/**
 * Converts a raw TikTok CDN image URL to a proxied URL.
 *
 * @param rawUrl - The original TikTok CDN URL
 * @param options - Optional settings
 * @param options.absolute - If true, prepends NEXT_PUBLIC_APP_URL (for MCP/external clients)
 * @param options.updatedAt - Post updated timestamp for cache busting after re-sync
 * @returns Proxied URL string, or null if input is null/empty
 */
export function proxyImageUrl(
  rawUrl: string | null | undefined,
  options?: boolean | { absolute?: boolean; updatedAt?: Date | string | null }
): string | null {
  if (!rawUrl) return null;

  // Support legacy boolean second arg for backwards compat
  const opts = typeof options === "boolean" ? { absolute: options } : options ?? {};
  const { absolute = false, updatedAt } = opts;

  let path = `/api/image?url=${encodeURIComponent(rawUrl)}`;

  // Append cache-buster when updatedAt is available so re-syncs
  // invalidate any stale Next.js Image optimization cache entries
  if (updatedAt) {
    const ts = updatedAt instanceof Date ? updatedAt.getTime() : new Date(updatedAt).getTime();
    if (!isNaN(ts)) {
      path += `&v=${ts}`;
    }
  }

  if (absolute) {
    const base = process.env.NEXT_PUBLIC_APP_URL || "";
    return `${base}${path}`;
  }

  return path;
}
