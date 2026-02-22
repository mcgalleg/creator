import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { comments, tiktokAccounts } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

/**
 * GET /api/avatar?username=liliarochel   — commenter avatar (freshest from comments)
 * GET /api/avatar?accountId=51           — TikTok account avatar
 *
 * Looks up the avatar URL, then redirects to /api/image?url=...
 * for HEIC conversion and error handling.
 *
 * This avoids the AI needing to reproduce long encoded CDN URLs —
 * it only needs to pass a short identifier.
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

  const proxyUrl = `/api/image?url=${encodeURIComponent(avatarUrl)}`;
  return Response.redirect(new URL(proxyUrl, request.url), 302);
}
