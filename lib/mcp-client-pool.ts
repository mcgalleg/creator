import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Pools MCP client connections by serverUrl to avoid the overhead of
 * a full protocol handshake (connect + initialize) on every request.
 * Stale entries are evicted after POOL_TTL. On error, the caller can
 * evict the cached client and retry with a fresh connection.
 */

interface PoolEntry {
  client: Client;
  lastUsed: number;
  /** Pending connect promise (non-null while connecting) */
  connecting: Promise<void> | null;
}

const pool = new Map<string, PoolEntry>();
const POOL_TTL = 5 * 60 * 1000; // 5 minutes

function cleanup() {
  const now = Date.now();
  for (const [url, entry] of pool) {
    if (now - entry.lastUsed > POOL_TTL) {
      entry.client.close().catch(() => {});
      pool.delete(url);
    }
  }
}

/** Get or create a cached MCP client for the given server URL. */
export async function getClient(serverUrl: string): Promise<Client> {
  cleanup();

  const existing = pool.get(serverUrl);
  if (existing) {
    existing.lastUsed = Date.now();
    if (existing.connecting) await existing.connecting;
    return existing.client;
  }

  const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
  const client = new Client({ name: "creator", version: "1.0.0" });
  const entry: PoolEntry = { client, lastUsed: Date.now(), connecting: null };

  entry.connecting = client.connect(transport).then(() => {
    entry.connecting = null;
  });
  pool.set(serverUrl, entry);

  try {
    await entry.connecting;
  } catch (err) {
    pool.delete(serverUrl);
    throw err;
  }

  return client;
}

/** Remove a cached client (e.g. after a request error). */
export function evictClient(serverUrl: string) {
  const entry = pool.get(serverUrl);
  if (entry) {
    entry.client.close().catch(() => {});
    pool.delete(serverUrl);
  }
}

/**
 * Execute `fn` with a pooled client. On failure, evicts the stale
 * client and retries once with a fresh connection.
 */
export async function withClient<T>(
  serverUrl: string,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  try {
    const client = await getClient(serverUrl);
    return await fn(client);
  } catch (err) {
    // Evict potentially stale connection and retry once
    evictClient(serverUrl);
    const client = await getClient(serverUrl);
    return await fn(client);
  }
}
