import { useState } from "react";

const TIKTOK_CDN_HOSTS = ["tiktokcdn.com", "tiktokcdn-eu.com", "tiktokcdn-us.com"];

/**
 * Ensures a TikTok CDN URL goes through our image proxy (for HEIC conversion).
 * If the URL is already proxied (/api/image?url=...), returns as-is.
 */
function ensureProxied(src: string): string {
  if (src.startsWith("/api/image")) return src;
  try {
    const parsed = new URL(src);
    const isTikTok = TIKTOK_CDN_HOSTS.some(
      (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)
    );
    if (isTikTok) {
      return `/api/image?url=${encodeURIComponent(src)}`;
    }
  } catch {
    // not a valid URL
  }
  return src;
}

/**
 * Image component for Remotion clips that:
 * 1. Routes TikTok CDN URLs through our HEIC→JPEG proxy
 * 2. Falls back gracefully on load errors instead of crashing
 */
export function ProxyImg({
  src,
  style,
  fallback,
}: {
  src: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}) {
  const [error, setError] = useState(false);
  const proxied = ensureProxied(src);

  if (error && fallback) return <>{fallback}</>;
  if (error) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxied}
      alt=""
      style={style}
      onError={() => setError(true)}
    />
  );
}
