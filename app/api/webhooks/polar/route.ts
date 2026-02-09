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
import { getCreditPack } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onSubscriptionActive: async (payload) => {
    const userId = payload.data.customer.externalId;
    const productId = payload.data.productId;
    const tier = POLAR_PRODUCT_TO_TIER[productId];
    if (userId && tier) {
      await provisionSubscription(userId, tier);
      await syncCreditBalance(userId);
    }
  },

  onSubscriptionCanceled: async (payload) => {
    const userId = payload.data.customer.externalId;
    const periodEnd = payload.data.currentPeriodEnd ?? undefined;
    if (userId) await cancelSubscription(userId, periodEnd);
  },

  onSubscriptionRevoked: async (payload) => {
    const userId = payload.data.customer.externalId;
    if (userId) await endSubscription(userId);
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

    // One-time credit pack purchase — Polar auto-granted sync-credits via Benefit
    if (!payload.data.subscriptionId) {
      await syncCreditBalance(userId);
      const packId = payload.data.product?.metadata?.packId;
      const pack = typeof packId === "string" ? getCreditPack(packId) : null;
      if (pack) {
        await db.insert(creditTransactions).values({
          userId,
          amount: pack.credits,
          type: "credit_pack_purchase",
          description: `Purchased ${pack.name} credit pack (${pack.credits} sync credits)`,
        });
      }
    }
  },

  onCustomerStateChanged: async (payload) => {
    const userId = payload.data.externalId;
    if (userId) await syncCreditBalance(userId);
  },
});
