"use client";

import { useState } from "react";
import { CreditBalanceDisplay } from "@/components/dashboard/credit-balance-display";
import {
  AccountCompactCard,
  AccountConnectBar,
  AccountDetailPanel,
  type TikTokProfile,
} from "@/components/dashboard/accounts";
import type { SyncOptions } from "@/hooks/use-accounts";
import { useSync } from "@/contexts/sync-context";
import { useCredits } from "@/hooks/use-credits";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users } from "lucide-react";
import type { PostImportConfig } from "@/components/dashboard/post-import-dialog";

export default function AccountsPage() {
  const {
    accounts,
    accountsLoading: loading,
    accountsError: error,
    connectAccount,
    disconnectAccount,
    triggerSync,
    refreshProfile,
    syncData,
    fetchSyncData,
    connecting,
    syncing,
    disconnecting,
  } = useSync();

  const { balance: creditBalance, loading: creditsLoading, refresh: refreshCredits } = useCredits();

  // Panel state
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [panelMode, setPanelMode] = useState<"detail" | "connect">("detail");
  const [connectProfile, setConnectProfile] = useState<TikTokProfile | null>(null);

  // Derived
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const panelOpen =
    (panelMode === "detail" && selectedAccountId !== null && !!selectedAccount) ||
    (panelMode === "connect" && connectProfile !== null);

  // Note: if selectedAccount is deleted, panelOpen becomes false via derived state,
  // and handlePanelOpenChange(false) resets selectedAccountId when Sheet closes.

  const handleConnect = async (
    username: string,
    options?: {
      triggerSync?: boolean;
      postsLimit?: number;
      includeComments?: boolean;
    }
  ) => {
    const result = await connectAccount(username, options);

    if (result.syncError) {
      toast.warning("Account connected, but sync failed", {
        description: result.syncError,
        duration: 8000,
      });
    }

    if (options?.triggerSync) {
      refreshCredits();
    }

    return result;
  };

  const handleSync = async (accountId: number, config?: PostImportConfig) => {
    const syncOptions: SyncOptions = {
      postsLimit: config?.postsLimit ?? config?.topCount ?? 50,
      includeComments: config?.includeComments ?? false,
      commentsLimit: config?.includeComments
        ? (config?.commentsPerPost ?? 100) * (config?.postsLimit ?? config?.topCount ?? 50)
        : 0,
      maxCommentsPerPost: config?.commentsPerPost,
      oldestPostDate: config?.customDateStart,
      newestPostDate: config?.customDateEnd,
    };

    await triggerSync(accountId, syncOptions);
    handlePanelOpenChange(false);
  };

  const handleDelete = async (accountId: number) => {
    const account = accounts.find((a) => a.id === accountId);
    const username = account?.username || "Account";
    try {
      await disconnectAccount(accountId);
      toast.success("Account disconnected", {
        description: `@${username} has been disconnected. Reconnect anytime to restore your data.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect account";
      toast.error("Failed to disconnect account", { description: message });
      throw err;
    }
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
      toast.error("Profile refresh failed", { description: message });
    }
  };

  const handleProfileFound = (profile: TikTokProfile) => {
    setConnectProfile(profile);
    setPanelMode("connect");
    setSelectedAccountId(null);
  };

  const handlePanelOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedAccountId(null);
      setConnectProfile(null);
      setPanelMode("detail");
    }
  };

  const handleAccountClick = (accountId: number) => {
    setSelectedAccountId(accountId);
    setPanelMode("detail");
    setConnectProfile(null);
  };

  const selectedSyncData = selectedAccountId != null ? syncData[selectedAccountId] : undefined;
  const isSyncing =
    selectedAccountId != null &&
    (syncing[selectedAccountId] || (selectedSyncData?.activeJobs?.length ?? 0) > 0);
  const isDisconnecting = selectedAccountId != null && disconnecting[selectedAccountId];

  return (
    <div className="w-full max-w-4xl mx-auto py-4 md:py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connected Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your TikTok accounts and sync your analytics data.
          </p>
        </div>
        <CreditBalanceDisplay balance={creditBalance} loading={creditsLoading} />
      </div>

      <div className="space-y-6">
        {/* Connect Bar */}
        <AccountConnectBar
          onProfileFound={handleProfileFound}
          connectedUsernames={accounts.map((a) => a.username)}
          isLoadingAccounts={loading}
        />

        {/* Account List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-lg border p-3 flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-4" />
              <span>{error}</span>
            </div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No accounts connected</h3>
            <p className="text-sm text-muted-foreground">
              Connect your TikTok account above to start tracking your analytics.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {accounts.length} account{accounts.length !== 1 ? "s" : ""} connected
            </p>
            {accounts.map((account) => (
              <AccountCompactCard
                key={account.id}
                account={account}
                syncData={syncData[account.id]}
                isSelected={selectedAccountId === account.id && panelMode === "detail"}
                isSyncing={syncing[account.id] || (syncData[account.id]?.activeJobs?.length ?? 0) > 0}
                isDisconnecting={disconnecting[account.id]}
                onClick={() => handleAccountClick(account.id)}
                onProfileRefresh={handleProfileRefresh}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail / Connect Panel */}
      <AccountDetailPanel
        open={panelOpen}
        onOpenChange={handlePanelOpenChange}
        mode={panelMode}
        account={selectedAccount}
        syncData={selectedSyncData}
        isSyncing={isSyncing}
        isDisconnecting={isDisconnecting}
        userCreditBalance={creditBalance}
        onSync={handleSync}
        onProfileRefresh={handleProfileRefresh}
        onDelete={handleDelete}
        onFetchSyncData={fetchSyncData}
        onRefreshCredits={refreshCredits}
        connectProfile={connectProfile}
        onConnect={handleConnect}
        isConnecting={connecting}
      />
    </div>
  );
}
