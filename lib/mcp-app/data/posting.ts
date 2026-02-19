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
