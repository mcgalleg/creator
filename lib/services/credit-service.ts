import { db } from "@/lib/db";
import { users, creditTransactions } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// Credit Pricing (1 credit = $0.01)
export const CREDIT_PRICING = {
  basic_sync: {
    credits: 25,
    description: "Basic sync (profile + 50 posts)",
  },
  standard_sync: {
    credits: 50,
    description: "Standard sync (profile + 100 posts)",
  },
  comments: {
    credits: 15,
    description: "Comments (per 100)",
  },
  full_sync: {
    credits: 125,
    description: "Full sync (profile + 100 posts + 500 comments)",
  },
} as const;

export type CreditTransactionType =
  | "sync_profile"
  | "sync_posts"
  | "sync_comments"
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
 * Deduct credits from user balance
 * Throws error if insufficient credits
 */
export async function deductCredits(
  userId: string,
  amount: number,
  type: "sync_profile" | "sync_posts" | "sync_comments",
  description: string
): Promise<number> {
  // Validate amount is positive
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Check sufficient balance
  const { sufficient, balance } = await checkCredits(userId, amount);
  if (!sufficient) {
    throw new Error(
      `Insufficient credits. Balance: ${balance}, Required: ${amount}`
    );
  }

  // Update user balance (decrement)
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

  // Insert credit transaction record with negative amount
  await db.insert(creditTransactions).values({
    userId,
    amount: -amount, // Negative for deductions
    type,
    description,
  });

  return updateResult[0].creditBalance;
}

/**
 * Add credits to user balance
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: "purchase" | "refund" | "signup_bonus",
  description: string
): Promise<number> {
  // Validate amount is positive
  if (amount <= 0) {
    throw new Error("Amount must be positive");
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
  return CREDIT_PRICING;
}
