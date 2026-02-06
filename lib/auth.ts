import {
  auth as clerkAuth,
  currentUser as clerkCurrentUser,
} from "@clerk/nextjs/server";
import { headers } from "next/headers";

/**
 * Test user ID used when BYPASS_AUTH is enabled.
 * This must match the ID in scripts/seed-test-user.ts
 */
export const TEST_USER_ID = "test_user_123";

/**
 * Build mock user data for a given test user ID.
 */
function buildTestUser(userId: string) {
  return {
    id: userId,
    firstName: "Test",
    lastName: "User",
    fullName: "Test User",
    emailAddresses: [{ emailAddress: `${userId}@example.com` }],
    imageUrl: "",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  };
}

/**
 * Read the test user ID from the X-Test-User-Id header, falling back to TEST_USER_ID.
 */
async function getTestUserId(): Promise<string> {
  try {
    const hdrs = await headers();
    const testUserId = hdrs.get("x-test-user-id");
    return testUserId || TEST_USER_ID;
  } catch {
    return TEST_USER_ID;
  }
}

/**
 * Auth wrapper that supports bypassing Clerk authentication for testing.
 *
 * When BYPASS_AUTH=true environment variable is set, returns a mock user ID
 * instead of calling Clerk. This allows automated testing without triggering
 * Clerk's bot detection.
 *
 * If the X-Test-User-Id header is present, that value is used as the userId,
 * enabling multi-user test isolation.
 *
 * IMPORTANT: BYPASS_AUTH should NEVER be enabled in production.
 */
export async function auth(): Promise<{ userId: string | null }> {
  // Production safeguard - prevent bypass in production
  if (
    process.env.NODE_ENV === "production" &&
    process.env.BYPASS_AUTH === "true"
  ) {
    throw new Error(
      "BYPASS_AUTH cannot be enabled in production. This is a security violation."
    );
  }

  // Bypass auth in test mode
  if (process.env.BYPASS_AUTH === "true") {
    const userId = await getTestUserId();
    return { userId };
  }

  // Normal Clerk authentication
  return clerkAuth();
}

/**
 * Check if auth bypass is currently enabled.
 * Useful for conditional logic in components.
 */
export function isAuthBypassed(): boolean {
  return process.env.BYPASS_AUTH === "true";
}

/**
 * Get the current user, with test mode support.
 * Returns mock user data when BYPASS_AUTH is enabled.
 */
export async function currentUser() {
  // Production safeguard
  if (
    process.env.NODE_ENV === "production" &&
    process.env.BYPASS_AUTH === "true"
  ) {
    throw new Error(
      "BYPASS_AUTH cannot be enabled in production. This is a security violation."
    );
  }

  // Return mock user in test mode
  if (process.env.BYPASS_AUTH === "true") {
    const userId = await getTestUserId();
    return buildTestUser(userId);
  }

  // Normal Clerk user lookup
  return clerkCurrentUser();
}
