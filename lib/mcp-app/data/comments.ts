import { db } from "@/lib/db";
import { posts, comments } from "@/lib/db/schema";
import { eq, inArray, desc, sql, and, gte, lte, count } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";
import { proxyImageUrl } from "@/lib/image-proxy";

export async function fetchRecentComments(
  userId: string,
  opts?: { limit?: number; offset?: number }
) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { comments: [], total: 0 };

  const [results, totalResult] = await Promise.all([
    db
      .select({
        id: comments.id,
        text: comments.text,
        authorUsername: comments.authorUsername,
        authorAvatarUrl: comments.authorAvatarUrl,
        likes: comments.likes,
        postThumbnailUrl: posts.thumbnailUrl,
        createdAt: comments.postedAt,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(inArray(posts.accountId, accountIdList))
      .orderBy(desc(comments.postedAt))
      .limit(opts?.limit ?? 20)
      .offset(opts?.offset ?? 0),
    db
      .select({ cnt: count() })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(inArray(posts.accountId, accountIdList)),
  ]);

  return {
    comments: results.map((c) => ({
      id: c.id.toString(),
      text: c.text,
      authorUsername: c.authorUsername,
      authorAvatarUrl: proxyImageUrl(c.authorAvatarUrl, true),
      likes: c.likes ?? 0,
      postThumbnailUrl: proxyImageUrl(c.postThumbnailUrl, true),
      createdAt: c.createdAt?.toISOString() ?? null,
    })),
    total: totalResult[0]?.cnt ?? 0,
  };
}

export async function fetchTopCommenters(
  userId: string,
  opts?: { limit?: number }
) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { commenters: [] };

  const results = await db
    .select({
      username: comments.authorUsername,
      avatarUrl: sql<string>`MAX(${comments.authorAvatarUrl})`,
      commentCount: count(),
      lastCommentAt: sql<string>`MAX(${comments.postedAt})`,
      followerCount: sql<number>`MAX(${comments.authorFollowerCount})`,
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(inArray(posts.accountId, accountIdList))
    .groupBy(comments.authorUsername)
    .orderBy(desc(count()))
    .limit(opts?.limit ?? 20);

  return {
    commenters: results.map((c) => {
      const followerCount = Number(c.followerCount ?? 0);
      const influenceScore = followerCount > 0
        ? Math.round(c.commentCount * Math.log10(Math.max(followerCount, 1)) * 100) / 100
        : c.commentCount;
      return {
        username: c.username,
        avatarUrl: proxyImageUrl(c.avatarUrl, true),
        commentCount: c.commentCount,
        lastCommentAt: c.lastCommentAt,
        followerCount,
        influenceScore,
      };
    }),
  };
}

export async function fetchCommentActivity(
  userId: string,
  opts?: { period?: "day" | "week" | "month" }
) {
  const period = opts?.period ?? "week";
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { activity: [], total: 0, period };

  const now = new Date();
  const numPeriods = 12;
  const activity: Array<{ date: string; comments: number }> = [];
  let total = 0;

  for (let i = numPeriods - 1; i >= 0; i--) {
    let startDate: Date;
    let endDate: Date;

    if (period === "day") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - i);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - i * 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const result = await db
      .select({ cnt: count() })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(
        and(
          inArray(posts.accountId, accountIdList),
          gte(comments.postedAt, startDate),
          lte(comments.postedAt, endDate)
        )
      );

    const cnt = result[0]?.cnt ?? 0;
    total += cnt;
    activity.push({ date: startDate.toISOString().split("T")[0], comments: cnt });
  }

  return { activity, total, period };
}

export async function fetchAudienceLoyalty(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { loyaltyRate: 0, repeat: 0, oneTime: 0, total: 0 };

  const commenterCounts = await db
    .select({
      username: comments.authorUsername,
      cnt: count(),
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(inArray(posts.accountId, accountIdList))
    .groupBy(comments.authorUsername);

  const total = commenterCounts.length;
  const repeat = commenterCounts.filter((c) => c.cnt > 1).length;
  const oneTime = total - repeat;
  const loyaltyRate = total > 0 ? Math.round((repeat / total) * 10000) / 100 : 0;

  return { loyaltyRate, repeat, oneTime, total };
}
