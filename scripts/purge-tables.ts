import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function purgeAll() {
  console.log("Purging all tables...");

  await db.execute(sql`
    TRUNCATE TABLE
      comments,
      account_metrics_history,
      credit_transactions,
      pinned_components,
      dashboard_layouts,
      sync_jobs,
      posts,
      drawings,
      feature_flags,
      tiktok_accounts,
      users
    CASCADE
  `);

  console.log("All tables purged successfully.");
}

purgeAll().catch((e) => {
  console.error("Failed to purge tables:", e);
  process.exit(1);
});
