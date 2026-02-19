import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { inArray, desc, asc, sql, count } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";
import { proxyImageUrl } from "@/lib/image-proxy";

const postSelect = {
  id: posts.id,
  tiktokId: posts.tiktokId,
  description: posts.description,
  thumbnailUrl: posts.thumbnailUrl,
  likes: posts.likes,
  comments: posts.comments,
  shares: posts.shares,
  plays: posts.plays,
  saves: posts.saves,
  postedAt: posts.postedAt,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- row shape comes from dynamic select
function mapPost(p: Record<string, any>) {
  const plays = p.plays ?? 0;
  const engagement = (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);
  const engagementRate = plays > 0 ? Math.round((engagement / plays) * 10000) / 100 : 0;
  return {
    id: p.id.toString(),
    tiktokId: p.tiktokId,
    description: p.description,
    thumbnailUrl: proxyImageUrl(p.thumbnailUrl, true),
    plays: p.plays ?? 0,
    likes: p.likes ?? 0,
    comments: p.comments ?? 0,
    shares: p.shares ?? 0,
    saves: p.saves ?? 0,
    postedAt: p.postedAt?.toISOString() ?? null,
    engagementRate,
  };
}

export async function fetchPosts(
  userId: string,
  opts?: {
    sortBy?: "likes" | "comments" | "shares" | "plays" | "postedAt";
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }
) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { posts: [], total: 0 };

  const sortCol = {
    likes: posts.likes,
    comments: posts.comments,
    shares: posts.shares,
    plays: posts.plays,
    postedAt: posts.postedAt,
  }[opts?.sortBy ?? "postedAt"];

  const orderFn = opts?.sortOrder === "asc" ? asc : desc;

  const [results, totalResult] = await Promise.all([
    db
      .select(postSelect)
      .from(posts)
      .where(inArray(posts.accountId, accountIdList))
      .orderBy(orderFn(sortCol))
      .limit(opts?.limit ?? 10)
      .offset(opts?.offset ?? 0),
    db
      .select({ cnt: count() })
      .from(posts)
      .where(inArray(posts.accountId, accountIdList)),
  ]);

  return {
    posts: results.map(mapPost),
    total: totalResult[0]?.cnt ?? 0,
  };
}

export async function fetchTopContent(
  userId: string,
  opts?: { metric?: "likes" | "comments" | "shares" | "plays"; limit?: number }
) {
  const metric = opts?.metric ?? "likes";
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { metric, posts: [] };

  const metricCol = {
    likes: posts.likes,
    comments: posts.comments,
    shares: posts.shares,
    plays: posts.plays,
  }[metric];

  const results = await db
    .select(postSelect)
    .from(posts)
    .where(inArray(posts.accountId, accountIdList))
    .orderBy(desc(metricCol))
    .limit(opts?.limit ?? 5);

  return { metric, posts: results.map(mapPost) };
}

export async function fetchViralPosts(
  userId: string,
  opts?: { limit?: number }
) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { posts: [] };

  const results = await db
    .select({
      ...postSelect,
      shareRate: sql<number>`CASE WHEN ${posts.plays} > 0 THEN ROUND(CAST(${posts.shares} AS numeric) / ${posts.plays} * 100, 2) ELSE 0 END`,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList))
    .orderBy(sql`CASE WHEN ${posts.plays} > 0 THEN CAST(${posts.shares} AS numeric) / ${posts.plays} ELSE 0 END DESC`)
    .limit(opts?.limit ?? 10);

  return {
    posts: results.map((p) => ({
      ...mapPost(p),
      shareRate: Number(p.shareRate),
    })),
  };
}

export async function fetchUnderperforming(
  userId: string,
  opts?: { limit?: number }
) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { posts: [] };

  // Get avg engagement rate across all posts
  const avgResult = await db
    .select({
      avgRate: sql<number>`CASE WHEN SUM(${posts.plays}) > 0 THEN ROUND(CAST(SUM(${posts.likes}) + SUM(${posts.comments}) + SUM(${posts.shares}) AS numeric) / SUM(${posts.plays}) * 100, 2) ELSE 0 END`,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const avgEngagementRate = Number(avgResult[0]?.avgRate ?? 0);

  const results = await db
    .select({
      ...postSelect,
      engRate: sql<number>`CASE WHEN ${posts.plays} > 0 THEN ROUND(CAST(${posts.likes} + ${posts.comments} + ${posts.shares} AS numeric) / ${posts.plays} * 100, 2) ELSE 0 END`,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList))
    .orderBy(sql`CASE WHEN ${posts.plays} > 0 THEN CAST(${posts.likes} + ${posts.comments} + ${posts.shares} AS numeric) / ${posts.plays} ELSE 0 END ASC`)
    .limit(opts?.limit ?? 10);

  return {
    posts: results.map((p) => ({
      ...mapPost(p),
      avgEngagementRate,
      performanceGap: Math.round((avgEngagementRate - Number(p.engRate)) * 100) / 100,
    })),
  };
}
