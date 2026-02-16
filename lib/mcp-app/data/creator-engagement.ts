import { db } from "@/lib/db";
import { posts, comments } from "@/lib/db/schema";
import { eq, inArray, sql, count, and, gte, lte } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

export async function fetchCreatorEngagement(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) {
    return { likedRate: 0, totalLiked: 0, totalComments: 0, trend: [] };
  }

  // Total comments and how many the creator liked
  const [stats] = await db
    .select({
      totalComments: count(),
      totalLiked: sql<number>`COALESCE(SUM(CASE WHEN ${comments.isAuthorLiked} = true THEN 1 ELSE 0 END), 0)`,
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(inArray(posts.accountId, accountIdList));

  const totalComments = Number(stats?.totalComments ?? 0);
  const totalLiked = Number(stats?.totalLiked ?? 0);
  const likedRate = totalComments > 0
    ? Math.round((totalLiked / totalComments) * 10000) / 100
    : 0;

  // Trend: liked rate over last 12 weeks
  const now = new Date();
  const trend: Array<{ date: string; likedRate: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - i * 7);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const [weekStats] = await db
      .select({
        total: count(),
        liked: sql<number>`COALESCE(SUM(CASE WHEN ${comments.isAuthorLiked} = true THEN 1 ELSE 0 END), 0)`,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(
        and(
          inArray(posts.accountId, accountIdList),
          gte(comments.postedAt, startDate),
          lte(comments.postedAt, endDate)
        )
      );

    const wTotal = Number(weekStats?.total ?? 0);
    const wLiked = Number(weekStats?.liked ?? 0);
    trend.push({
      date: startDate.toISOString().split("T")[0],
      likedRate: wTotal > 0 ? Math.round((wLiked / wTotal) * 10000) / 100 : 0,
    });
  }

  return { likedRate, totalLiked, totalComments, trend };
}
