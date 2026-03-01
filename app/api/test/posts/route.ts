import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, comments } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { testRouteGuard } from "@/lib/test-guard";

export async function GET(request: NextRequest) {
  const blocked = testRouteGuard();
  if (blocked) return blocked;

  const accountId = request.nextUrl.searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json({ error: "accountId query param required" }, { status: 400 });
  }

  const accountIdNum = parseInt(accountId, 10);
  if (isNaN(accountIdNum)) {
    return NextResponse.json({ error: "Invalid accountId" }, { status: 400 });
  }

  // Fetch all posts for this account
  const accountPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.accountId, accountIdNum));

  // Fetch all comments for those posts
  const postIds = accountPosts.map((p) => p.id);
  const accountComments = postIds.length > 0
    ? await db
        .select()
        .from(comments)
        .where(inArray(comments.postId, postIds))
    : [];

  return NextResponse.json({
    posts: accountPosts,
    comments: accountComments,
  });
}
