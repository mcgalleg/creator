import { NextResponse } from "next/server";
import { findExpiredTrials, expireTrial } from "@/lib/services/trial-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiredUserIds = await findExpiredTrials();
    let expired = 0;
    let failed = 0;

    for (const userId of expiredUserIds) {
      try {
        await expireTrial(userId);
        expired++;
      } catch (err) {
        console.error(`Failed to expire trial for ${userId}:`, err);
        failed++;
      }
    }

    console.log(`Trial expiry cron: ${expired} expired, ${failed} failed, ${expiredUserIds.length} total`);
    return NextResponse.json({ expired, failed, total: expiredUserIds.length });
  } catch (error) {
    console.error("Trial expiry cron failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
