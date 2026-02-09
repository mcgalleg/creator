import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPolar } from "@/lib/polar";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const polar = getPolar();

    // Find the user's active subscription
    const subscriptions = await polar.subscriptions.list({
      externalCustomerId: [userId],
      active: true,
    });

    const subscription = subscriptions.result.items?.[0];
    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Cancel at period end — user keeps access until current billing period expires.
    // Polar will fire the onSubscriptionCanceled webhook which updates our DB.
    await polar.subscriptions.update({
      id: subscription.id,
      subscriptionUpdate: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({
      message: "Subscription will be canceled at the end of the current billing period",
      expiresAt: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
