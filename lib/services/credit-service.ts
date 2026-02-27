import { db } from "@/lib/db";
import { users, creditTransactions } from "@/lib/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { CREDIT_PRICING_DISPLAY } from "@/lib/credits";
import { ingestSyncCreditEvent, getPolarMeterBalances } from "@/lib/polar";

/**
 * Read carryover columns from the users table.
 * These represent unused credits from a previous tier after an upgrade.
 */
export async function getCarryover(userId: string): Promise<{ aiTokens: number; syncCredits: number }> {
  const result = await db
    .select({
      carryoverAiTokens: users.carryoverAiTokens,
      carryoverSyncCredits: users.carryoverSyncCredits,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) return { aiTokens: 0, syncCredits: 0 };
  return {
    aiTokens: result[0].carryoverAiTokens,
    syncCredits: result[0].carryoverSyncCredits,
  };
}

export type CreditTransactionType =
  | "sync_posts"
  | "sync_comments"
  | "credit_hold"
  | "purchase"
  | "refund"
  | "signup_bonus"
  | "ai_chat"
  | "subscription_renewal"
  | "credit_pack_purchase"
  | "ai_token_pack_purchase";

/**
 * Get current credit balance for user (sync credits from local cache)
 */
export async function getUserCredits(userId: string): Promise<number> {
  const result = await db
    .select({ creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("User not found");
  }

  return result[0].creditBalance;
}

/**
 * Verify user has sufficient sync credit balance.
 * Reads from Polar (source of truth) first, falls back to local DB cache.
 */
export async function checkCredits(
  userId: string,
  amount: number
): Promise<{ sufficient: boolean; balance: number; required: number }> {
  let balance: number;

  try {
    const [meterBalances, carryover] = await Promise.all([
      getPolarMeterBalances(userId),
      getCarryover(userId),
    ]);
    balance = meterBalances.syncCredits + carryover.syncCredits;

    // Fire-and-forget: update local DB cache
    syncCreditBalance(userId).catch((err) =>
      console.error("Background cache sync failed in checkCredits:", err)
    );
  } catch {
    // Polar unreachable — fall back to local DB cache
    balance = await getUserCredits(userId);
  }

  return {
    sufficient: balance >= amount,
    balance,
    required: amount,
  };
}

/**
 * Sync the local creditBalance cache from Polar meter balances.
 * Polar meters are the source of truth; this updates the local DB cache.
 */
export async function syncCreditBalance(userId: string): Promise<number> {
  const [balances, carryover] = await Promise.all([
    getPolarMeterBalances(userId),
    getCarryover(userId),
  ]);

  const totalSyncCredits = Math.max(0, balances.syncCredits) + carryover.syncCredits;

  const [updateResult] = await db
    .update(users)
    .set({
      creditBalance: totalSyncCredits,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ creditBalance: users.creditBalance });

  if (!updateResult) {
    // User doesn't exist locally yet (e.g. webhook arrived before provisioning)
    return 0;
  }

  return updateResult.creditBalance;
}

/**
 * Verify user has sufficient AI token balance.
 * Reads from Polar AI token meter (source of truth), falls back to 0.
 */
export async function checkAiTokens(
  userId: string,
  amount: number
): Promise<{ sufficient: boolean; balance: number; required: number }> {
  let balance: number;

  try {
    const [meterBalances, carryover] = await Promise.all([
      getPolarMeterBalances(userId),
      getCarryover(userId),
    ]);
    balance = meterBalances.aiTokens + carryover.aiTokens;
  } catch {
    // Polar unreachable — deny by default (no local cache for AI tokens)
    balance = 0;
  }

  return {
    sufficient: balance >= amount,
    balance,
    required: amount,
  };
}

/**
 * Add credits to user balance. Syncs from Polar meters (source of truth).
 * Called from webhooks when Polar grants credits.
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: "purchase" | "refund" | "signup_bonus" | "subscription_renewal" | "credit_pack_purchase" | "ai_token_pack_purchase",
  description: string
): Promise<number> {
  if (!amount || amount <= 0) {
    return getUserCredits(userId);
  }

  // Record the audit log entry
  await db.insert(creditTransactions).values({
    userId,
    amount,
    type,
    description,
  });

  // Sync from Polar (source of truth) to update local cache
  return syncCreditBalance(userId);
}

/**
 * Deduct credits from user balance (simple post-hoc deduction, no hold/finalize).
 * For ai_chat: Polar LLM Strategy auto-ingests token events, so we only update local cache + audit log.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  type: "ai_chat",
  description: string
): Promise<number> {
  if (!amount || amount <= 0) {
    return getUserCredits(userId);
  }

  // AI chat: Polar LLM Strategy handles ingestion automatically.
  // Just update local cache + write audit log.
  const [updateResult] = await db.batch([
    db.update(users)
      .set({
        creditBalance: sql`GREATEST(${users.creditBalance} - ${amount}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ creditBalance: users.creditBalance }),
    db.insert(creditTransactions).values({
      userId,
      amount: -amount,
      type,
      description,
    }),
  ]);

  if (updateResult.length === 0) {
    throw new Error("User not found");
  }

  return updateResult[0].creditBalance;
}

/**
 * Hold credits in escrow (deducts from local cache, can be finalized or refunded).
 * Holds work on the local cache only. Polar event is ingested on finalization.
 *
 * Uses a conditional UPDATE (WHERE creditBalance >= amount) which acquires a
 * row-level lock in PostgreSQL, preventing concurrent over-deduction.
 * The transaction log is only inserted after a successful deduction.
 */
export async function holdCredits(
  userId: string,
  amount: number,
  description: string
): Promise<number> {
  if (!amount || amount <= 0) {
    return getUserCredits(userId);
  }

  // Atomic check-and-deduct: the WHERE clause ensures the row lock prevents races.
  // Do this BEFORE inserting the transaction log so a failed hold doesn't leave orphaned records.
  const balanceUpdate = await db.update(users)
    .set({
      creditBalance: sql`${users.creditBalance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), gte(users.creditBalance, amount)))
    .returning({ creditBalance: users.creditBalance });

  if (balanceUpdate.length === 0) {
    throw new Error(
      `Insufficient credits. Required: ${amount}`
    );
  }

  // Only record the hold after successful deduction — refund if log insert fails
  try {
    await db.insert(creditTransactions).values({
      userId,
      amount: -amount,
      type: "credit_hold",
      description,
    });
  } catch (logError) {
    // Refund the deduction if we can't log it
    await db.update(users)
      .set({ creditBalance: sql`${users.creditBalance} + ${amount}` })
      .where(eq(users.id, userId));
    throw logError;
  }

  return balanceUpdate[0].creditBalance;
}

/**
 * Finalize a credit hold, adjusting for actual usage.
 * The hold already deducted `held` from the user's local cache.
 * This function settles the difference and ingests the Polar sync-credits event.
 */
export async function finalizeCredits(
  userId: string,
  held: number,
  actual: number,
  type: "sync_posts" | "sync_comments",
  description: string
): Promise<void> {
  const difference = held - actual;

  // 1. Adjust local DB first (authoritative ledger)
  if (difference > 0) {
    // Overestimate — refund overage to local cache, record actual usage
    await db.batch([
      db.update(users)
        .set({
          creditBalance: sql`${users.creditBalance} + ${difference}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId)),
      db.insert(creditTransactions).values({
        userId,
        amount: -actual,
        type,
        description,
      }),
    ]);
  } else if (difference < 0) {
    // Underestimate — charge additional from local cache, record actual usage
    const additionalAmount = -difference;

    await db.batch([
      db.update(users)
        .set({
          creditBalance: sql`GREATEST(${users.creditBalance} - ${additionalAmount}, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId)),
      db.insert(creditTransactions).values({
        userId,
        amount: -actual,
        type,
        description,
      }),
    ]);
  } else {
    // Exact match — no balance adjustment needed, record actual usage
    await db.insert(creditTransactions).values({
      userId,
      amount: -actual,
      type,
      description,
    });
  }

  // 2. Ingest the actual usage to Polar (best-effort, local DB is authoritative)
  if (actual > 0) {
    try {
      await ingestSyncCreditEvent(userId, actual, { type });
    } catch (e) {
      console.error("Polar ingest failed, will reconcile:", e);
    }
  }
}

/**
 * Refund a full credit hold back to the user (local cache only, no Polar event)
 */
export async function refundHold(
  userId: string,
  amount: number,
  description: string
): Promise<number> {
  if (amount <= 0) {
    return getUserCredits(userId);
  }

  const [updateResult] = await db.batch([
    db.update(users)
      .set({
        creditBalance: sql`${users.creditBalance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ creditBalance: users.creditBalance }),
    db.insert(creditTransactions).values({
      userId,
      amount,
      type: "refund",
      description,
    }),
  ]);

  if (updateResult.length === 0) {
    throw new Error("User not found");
  }

  return updateResult[0].creditBalance;
}

/**
 * Get transaction history for user
 */
export async function getCreditHistory(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<
  Array<{
    id: number;
    type: CreditTransactionType;
    amount: number;
    description: string | null;
    createdAt: Date;
  }>
> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const transactions = await db
    .select({
      id: creditTransactions.id,
      type: creditTransactions.type,
      amount: creditTransactions.amount,
      description: creditTransactions.description,
      createdAt: creditTransactions.createdAt,
    })
    .from(creditTransactions)
    .where(and(
      eq(creditTransactions.userId, userId),
      sql`${creditTransactions.type} != 'credit_hold'`
    ))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  return transactions as Array<{
    id: number;
    type: CreditTransactionType;
    amount: number;
    description: string | null;
    createdAt: Date;
  }>;
}

/**
 * Get credit pricing table for display in UI
 */
export function getCreditPricing() {
  return CREDIT_PRICING_DISPLAY;
}
