"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Trash2,
  BadgeCheck,
  Users,
  Heart,
  Video,
  Clock,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { CommentSyncDialog } from "./comment-sync-dialog";
import { toast } from "sonner";
import type { TikTokAccount, SyncJob } from "@/hooks/use-accounts";

interface AccountListProps {
  accounts: TikTokAccount[];
  loading: boolean;
  error: string | null;
  onSync: (accountId: number) => void;
  onDelete: (accountId: number) => Promise<void>;
  syncing: Record<number, boolean>;
  disconnecting: Record<number, boolean>;
  syncStatus: Record<number, SyncJob | null>;
}

export function AccountList({
  accounts,
  loading,
  error,
  onSync,
  onDelete,
  syncing,
  disconnecting,
  syncStatus,
}: AccountListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<TikTokAccount | null>(null);
  const [commentSyncAccount, setCommentSyncAccount] = useState<TikTokAccount | null>(null);

  const formatNumber = (num: number | null): string => {
    if (num === null) return "0";
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteClick = (account: TikTokAccount) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (accountToDelete) {
      const username = accountToDelete.username;
      try {
        await onDelete(accountToDelete.id);
        toast.success("Account disconnected", {
          description: `@${username} has been removed from your accounts.`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to disconnect account";
        toast.error("Failed to disconnect account", {
          description: message,
        });
      }
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
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
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-24" />
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
    <>
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
            const isSyncing =
              syncing[account.id] || currentSyncStatus?.status === "running";
            const isDisconnecting = disconnecting[account.id];

            return (
              <div
                key={account.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg"
              >
                <Avatar className="size-12 shrink-0">
                  <AvatarImage
                    src={account.avatarUrl || undefined}
                    alt={account.displayName || account.username}
                  />
                  <AvatarFallback>
                    {(account.displayName || account.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">
                      {account.displayName || account.username}
                    </span>
                    {account.isVerified && (
                      <BadgeCheck className="size-4 text-blue-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    @{account.username}
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="size-3.5" />
                      <span>{formatNumber(account.followerCount)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Heart className="size-3.5" />
                      <span>{formatNumber(account.likesCount)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Video className="size-3.5" />
                      <span>{account.videoCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span>Synced {formatDate(account.lastSyncedAt)}</span>
                    </div>
                  </div>

                  {/* Sync Status */}
                  {currentSyncStatus && currentSyncStatus.status !== "completed" && (
                    <div className="mt-2">
                      {currentSyncStatus.status === "running" && (
                        <Badge variant="secondary" className="text-xs">
                          <RefreshCw className="size-3 mr-1 animate-spin" />
                          Syncing...
                        </Badge>
                      )}
                      {currentSyncStatus.status === "failed" && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="size-3 mr-1" />
                          Sync failed: {currentSyncStatus.error || "Unknown error"}
                        </Badge>
                      )}
                      {currentSyncStatus.status === "pending" && (
                        <Badge variant="secondary" className="text-xs">
                          Sync pending...
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSync(account.id)}
                    disabled={isSyncing || isDisconnecting}
                  >
                    <RefreshCw
                      className={`size-4 ${isSyncing ? "animate-spin" : ""}`}
                    />
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommentSyncAccount(account)}
                    disabled={isSyncing || isDisconnecting}
                  >
                    <MessageCircle className="size-4" />
                    Comments
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => handleDeleteClick(account)}
                    disabled={isSyncing || isDisconnecting}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect{" "}
              <span className="font-medium">@{accountToDelete?.username}</span>? This
              will delete all synced posts and comments for this account. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={accountToDelete ? disconnecting[accountToDelete.id] : false}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={accountToDelete ? disconnecting[accountToDelete.id] : false}
            >
              {accountToDelete && disconnecting[accountToDelete.id]
                ? "Disconnecting..."
                : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Sync Dialog */}
      {commentSyncAccount && (
        <CommentSyncDialog
          isOpen={!!commentSyncAccount}
          onClose={() => setCommentSyncAccount(null)}
          accountId={commentSyncAccount.id}
          accountUsername={commentSyncAccount.username}
        />
      )}
    </>
  );
}
