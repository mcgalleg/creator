import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - heic-convert has no type declarations
import convert from "heic-convert";

const ALLOWED_HOSTNAMES = [
  "tiktokcdn.com",
  "tiktokcdn-eu.com",
  "tiktokcdn-us.com",
];

// Content types that browsers can't display natively
const HEIC_TYPES = new Set(["image/heic", "image/heif"]);

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

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTNAMES.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );
}

export async function GET(request: NextRequest) {
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
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return errorResponse(404, "Upstream image not found", true);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const body = Buffer.from(await response.arrayBuffer());

    // Convert HEIC/HEIF to JPEG since browsers can't display them
    if (HEIC_TYPES.has(contentType) || parsed.pathname.endsWith(".heic") || parsed.pathname.endsWith(".heif")) {
      const jpeg = await convert({ buffer: body, format: "JPEG", quality: 0.8 });
      return new NextResponse(new Uint8Array(jpeg), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=2678400, immutable",
        },
      });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2678400, immutable",
      },
    });
  } catch (err) {
    console.error("[Image Proxy] Error:", err);
    return errorResponse(502, "Proxy error", true);
  }
}
