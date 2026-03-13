import { db } from "@/lib/db";
import { connectors, userConnectors } from "@/lib/db/schema/connectors";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectorRow = typeof connectors.$inferSelect;
export type UserConnectorRow = typeof userConnectors.$inferSelect;

export interface EnabledConnector extends ConnectorRow {
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}

// ---------------------------------------------------------------------------
// Connector catalog queries
// ---------------------------------------------------------------------------

/** List all globally enabled connectors, with optional category filter. */
export async function listConnectors(opts?: {
  category?: string;
  featured?: boolean;
}): Promise<ConnectorRow[]> {
  let query = db.select().from(connectors).where(eq(connectors.enabled, true));

  // Apply filters via additional conditions
  const rows = await query;

  return rows
    .filter((r) => {
      if (opts?.category && r.category !== opts.category) return false;
      if (opts?.featured !== undefined && r.featured !== opts.featured) return false;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Look up a single connector by slug ID. */
export async function getConnectorById(id: string): Promise<ConnectorRow | undefined> {
  const rows = await db
    .select()
    .from(connectors)
    .where(eq(connectors.id, id))
    .limit(1);
  return rows[0];
}

/** Check if a server URL belongs to a registered, enabled connector. */
export async function isRegisteredServerUrl(url: string): Promise<boolean> {
  const rows = await db
    .select({ id: connectors.id })
    .from(connectors)
    .where(and(eq(connectors.mcpServerUrl, url), eq(connectors.enabled, true)))
    .limit(1);
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Per-user connector state
// ---------------------------------------------------------------------------

/** Get all connectors a user has enabled, with decrypted tokens. */
export async function getEnabledConnectorsForUser(userId: string): Promise<EnabledConnector[]> {
  const rows = await db
    .select({
      connector: connectors,
      uc: userConnectors,
    })
    .from(userConnectors)
    .innerJoin(connectors, eq(userConnectors.connectorId, connectors.id))
    .where(
      and(
        eq(userConnectors.userId, userId),
        eq(userConnectors.enabled, true),
        eq(connectors.enabled, true),
      )
    );

  return rows.map(({ connector, uc }) => ({
    ...connector,
    accessToken: uc.accessToken ? decrypt(uc.accessToken) : null,
    refreshToken: uc.refreshToken ? decrypt(uc.refreshToken) : null,
    tokenExpiresAt: uc.tokenExpiresAt,
  }));
}

/** Get a user's connector IDs (enabled ones only). */
export async function getUserConnectorIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ connectorId: userConnectors.connectorId })
    .from(userConnectors)
    .where(
      and(eq(userConnectors.userId, userId), eq(userConnectors.enabled, true))
    );
  return rows.map((r) => r.connectorId);
}

/** Enable or disable a connector for a user. */
export async function toggleUserConnector(
  userId: string,
  connectorId: string,
  enabled: boolean,
): Promise<void> {
  await db
    .insert(userConnectors)
    .values({
      userId,
      connectorId,
      enabled,
      connectedAt: enabled ? new Date() : undefined,
    })
    .onConflictDoUpdate({
      target: [userConnectors.userId, userConnectors.connectorId],
      set: { enabled, updatedAt: new Date() },
    });
}

/** Encrypt and store OAuth tokens for a user's connector. */
export async function saveOAuthTokens(
  userId: string,
  connectorId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string;
  },
): Promise<void> {
  await db
    .insert(userConnectors)
    .values({
      userId,
      connectorId,
      enabled: true,
      accessToken: encrypt(tokens.accessToken),
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
      tokenExpiresAt: tokens.expiresAt ?? null,
      tokenScope: tokens.scope ?? null,
      connectedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userConnectors.userId, userConnectors.connectorId],
      set: {
        enabled: true,
        accessToken: encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        tokenExpiresAt: tokens.expiresAt ?? null,
        tokenScope: tokens.scope ?? null,
        connectedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

/**
 * Get a valid access token for a connector, auto-refreshing if expired.
 * Returns null if the connector has no stored tokens.
 */
export async function getValidAccessToken(
  userId: string,
  connectorId: string,
): Promise<string | null> {
  const rows = await db
    .select()
    .from(userConnectors)
    .where(
      and(
        eq(userConnectors.userId, userId),
        eq(userConnectors.connectorId, connectorId),
      )
    )
    .limit(1);

  const uc = rows[0];
  if (!uc?.accessToken) return null;

  // Check if token is expired (with 60s buffer)
  if (uc.tokenExpiresAt && uc.tokenExpiresAt.getTime() < Date.now() + 60_000) {
    if (!uc.refreshToken) return null;

    // Look up connector's OAuth config for token endpoint
    const connector = await getConnectorById(connectorId);
    if (!connector?.oauthConfig) return null;

    const { tokenUrl } = connector.oauthConfig;
    const decryptedRefreshToken = decrypt(uc.refreshToken);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: decryptedRefreshToken,
        client_id: connector.oauthConfig.clientId ?? "",
      }),
    });

    if (!response.ok) {
      console.error(`[connector-service] Token refresh failed for ${connectorId}:`, response.status);
      return null;
    }

    const data = await response.json();
    await saveOAuthTokens(userId, connectorId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? decryptedRefreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scope: data.scope,
    });

    return data.access_token;
  }

  return decrypt(uc.accessToken);
}
