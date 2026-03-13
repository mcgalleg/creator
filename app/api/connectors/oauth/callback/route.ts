import { auth } from "@/lib/auth";
import { getConnectorById, saveOAuthTokens } from "@/lib/services/connector-service";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/connectors/oauth/callback?code=...&state=...
 *
 * OAuth callback: validates state, exchanges code for tokens,
 * encrypts and stores them, enables the connector, and redirects
 * the user to /workspace/connectors.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("[oauth/callback] Provider error:", error);
      return NextResponse.redirect(
        new URL(`/workspace/connectors?error=${encodeURIComponent(error)}`, req.url),
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/workspace/connectors?error=missing_params", req.url),
      );
    }

    // Validate state
    const cookieStore = await cookies();
    const storedState = cookieStore.get("oauth_state")?.value;
    const connectorId = cookieStore.get("oauth_connector_id")?.value;
    const codeVerifier = cookieStore.get("oauth_code_verifier")?.value;

    if (!storedState || state !== storedState || !connectorId) {
      return NextResponse.redirect(
        new URL("/workspace/connectors?error=invalid_state", req.url),
      );
    }

    // Clean up cookies
    cookieStore.delete("oauth_state");
    cookieStore.delete("oauth_connector_id");
    cookieStore.delete("oauth_code_verifier");

    // Look up connector OAuth config
    const connector = await getConnectorById(connectorId);
    if (!connector?.oauthConfig) {
      return NextResponse.redirect(
        new URL("/workspace/connectors?error=connector_not_found", req.url),
      );
    }

    const { tokenUrl, clientId } = connector.oauthConfig;

    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${url.origin}/api/connectors/oauth/callback`,
      client_id: clientId ?? "",
    });

    if (codeVerifier) {
      tokenParams.set("code_verifier", codeVerifier);
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error("[oauth/callback] Token exchange failed:", tokenResponse.status, errBody);
      return NextResponse.redirect(
        new URL("/workspace/connectors?error=token_exchange_failed", req.url),
      );
    }

    const data = await tokenResponse.json();

    // Store encrypted tokens and enable the connector
    await saveOAuthTokens(userId, connectorId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scope: data.scope,
    });

    return NextResponse.redirect(
      new URL(`/workspace/connectors?connected=${connectorId}`, req.url),
    );
  } catch (error) {
    console.error("[oauth/callback] Error:", error);
    return NextResponse.redirect(
      new URL("/workspace/connectors?error=internal", req.url),
    );
  }
}
