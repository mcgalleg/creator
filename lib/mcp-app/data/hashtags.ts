import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { inArray, and, gte, lte } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

interface PostRow {
  hashtags: string[] | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  plays: number | null;
  postedAt: Date | null;
}

export async function fetchTopHashtags(
  userId: string,
  opts?: { limit?: number }
) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { hashtags: [], total: 0 };

  const allPosts = await db
    .select({
      hashtags: posts.hashtags,
      likes: posts.likes,
      comments: posts.comments,
      shares: posts.shares,
      plays: posts.plays,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const tagMap = new Map<string, { count: number; likes: number; plays: number; engagement: number }>();

  allPosts.forEach((p) => {
    if (!p.hashtags) return;
    p.hashtags.forEach((tag) => {
      const t = tag.toLowerCase().replace(/^#/, "");
      if (!t) return;
      const existing = tagMap.get(t) || { count: 0, likes: 0, plays: 0, engagement: 0 };
      existing.count++;
      existing.likes += p.likes ?? 0;
      existing.plays += p.plays ?? 0;
      existing.engagement += (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);
      tagMap.set(t, existing);
    });
  });

  const sorted = Array.from(tagMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, opts?.limit ?? 10);

  return {
    hashtags: sorted.map(([tag, stats]) => ({
      tag,
      usageCount: stats.count,
      avgLikes: stats.count > 0 ? Math.round(stats.likes / stats.count) : 0,
      avgPlays: stats.count > 0 ? Math.round(stats.plays / stats.count) : 0,
      avgEngagementRate: stats.plays > 0
        ? Math.round((stats.engagement / stats.plays) * 10000) / 100
        : 0,
    })),
    total: tagMap.size,
  };
}

export async function fetchHashtagPerformance(
  userId: string,
  opts?: { limit?: number; sortBy?: "likes" | "plays" | "engagement" }
) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { hashtags: [], sortBy: opts?.sortBy ?? "engagement" };

  const allPosts = await db
    .select({
      hashtags: posts.hashtags,
      likes: posts.likes,
      comments: posts.comments,
      shares: posts.shares,
      plays: posts.plays,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const tagMap = new Map<string, {
    count: number; likes: number; comments: number; shares: number; plays: number;
  }>();

  allPosts.forEach((p) => {
    if (!p.hashtags) return;
    p.hashtags.forEach((tag) => {
      const t = tag.toLowerCase().replace(/^#/, "");
      if (!t) return;
      const existing = tagMap.get(t) || { count: 0, likes: 0, comments: 0, shares: 0, plays: 0 };
      existing.count++;
      existing.likes += p.likes ?? 0;
      existing.comments += p.comments ?? 0;
      existing.shares += p.shares ?? 0;
      existing.plays += p.plays ?? 0;
      tagMap.set(t, existing);
    });
  });

  const sortBy = opts?.sortBy ?? "engagement";
  const sorted = Array.from(tagMap.entries())
    .sort((a, b) => {
      if (sortBy === "likes") return b[1].likes - a[1].likes;
      if (sortBy === "plays") return b[1].plays - a[1].plays;
      // engagement rate
      const rateA = a[1].plays > 0 ? (a[1].likes + a[1].comments + a[1].shares) / a[1].plays : 0;
      const rateB = b[1].plays > 0 ? (b[1].likes + b[1].comments + b[1].shares) / b[1].plays : 0;
      return rateB - rateA;
    })
    .slice(0, opts?.limit ?? 10);

  return {
    hashtags: sorted.map(([tag, s]) => ({
      tag,
      usageCount: s.count,
      totalPlays: s.plays,
      totalLikes: s.likes,
      totalComments: s.comments,
      totalShares: s.shares,
      avgEngagementRate: s.plays > 0
        ? Math.round(((s.likes + s.comments + s.shares) / s.plays) * 10000) / 100
        : 0,
    })),
    sortBy,
  };
}

export async function fetchHashtagTrends(
  userId: string,
  opts?: { period?: "day" | "week" | "month" }
) {
  const period = opts?.period ?? "week";
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { period, hashtags: [] };

  const allPosts: PostRow[] = await db
    .select({
      hashtags: posts.hashtags,
      likes: posts.likes,
      comments: posts.comments,
      shares: posts.shares,
      plays: posts.plays,
      postedAt: posts.postedAt,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  // Find top 5 hashtags first
  const tagCounts = new Map<string, number>();
  allPosts.forEach((p) => {
    if (!p.hashtags) return;
    p.hashtags.forEach((tag) => {
      const t = tag.toLowerCase().replace(/^#/, "");
      if (!t) return;
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    });
  });

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  // Build time series for each top tag
  const now = new Date();
  const numPeriods = 12;
  const dateLabels: string[] = [];

  for (let i = numPeriods - 1; i >= 0; i--) {
    if (period === "day") {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dateLabels.push(d.toISOString().split("T")[0]);
    } else if (period === "week") {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      dateLabels.push(d.toISOString().split("T")[0]);
    } else {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      dateLabels.push(d.toISOString().split("T")[0]);
    }
  }

  const getPeriodIndex = (date: Date): number => {
    for (let i = dateLabels.length - 1; i >= 0; i--) {
      if (date >= new Date(dateLabels[i])) return i;
    }
    return -1;
  };

  const tagSeries = topTags.map((tag) => {
    const points = dateLabels.map((d) => ({ date: d, count: 0 }));
    allPosts.forEach((p) => {
      if (!p.hashtags || !p.postedAt) return;
      const hasTag = p.hashtags.some((t) => t.toLowerCase().replace(/^#/, "") === tag);
      if (!hasTag) return;
      const idx = getPeriodIndex(new Date(p.postedAt));
      if (idx >= 0) points[idx].count++;
    });
    return { tag, points };
  });

  return { period, hashtags: tagSeries };
}
