"use client";

import { useState, useCallback, useEffect } from "react";

interface UseCreditsReturn {
  balance: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing user credit balance
 */
export function useCredits(): UseCreditsReturn {
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
