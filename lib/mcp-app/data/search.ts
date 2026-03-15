import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { generateQueryEmbedding } from "@/lib/services/embedding-service";
import { getUserAccountIds } from "./accounts";

type SearchResult = {
  text: string;
  author_username: string | null;
  likes: number | null;
  posted_at: string | null;
  sentiment: string | null;
  sentiment_category: string | null;
  post_description: string | null;
  similarity: number;
};

type SearchResponse = {
  results: SearchResult[];
  count: number;
  query: string;
  error?: string;
};

/**
 * Semantic search across comments using pgvector cosine similarity.
 * Results are scoped to the authenticated user's accounts.
 */
export async function searchComments(
  userId: string,
  query: string,
  options?: {
    limit?: number;
    sentiment?: "supportive" | "neutral" | "unsupportive";
    selectedAccountIds?: number[];
  }
): Promise<SearchResponse> {
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return { results: [], count: 0, query: "", error: "A search query is required. Provide a natural language description of the comments to find." };
  }

  const limit = Math.min(options?.limit ?? 30, 50);

  const accountIds = await getUserAccountIds(
    userId,
    options?.selectedAccountIds?.map(String)
  );

  if (accountIds.length === 0) {
    return { results: [], count: 0, query };
  }

  // Generate embedding for the search query
  const queryEmbedding = await generateQueryEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const ids = accountIds.join(", ");

  // Optional sentiment filter — validated enum so safe to interpolate
  const sentimentClause = options?.sentiment
    ? `AND c.sentiment = '${options.sentiment}'`
    : "";

  const result = await db.execute(sql.raw(`
    WITH scoped_comments AS NOT MATERIALIZED (
      SELECT * FROM comments
      WHERE post_id IN (SELECT id FROM posts WHERE account_id IN (${ids}))
    )
    SELECT c.text, c.author_username, c.likes, c.posted_at,
           c.sentiment, c.sentiment_category,
           p.description as post_description,
           1 - (c.text_embedding <=> '${embeddingStr}'::vector) as similarity
    FROM scoped_comments c
    JOIN posts p ON c.post_id = p.id
    WHERE c.text_embedding IS NOT NULL
      ${sentimentClause}
    ORDER BY c.text_embedding <=> '${embeddingStr}'::vector
    LIMIT ${limit}
  `));

  const rows = (Array.isArray(result) ? result : (result as Record<string, unknown>).rows ?? []) as SearchResult[];

  return {
    results: rows,
    count: rows.length,
    query,
  };
}
