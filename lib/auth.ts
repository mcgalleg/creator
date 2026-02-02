import {
  auth as clerkAuth,
  currentUser as clerkCurrentUser,
} from "@clerk/nextjs/server";

/**
 * Test user ID used when BYPASS_AUTH is enabled.
 * This must match the ID in scripts/seed-test-user.ts
 */
export const TEST_USER_ID = "test_user_123";

/**
 * Mock user data for test mode
 */
const TEST_USER = {
  id: TEST_USER_ID,
  firstName: "Test",
  lastName: "User",
  fullName: "Test User",
  emailAddresses: [{ emailAddress: "test@example.com" }],
  imageUrl: "",
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
};

/**
 * Auth wrapper that supports bypassing Clerk authentication for testing.
 *
 * When BYPASS_AUTH=true environment variable is set, returns a mock user ID
 * instead of calling Clerk. This allows automated testing without triggering
 * Clerk's bot detection.
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
    return { userId: TEST_USER_ID };
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
    return TEST_USER;
  }

  // Normal Clerk user lookup
  return clerkCurrentUser();
}
