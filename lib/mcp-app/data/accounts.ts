import { db } from "@/lib/db";
import { tiktokAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/** Helper: get account IDs for a user, optionally filtered */
export async function getUserAccountIds(
  userId: string,
  accountIds?: string[]
): Promise<number[]> {
  const accounts = await db
    .select({ id: tiktokAccounts.id })
    .from(tiktokAccounts)
    .where(and(eq(tiktokAccounts.userId, userId), eq(tiktokAccounts.status, "active")));

  if (accountIds && accountIds.length > 0) {
    const requested = new Set(accountIds.map((id) => parseInt(id, 10)));
    const filtered = accounts.filter((a) => requested.has(a.id));
    if (filtered.length !== requested.size) {
      throw new Error("One or more accounts not found or not owned by user");
    }
    return filtered.map((a) => a.id);
  }

  return accounts.map((a) => a.id);
}
