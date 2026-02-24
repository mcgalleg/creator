import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { getPolar } from "@/lib/polar";
import { POLAR_PRODUCTS } from "@/lib/subscriptions";

/**
 * Ensures a user exists in the database.
 * If the user doesn't exist (e.g., webhook didn't fire in development),
 * create them with default values and subscribe to free Polar product.
 *
 * Mirrors the webhook handler: creates Polar customer + free subscription.
 */
export async function ensureUserExists(userId: string): Promise<boolean> {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length > 0) {
      return true;
    }

    // User doesn't exist, fetch from Clerk and create
    const clerkUser = await currentUser();

    if (!clerkUser || clerkUser.id !== userId) {
      console.error("Could not fetch Clerk user to create database record");
      return false;
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

    // Create user with 0 balance (credits come from Polar)
    await db.insert(users).values({
      id: userId,
      email,
      name,
      imageUrl: clerkUser.imageUrl ?? null,
      creditBalance: 0,
    });

    // Create Polar customer and subscribe to free product
    try {
      const polar = getPolar();
      await polar.customers.create({
        externalId: userId,
        email,
        name: name ?? undefined,
      });

      // Subscribe to the free Polar product ($0/month) for baseline credits
      if (POLAR_PRODUCTS.free) {
        await polar.subscriptions.create({
          productId: POLAR_PRODUCTS.free,
          externalCustomerId: userId,
        });
      }

    } catch (polarErr) {
      // Log but don't fail — user is created in DB regardless
      console.error(`Failed to create Polar customer for ${userId}:`, polarErr);
    }

    console.log(`Created user ${userId} on-the-fly`);
    return true;
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return false;
  }
}
