import { CustomerPortal } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const portalHandler = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
  getExternalCustomerId: async () => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }
    return userId;
  },
});

export async function GET(req: NextRequest) {
  try {
    return await portalHandler(req);
  } catch (error) {
    console.error("Customer portal error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json(
      { error: "Failed to open customer portal" },
      { status: 500 }
    );
  }
}
