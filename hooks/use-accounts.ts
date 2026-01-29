"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface TikTokAccount {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number | null;
  followingCount: number | null;
  likesCount: number | null;
  videoCount: number | null;
  bio: string | null;
  isVerified: boolean | null;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface SyncJob {
  id: number;
  status: "pending" | "running" | "completed" | "failed";
  type: string;
  creditsEstimated: number | null;
  creditsUsed: number | null;
  postsCount: number | null;
  commentsCount: number | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface SyncOptions {
  postsLimit?: number;
  includeComments?: boolean;
  commentsLimit?: number;
}

export interface ConnectResult {
  account: TikTokAccount;
  syncJob?: {
    jobId: number;
    runId: string;
  };
  profile: {
    username: string;
    displayName: string;
    followerCount: number;
    followingCount: number;
    likesCount: number;
    videoCount: number;
    avatarUrl: string;
    bio: string;
    isVerified: boolean;
  };
}

export interface SyncResult {
  jobId: number;
  runId: string;
  estimatedCredits: number;
  breakdown: {
    profile: number;
    posts: number;
    comments: number;
  };
  description: string;
}

export interface UseAccountsReturn {
  accounts: TikTokAccount[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  connectAccount: (
    username: string,
    options?: { triggerSync?: boolean } & SyncOptions
  ) => Promise<ConnectResult>;
  disconnectAccount: (accountId: number) => Promise<void>;
  triggerSync: (accountId: number, options?: SyncOptions) => Promise<SyncResult>;
  syncStatus: Record<number, SyncJob | null>;
  pollSyncStatus: (accountId: number, jobId: number) => void;
  stopPolling: (accountId: number) => void;
  connecting: boolean;
  syncing: Record<number, boolean>;
  disconnecting: Record<number, boolean>;
}

export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<Record<number, boolean>>({});
  const [disconnecting, setDisconnecting] = useState<Record<number, boolean>>({});
  const [syncStatus, setSyncStatus] = useState<Record<number, SyncJob | null>>({});

  // Keep track of polling intervals
  const pollingIntervals = useRef<Record<number, NodeJS.Timeout>>({});

  // Fetch all accounts
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/accounts");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch accounts");
      }

      setAccounts(data.accounts);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch accounts";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect a new account
  const connectAccount = useCallback(
    async (
      username: string,
      options?: { triggerSync?: boolean } & SyncOptions
    ): Promise<ConnectResult> => {
      try {
        setConnecting(true);
        setError(null);

        const response = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            triggerSync: options?.triggerSync ?? false,
            postsLimit: options?.postsLimit ?? 50,
            includeComments: options?.includeComments ?? false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to connect account");
        }

        // Add the new account to the list
        setAccounts((prev) => [...prev, data.account]);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to connect account";
        setError(message);
        throw err;
      } finally {
        setConnecting(false);
      }
    },
    []
  );

  // Disconnect an account
  const disconnectAccount = useCallback(async (accountId: number): Promise<void> => {
    try {
      setDisconnecting((prev) => ({ ...prev, [accountId]: true }));
      setError(null);

      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect account");
      }

      // Remove the account from the list
      setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));

      // Stop any polling for this account
      if (pollingIntervals.current[accountId]) {
        clearInterval(pollingIntervals.current[accountId]);
        delete pollingIntervals.current[accountId];
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect account";
      setError(message);
      throw err;
    } finally {
      setDisconnecting((prev) => ({ ...prev, [accountId]: false }));
    }
  }, []);

  // Trigger sync for an account
  const triggerSync = useCallback(
    async (accountId: number, options?: SyncOptions): Promise<SyncResult> => {
      try {
        setSyncing((prev) => ({ ...prev, [accountId]: true }));
        setError(null);

        const response = await fetch(`/api/accounts/${accountId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postsLimit: options?.postsLimit ?? 50,
            includeComments: options?.includeComments ?? false,
            commentsLimit: options?.commentsLimit ?? 0,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to start sync");
        }

        // Set initial sync status
        setSyncStatus((prev) => ({
          ...prev,
          [accountId]: {
            id: data.jobId,
            status: "running",
            type: options?.includeComments ? "full" : "posts",
            creditsEstimated: data.estimatedCredits,
            creditsUsed: null,
            postsCount: null,
            commentsCount: null,
            error: null,
            startedAt: new Date().toISOString(),
            completedAt: null,
            createdAt: new Date().toISOString(),
          },
        }));

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start sync";
        setError(message);
        throw err;
      } finally {
        setSyncing((prev) => ({ ...prev, [accountId]: false }));
      }
    },
    []
  );

  // Poll for sync status
  const pollSyncStatus = useCallback((accountId: number, jobId: number) => {
    // Clear any existing interval for this account
    if (pollingIntervals.current[accountId]) {
      clearInterval(pollingIntervals.current[accountId]);
    }

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/accounts/${accountId}/sync?jobId=${jobId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch sync status");
        }

        if (data.job) {
          setSyncStatus((prev) => ({ ...prev, [accountId]: data.job }));

          // If job is complete or failed, stop polling and refresh accounts
          if (data.job.status === "completed" || data.job.status === "failed") {
            if (pollingIntervals.current[accountId]) {
              clearInterval(pollingIntervals.current[accountId]);
              delete pollingIntervals.current[accountId];
            }

            // Refresh accounts to get updated data
            const accountsResponse = await fetch("/api/accounts");
            const accountsData = await accountsResponse.json();
            if (accountsResponse.ok) {
              setAccounts(accountsData.accounts);
            }
          }
        }
      } catch (err) {
        console.error("Error polling sync status:", err);
      }
    };

    // Poll immediately
    poll();

    // Then poll every 3 seconds
    pollingIntervals.current[accountId] = setInterval(poll, 3000);
  }, []);

  // Stop polling for an account
  const stopPolling = useCallback((accountId: number) => {
    if (pollingIntervals.current[accountId]) {
      clearInterval(pollingIntervals.current[accountId]);
      delete pollingIntervals.current[accountId];
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    const intervals = pollingIntervals.current;
    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, []);

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    connectAccount,
    disconnectAccount,
    triggerSync,
    syncStatus,
    pollSyncStatus,
    stopPolling,
    connecting,
    syncing,
    disconnecting,
  };
}
