"use client";

import { createContext, useContext } from "react";
import useSWR, { mutate } from "swr";

export const CREDITS_KEY = "/api/credits";

interface CreditsData {
  balance: number;
  aiTokens: number | null;
  pricing: unknown;
}

interface CreditsState {
  balance: number;
  aiTokens: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CreditsContext = createContext<CreditsState | null>(null);

const creditsFetcher = async (url: string): Promise<CreditsData> => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch credits");
  return data;
};

/**
 * Hook for fetching and managing user credit balance.
 * When used inside a CreditsProvider, shares state across all consumers.
 * When used standalone (no provider), creates its own local state.
 */
export function useCredits(): CreditsState {
  const ctx = useContext(CreditsContext);
  if (ctx) return ctx;

  // Fallback: standalone usage (should not happen in dashboard)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCreditsInternal();
}

function useCreditsInternal(): CreditsState {
  const { data, error, isLoading, mutate: boundMutate } = useSWR<CreditsData>(
    CREDITS_KEY,
    creditsFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2_000,
      keepPreviousData: true,
    }
  );

  return {
    balance: Math.max(0, data?.balance ?? 0),
    aiTokens: data?.aiTokens != null ? Math.max(0, data.aiTokens) : null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch credits") : null,
    refresh: async () => { await boundMutate(); },
  };
}

/**
 * Imperatively revalidate credits from anywhere (no hook required).
 * Useful for event-driven refreshes after credit-affecting operations.
 */
export function invalidateCredits() {
  mutate(CREDITS_KEY);
}

export { CreditsContext, useCreditsInternal };
