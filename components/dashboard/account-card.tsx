"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentSyncDialog } from "./comment-sync-dialog";
import { PostImportDialog, type PostImportConfig } from "./post-import-dialog";
import {
  BadgeCheck,
  MoreVertical,
  RefreshCw,
  Unplug,
  Loader2,
  Download,
  MessageSquare,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TikTokAccount, AccountSyncData } from "@/hooks/use-accounts";

interface AccountCardProps {
  account: TikTokAccount;
  syncData?: AccountSyncData;
  onSync: (accountId: number, config?: PostImportConfig) => void;
  onProfileRefresh?: (accountId: number) => void;
  onDelete: (accountId: number) => Promise<void>;
  isSyncing: boolean;
  isDisconnecting: boolean;
  userCreditBalance?: number;
  onFetchSyncData?: (accountId: number) => Promise<void>;
}

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

const formatRelativeTime = (dateStr: string | null): string => {
  if (!dateStr) return "Never synced";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export function AccountCard({
  account,
  syncData,
  onSync,
  onProfileRefresh,
  onDelete,
  isSyncing,
  isDisconnecting,
  userCreditBalance,
  onFetchSyncData,
}: AccountCardProps) {
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentSyncOpen, setCommentSyncOpen] = useState(false);
  const [postImportOpen, setPostImportOpen] = useState(false);
  const [dismissedError, setDismissedError] = useState<number | null>(null);

  // Derive stats from syncData with account fallbacks
  const stats = syncData?.stats;
  const statsLoading = !syncData;

  // Active and recent jobs
  const activeJobs = syncData?.activeJobs ?? [];
  const recentJobs = syncData?.recentJobs ?? [];
  const postsSyncing = activeJobs.some(
    (j) => j.type === "posts" || j.type === "full"
  );
  const commentsSyncing = activeJobs.some((j) => j.type === "comments");
  const hasActiveJobs = activeJobs.length > 0;

  // Most recent failed job (unless dismissed)
  const lastFailedJob = recentJobs.find(
    (j) => j.status === "failed" && j.id !== dismissedError
  );

  // Post progress values
  const syncedPosts = stats?.syncedPosts ?? 0;
  const totalPosts = stats?.totalPosts ?? account.videoCount ?? 0;
  const postsPercent = totalPosts > 0 ? (syncedPosts / totalPosts) * 100 : 0;

  // Comments count
  const syncedComments = stats?.syncedComments ?? 0;

  // Last synced time
  const lastSyncedAt = stats?.lastSyncedAt ?? account.lastSyncedAt;

  const handleProfileRefresh = async () => {
    if (!onProfileRefresh || isRefreshingProfile) return;
    setIsRefreshingProfile(true);
    try {
      onProfileRefresh(account.id);
    } finally {
      setTimeout(() => setIsRefreshingProfile(false), 2000);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await onDelete(account.id);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handlePostImport = async (
    config: PostImportConfig,
    _estimatedCost: number
  ) => {
    onSync(account.id, config);
    setPostImportOpen(false);
  };

  const handleCommentSyncStarted = () => {
    onFetchSyncData?.(account.id);
  };

  // Active job description for the status bar
  const getActiveJobDescription = (): string => {
    if (postsSyncing && commentsSyncing) return "Importing posts and comments...";
    if (postsSyncing) {
      const postJob = activeJobs.find(
        (j) => j.type === "posts" || j.type === "full"
      );
      const count = postJob?.postsCount;
      if (count) return `Importing posts... (${count} so far)`;
      return "Importing posts...";
    }
    if (commentsSyncing) {
      const commentJob = activeJobs.find((j) => j.type === "comments");
      const count = commentJob?.commentsCount;
      if (count) return `Syncing comments... (${count} so far)`;
      return "Syncing comments...";
    }
    return "Syncing...";
  };

  return (
    <>
      <div className="rounded-lg border bg-card p-4 space-y-3">
        {/* Header: Avatar, name, username, last sync, actions */}
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border shrink-0">
            <AvatarImage
              src={account.avatarUrl || undefined}
              alt={account.displayName || account.username}
            />
            <AvatarFallback>
              {(account.displayName || account.username)
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold truncate">
                {account.displayName || account.username}
              </span>
              {account.isVerified && (
                <BadgeCheck className="size-4 text-blue-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="truncate">@{account.username}</span>
              <span className="text-muted-foreground/50 shrink-0">&middot;</span>
              <span className="shrink-0">
                {formatRelativeTime(lastSyncedAt)}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
              >
                <MoreVertical className="size-4" />
                <span className="sr-only">Account actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onProfileRefresh && (
                <DropdownMenuItem
                  onClick={handleProfileRefresh}
                  disabled={
                    isSyncing || isDisconnecting || isRefreshingProfile
                  }
                >
                  <RefreshCw
                    className={cn(
                      "size-4 mr-2",
                      isRefreshingProfile && "animate-spin"
                    )}
                  />
                  {isRefreshingProfile
                    ? "Refreshing..."
                    : "Refresh Profile"}
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                    FREE
                  </Badge>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isSyncing || isDisconnecting}
                className="text-destructive focus:text-destructive"
              >
                <Unplug className="size-4 mr-2" />
                Disconnect Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Posts row */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium w-20 shrink-0">Posts</span>
          <div className="flex-1 min-w-0">
            {statsLoading ? (
              <Skeleton className="h-2 w-full rounded-full" />
            ) : (
              <Progress
                value={Math.min(postsPercent, 100)}
                className="h-2"
              />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {statsLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                {postsSyncing ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3 animate-spin" />
                    Importing...
                  </span>
                ) : (
                  <>
                    {formatNumber(syncedPosts)}/{formatNumber(totalPosts)}{" "}
                    synced
                  </>
                )}
              </span>
            )}
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPostImportOpen(true)}
              disabled={isSyncing || isDisconnecting}
            >
              {postsSyncing ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Importing
                </>
              ) : syncedPosts > 0 ? (
                <>
                  <Download className="size-3" />
                  Import More
                </>
              ) : (
                <>
                  <Download className="size-3" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Comments row */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium w-20 shrink-0">Comments</span>
          <div className="flex-1 min-w-0">
            {statsLoading ? (
              <Skeleton className="h-2 w-full rounded-full" />
            ) : syncedPosts === 0 ? (
              <div className="h-2 w-full rounded-full bg-muted" />
            ) : (
              <Progress
                value={syncedComments > 0 ? 100 : 0}
                className="h-2"
              />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {statsLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : syncedPosts === 0 ? (
              <span className="text-sm text-muted-foreground italic whitespace-nowrap">
                Import posts first
              </span>
            ) : (
              <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                {commentsSyncing ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3 animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  <>{formatNumber(syncedComments)} synced</>
                )}
              </span>
            )}
            <Button
              variant="outline"
              size="xs"
              onClick={() => setCommentSyncOpen(true)}
              disabled={isSyncing || isDisconnecting || syncedPosts === 0}
            >
              {commentsSyncing ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Syncing
                </>
              ) : (
                <>
                  <MessageSquare className="size-3" />
                  Sync
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Active sync progress indicator */}
        {hasActiveJobs && (
          <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
            <Loader2 className="size-3.5 animate-spin text-primary shrink-0" />
            <span className="text-sm text-primary">
              {getActiveJobDescription()}
            </span>
          </div>
        )}

        {/* Failed job error */}
        {lastFailedJob && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/5 border border-destructive/10 px-3 py-2">
            <AlertTriangle className="size-3.5 text-destructive shrink-0 mt-0.5" />
            <span className="text-sm text-destructive flex-1">
              Sync failed: {lastFailedJob.error || "Unknown error"}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-destructive hover:text-destructive"
              onClick={() => setDismissedError(lastFailedJob.id)}
            >
              <X className="size-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect{" "}
              <span className="font-medium">@{account.username}</span>? This
              will delete all synced posts and comments for this account. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDisconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Sync Dialog */}
      <CommentSyncDialog
        isOpen={commentSyncOpen}
        onClose={() => setCommentSyncOpen(false)}
        accountId={account.id}
        accountUsername={account.username}
        activeCommentJobs={activeJobs.filter((j) => j.type === "comments")}
        onSyncStarted={handleCommentSyncStarted}
      />

      {/* Post Import Dialog */}
      <PostImportDialog
        isOpen={postImportOpen}
        onClose={() => setPostImportOpen(false)}
        accountUsername={account.username}
        totalPosts={stats?.totalPosts ?? account.videoCount ?? 0}
        userCreditBalance={userCreditBalance ?? 0}
        onImport={handlePostImport}
        isImporting={postsSyncing}
      />
    </>
  );
}
