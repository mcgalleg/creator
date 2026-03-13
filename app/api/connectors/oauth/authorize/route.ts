import { auth } from "@/lib/auth";
import { getConnectorById } from "@/lib/services/connector-service";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";

/**
 * GET /api/connectors/oauth/authorize?connectorId=...
 *
 * Starts the OAuth flow: generates state + optional PKCE,
 * stores them in cookies, and redirects to the provider's auth URL.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const connectorId = url.searchParams.get("connectorId");

    if (!connectorId) {
      return NextResponse.json(
        { error: "connectorId is required" },
        { status: 400 },
      );
    }

    const connector = await getConnectorById(connectorId);
    if (!connector || !connector.enabled || !connector.oauthConfig) {
      return NextResponse.json(
        { error: "Connector not found or does not support OAuth" },
        { status: 404 },
      );
    }

    const { authUrl, clientId, scopes, usePkce } = connector.oauthConfig;

    // Generate OAuth state
    const state = randomBytes(32).toString("hex");

    // Build cookie jar for state validation
    const cookieStore = await cookies();
    cookieStore.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });
    cookieStore.set("oauth_connector_id", connectorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    // Build auth URL
    const authParams = new URLSearchParams({
      response_type: "code",
      client_id: clientId ?? "",
      redirect_uri: `${url.origin}/api/connectors/oauth/callback`,
      state,
    });

    if (scopes?.length) {
      authParams.set("scope", scopes.join(" "));
    }

    // PKCE support
    if (usePkce) {
      const codeVerifier = randomBytes(32).toString("base64url");
      const codeChallenge = createHash("sha256")
        .update(codeVerifier)
        .digest("base64url");

      authParams.set("code_challenge", codeChallenge);
      authParams.set("code_challenge_method", "S256");

      cookieStore.set("oauth_code_verifier", codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });
    }

    return NextResponse.redirect(`${authUrl}?${authParams.toString()}`);
  } catch (error) {
    console.error("[oauth/authorize] Error:", error);
    return NextResponse.json(
      { error: "Failed to start OAuth flow" },
      { status: 500 },
    );
  }
}
