import { CustomerPortal } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";

const portalHandler = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
  getExternalCustomerId: async (req: NextRequest) => {
    const externalId = req.nextUrl.searchParams.get("customerExternalId");
    if (!externalId) {
      throw new Error("customerExternalId is required");
    }
    return externalId;
  },
});

export async function GET(req: NextRequest) {
  try {
    return await portalHandler(req);
  } catch (error) {
    console.error("Customer portal error:", error);
    return Response.json(
      { error: "Failed to open customer portal" },
      { status: 500 }
    );
  }
}
