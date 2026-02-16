import { db } from "@/lib/db";
import { posts, comments } from "@/lib/db/schema";
import { eq, inArray, sql, count, desc } from "drizzle-orm";
import { getUserAccountIds } from "./accounts";

// Map common region codes to display names
const REGION_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada",
  AU: "Australia", DE: "Germany", FR: "France", BR: "Brazil",
  IN: "India", MX: "Mexico", JP: "Japan", KR: "South Korea",
  ES: "Spain", IT: "Italy", NL: "Netherlands", SE: "Sweden",
  PH: "Philippines", ID: "Indonesia", TH: "Thailand", VN: "Vietnam",
  MY: "Malaysia", SG: "Singapore", PK: "Pakistan", NG: "Nigeria",
  ZA: "South Africa", AR: "Argentina", CO: "Colombia", CL: "Chile",
  PE: "Peru", PL: "Poland", TR: "Turkey", RU: "Russia",
  UA: "Ukraine", EG: "Egypt", SA: "Saudi Arabia", AE: "UAE",
  TW: "Taiwan", HK: "Hong Kong", NZ: "New Zealand", IE: "Ireland",
  PT: "Portugal", BE: "Belgium", CH: "Switzerland", AT: "Austria",
};

// Map common language codes to display names
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", pt: "Portuguese", fr: "French",
  de: "German", it: "Italian", ja: "Japanese", ko: "Korean",
  zh: "Chinese", hi: "Hindi", ar: "Arabic", ru: "Russian",
  tr: "Turkish", nl: "Dutch", pl: "Polish", sv: "Swedish",
  th: "Thai", vi: "Vietnamese", id: "Indonesian", ms: "Malay",
  fil: "Filipino", tl: "Tagalog", uk: "Ukrainian",
};

export async function fetchAudienceGeography(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { regions: [], totalCommenters: 0 };

  const results = await db
    .select({
      region: comments.authorRegion,
      cnt: count(),
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(inArray(posts.accountId, accountIdList))
    .groupBy(comments.authorRegion)
    .orderBy(desc(count()));

  const totalCommenters = results.reduce((s, r) => s + r.cnt, 0);

  const regions = results
    .filter((r) => r.region)
    .map((r) => ({
      code: r.region!,
      name: REGION_NAMES[r.region!] ?? r.region!,
      commentCount: r.cnt,
      percentage: totalCommenters > 0
        ? Math.round((r.cnt / totalCommenters) * 10000) / 100
        : 0,
    }));

  return { regions, totalCommenters };
}

export async function fetchAudienceLanguages(userId: string) {
  const accountIdList = await getUserAccountIds(userId);
  if (accountIdList.length === 0) return { languages: [], totalComments: 0 };

  const results = await db
    .select({
      language: comments.commentLanguage,
      cnt: count(),
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(inArray(posts.accountId, accountIdList))
    .groupBy(comments.commentLanguage)
    .orderBy(desc(count()));

  const totalComments = results.reduce((s, r) => s + r.cnt, 0);

  const languages = results
    .filter((r) => r.language)
    .map((r) => ({
      code: r.language!,
      name: LANGUAGE_NAMES[r.language!] ?? r.language!,
      commentCount: r.cnt,
      percentage: totalComments > 0
        ? Math.round((r.cnt / totalComments) * 10000) / 100
        : 0,
    }));

  return { languages, totalComments };
}
