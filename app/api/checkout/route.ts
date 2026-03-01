import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPolar } from "@/lib/polar";

/**
 * Look up the customer's active free subscription so we can pass it as
 * `subscriptionId` on the checkout — Polar treats this as an upgrade
 * instead of rejecting with "You already have an active subscription."
 */
async function findFreeSubscriptionId(
  externalCustomerId: string
): Promise<string | undefined> {
  try {
    const polar = getPolar();
    const subs = await polar.subscriptions.list({
      externalCustomerId: [externalCustomerId],
      active: true,
    });
    const freeSub = subs.result.items.find((s) => s.amount === 0);
    return freeSub?.id;
  } catch {
    return undefined;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const products = url.searchParams.getAll("products");
    if (products.length === 0) {
      return Response.json(
        { error: "Missing products in query params" },
        { status: 400 }
      );
    }

    const externalCustomerId =
      url.searchParams.get("customerExternalId") ?? undefined;
    const customerEmail =
      url.searchParams.get("customerEmail") ?? undefined;

    // If the customer already has a free subscription, attach its ID so
    // Polar upgrades it rather than blocking with a duplicate-subscription error.
    const subscriptionId = externalCustomerId
      ? await findFreeSubscriptionId(externalCustomerId)
      : undefined;

    const successUrl = new URL(
      `${process.env.NEXT_PUBLIC_APP_URL}/workspace/settings?checkout=success`
    );
    successUrl.searchParams.set("checkoutId", "{CHECKOUT_ID}");

    const polar = getPolar();
    const result = await polar.checkouts.create({
      products,
      successUrl: decodeURI(successUrl.toString()),
      externalCustomerId,
      customerEmail,
      ...(subscriptionId ? { subscriptionId } : {}),
    });

    return NextResponse.redirect(result.url);
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
