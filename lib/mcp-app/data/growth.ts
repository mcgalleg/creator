import { db } from "@/lib/db";
import { posts, tiktokAccounts } from "@/lib/db/schema";
import { inArray, and, gte, lte, count } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

export async function fetchFollowerGrowth(
  userId: string,
  opts?: { period?: "day" | "week" | "month"; count?: number }
) {
  const period = opts?.period ?? "week";
  const numPeriods = opts?.count ?? 12;
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { period, points: [] };

  // Current total followers
  const accounts = await db
    .select({ followerCount: tiktokAccounts.followerCount })
    .from(tiktokAccounts)
    .where(inArray(tiktokAccounts.id, accountIdList));
  const currentFollowers = accounts.reduce((s, a) => s + (a.followerCount ?? 0), 0);

  // Approximate historical growth using post engagement trends
  const now = new Date();
  const points: Array<{ date: string; followers: number; delta: number }> = [];

  // Work backwards: each period, subtract an estimated delta based on post volume
  const periodData: Array<{ date: string; postCount: number }> = [];
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
      .from(posts)
      .where(
        and(
          inArray(posts.accountId, accountIdList),
          gte(posts.postedAt, startDate),
          lte(posts.postedAt, endDate)
        )
      );

    periodData.push({
      date: startDate.toISOString().split("T")[0],
      postCount: result[0]?.cnt ?? 0,
    });
  }

  // Simple approximation: distribute followers proportionally
  const totalPosts = periodData.reduce((s, p) => s + p.postCount, 0);
  let prevFollowers = 0;
  for (let i = 0; i < periodData.length; i++) {
    const fraction = totalPosts > 0
      ? (periodData.slice(0, i + 1).reduce((s, p) => s + p.postCount, 0) / totalPosts)
      : ((i + 1) / periodData.length);
    const estimated = Math.round(currentFollowers * fraction);
    const delta = estimated - prevFollowers;
    points.push({
      date: periodData[i].date,
      followers: estimated,
      delta,
    });
    prevFollowers = estimated;
  }

  return { period, points };
}
