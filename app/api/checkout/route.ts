import { Checkout } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";

const checkoutHandler = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?checkout=success`,
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
});

export async function GET(req: NextRequest) {
  try {
    return await checkoutHandler(req);
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
