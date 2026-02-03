"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  setPendingAccountSync,
  clearPendingAccountSync,
  clearPendingCommentSync,
  clearPendingConnectionForUsername,
  getAllPendingSyncs,
} from "@/lib/persistent-async-state";

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
  runId: string;
  estimatedCredits: number;
  breakdown: {
    profile: number;
    posts: number;
    comments: number;
  };
  description: string;
}

export interface CommentSyncJob {
  id: number;
  status: "pending" | "running" | "completed" | "failed";
  type: string;
  mode: "selection" | "top_performers" | "date_range" | "budget";
  postCount: number;
  creditsEstimated: number | null;
  creditsUsed: number | null;
  commentsCount: number | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
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
  commentSyncStatus: Record<number, CommentSyncJob | null>;
  pollSyncStatus: (accountId: number, jobId: number) => void;
  pollCommentSyncStatus: (accountId: number, jobId: number, mode: CommentSyncJob["mode"], postCount: number) => void;
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
  const [commentSyncStatus, setCommentSyncStatus] = useState<Record<number, CommentSyncJob | null>>({});

  // Keep track of polling intervals (separate for account and comment syncs)
  const pollingIntervals = useRef<Record<number, NodeJS.Timeout>>({});
  const commentPollingIntervals = useRef<Record<number, NodeJS.Timeout>>({});
  // Track if we've restored pending syncs
  const hasRestoredPendingSyncs = useRef(false);

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
        // Don't set the shared error state for connection errors
        // The caller (account-connection-form) handles its own error display
        throw err;
      } finally {
        setConnecting(false);
      }
    },
    []
  );

  // Disconnect an account
  const disconnectAccount = useCallback(async (accountId: number): Promise<void> => {
    // Find the account before deleting to get its username
    const accountToDelete = accounts.find((a) => a.id === accountId);

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

      // Clear any pending sync state
      clearPendingAccountSync(accountId);

      // Clear any pending connection state for this username
      if (accountToDelete?.username) {
        clearPendingConnectionForUsername(accountToDelete.username);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect account";
      setError(message);
      throw err;
    } finally {
      setDisconnecting((prev) => ({ ...prev, [accountId]: false }));
    }
  }, [accounts]);

  // Trigger sync for an account
  const triggerSync = useCallback(
    async (accountId: number, options?: SyncOptions): Promise<SyncResult> => {
      // Find account username for persistence
      const account = accounts.find((a) => a.id === accountId);

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

        const syncType = options?.includeComments ? "full" : "posts";

        // Persist sync state to localStorage
        setPendingAccountSync(accountId, {
          accountId,
          accountUsername: account?.username || "",
          jobId: data.jobId,
          type: syncType,
        });

        // Set initial sync status
        setSyncStatus((prev) => ({
          ...prev,
          [accountId]: {
            id: data.jobId,
            status: "running",
            type: syncType,
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
    [accounts]
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

            // Clear persistent state
            clearPendingAccountSync(accountId);

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
    if (commentPollingIntervals.current[accountId]) {
      clearInterval(commentPollingIntervals.current[accountId]);
      delete commentPollingIntervals.current[accountId];
    }
  }, []);

  // Poll for comment sync status
  const pollCommentSyncStatus = useCallback(
    (accountId: number, jobId: number, mode: CommentSyncJob["mode"], postCount: number) => {
      // Clear any existing interval for this account
      if (commentPollingIntervals.current[accountId]) {
        clearInterval(commentPollingIntervals.current[accountId]);
      }

      const poll = async () => {
        try {
          // Comment syncs use the same endpoint as account syncs
          const response = await fetch(
            `/api/accounts/${accountId}/sync?jobId=${jobId}`
          );
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to fetch comment sync status");
          }

          if (data.job) {
            setCommentSyncStatus((prev) => ({
              ...prev,
              [accountId]: {
                id: data.job.id,
                status: data.job.status,
                type: data.job.type,
                mode,
                postCount,
                creditsEstimated: data.job.creditsEstimated,
                creditsUsed: data.job.creditsUsed,
                commentsCount: data.job.commentsCount,
                error: data.job.error,
                startedAt: data.job.startedAt,
                completedAt: data.job.completedAt,
                createdAt: data.job.createdAt,
              },
            }));

            // If job is complete or failed, stop polling
            if (data.job.status === "completed" || data.job.status === "failed") {
              if (commentPollingIntervals.current[accountId]) {
                clearInterval(commentPollingIntervals.current[accountId]);
                delete commentPollingIntervals.current[accountId];
              }

              // Clear persistent state
              clearPendingCommentSync(accountId);

              // Refresh accounts to get updated data
              const accountsResponse = await fetch("/api/accounts");
              const accountsData = await accountsResponse.json();
              if (accountsResponse.ok) {
                setAccounts(accountsData.accounts);
              }
            }
          }
        } catch (err) {
          console.error("Error polling comment sync status:", err);
        }
      };

      // Poll immediately
      poll();

      // Then poll every 3 seconds
      commentPollingIntervals.current[accountId] = setInterval(poll, 3000);
    },
    []
  );

  // Restore pending syncs from localStorage on mount
  useEffect(() => {
    if (hasRestoredPendingSyncs.current) return;
    hasRestoredPendingSyncs.current = true;

    const { accountSyncs, commentSyncs } = getAllPendingSyncs();

    // For each pending account sync, set initial status and start polling
    accountSyncs.forEach((pending) => {
      // Set a "resuming" status
      setSyncStatus((prev) => ({
        ...prev,
        [pending.accountId]: {
          id: pending.jobId,
          status: "running",
          type: pending.type,
          creditsEstimated: null,
          creditsUsed: null,
          postsCount: null,
          commentsCount: null,
          error: null,
          startedAt: new Date(pending.startedAt).toISOString(),
          completedAt: null,
          createdAt: new Date(pending.startedAt).toISOString(),
        },
      }));

      // Resume polling for this sync
      pollSyncStatus(pending.accountId, pending.jobId);
    });

    // For each pending comment sync, set initial status and start polling
    commentSyncs.forEach((pending) => {
      // Set a "resuming" status
      setCommentSyncStatus((prev) => ({
        ...prev,
        [pending.accountId]: {
          id: pending.jobId,
          status: "running",
          type: "comments",
          mode: pending.mode,
          postCount: pending.postCount,
          creditsEstimated: null,
          creditsUsed: null,
          commentsCount: null,
          error: null,
          startedAt: new Date(pending.startedAt).toISOString(),
          completedAt: null,
          createdAt: new Date(pending.startedAt).toISOString(),
        },
      }));

      // Resume polling for this comment sync
      pollCommentSyncStatus(pending.accountId, pending.jobId, pending.mode, pending.postCount);
    });
  }, [pollSyncStatus, pollCommentSyncStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    const intervals = pollingIntervals.current;
    const commentIntervals = commentPollingIntervals.current;
    return () => {
      Object.values(intervals).forEach(clearInterval);
      Object.values(commentIntervals).forEach(clearInterval);
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
    commentSyncStatus,
    pollSyncStatus,
    pollCommentSyncStatus,
    stopPolling,
    connecting,
    syncing,
    disconnecting,
  };
}
