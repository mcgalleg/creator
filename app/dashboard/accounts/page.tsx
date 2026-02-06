"use client";

import { useEffect, useRef } from "react";
import { AccountConnectionForm } from "@/components/dashboard/account-connection-form";
import { AccountList } from "@/components/dashboard/account-list";
import { CreditBalanceDisplay } from "@/components/dashboard/credit-balance-display";
import { useAccounts, type SyncOptions } from "@/hooks/use-accounts";
import { useCredits } from "@/hooks/use-credits";
import { toast } from "sonner";
import type { PostImportConfig } from "@/components/dashboard/post-import-dialog";

export default function AccountsPage() {
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

  const { balance: creditBalance, loading: creditsLoading, refresh: refreshCredits } = useCredits();

  // Bug Fix 2: Auto-refresh credits when syncs complete
  // Track whether any account had active jobs so we detect the transition to 0
  const hadActiveJobsRef = useRef(false);
  const totalActiveJobs = Object.values(syncData).reduce(
    (sum, data) => sum + (data?.activeJobs?.length ?? 0),
    0
  );

  useEffect(() => {
    if (totalActiveJobs > 0) {
      hadActiveJobsRef.current = true;
    } else if (hadActiveJobsRef.current) {
      // Transitioned from active jobs to no active jobs — sync completed
      hadActiveJobsRef.current = false;
      refreshCredits();
    }
  }, [totalActiveJobs, refreshCredits]);

  const handleConnect = async (
    username: string,
    options?: {
      triggerSync?: boolean;
      importOption?: "profile_only" | "profile_posts" | "profile_posts_comments";
      postsLimit?: number;
      includeComments?: boolean;
    }
  ) => {
    const result = await connectAccount(username, options);

    // Show warning if sync failed but account was created
    if (result.syncError) {
      toast.warning("Account connected, but sync failed", {
        description: result.syncError,
        duration: 8000,
      });
    }

    // Refresh credits after connecting (in case sync was triggered)
    if (options?.triggerSync || options?.importOption !== "profile_only") {
      refreshCredits();
    }
    return result;
  };

  const handleSync = async (accountId: number, config?: PostImportConfig) => {
    // Convert PostImportConfig to SyncOptions
    const syncOptions: SyncOptions = {
      postsLimit: config?.postsLimit ?? config?.topCount ?? 50,
      includeComments: config?.includeComments ?? false,
      commentsLimit: config?.includeComments ? (config?.commentsPerPost ?? 100) * (config?.postsLimit ?? config?.topCount ?? 50) : 0,
      sorting: config?.sorting,
      oldestPostDate: config?.customDateStart,
      newestPostDate: config?.customDateEnd,
    };

    await triggerSync(accountId, syncOptions);
    // Polling is automatically started by triggerSync via fetchSyncData
  };

  const handleDelete = async (accountId: number) => {
    await disconnectAccount(accountId);
  };

  const handleProfileRefresh = async (accountId: number) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    try {
      await refreshProfile(accountId);

      toast.success("Profile refreshed", {
        description: `Updated stats for @${account.username}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh profile";
      toast.error("Profile refresh failed", {
        description: message,
      });
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connected Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your TikTok accounts and sync your analytics data.
          </p>
        </div>
        <CreditBalanceDisplay
          balance={creditBalance}
          loading={creditsLoading}
        />
      </div>

      <div className="space-y-6">
        {/* Account Connection Form */}
        <AccountConnectionForm
          onConnect={handleConnect}
          isConnecting={connecting}
          connectedUsernames={accounts.map((a) => a.username)}
          isLoadingAccounts={loading}
          userCreditBalance={creditBalance}
          onRefreshCredits={refreshCredits}
        />

        {/* Account List */}
        <AccountList
          accounts={accounts}
          loading={loading}
          error={error}
          onSync={handleSync}
          onProfileRefresh={handleProfileRefresh}
          onDelete={handleDelete}
          syncing={syncing}
          userCreditBalance={creditBalance}
          disconnecting={disconnecting}
          syncData={syncData}
          onFetchSyncData={fetchSyncData}
        />
      </div>
    </div>
  );
}
