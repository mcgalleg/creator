import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { inArray, sql } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

export async function fetchDurationPerformance(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { points: [] };

  const results = await db
    .select({
      id: posts.id,
      duration: posts.duration,
      plays: posts.plays,
      likes: posts.likes,
      comments: posts.comments,
      shares: posts.shares,
      description: posts.description,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const points = results
    .filter((p) => p.duration && p.duration > 0)
    .map((p) => {
      const engagement = (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);
      const engagementRate = (p.plays ?? 0) > 0
        ? Math.round((engagement / (p.plays ?? 1)) * 10000) / 100
        : 0;
      return {
        id: p.id.toString(),
        duration: p.duration!,
        plays: p.plays ?? 0,
        engagementRate,
        description: p.description?.slice(0, 80) ?? null,
      };
    });

  return { points };
}

export async function fetchViewsDistribution(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { buckets: [] };

  const bucketDefs = [
    { label: "0-1K", min: 0, max: 1000 },
    { label: "1K-10K", min: 1000, max: 10000 },
    { label: "10K-50K", min: 10000, max: 50000 },
    { label: "50K-100K", min: 50000, max: 100000 },
    { label: "100K-500K", min: 100000, max: 500000 },
    { label: "500K-1M", min: 500000, max: 1000000 },
    { label: "1M+", min: 1000000, max: Infinity },
  ];

  const allPlays = await db
    .select({ plays: posts.plays })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const buckets = bucketDefs.map((b) => ({
    label: b.label,
    min: b.min,
    max: b.max === Infinity ? -1 : b.max,
    count: allPlays.filter((p) => {
      const v = p.plays ?? 0;
      return v >= b.min && (b.max === Infinity ? true : v < b.max);
    }).length,
  }));

  return { buckets };
}
