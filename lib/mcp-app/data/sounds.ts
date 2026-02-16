import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { inArray, sql, isNotNull } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

export async function fetchSoundAnalytics(
  userId: string,
  opts?: { limit?: number; sortBy?: "plays" | "likes" | "usage" }
) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) {
    return { sounds: [], totalOriginal: 0, totalTrending: 0 };
  }

  const allPosts = await db
    .select({
      songTitle: posts.songTitle,
      songArtist: posts.songArtist,
      songDuration: posts.songDuration,
      likes: posts.likes,
      comments: posts.comments,
      shares: posts.shares,
      plays: posts.plays,
    })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const soundMap = new Map<string, {
    title: string;
    artist: string | null;
    duration: number | null;
    count: number;
    likes: number;
    plays: number;
    engagement: number;
  }>();

  let totalOriginal = 0;

  allPosts.forEach((p) => {
    const title = p.songTitle || "Original Sound";
    if (title === "Original Sound" || title.toLowerCase().includes("original sound")) {
      totalOriginal++;
      return;
    }

    const key = `${title}|${p.songArtist ?? ""}`;
    const existing = soundMap.get(key) || {
      title,
      artist: p.songArtist,
      duration: p.songDuration,
      count: 0,
      likes: 0,
      plays: 0,
      engagement: 0,
    };
    existing.count++;
    existing.likes += p.likes ?? 0;
    existing.plays += p.plays ?? 0;
    existing.engagement += (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);
    soundMap.set(key, existing);
  });

  const sortBy = opts?.sortBy ?? "plays";
  const sorted = Array.from(soundMap.values())
    .sort((a, b) => {
      if (sortBy === "likes") return b.likes - a.likes;
      if (sortBy === "usage") return b.count - a.count;
      return b.plays - a.plays;
    })
    .slice(0, opts?.limit ?? 10);

  return {
    sounds: sorted.map((s) => ({
      title: s.title,
      artist: s.artist,
      usageCount: s.count,
      avgPlays: s.count > 0 ? Math.round(s.plays / s.count) : 0,
      avgLikes: s.count > 0 ? Math.round(s.likes / s.count) : 0,
      avgEngagementRate: s.plays > 0
        ? Math.round((s.engagement / s.plays) * 10000) / 100
        : 0,
      duration: s.duration,
    })),
    totalOriginal,
    totalTrending: soundMap.size,
  };
}
