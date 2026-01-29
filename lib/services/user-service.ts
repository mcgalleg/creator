import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Ensures a user exists in the database.
 * If the user doesn't exist (e.g., webhook didn't fire in development),
 * create them with default values.
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

    // Create user with signup bonus
    await db.insert(users).values({
      id: userId,
      email: clerkUser.emailAddresses?.[0]?.emailAddress ?? "",
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
      imageUrl: clerkUser.imageUrl ?? null,
      creditBalance: 100, // Signup bonus
    });

    console.log(`Created user ${userId} on-the-fly with 100 signup bonus credits`);
    return true;
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return false;
  }
}
