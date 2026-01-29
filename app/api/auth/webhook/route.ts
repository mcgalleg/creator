import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

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

    // Build full name from first and last name
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    // Create user in database with signup bonus credits
    await db.insert(users).values({
      id,
      email: primaryEmail?.email_address ?? "",
      name,
      imageUrl: image_url ?? null,
      creditBalance: 100, // Signup bonus
    });

    console.log(`Created user ${id} with 100 signup bonus credits`);
  }

  return new Response("Webhook received", { status: 200 });
}
