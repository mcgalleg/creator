import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, syncJobs } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { cancelSyncJob } from "@/lib/services/sync-service";
import { getPolar } from "@/lib/polar";
import { POLAR_PRODUCTS } from "@/lib/subscriptions";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SIGNING_SECRET");
    return new Response("Missing signing secret", { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the raw body text (important: don't parse and re-stringify)
  const body = await req.text();

  // Handle test/ping webhooks from Clerk dashboard (sends null body)
  if (!body || body === "null") {
    console.log("Received test ping from Clerk");
    return new Response("Webhook endpoint active", { status: 200 });
  }

  // Create a new Svix instance with your secret
  const wh = new Webhook(SIGNING_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  // Check if evt is valid
  if (!evt || !evt.type) {
    console.error("Invalid webhook payload");
    return new Response("Invalid webhook payload", { status: 400 });
  }

  console.log(`Received webhook: ${evt.type}`);

  // Handle user.created event
  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    // Get primary email
    const primaryEmail = email_addresses?.find(
      (email) => email.id === evt.data.primary_email_address_id
    );

    const email = primaryEmail?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    // Upsert user: if email exists, update the Clerk ID (user re-registered)
    // This handles both duplicate webhooks and re-registered users
    // Credits now come from Polar, so creditBalance starts at 0
    const [upsertResult] = await db.insert(users)
      .values({
        id,
        email,
        name,
        imageUrl: image_url ?? null,
        creditBalance: 0,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          id, // Update to new Clerk ID if user re-registered
          name,
          imageUrl: image_url ?? null,
          updatedAt: new Date(),
        },
      })
      .returning({ trialConverted: users.trialConverted });

    // Create Polar customer with Clerk ID as externalId
    try {
      const polar = getPolar();
      await polar.customers.create({
        externalId: id,
        email,
        name: name ?? undefined,
      });

      // Subscribe to the free Polar product ($0/month) for baseline credits
      if (POLAR_PRODUCTS.free) {
        await polar.subscriptions.create({
          productId: POLAR_PRODUCTS.free,
          externalCustomerId: id,
        });
      }
    } catch (polarErr) {
      // Log but don't fail the webhook — user is created in DB regardless
      console.error(`Failed to create Polar customer for ${id}:`, polarErr);
    }

    // Start 14-day Pro trial (skip for re-registered users who already converted)
    // Wrapped in separate try/catch so trial failure doesn't break user creation
    try {
      if (!upsertResult?.trialConverted) {
        const { startTrial } = await import("@/lib/services/trial-service");
        await startTrial(id);
      }
    } catch (trialErr) {
      console.error(`Failed to start trial for ${id}:`, trialErr);
    }

    console.log(`Upserted user ${id} (email: ${email})`);
  }

  // Handle user.updated event
  if (evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const primaryEmail = email_addresses?.find(
      (email) => email.id === evt.data.primary_email_address_id
    );

    const email = primaryEmail?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    // Update user by Clerk ID
    await db.update(users)
      .set({
        email,
        name,
        imageUrl: image_url ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    console.log(`Updated user ${id}`);
  }

  // Handle user.deleted event
  if (evt.type === "user.deleted") {
    const { id } = evt.data;

    if (id) {
      // Cancel active sync jobs before user deletion
      const activeJobs = await db
        .select({ id: syncJobs.id })
        .from(syncJobs)
        .where(
          and(
            eq(syncJobs.userId, id),
            inArray(syncJobs.status, ["pending", "running"])
          )
        );

      for (const activeJob of activeJobs) {
        try {
          await cancelSyncJob(activeJob.id);
        } catch (cancelError) {
          console.error(`Failed to cancel sync job ${activeJob.id} during user deletion:`, cancelError);
        }
      }

      await db.delete(users).where(eq(users.id, id));
      console.log(`Deleted user ${id}`);
    }
  }

  return new Response("Webhook received", { status: 200 });
}
