"use client";

// Internal hook — consumed by SyncProvider only. Import useSync() from contexts instead.

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
  type: string;
  status: string;
  creditsEstimated: number | null;
  creditsHeld: number | null;
  creditsUsed: number | null;
  postsCount: number | null;
  commentsCount: number | null;
  commentsEstimated: number | null;
  newPostsCount: number | null;
  updatedPostsCount: number | null;
  newCommentsCount: number | null;
  updatedCommentsCount: number | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface SyncOptions {
  postsLimit?: number;
  includeComments?: boolean;
  commentsLimit?: number;
  sorting?: "latest" | "popular" | "oldest";
  oldestPostDate?: string;
  newestPostDate?: string;
}

export interface ConnectResult {
  account: TikTokAccount;
  syncJob?: {
    jobId: number;
    runId: string;
  };
  syncError?: string | null;
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
  creditsHeld: number;
}

// Sync data returned by GET /api/accounts/[id]/sync
export interface AccountSyncData {
  activeJobs: SyncJob[];
  recentJobs: SyncJob[];
  stats: {
    syncedPosts: number;
    totalPosts: number;
    syncedComments: number;
    lastSyncedAt: string | null;
  };
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
  refreshProfile: (accountId: number) => Promise<void>;
  syncData: Record<number, AccountSyncData>;
  fetchSyncData: (accountId: number) => Promise<void>;
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

  // Sync data per account (from DB, not localStorage)
  const [syncData, setSyncData] = useState<Record<number, AccountSyncData>>({});

  // Polling refs - one interval per account that has active jobs
  const pollingRefs = useRef<Record<number, NodeJS.Timeout>>({});

  // Stop polling for a specific account
  const stopPolling = useCallback((accountId: number) => {
    if (pollingRefs.current[accountId]) {
      clearInterval(pollingRefs.current[accountId]);
      delete pollingRefs.current[accountId];
    }
  }, []);

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

  // Start polling for an account with active jobs
  const startPolling = useCallback(
    (accountId: number) => {
      // Don't double-poll
      if (pollingRefs.current[accountId]) return;

      pollingRefs.current[accountId] = setInterval(async () => {
        try {
          const res = await fetch(`/api/accounts/${accountId}/sync`);
          if (!res.ok) return;
          const data = await res.json();
          setSyncData((prev) => ({ ...prev, [accountId]: data }));

          // Stop polling when no more active jobs
          if (!data.activeJobs || data.activeJobs.length === 0) {
            stopPolling(accountId);
            // Refresh accounts to get updated stats
            const accountsRes = await fetch("/api/accounts");
            if (accountsRes.ok) {
              const accountsData = await accountsRes.json();
              setAccounts(accountsData.accounts);
            }
          }
        } catch (err) {
          console.error("Error polling sync data:", err);
        }
      }, 3000);
    },
    [stopPolling]
  );

  // Fetch sync data for a single account
  const fetchSyncData = useCallback(
    async (accountId: number) => {
      try {
        const res = await fetch(`/api/accounts/${accountId}/sync`);
        if (!res.ok) return;
        const data = await res.json();
        setSyncData((prev) => ({ ...prev, [accountId]: data }));

        // If there are active jobs, start polling
        if (data.activeJobs?.length > 0) {
          startPolling(accountId);
        }
      } catch (err) {
        console.error("Error fetching sync data:", err);
      }
    },
    [startPolling]
  );

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

        // If a sync was triggered, fetch sync data to pick up the active job
        if (data.syncJob?.jobId && data.account?.id) {
          fetchSyncData(data.account.id);
        }

        return data;
      } catch (err) {
        throw err;
      } finally {
        setConnecting(false);
      }
    },
    [fetchSyncData]
  );

  // Disconnect an account
  const disconnectAccount = useCallback(
    async (accountId: number): Promise<void> => {
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
        stopPolling(accountId);

        // Clean up sync data
        setSyncData((prev) => {
          const next = { ...prev };
          delete next[accountId];
          return next;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to disconnect account";
        setError(message);
        throw err;
      } finally {
        setDisconnecting((prev) => ({ ...prev, [accountId]: false }));
      }
    },
    [stopPolling]
  );

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
            sorting: options?.sorting,
            oldestPostDate: options?.oldestPostDate,
            newestPostDate: options?.newestPostDate,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to start sync");
        }

        // Immediately fetch sync data which will pick up the new active job and start polling
        await fetchSyncData(accountId);

        return {
          jobId: data.jobId,
          creditsHeld: data.creditsHeld ?? data.estimatedCredits ?? 0,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start sync";
        setError(message);
        throw err;
      } finally {
        setSyncing((prev) => ({ ...prev, [accountId]: false }));
      }
    },
    [fetchSyncData]
  );

  // Refresh profile for an account
  const refreshProfile = useCallback(
    async (accountId: number): Promise<void> => {
      const response = await fetch(`/api/accounts/${accountId}/refresh-profile`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to refresh profile");
      }

      // Refresh accounts to show updated data
      await fetchAccounts();
    },
    [fetchAccounts]
  );

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // After accounts load, fetch sync data for each account
  useEffect(() => {
    if (accounts.length === 0) return;

    accounts.forEach((account) => {
      fetchSyncData(account.id);
    });
    // Only run when accounts array identity changes (after fetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length > 0 && accounts.map((a) => a.id).join(",")]);

  // Cleanup all polling intervals on unmount
  useEffect(() => {
    const refs = pollingRefs.current;
    return () => {
      Object.values(refs).forEach(clearInterval);
    };
  }, []);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    connectAccount,
    disconnectAccount,
    triggerSync,
    refreshProfile,
    syncData,
    fetchSyncData,
    connecting,
    syncing,
    disconnecting,
  };
}
