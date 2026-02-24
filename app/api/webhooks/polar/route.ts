import { Webhooks } from "@polar-sh/nextjs";
import { POLAR_PRODUCT_TO_TIER } from "@/lib/polar";
import { syncCreditBalance } from "@/lib/services/credit-service";
import {
  provisionSubscription,
  cancelSubscription,
  endSubscription,
} from "@/lib/services/subscription-service";
import { db } from "@/lib/db";
import { creditTransactions } from "@/lib/db/schema/credits";
import { getCreditPack, getAiTokenPack } from "@/lib/subscriptions";

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

    // Paid tier: provision subscription
    await provisionSubscription(userId, tier);
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

    await endSubscription(userId);
  },

  onOrderPaid: async (payload) => {
    const userId = payload.data.customer.externalId;
    if (!userId) return;

    // Subscription renewal — Polar auto-granted meter credits via Benefit
    if (payload.data.billingReason === "subscription_cycle") {
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
