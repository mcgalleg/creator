"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users } from "lucide-react";
import { AccountCard } from "./account-card";
import { toast } from "sonner";
import type { TikTokAccount, AccountSyncData } from "@/hooks/use-accounts";
import type { PostImportConfig } from "./post-import-dialog";

interface AccountListProps {
  accounts: TikTokAccount[];
  loading: boolean;
  error: string | null;
  onSync: (accountId: number, config?: PostImportConfig) => void;
  onProfileRefresh?: (accountId: number) => void;
  onDelete: (accountId: number) => Promise<void>;
  syncing: Record<number, boolean>;
  disconnecting: Record<number, boolean>;
  syncData: Record<number, AccountSyncData>;
  onFetchSyncData?: (accountId: number) => Promise<void>;
  userCreditBalance?: number;
}

export function AccountList({
  accounts,
  loading,
  error,
  onSync,
  onProfileRefresh,
  onDelete,
  syncing,
  disconnecting,
  syncData,
  onFetchSyncData,
  userCreditBalance,
}: AccountListProps) {
  const handleDelete = async (accountId: number) => {
    const account = accounts.find((a) => a.id === accountId);
    const username = account?.username || "Account";

    try {
      await onDelete(accountId);
      toast.success("Account disconnected", {
        description: `@${username} has been removed from your accounts.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect account";
      toast.error("Failed to disconnect account", {
        description: message,
      });
      throw err;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Your connected TikTok accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-2 pl-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Your connected TikTok accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No accounts connected</h3>
            <p className="text-sm text-muted-foreground">
              Connect your TikTok account above to start tracking your analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          {accounts.length} account{accounts.length !== 1 ? "s" : ""} connected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.map((account) => {
          const accountSyncData = syncData[account.id];
          const hasActiveJobs = (accountSyncData?.activeJobs?.length ?? 0) > 0;
          const isSyncing = syncing[account.id] || hasActiveJobs;
          const isDisconnecting = disconnecting[account.id];

          return (
            <AccountCard
              key={account.id}
              account={account}
              syncData={accountSyncData}
              onSync={onSync}
              onProfileRefresh={onProfileRefresh}
              onDelete={handleDelete}
              isSyncing={isSyncing}
              isDisconnecting={isDisconnecting}
              userCreditBalance={userCreditBalance}
              onFetchSyncData={onFetchSyncData}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
