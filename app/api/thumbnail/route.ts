import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/thumbnail?postId=123
 *
 * Looks up the thumbnail URL for a post by ID,
 * then redirects to /api/image?url=... for HEIC conversion.
 *
 * This avoids the AI needing to reproduce long encoded CDN URLs —
 * it only needs to pass a short numeric post ID.
 */
export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId) {
    return new Response("Missing postId", { status: 400 });
  }

  const id = Number(postId);
  if (isNaN(id)) {
    return new Response("Invalid postId", { status: 400 });
  }

  const [row] = await db
    .select({ thumbnailUrl: posts.thumbnailUrl })
    .from(posts)
    .where(eq(posts.id, id));

  if (!row?.thumbnailUrl) {
    return new Response("Thumbnail not found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const proxyUrl = `/api/image?url=${encodeURIComponent(row.thumbnailUrl)}`;
  return Response.redirect(new URL(proxyUrl, request.url), 302);
}
