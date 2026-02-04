import { db } from "@/lib/db";
import { users, creditTransactions } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { CREDIT_PRICING_DISPLAY } from "@/lib/credits";

export type CreditTransactionType =
  | "sync_posts"
  | "sync_comments"
  | "credit_hold"
  | "purchase"
  | "refund"
  | "signup_bonus";

/**
 * Get current credit balance for user
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
 * Verify user has sufficient balance
 */
export async function checkCredits(
  userId: string,
  amount: number
): Promise<{ sufficient: boolean; balance: number; required: number }> {
  const balance = await getUserCredits(userId);

  return {
    sufficient: balance >= amount,
    balance,
    required: amount,
  };
}

/**
 * Add credits to user balance (used by purchase flow)
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: "purchase" | "refund" | "signup_bonus",
  description: string
): Promise<number> {
  // No-op for zero or negative amounts
  if (!amount || amount <= 0) {
    return getUserCredits(userId);
  }

  // Update user balance (increment)
  const updateResult = await db
    .update(users)
    .set({
      creditBalance: sql`${users.creditBalance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ creditBalance: users.creditBalance });

  if (updateResult.length === 0) {
    throw new Error("User not found");
  }

  // Insert credit transaction record with positive amount
  await db.insert(creditTransactions).values({
    userId,
    amount, // Positive for additions
    type,
    description,
  });

  return updateResult[0].creditBalance;
}

/**
 * Hold credits in escrow (deducts from balance, can be finalized or refunded)
 */
export async function holdCredits(
  userId: string,
  amount: number,
  description: string
): Promise<number> {
  // No-op for zero or negative amounts
  if (!amount || amount <= 0) {
    return getUserCredits(userId);
  }

  // Check sufficient balance
  const { sufficient, balance } = await checkCredits(userId, amount);
  if (!sufficient) {
    throw new Error(
      `Insufficient credits. Balance: ${balance}, Required: ${amount}`
    );
  }

  // Deduct from user balance
  const updateResult = await db
    .update(users)
    .set({
      creditBalance: sql`${users.creditBalance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ creditBalance: users.creditBalance });

  if (updateResult.length === 0) {
    throw new Error("Failed to update user balance");
  }

  // Insert credit hold transaction with negative amount
  await db.insert(creditTransactions).values({
    userId,
    amount: -amount,
    type: "credit_hold",
    description,
  });

  return updateResult[0].creditBalance;
}

/**
 * Finalize a credit hold, adjusting for actual usage.
 * The hold already deducted `held` from the user's balance.
 * This function settles the difference:
 * - If actual < held: refunds (held - actual) back to user
 * - If actual > held: deducts (actual - held) additionally
 * - If actual === held: no balance change needed
 *
 * Records a settlement transaction for the audit trail.
 */
export async function finalizeCredits(
  userId: string,
  held: number,
  actual: number,
  type: "sync_posts" | "sync_comments",
  description: string
): Promise<void> {
  const difference = held - actual;

  if (difference > 0) {
    // Refund the overestimate back to the user
    await db
      .update(users)
      .set({
        creditBalance: sql`${users.creditBalance} + ${difference}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await db.insert(creditTransactions).values({
      userId,
      amount: difference,
      type: "refund",
      description: `Settled hold: used ${actual} of ${held} held. ${description}`,
    });
  } else if (difference < 0) {
    // Deduct the additional amount beyond the hold
    const additionalAmount = -difference;

    await db
      .update(users)
      .set({
        creditBalance: sql`${users.creditBalance} - ${additionalAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await db.insert(creditTransactions).values({
      userId,
      amount: -additionalAmount,
      type,
      description: `Additional charge beyond hold: used ${actual} of ${held} held. ${description}`,
    });
  }
  // If difference === 0, no balance change or transaction needed — the hold was exact
}

/**
 * Refund a full credit hold back to the user
 */
export async function refundHold(
  userId: string,
  amount: number,
  description: string
): Promise<number> {
  // No-op for zero amount
  if (amount === 0) {
    return getUserCredits(userId);
  }

  // Add full amount back to user balance
  const updateResult = await db
    .update(users)
    .set({
      creditBalance: sql`${users.creditBalance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ creditBalance: users.creditBalance });

  if (updateResult.length === 0) {
    throw new Error("User not found");
  }

  // Insert refund transaction with positive amount
  await db.insert(creditTransactions).values({
    userId,
    amount,
    type: "refund",
    description,
  });

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
    .where(eq(creditTransactions.userId, userId))
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
