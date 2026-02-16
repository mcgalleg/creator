import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

export async function fetchPostingFrequency(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { days: [] };

  const allPosts = await db
    .select({ postedAt: posts.postedAt })
    .from(posts)
    .where(inArray(posts.accountId, accountIdList));

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const shortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCounts: Record<number, number> = {};
  for (let i = 0; i < 7; i++) dayCounts[i] = 0;

  allPosts.forEach((p) => {
    if (!p.postedAt) return;
    dayCounts[new Date(p.postedAt).getDay()]++;
  });

  const days = Object.entries(dayCounts).map(([d, count]) => ({
    day: dayNames[parseInt(d)],
    shortDay: shortNames[parseInt(d)],
    posts: count,
  }));

  return { days };
}

export async function fetchBestPostingTimes(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { heatmap: [] };

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

  const grid: Record<string, { engagement: number; plays: number; count: number }> = {};

  allPosts.forEach((p) => {
    if (!p.postedAt) return;
    const d = new Date(p.postedAt);
    const day = d.getDay();
    const hour = d.getHours();
    const key = `${day}-${hour}`;
    if (!grid[key]) grid[key] = { engagement: 0, plays: 0, count: 0 };
    grid[key].engagement += (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);
    grid[key].plays += p.plays ?? 0;
    grid[key].count++;
  });

  const heatmap: Array<{ day: number; hour: number; avgEngagement: number }> = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      const cell = grid[key];
      heatmap.push({
        day,
        hour,
        avgEngagement: cell && cell.count > 0
          ? Math.round(cell.engagement / cell.count)
          : 0,
      });
    }
  }

  return { heatmap };
}
