/**
 * Converts a raw TikTok CDN image URL to a proxied URL.
 *
 * @param rawUrl - The original TikTok CDN URL
 * @param absolute - If true, prepends NEXT_PUBLIC_APP_URL (for MCP/external clients)
 * @returns Proxied URL string, or null if input is null/empty
 */
export function proxyImageUrl(
  rawUrl: string | null | undefined,
  absolute = false
): string | null {
  if (!rawUrl) return null;

  const path = `/api/image?url=${encodeURIComponent(rawUrl)}`;

  if (absolute) {
    const base = process.env.NEXT_PUBLIC_APP_URL || "";
    return `${base}${path}`;
  }

  return path;
}
