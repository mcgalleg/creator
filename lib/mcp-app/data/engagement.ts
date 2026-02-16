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

export async function fetchEngagementBreakdown(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { breakdown: [] };

  const stats = await db
    .select({
      totalLikes: sql<number>`COALESCE(SUM(${posts.likes}), 0)`,
      totalComments: sql<number>`COALESCE(SUM(${posts.comments}), 0)`,
      totalShares: sql<number>`COALESCE(SUM(${posts.shares}), 0)`,
      totalSaves: sql<number>`COALESCE(SUM(${posts.saves}), 0)`,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const s = stats[0];
  const likes = Number(s?.totalLikes ?? 0);
  const cmts = Number(s?.totalComments ?? 0);
  const shares = Number(s?.totalShares ?? 0);
  const saves = Number(s?.totalSaves ?? 0);
  const total = likes + cmts + shares + saves;

  const breakdown = [
    { type: "likes" as const, value: likes, percentage: total > 0 ? Math.round((likes / total) * 100) : 0 },
    { type: "comments" as const, value: cmts, percentage: total > 0 ? Math.round((cmts / total) * 100) : 0 },
    { type: "shares" as const, value: shares, percentage: total > 0 ? Math.round((shares / total) * 100) : 0 },
    { type: "saves" as const, value: saves, percentage: total > 0 ? Math.round((saves / total) * 100) : 0 },
  ];

  return { breakdown };
}

export async function fetchEngagementByDay(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { days: [] };

  const allPosts = await db
    .select({
      postedAt: posts.postedAt,
      likes: posts.likes,
      comments: posts.comments,
      shares: posts.shares,
      plays: posts.plays,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const shortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayStats: Record<number, { engagement: number; plays: number; posts: number }> = {};
  for (let i = 0; i < 7; i++) dayStats[i] = { engagement: 0, plays: 0, posts: 0 };

  allPosts.forEach((p) => {
    if (!p.postedAt) return;
    const day = new Date(p.postedAt).getDay();
    const eng = (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);
    dayStats[day].engagement += eng;
    dayStats[day].plays += p.plays ?? 0;
    dayStats[day].posts++;
  });

  const days = Object.entries(dayStats).map(([day, stats]) => ({
    day: dayNames[parseInt(day)],
    shortDay: shortNames[parseInt(day)],
    engagementRate: stats.plays > 0
      ? Math.round((stats.engagement / stats.plays) * 10000) / 100
      : 0,
    posts: stats.posts,
  }));

  return { days };
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
