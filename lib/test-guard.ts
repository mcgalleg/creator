import { NextResponse } from "next/server";

/**
 * Guard for test-only API routes.
 * Returns a 404 response in production or when BYPASS_AUTH is not enabled.
 * Returns null if the request should proceed.
 */
export function testRouteGuard(): NextResponse | null {
  if (process.env.NODE_ENV === "production" || process.env.BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  return null;
}
