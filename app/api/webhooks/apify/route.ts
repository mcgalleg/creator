import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { handleSyncWebhook } from "@/lib/services/sync-service";

export async function POST(request: NextRequest) {
  // 1. Verify secret via header only (never accept secrets in query params — they leak in logs)
  const headerSecret = request.headers.get("X-Apify-Webhook-Secret");
  const expectedSecret = process.env.APIFY_WEBHOOK_SECRET;

  if (!expectedSecret || !headerSecret || headerSecret.length !== expectedSecret.length || !timingSafeEqual(Buffer.from(headerSecret), Buffer.from(expectedSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse the webhook payload
  const body = await request.json();
  const { eventType, resource } = body;

  if (!resource?.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // 3. Map event type to status
  const statusMap: Record<
    string,
    "SUCCEEDED" | "FAILED" | "ABORTED" | "TIMED-OUT"
  > = {
    "ACTOR.RUN.SUCCEEDED": "SUCCEEDED",
    "ACTOR.RUN.FAILED": "FAILED",
    "ACTOR.RUN.ABORTED": "ABORTED",
    "ACTOR.RUN.TIMED_OUT": "TIMED-OUT",
  };

  const status = statusMap[eventType];
  if (!status) {
    // Unknown event type, just acknowledge
    return NextResponse.json({ ok: true });
  }

  // 4. Process the webhook (runs async, but we await it since Apify allows 30s)
  try {
    await handleSyncWebhook(resource.id, status);
  } catch (error) {
    console.error("[Webhook] Error processing:", error);
    // Still return 200 to prevent Apify from retrying
  }

  return NextResponse.json({ ok: true });
}
