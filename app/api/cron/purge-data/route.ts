import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tiktokAccounts } from "@/lib/db/schema";
import { eq, lt } from "drizzle-orm";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

function verifyBearerToken(header: string | null, secret: string | undefined): boolean {
  if (!header || !secret) return false;
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

export async function GET(req: Request) {
  if (!verifyBearerToken(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const expiredUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(lt(users.dataPurgeAt, now));

    let purged = 0;
    let failed = 0;

    for (const user of expiredUsers) {
      try {
        // Delete all tiktokAccounts for this user (cascades to posts -> comments, metrics, sync-jobs)
        await db.delete(tiktokAccounts).where(eq(tiktokAccounts.userId, user.id));

        // Reset user to free tier with no data
        await db.update(users)
          .set({
            subscriptionTier: "free",
            dataPurgeAt: null,
            subscriptionStartedAt: null,
            subscriptionExpiresAt: null,
            creditsResetAt: null,
            creditBalance: 0,
            updatedAt: now,
          })
          .where(eq(users.id, user.id));

        purged++;
      } catch (err) {
        console.error(`Failed to purge data for user ${user.id}:`, err);
        failed++;
      }
    }

    console.log(`Data purge cron: ${purged} purged, ${failed} failed, ${expiredUsers.length} total`);
    return NextResponse.json({ purged, failed, total: expiredUsers.length });
  } catch (error) {
    console.error("Data purge cron failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
