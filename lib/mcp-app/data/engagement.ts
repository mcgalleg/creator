import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { inArray, sql, and, gte, lte } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

export async function fetchEngagementTrends(
  userId: string,
  opts?: { period?: "day" | "week" | "month"; count?: number }
) {
  const period = opts?.period ?? "week";
  const numPeriods = opts?.count ?? 12;
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { period, data: [] };

  const now = new Date();
  const data: Array<{ date: string; plays: number; likes: number; comments: number; shares: number; saves: number }> = [];

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

    const results = await db
      .select({
        totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
        totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
        totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
        totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
        totalSaves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`,
      })
      .from(posts)
      .where(
        and(
          inArray(posts.accountId, accountIdList),
          gte(posts.postedAt, startDate),
          lte(posts.postedAt, endDate)
        )
      );

    const r = results[0];
    data.push({
      date: startDate.toISOString().split("T")[0],
      plays: Number(r?.totalPlays ?? 0),
      likes: Number(r?.totalLikes ?? 0),
      comments: Number(r?.totalComments ?? 0),
      shares: Number(r?.totalShares ?? 0),
      saves: Number(r?.totalSaves ?? 0),
    });
  }

  return { period, data };
}

export async function fetchEngagementRate(
  userId: string,
  opts?: { period?: "day" | "week" | "month"; count?: number }
) {
  const period = opts?.period ?? "week";
  const numPeriods = opts?.count ?? 12;
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { period, data: [] };

  const now = new Date();
  const data: Array<{ date: string; engagementRate: number }> = [];

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

    const results = await db
      .select({
        totalEng: sql<number>`COALESCE(SUM(${posts.likes}) + SUM(${posts.comments}) + SUM(${posts.shares}), 0)`,
        totalPlays: sql<number>`COALESCE(SUM(${posts.plays}), 0)`,
      })
      .from(posts)
      .where(
        and(
          inArray(posts.accountId, accountIdList),
          gte(posts.postedAt, startDate),
          lte(posts.postedAt, endDate)
        )
      );

    const r = results[0];
    const eng = Number(r?.totalEng ?? 0);
    const plays = Number(r?.totalPlays ?? 0);
    const rate = plays > 0
      ? Math.round((eng / plays) * 10000) / 100
      : 0;

    data.push({ date: startDate.toISOString().split("T")[0], engagementRate: rate });
  }

  return { period, data };
}
