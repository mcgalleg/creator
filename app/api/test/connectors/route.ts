import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { connectors, userConnectors } from "@/lib/db/schema/connectors";
import { eq } from "drizzle-orm";
import { testRouteGuard } from "@/lib/test-guard";

/**
 * GET /api/test/connectors?userId=...
 *
 * Test-only route to inspect connector state.
 * Returns all connectors and the user's enabled connectors.
 */
export async function GET(request: NextRequest) {
  const blocked = testRouteGuard();
  if (blocked) return blocked;

  const userId = request.nextUrl.searchParams.get("userId");

  const allConnectors = await db.select().from(connectors);

  let userState: (typeof userConnectors.$inferSelect)[] = [];
  if (userId) {
    userState = await db
      .select()
      .from(userConnectors)
      .where(eq(userConnectors.userId, userId));
  }

  return NextResponse.json({
    connectors: allConnectors,
    userConnectors: userState.map((uc) => ({
      ...uc,
      // Redact tokens in test output
      accessToken: uc.accessToken ? "[encrypted]" : null,
      refreshToken: uc.refreshToken ? "[encrypted]" : null,
    })),
  });
}
