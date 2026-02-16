import { db } from "@/lib/db";
import { tiktokAccounts, posts } from "@/lib/db/schema";
import { and, eq, inArray, sql, count, gte } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

export async function fetchAccountOverview(
  userId: string,
  opts?: { accountIds?: string[] }
) {
  const accountIdList = await getUserAccountIds(userId, opts?.accountIds);
  if (accountIdList.length === 0) {
    return {
      followers: 0, followerChange: 0,
      totalPlays: 0, playsChange: 0,
      engagementRate: 0, engagementRateChange: 0,
      contentVelocity: 0,
      totalLikes: 0, totalShares: 0, totalSaves: 0,
      avgViews: 0, totalComments: 0, commentsPerPost: 0,
    };
  }

  const accounts = await db
    .select({
      followerCount: tiktokAccounts.followerCount,
    })
    .from(tiktokAccounts)
    .where(inArray(tiktokAccounts.id, accountIdList));

  const followers = accounts.reduce((s, a) => s + (a.followerCount ?? 0), 0);

  const stats = await db
    .select({
      totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
      totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
      totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
      totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
      totalSaves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`,
      postCount: count(),
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  // Neon's serverless driver returns SUM() as strings — coerce to numbers
  const r = stats[0];
  const totalLikes = Number(r?.totalLikes ?? 0);
  const totalComments = Number(r?.totalComments ?? 0);
  const totalShares = Number(r?.totalShares ?? 0);
  const totalPlays = Number(r?.totalPlays ?? 0);
  const totalSaves = Number(r?.totalSaves ?? 0);
  const postCount = Number(r?.postCount ?? 0);

  const totalEngagement = totalLikes + totalComments + totalShares;
  const engagementRate = totalPlays > 0
    ? Math.round((totalEngagement / totalPlays) * 10000) / 100
    : 0;
  const avgViews = postCount > 0 ? Math.round(totalPlays / postCount) : 0;
  const commentsPerPost = postCount > 0
    ? Math.round((totalComments / postCount) * 100) / 100
    : 0;

  // Content velocity: posts in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPosts = await db
    .select({ cnt: count() })
    .from(posts)
    .where(
      and(
        inArray(posts.accountId, accountIdList),
        gte(posts.postedAt, thirtyDaysAgo),
      )
    );
  const contentVelocity = recentPosts[0]?.cnt ?? 0;

  return {
    followers,
    followerChange: 0,
    totalPlays,
    playsChange: 0,
    engagementRate,
    engagementRateChange: 0,
    contentVelocity,
    totalLikes,
    totalShares,
    totalSaves,
    avgViews,
    totalComments,
    commentsPerPost,
  };
}
