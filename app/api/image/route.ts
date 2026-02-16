import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTNAMES = [
  "tiktokcdn.com",
  "tiktokcdn-eu.com",
  "tiktokcdn-us.com",
];

// 1x1 transparent PNG fallback
const TRANSPARENT_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRlEFrkJggg==",
  "base64"
);

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTNAMES.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 400,
      headers: { "Content-Type": "image/png" },
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 400,
      headers: { "Content-Type": "image/png" },
    });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 403,
      headers: { "Content-Type": "image/png" },
    });
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return new NextResponse(TRANSPARENT_PIXEL, {
        status: 404,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2678400, immutable",
      },
    });
  } catch {
    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 502,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}
