"use client";

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
    syncStatus,
    commentSyncStatus,
    pollSyncStatus,
    pollCommentSyncStatus,
    connecting,
    syncing,
    disconnecting,
  } = useAccounts();

  const { balance: creditBalance, loading: creditsLoading, refresh: refreshCredits } = useCredits();

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

    const result = await triggerSync(accountId, syncOptions);
    // Start polling for status
    pollSyncStatus(accountId, result.jobId);
    // Refresh credits after sync completes (handled by polling)
  };

  const handleDelete = async (accountId: number) => {
    await disconnectAccount(accountId);
  };

  const handleProfileRefresh = async (accountId: number) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    try {
      const response = await fetch(`/api/accounts/${accountId}/refresh-profile`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to refresh profile");
      }

      toast.success("Profile refreshed", {
        description: `Updated stats for @${account.username}`,
      });

      // Refresh the accounts list to show updated data
      await fetchAccounts();
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
          syncStatus={syncStatus}
          commentSyncStatus={commentSyncStatus}
          onCommentSyncStarted={pollCommentSyncStatus}
        />
      </div>
    </div>
  );
}
