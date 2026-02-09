// ─── Credit Rates (single source of truth) ──────────────────────────────────

export const CREDIT_RATES = {
  PER_POST: 1,
  PER_COMMENT: 0.15,
  PROFILE_SYNC: 0,
  AI_TOKENS_PER_CREDIT: 5000,
} as const;

// ─── Calculation Helpers ─────────────────────────────────────────────────────
// All helpers use Math.round(n * rate) — the per-item method that matches
// how the backend charges users during sync finalization.

export function calculateCommentCredits(count: number): number {
  return Math.max(0, Math.round(count * CREDIT_RATES.PER_COMMENT));
}

export function calculatePostCredits(count: number): number {
  return Math.max(0, Math.round(count * CREDIT_RATES.PER_POST));
}

export function calculateSyncCredits(posts: number, comments: number): number {
  return calculatePostCredits(posts) + calculateCommentCredits(comments);
}

export function calculateAiCredits(totalTokens: number): number {
  return Math.max(1, Math.ceil(totalTokens / CREDIT_RATES.AI_TOKENS_PER_CREDIT));
}

// ─── Pricing Display ─────────────────────────────────────────────────────────
// Per-item rates for UI display

export const CREDIT_PRICING_DISPLAY = {
  posts: {
    rate: CREDIT_RATES.PER_POST,
    description: "Per post imported",
  },
  comments: {
    rate: CREDIT_RATES.PER_COMMENT,
    description: "Per comment synced",
  },
  profile: {
    rate: CREDIT_RATES.PROFILE_SYNC,
    description: "Profile sync (free)",
  },
  ai_chat: {
    rate: "~1 per message",
    description: "AI chat (per ~5K tokens)",
  },
} as const;

export const SIGNUP_BONUS_CREDITS = 250;

// Trial bonus credits (Pro allocation minus Free baseline)
export const TRIAL_BONUS_SYNC_CREDITS = 730; // pro 750 - free 20
export const TRIAL_BONUS_AI_TOKENS = 2_950_000; // pro 3M - free 50K
