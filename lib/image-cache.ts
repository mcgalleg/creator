import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// @ts-expect-error - heic-convert has no type declarations
import convert from "heic-convert";

const HEIC_TYPES = new Set(["image/heic", "image/heif"]);

const CACHE_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "image-cache")
  : path.join(process.cwd(), ".cache", "images");

/** SHA-256 of URL pathname only (stable across signature rotations). */
export function getCacheKey(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  return createHash("sha256").update(parsed.pathname).digest("hex");
}

/** Check if content type or pathname indicates HEIC/HEIF. */
export function isHeic(contentType: string, pathname: string): boolean {
  return (
    HEIC_TYPES.has(contentType) ||
    pathname.endsWith(".heic") ||
    pathname.endsWith(".heif")
  );
}

interface CachedImage {
  data: Buffer;
  contentType: string;
}

/** Read cached image from disk, or null if not found. */
export async function getCachedImage(
  cacheKey: string
): Promise<CachedImage | null> {
  try {
    const dir = path.join(CACHE_DIR, cacheKey.slice(0, 2));
    const binPath = path.join(dir, `${cacheKey}.bin`);
    const metaPath = path.join(dir, `${cacheKey}.meta`);

    const [data, metaRaw] = await Promise.all([
      fs.readFile(binPath),
      fs.readFile(metaPath, "utf-8"),
    ]);

    const meta = JSON.parse(metaRaw) as { contentType: string };
    return { data, contentType: meta.contentType };
  } catch {
    return null;
  }
}

/** Atomically write image + metadata to cache. */
export async function putCachedImage(
  cacheKey: string,
  data: Buffer,
  contentType: string
): Promise<void> {
  try {
    const dir = path.join(CACHE_DIR, cacheKey.slice(0, 2));
    await fs.mkdir(dir, { recursive: true });

    const binPath = path.join(dir, `${cacheKey}.bin`);
    const metaPath = path.join(dir, `${cacheKey}.meta`);
    const tmpBin = `${binPath}.tmp.${process.pid}`;
    const tmpMeta = `${metaPath}.tmp.${process.pid}`;

    await Promise.all([
      fs.writeFile(tmpBin, data),
      fs.writeFile(tmpMeta, JSON.stringify({ contentType })),
    ]);

    await Promise.all([
      fs.rename(tmpBin, binPath),
      fs.rename(tmpMeta, metaPath),
    ]);
  } catch (err) {
    console.error("[Image Cache] Write error:", err);
  }
}

const ALLOWED_HOSTNAMES = [
  "tiktokcdn.com",
  "tiktokcdn-eu.com",
  "tiktokcdn-us.com",
];

/** Check if hostname belongs to TikTok CDN. */
export function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTNAMES.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );
}

/**
 * Full image proxy pipeline: cache check → fetch upstream → HEIC conversion → cache write.
 * Returns `{ data, contentType, cacheStatus }` or `null` if upstream returned non-200.
 * Throws on network/conversion errors (caller should catch).
 */
export async function fetchImage(
  rawUrl: string
): Promise<{ data: Buffer; contentType: string; cacheStatus: "HIT" | "MISS" } | null> {
  const cacheKey = getCacheKey(rawUrl);
  const cached = await getCachedImage(cacheKey);
  if (cached) {
    return { data: cached.data, contentType: cached.contentType, cacheStatus: "HIT" };
  }

  const response = await fetch(rawUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) return null;

  let contentType = response.headers.get("content-type") || "image/jpeg";
  let data = Buffer.from(await response.arrayBuffer());

  const parsed = new URL(rawUrl);
  if (isHeic(contentType, parsed.pathname)) {
    const jpeg = await convert({
      buffer: data,
      format: "JPEG",
      quality: 0.8,
    });
    data = Buffer.from(jpeg);
    contentType = "image/jpeg";
  }

  void putCachedImage(cacheKey, data, contentType);

  return { data, contentType, cacheStatus: "MISS" };
}

/**
 * Pre-warm a single image URL into the cache.
 * Fetches upstream, converts HEIC→JPEG if needed, and writes to disk cache.
 * Never throws — failures are silently logged.
 */
export async function prewarmImage(rawUrl: string): Promise<void> {
  try {
    await fetchImage(rawUrl);
  } catch (err) {
    console.error("[Image Cache] Pre-warm error:", err);
  }
}
