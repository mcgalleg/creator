"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";

interface CreditsState {
  balance: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CreditsContext = createContext<CreditsState | null>(null);

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
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/credits");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch credits");
      }

      setBalance(data.balance);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch credits";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch credits on mount
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    balance,
    loading,
    error,
    refresh: fetchCredits,
  };
}

export { CreditsContext, useCreditsInternal };
