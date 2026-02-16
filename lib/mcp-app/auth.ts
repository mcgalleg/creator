import { auth } from "@/lib/auth";

/**
 * Get the current user ID from either OAuth authInfo or Clerk session.
 * Used by all MCP App tool handlers.
 */
export async function getCurrentUserId(
  authInfo?: { extra?: { userId?: string } }
): Promise<string> {
  // OAuth path: external MCP clients (Claude Desktop, ChatGPT)
  if (authInfo?.extra?.userId) {
    return authInfo.extra.userId as string;
  }
  // Clerk session path: in-app MCP or test bypass
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }
  return userId;
}
