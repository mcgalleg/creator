import { db } from "@/lib/db";
import { posts, tiktokAccounts } from "@/lib/db/schema";
import { eq, inArray, and, gte, lte, sql, count } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

export async function fetchPeriodComparison(
  userId: string,
  opts: {
    period1Start?: string;
    period1End?: string;
    period2Start?: string;
    period2End?: string;
  }
) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) {
    return { period1: {}, period2: {}, changes: {} };
  }

  const getMetrics = async (start: string, end: string) => {
    const results = await db
      .select({
        totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
        totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
        totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
        totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
        totalSaves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`,
        postCount: count(),
      })
      .from(posts)
      .where(
        and(
          inArray(posts.accountId, accountIdList),
          gte(posts.postedAt, new Date(start)),
          lte(posts.postedAt, new Date(end))
        )
      );
    const d = results[0];
    return {
      likes: Number(d?.totalLikes ?? 0),
      comments: Number(d?.totalComments ?? 0),
      shares: Number(d?.totalShares ?? 0),
      plays: Number(d?.totalPlays ?? 0),
      saves: Number(d?.totalSaves ?? 0),
      posts: Number(d?.postCount ?? 0),
    };
  };

  // Default periods: last 7 days vs prior 7 days
  const now = new Date();
  const p2End = opts.period2End ?? now.toISOString().split("T")[0];
  const p2Start = opts.period2Start ?? new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
  const p1End = opts.period1End ?? p2Start;
  const p1Start = opts.period1Start ?? new Date(new Date(p1End).getTime() - 7 * 86400000).toISOString().split("T")[0];

  const [period1, period2] = await Promise.all([
    getMetrics(p1Start, p1End),
    getMetrics(p2Start, p2End),
  ]);

  const calcChange = (old: number, cur: number) =>
    old === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - old) / old) * 10000) / 100;

  return {
    period1: { start: p1Start, end: p1End, ...period1 },
    period2: { start: p2Start, end: p2End, ...period2 },
    changes: {
      likes: calcChange(period1.likes, period2.likes),
      comments: calcChange(period1.comments, period2.comments),
      shares: calcChange(period1.shares, period2.shares),
      plays: calcChange(period1.plays, period2.plays),
      saves: calcChange(period1.saves, period2.saves),
    },
  };
}

export async function fetchAccountComparison(
  userId: string,
  opts: { accountIds: string[] }
) {
  const accountIdList = await getUserAccountIds(userId, opts.accountIds);
  if (accountIdList.length < 2) {
    throw new Error("At least 2 accounts required for comparison");
  }

  const accounts = await Promise.all(
    accountIdList.map(async (accountId) => {
      const [account] = await db
        .select({
          username: tiktokAccounts.username,
          followerCount: tiktokAccounts.followerCount,
        })
        .from(tiktokAccounts)
        .where(eq(tiktokAccounts.id, accountId));

      const [stats] = await db
        .select({
          totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
          totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
          totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
          totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
          postCount: count(),
        })
        .from(posts)
        .where(eq(posts.accountId, accountId));

      const tLikes = Number(stats?.totalLikes ?? 0);
      const tComments = Number(stats?.totalComments ?? 0);
      const tShares = Number(stats?.totalShares ?? 0);
      const tPlays = Number(stats?.totalPlays ?? 0);
      const totalEng = tLikes + tComments + tShares;
      const engagement = tPlays > 0
        ? Math.round((totalEng / tPlays) * 10000) / 100
        : 0;

      return {
        username: account?.username ?? "Unknown",
        metrics: {
          followers: account?.followerCount ?? 0,
          likes: tLikes,
          engagement,
          plays: tPlays,
          shares: tShares,
        },
      };
    })
  );

  return { accounts };
}
