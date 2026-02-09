import { db } from "@/lib/db";
import { users, creditTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { SIGNUP_BONUS_CREDITS } from "@/lib/credits";
import { getPolar, ingestSyncCreditEvent } from "@/lib/polar";

/**
 * Ensures a user exists in the database.
 * If the user doesn't exist (e.g., webhook didn't fire in development),
 * create them with default values and grant signup bonus.
 *
 * Mirrors the webhook handler: creates Polar customer + ingests signup bonus
 * so that the Polar meter (source of truth) reflects the granted credits.
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

    // Create user with signup bonus balance (matches webhook handler)
    await db.insert(users).values({
      id: userId,
      email,
      name,
      imageUrl: clerkUser.imageUrl ?? null,
      creditBalance: SIGNUP_BONUS_CREDITS,
    });

    // Record audit trail
    await db.insert(creditTransactions).values({
      userId,
      amount: SIGNUP_BONUS_CREDITS,
      type: "signup_bonus",
      description: "Welcome bonus credits",
    });

    // Create Polar customer and grant signup bonus (mirrors webhook handler)
    try {
      const polar = getPolar();
      await polar.customers.create({
        externalId: userId,
        email,
        name: name ?? undefined,
      });
      await ingestSyncCreditEvent(userId, -SIGNUP_BONUS_CREDITS, { type: "signup_bonus" });
    } catch (polarErr) {
      // Log but don't fail — user is created in DB with credits regardless
      console.error(`Failed to create Polar customer for ${userId}:`, polarErr);
    }

    console.log(`Created user ${userId} on-the-fly with ${SIGNUP_BONUS_CREDITS} signup bonus credits`);
    return true;
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return false;
  }
}
