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
import { AccountDataTree } from "./account-data-tree";
import { toast } from "sonner";
import type { TikTokAccount, SyncJob, CommentSyncJob } from "@/hooks/use-accounts";
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
  syncStatus: Record<number, SyncJob | null>;
  commentSyncStatus?: Record<number, CommentSyncJob | null>;
  onCommentSyncStarted?: (accountId: number, jobId: number, mode: CommentSyncJob["mode"], postCount: number) => void;
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
  syncStatus,
  commentSyncStatus,
  onCommentSyncStarted,
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
          const currentSyncStatus = syncStatus[account.id];
          const currentCommentSyncStatus = commentSyncStatus?.[account.id];
          const isSyncing =
            syncing[account.id] ||
            currentSyncStatus?.status === "running" ||
            currentCommentSyncStatus?.status === "running";
          const isDisconnecting = disconnecting[account.id];

          return (
            <AccountDataTree
              key={account.id}
              account={account}
              syncStatus={currentSyncStatus}
              commentSyncStatus={currentCommentSyncStatus}
              onSync={onSync}
              onProfileRefresh={onProfileRefresh}
              onDelete={handleDelete}
              isSyncing={isSyncing}
              isDisconnecting={isDisconnecting}
              userCreditBalance={userCreditBalance}
              onCommentSyncStarted={onCommentSyncStarted}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
