import { NextRequest, NextResponse } from "next/server";
import { isAllowedHost, fetchImage } from "@/lib/image-cache";
import { imageLimiter } from "@/lib/rate-limit";

/** Return a plain-text error so <img onError> fires (NOT a valid image). */
function errorResponse(status: number, message: string, noStore = false) {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain",
      ...(noStore
        ? { "Cache-Control": "no-cache, no-store, must-revalidate" }
        : {}),
    },
  });
}

export async function GET(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { limited } = imageLimiter.check(ip);
  if (limited) return errorResponse(429, "Rate limit exceeded");

  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return errorResponse(400, "Missing url parameter");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return errorResponse(400, "Invalid URL");
  }

  if (!isAllowedHost(parsed.hostname)) {
    return errorResponse(403, "Host not allowed");
  }

  try {
    const result = await fetchImage(url);

    if (!result) {
      return errorResponse(404, "Upstream image not found", true);
    }

    return new NextResponse(new Uint8Array(result.data), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "public, max-age=2678400, immutable",
        "X-Cache": result.cacheStatus,
      },
    });
  } catch (err) {
    console.error("[Image Proxy] Error:", err);
    return errorResponse(502, "Proxy error", true);
  }
}
