"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAccounts } from "@/hooks/use-accounts";
import type {
  TikTokAccount,
  SyncJob,
  AccountSyncData,
  UseAccountsReturn,
} from "@/hooks/use-accounts";
import { useCredits } from "@/hooks/use-credits";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SyncCompletedCallback = (
  accountId: number,
  completedJobs: SyncJob[]
) => void;

export interface SyncContextValue {
  // Passthrough from useAccounts
  accounts: TikTokAccount[];
  accountsLoading: boolean;
  accountsError: string | null;
  fetchAccounts: UseAccountsReturn["fetchAccounts"];
  connectAccount: UseAccountsReturn["connectAccount"];
  disconnectAccount: UseAccountsReturn["disconnectAccount"];
  triggerSync: UseAccountsReturn["triggerSync"];
  refreshProfile: UseAccountsReturn["refreshProfile"];
  syncData: Record<number, AccountSyncData>;
  fetchSyncData: UseAccountsReturn["fetchSyncData"];
  connecting: boolean;
  syncing: Record<number, boolean>;
  disconnecting: Record<number, boolean>;

  // Derived sync status
  isSyncing: boolean;
  totalActiveJobs: number;
  activeJobsFor: (accountId: number) => SyncJob[];

  // Currently selected account (shared across header, chat, etc.)
  selectedAccountId: number | null;
  setSelectedAccountId: (id: number | null) => void;

  // Event: subscribe to sync completion (returns unsubscribe fn)
  onSyncCompleted: (callback: SyncCompletedCallback) => () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SyncContext = createContext<SyncContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SyncProvider({ children }: { children: ReactNode }) {
  const {
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
  } = useAccounts();

  const { refresh: refreshCredits } = useCredits();

  // Selected account state (shared across header, chat, etc.)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // Auto-select first account when accounts load and nothing is selected
  useEffect(() => {
    if (accounts.length > 0 && selectedAccountId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional initialization from async data
      setSelectedAccountId(accounts[0].id);
    }
    // If the selected account was disconnected, fall back to first
    if (selectedAccountId !== null && accounts.length > 0 && !accounts.some(a => a.id === selectedAccountId)) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Subscriber pattern (same as DrawingBridgeProvider)
  const subscribersRef = useRef<Set<SyncCompletedCallback>>(new Set());

  // Track previous active-job counts per account for completion detection
  const prevActiveCountsRef = useRef<Record<number, number>>({});

  // ------ Completion detection ------
  useEffect(() => {
    const prev = prevActiveCountsRef.current;

    for (const [accountIdStr, data] of Object.entries(syncData)) {
      const accountId = Number(accountIdStr);
      const currentActive = data?.activeJobs?.length ?? 0;
      const previousActive = prev[accountId] ?? 0;

      // Transition from >0 to 0 → sync completed
      if (previousActive > 0 && currentActive === 0) {
        // Gather completed jobs (recent jobs that weren't active anymore)
        const completedJobs = (data?.recentJobs ?? []).filter(
          (j) => j.status === "completed" || j.status === "failed"
        );

        // Broadcast to all subscribers
        subscribersRef.current.forEach((cb) => {
          try {
            cb(accountId, completedJobs);
          } catch (err) {
            console.error("Error in sync completion subscriber:", err);
          }
        });

        // Auto-refresh credits
        refreshCredits();
      }
    }

    // Update prev counts
    const next: Record<number, number> = {};
    for (const [id, data] of Object.entries(syncData)) {
      next[Number(id)] = data?.activeJobs?.length ?? 0;
    }
    prevActiveCountsRef.current = next;
  }, [syncData, refreshCredits]);

  // ------ Derived values ------
  const totalActiveJobs = Object.values(syncData).reduce(
    (sum, data) => sum + (data?.activeJobs?.length ?? 0),
    0
  );

  const isSyncing = totalActiveJobs > 0;

  const activeJobsFor = useCallback(
    (accountId: number): SyncJob[] => {
      return syncData[accountId]?.activeJobs ?? [];
    },
    [syncData]
  );

  // ------ Subscribe to sync completion ------
  const onSyncCompleted = useCallback(
    (callback: SyncCompletedCallback): (() => void) => {
      subscribersRef.current.add(callback);
      return () => {
        subscribersRef.current.delete(callback);
      };
    },
    []
  );

  const value: SyncContextValue = {
    accounts,
    accountsLoading: loading,
    accountsError: error,
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
    selectedAccountId,
    setSelectedAccountId,
    isSyncing,
    totalActiveJobs,
    activeJobsFor,
    onSyncCompleted,
  };

  return <SyncContext value={value}>{children}</SyncContext>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return ctx;
}

export function useSyncOptional(): SyncContextValue | null {
  return useContext(SyncContext);
}

/**
 * Convenience hook: subscribe to sync-completion events.
 * The callback fires when any account's active jobs drop to 0.
 */
export function useOnSyncCompleted(
  callback: (accountId: number, completedJobs: SyncJob[]) => void
) {
  const { onSyncCompleted } = useSync();

  useEffect(() => {
    return onSyncCompleted(callback);
  }, [onSyncCompleted, callback]);
}
