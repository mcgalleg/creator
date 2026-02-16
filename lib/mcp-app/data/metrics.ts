import { db } from "@/lib/db";
import { posts, tiktokAccounts } from "@/lib/db/schema";
import { inArray, sql } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

export async function fetchSavesRate(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { savesRate: 0, totalSaves: 0, totalPlays: 0 };

  const [stats] = await db
    .select({
      totalSaves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`,
      totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const totalSaves = Number(stats?.totalSaves ?? 0);
  const totalPlays = Number(stats?.totalPlays ?? 0);
  const savesRate = totalPlays > 0
    ? Math.round((totalSaves / totalPlays) * 10000) / 100
    : 0;

  return { savesRate, totalSaves, totalPlays };
}

export async function fetchViralityScore(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { viralityScore: 0, totalShares: 0, totalPlays: 0 };

  const [stats] = await db
    .select({
      totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
      totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const totalShares = Number(stats?.totalShares ?? 0);
  const totalPlays = Number(stats?.totalPlays ?? 0);
  const viralityScore = totalPlays > 0
    ? Math.round((totalShares / totalPlays) * 10000) / 100
    : 0;

  return { viralityScore, totalShares, totalPlays };
}

export async function fetchFollowerEngagement(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { ratio: 0, totalPlays: 0, followers: 0 };

  const [stats] = await db
    .select({
      totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const accounts = await db
    .select({ followerCount: tiktokAccounts.followerCount })
    .from(tiktokAccounts)
    .where(inArray(tiktokAccounts.id, accountIdList));

  const followers = accounts.reduce((s, a) => s + (a.followerCount ?? 0), 0);
  const totalPlays = Number(stats?.totalPlays ?? 0);
  const ratio = followers > 0
    ? Math.round((totalPlays / followers) * 100) / 100
    : 0;

  return { ratio, totalPlays, followers };
}
