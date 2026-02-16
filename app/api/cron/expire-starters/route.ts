import { NextResponse } from "next/server";
import { findExpiredStarters, expireStarter } from "@/lib/services/trial-service";
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
    const expiredUserIds = await findExpiredStarters();
    let expired = 0;
    let failed = 0;

    for (const userId of expiredUserIds) {
      try {
        await expireStarter(userId);
        expired++;
      } catch (err) {
        console.error(`Failed to expire starter for ${userId}:`, err);
        failed++;
      }
    }

    console.log(`Starter expiry cron: ${expired} expired, ${failed} failed, ${expiredUserIds.length} total`);
    return NextResponse.json({ expired, failed, total: expiredUserIds.length });
  } catch (error) {
    console.error("Starter expiry cron failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
