import { config } from "dotenv";
config({ path: ".env.local" });

import * as readline from "readline";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function purgeAll() {
  // Warn if pointing at production
  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl.includes("production") || dbUrl.includes("prod.")) {
    console.error("ERROR: DATABASE_URL appears to point to production. Aborting.");
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>(resolve => rl.question("\u26A0\uFE0F  This will DELETE ALL DATA. Type 'YES' to confirm: ", resolve));
  rl.close();
  if (answer !== "YES") { console.log("Aborted."); process.exit(0); }

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
