import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, tiktokAccounts } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { isAllowedHost, fetchImage } from "@/lib/image-cache";

/**
 * GET /api/avatar?username=liliarochel   — commenter avatar (freshest from comments)
 * GET /api/avatar?accountId=51           — TikTok account avatar
 *
 * Looks up the avatar URL, then serves the image directly
 * with file cache + HEIC conversion.
 *
 * Used by Remotion clips where a short identifier is easier
 * than a full encoded CDN URL.
 */
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const accountId = request.nextUrl.searchParams.get("accountId");

  let avatarUrl: string | null = null;

  if (username) {
    const [row] = await db
      .select({
        avatarUrl: sql<string>`(array_agg(${comments.authorAvatarUrl} ORDER BY ${comments.createdAt} DESC))[1]`,
      })
      .from(comments)
      .where(eq(comments.authorUsername, username));
    avatarUrl = row?.avatarUrl ?? null;
  } else if (accountId) {
    const id = Number(accountId);
    if (isNaN(id)) {
      return new Response("Invalid accountId", { status: 400 });
    }
    const [row] = await db
      .select({ avatarUrl: tiktokAccounts.avatarUrl })
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.id, id));
    avatarUrl = row?.avatarUrl ?? null;
  } else {
    return new Response("Missing username or accountId", { status: 400 });
  }

  if (!avatarUrl) {
    return new Response("Avatar not found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(avatarUrl);
  } catch {
    return new Response("Invalid avatar URL", { status: 500 });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  try {
    const result = await fetchImage(avatarUrl);

    if (!result) {
      return new Response("Upstream image not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
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
    console.error("[Avatar Proxy] Error:", err);
    return new Response("Proxy error", {
      status: 502,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}
