import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function purgeAll() {
  console.log("Purging all tables...");

  await db.execute(sql`
    TRUNCATE TABLE
      comments,
      post_collaborators,
      account_metrics_history,
      credit_transactions,
      dashboard_layouts,
      sync_jobs,
      posts,
      drawings,
      user_feature_overrides,
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
