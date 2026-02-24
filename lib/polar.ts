import { Polar } from "@polar-sh/sdk";

// Singleton client
let _polar: Polar | null = null;
export function getPolar(): Polar {
  if (!_polar) {
    if (!process.env.POLAR_ACCESS_TOKEN) {
      throw new Error("POLAR_ACCESS_TOKEN environment variable is not set");
    }
    _polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
    });
  }
  return _polar;
}

// Product ID -> tier mapping (monthly + annual variants)
export const POLAR_PRODUCT_TO_TIER: Record<string, "free" | "basic" | "pro" | "agency" | "mcp"> = {
  [process.env.NEXT_PUBLIC_POLAR_PRODUCT_FREE!]: "free",
  [process.env.NEXT_PUBLIC_POLAR_PRODUCT_BASIC!]: "basic",
  [process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO!]: "pro",
  [process.env.NEXT_PUBLIC_POLAR_PRODUCT_AGENCY!]: "agency",
  [process.env.NEXT_PUBLIC_POLAR_PRODUCT_MCP!]: "mcp",
  // Annual variants map to the same tier
  [process.env.NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_BASIC!]: "basic",
  [process.env.NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_PRO!]: "pro",
  [process.env.NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_AGENCY!]: "agency",
};

// Fetch BOTH meter balances from Polar for a customer
export async function getPolarMeterBalances(externalCustomerId: string): Promise<{
  aiTokens: number;
  syncCredits: number;
}> {
  const polar = getPolar();
  const state = await polar.customers.getStateExternal({ externalId: externalCustomerId });
  const aiMeter = state.activeMeters?.find(m => m.meterId === process.env.POLAR_AI_METER_ID);
  const syncMeter = state.activeMeters?.find(m => m.meterId === process.env.POLAR_SYNC_METER_ID);
  return {
    aiTokens: aiMeter?.balance ?? 0,
    syncCredits: syncMeter?.balance ?? 0,
  };
}

// Ingest an AI token usage event
export async function ingestAiTokenEvent(
  externalCustomerId: string,
  tokens: number,
  metadata?: Record<string, unknown> & { externalId?: string }
) {
  const { externalId, ...rest } = metadata ?? {};
  const polar = getPolar();
  await polar.events.ingest({
    events: [{
      name: "ai-tokens",
      externalCustomerId,
      ...(externalId ? { externalId } : {}),
      metadata: { tokens, ...rest },
    }],
  });
}

// Ingest a sync credit usage event
export async function ingestSyncCreditEvent(
  externalCustomerId: string,
  units: number,
  metadata?: Record<string, unknown> & { externalId?: string }
) {
  const { externalId, ...rest } = metadata ?? {};
  const polar = getPolar();
  await polar.events.ingest({
    events: [{
      name: "sync-credits",
      externalCustomerId,
      ...(externalId ? { externalId } : {}),
      metadata: { units, ...rest },
    }],
  });
}
