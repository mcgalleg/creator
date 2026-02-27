import { Webhooks } from "@polar-sh/nextjs";
import { POLAR_PRODUCT_TO_TIER } from "@/lib/polar";
import { syncCreditBalance } from "@/lib/services/credit-service";
import {
  provisionSubscription,
  cancelSubscription,
  endSubscription,
} from "@/lib/services/subscription-service";
import { compensateUpgradeCredits } from "@/lib/services/upgrade-credit-service";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { creditTransactions } from "@/lib/db/schema/credits";
import { getCreditPack, getAiTokenPack } from "@/lib/subscriptions";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onSubscriptionActive: async (payload) => {
    const userId = payload.data.customer.externalId;
    const productId = payload.data.productId;
    const tier = POLAR_PRODUCT_TO_TIER[productId];
    if (!userId || !tier) return;

    // Free product activation: just sync balance, don't change tier
    if (tier === "free") {
      await syncCreditBalance(userId);
      return;
    }

    // Ensure user row exists (Polar webhook may arrive before Clerk webhook)
    const [existingUser] = await db
      .select({ id: users.id, subscriptionTier: users.subscriptionTier })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      const customer = payload.data.customer;
      await db.insert(users).values({
        id: userId,
        email: customer.email,
        name: customer.name ?? null,
        creditBalance: 0,
      }).onConflictDoNothing();
    }

    const oldTier = existingUser?.subscriptionTier ?? "free";

    // Paid tier: provision subscription
    await provisionSubscription(userId, tier);

    // Compensate meter consumption from the old tier so it doesn't penalize
    // the new allocation. Leftover old-tier credits carry over as a bonus.
    if (oldTier !== tier) {
      await compensateUpgradeCredits(userId, oldTier);
    }

    await syncCreditBalance(userId);
  },

  onSubscriptionCanceled: async (payload) => {
    const userId = payload.data.customer.externalId;
    const periodEnd = payload.data.currentPeriodEnd ?? undefined;
    if (userId) await cancelSubscription(userId, periodEnd);
  },

  onSubscriptionRevoked: async (payload) => {
    const userId = payload.data.customer.externalId;
    if (!userId) return;

    const productId = payload.data.productId;
    const tier = POLAR_PRODUCT_TO_TIER[productId];

    // Free product revoked: just log, don't change tier
    if (tier === "free") {
      console.log(`Free product revoked for user ${userId}`);
      return;
    }

    // Ensure user row exists before updating
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      const customer = payload.data.customer;
      await db.insert(users).values({
        id: userId,
        email: customer.email,
        name: customer.name ?? null,
        creditBalance: 0,
      }).onConflictDoNothing();
    }

    await endSubscription(userId);
  },

  onOrderPaid: async (payload) => {
    const userId = payload.data.customer.externalId;
    if (!userId) return;

    // Ensure user row exists (Polar webhook may arrive before Clerk webhook)
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      const customer = payload.data.customer;
      await db.insert(users).values({
        id: userId,
        email: customer.email,
        name: customer.name ?? null,
        creditBalance: 0,
      }).onConflictDoNothing();
    }

    // Subscription renewal — Polar auto-granted meter credits via Benefit
    if (payload.data.billingReason === "subscription_cycle") {
      // New billing cycle: clear carryover bonus from previous upgrade
      await db.update(users)
        .set({
          carryoverAiTokens: 0,
          carryoverSyncCredits: 0,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      await syncCreditBalance(userId);
      await db.insert(creditTransactions).values({
        userId,
        amount: 0,
        type: "subscription_renewal",
        description: "Monthly meter credits renewed by Polar",
      });
      return;
    }

    // One-time pack purchase — Polar auto-granted credits via Benefit
    if (!payload.data.subscriptionId) {
      await syncCreditBalance(userId);
      const packId = payload.data.product?.metadata?.packId;

      // Sync credit pack
      const creditPack = typeof packId === "string" ? getCreditPack(packId) : null;
      if (creditPack) {
        await db.insert(creditTransactions).values({
          userId,
          amount: creditPack.credits,
          type: "credit_pack_purchase",
          description: `Purchased ${creditPack.name} credit pack (${creditPack.credits} sync credits)`,
        });
      }

      // AI token pack
      const aiPack = typeof packId === "string" ? getAiTokenPack(packId) : null;
      if (aiPack) {
        await db.insert(creditTransactions).values({
          userId,
          amount: aiPack.tokens,
          type: "ai_token_pack_purchase",
          description: `Purchased ${aiPack.name} AI token pack (${aiPack.tokens.toLocaleString()} tokens)`,
        });
      }
    }
  },

  onCustomerStateChanged: async (payload) => {
    const userId = payload.data.externalId;
    if (userId) await syncCreditBalance(userId);
  },
});
