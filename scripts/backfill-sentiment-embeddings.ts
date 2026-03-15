/**
 * Backfill sentiment classification + embeddings for existing comments.
 *
 * Usage:
 *   npx tsx scripts/backfill-sentiment-embeddings.ts
 *   npx tsx scripts/backfill-sentiment-embeddings.ts --dry-run
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { classifyComments } from "../lib/services/classification-service";
import { generateEmbeddings } from "../lib/services/embedding-service";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

  const client = neon(process.env.DATABASE_URL);
  const db = drizzle({ client });

  if (isDryRun) console.log("=== DRY RUN — no writes will be made ===\n");

  // Count total unclassified
  const countResult = await db.execute(sql`
    SELECT COUNT(*)::int as total FROM comments
    WHERE sentiment IS NULL AND text IS NOT NULL AND text != ''
  `);
  const countRows = Array.isArray(countResult) ? countResult : (countResult as Record<string, unknown>).rows as Record<string, unknown>[] ?? [];
  const total = Number(countRows[0]?.total ?? 0);
  console.log(`Found ${total} unclassified comments\n`);

  if (total === 0) {
    console.log("Nothing to do.");
    return;
  }

  const BATCH_SIZE = 200;
  let processed = 0;

  while (true) {
    const batchResult = await db.execute(sql`
      SELECT id, text FROM comments
      WHERE sentiment IS NULL AND text IS NOT NULL AND text != ''
      ORDER BY id
      LIMIT ${BATCH_SIZE}
    `);
    const batchRows = Array.isArray(batchResult) ? batchResult : (batchResult as Record<string, unknown>).rows as Record<string, unknown>[] ?? [];
    const batch = batchRows as unknown as { id: number; text: string }[];
    if (batch.length === 0) break;

    if (isDryRun) {
      console.log(`[DRY RUN] Would process ${total} comments in ${Math.ceil(total / BATCH_SIZE)} batches of ${BATCH_SIZE}`);
      break;
    } else {
      // Run classification and embedding in parallel
      const [classifications, embeddings] = await Promise.all([
        classifyComments(batch.map((r) => ({ id: r.id, text: r.text }))),
        generateEmbeddings(batch.map((r) => r.text)),
      ]);

      const classMap = new Map(classifications.map((c) => [c.id, c]));

      // Bulk update via UPDATE ... FROM (VALUES ...) — single round trip per batch
      const values: string[] = [];
      for (let j = 0; j < batch.length; j++) {
        const comment = batch[j];
        const cls = classMap.get(comment.id);
        const embedding = embeddings[j];
        if (cls && embedding) {
          const embeddingStr = `[${embedding.join(",")}]`;
          values.push(
            `(${comment.id}, '${cls.sentiment}', '${cls.category}', ${cls.score}, '${embeddingStr}'::vector)`
          );
        }
      }

      if (values.length > 0) {
        await db.execute(sql.raw(`
          UPDATE comments
          SET sentiment = v.sentiment,
              sentiment_category = v.sentiment_category,
              sentiment_score = v.sentiment_score,
              text_embedding = v.text_embedding
          FROM (VALUES ${values.join(", ")}) AS v(id, sentiment, sentiment_category, sentiment_score, text_embedding)
          WHERE comments.id = v.id
        `));
      }

      processed += batch.length;
      console.log(`Processed ${processed}/${total} (${((processed / total) * 100).toFixed(1)}%)`);
    }

    // Rate limit: 500ms between batches
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone! Processed ${processed} comments.`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
