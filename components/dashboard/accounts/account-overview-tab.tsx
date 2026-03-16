"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BadgeCheck,
  Users,
  Heart,
  Video,
  RefreshCw,
  Unplug,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatNumber, formatRelativeTime, getActiveJobDescription } from "./shared-utils";
import { AccountDeleteDialog } from "./account-delete-dialog";
import { useDismissedErrors } from "@/hooks/use-dismissed-errors";
import type { TikTokAccount, AccountSyncData, SyncJob } from "@/hooks/use-accounts";

interface AccountOverviewTabProps {
  account: TikTokAccount;
  syncData?: AccountSyncData;
  isSyncing: boolean;
  isDisconnecting: boolean;
  onProfileRefresh: (accountId: number) => void;
  onDelete: (accountId: number) => Promise<void>;
}

export function AccountOverviewTab({
  account,
  syncData,
  isSyncing,
  isDisconnecting,
  onProfileRefresh,
  onDelete,
}: AccountOverviewTabProps) {
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dismissedErrors, dismissError] = useDismissedErrors();

  // Toast on newly completed jobs
  const prevRecentJobIdsRef = useRef<Set<number> | null>(null);
  const activeJobs = syncData?.activeJobs ?? [];
  const recentJobs = useMemo(() => syncData?.recentJobs ?? [], [syncData?.recentJobs]);

  useEffect(() => {
    if (prevRecentJobIdsRef.current === null) {
      prevRecentJobIdsRef.current = new Set(recentJobs.map((j) => j.id));
      return;
    }
    const prevIds = prevRecentJobIdsRef.current;
    const newlyCompleted = recentJobs.filter(
      (j) => j.status === "completed" && !prevIds.has(j.id)
    );
    for (const job of newlyCompleted) {
      if (job.type === "posts" || job.type === "full") {
        const parts: string[] = [];
        if (job.newPostsCount) parts.push(`${job.newPostsCount} new`);
        if (job.updatedPostsCount) parts.push(`${job.updatedPostsCount} updated`);
        if (job.creditsUsed != null) parts.push(`${job.creditsUsed} credits used`);
        toast.success("Post import complete", {
          description: parts.join(", ") || "No posts processed",
        });
      }
      if (job.type === "comments") {
        const parts: string[] = [];
        if (job.newCommentsCount) parts.push(`${job.newCommentsCount} new`);
        if (job.updatedCommentsCount) parts.push(`${job.updatedCommentsCount} updated`);
        if (job.creditsUsed != null) parts.push(`${job.creditsUsed} credits used`);
        toast.success("Comment sync complete", {
          description: parts.join(", ") || "No comments processed",
        });
      }
    }
    prevRecentJobIdsRef.current = new Set(recentJobs.map((j) => j.id));
  }, [recentJobs]);

  const stats = syncData?.stats;
  const statsLoading = !syncData;

  const commentsSyncing = activeJobs.some((j) => j.type === "comments");

  const syncedPosts = stats?.syncedPosts ?? 0;
  const totalPosts = stats?.totalPosts ?? account.videoCount ?? 0;
  const postsPercent = totalPosts > 0 ? (syncedPosts / totalPosts) * 100 : 0;

  const syncedComments = stats?.syncedComments ?? 0;
  const activeCommentJob = activeJobs.find((j) => j.type === "comments");
  const commentItemsCollected = activeCommentJob?.commentsCount ?? 0;
  const commentEstimatedTotal = activeCommentJob?.commentsEstimated ?? 0;
  const commentsPercent =
    commentsSyncing && commentEstimatedTotal > 0
      ? Math.min((commentItemsCollected / commentEstimatedTotal) * 100, 99)
      : syncedComments > 0
        ? 100
        : 0;

  const lastSyncedAt = stats?.lastSyncedAt ?? account.lastSyncedAt;

  // Only show a failed job if no successful sync completed after it.
  // Uses lastCompletedJobAt (not limited by the 5-job recentJobs window)
  // so stale errors from before a successful sync are hidden.
  const lastCompletedAt = stats?.lastCompletedJobAt;
  const lastFailedJob = recentJobs.find(
    (j) =>
      j.status === "failed" &&
      !dismissedErrors.has(j.id) &&
      (!lastCompletedAt ||
        new Date(j.completedAt ?? j.createdAt) > new Date(lastCompletedAt))
  );

  const handleProfileRefresh = async () => {
    if (isRefreshingProfile) return;
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

  return (
    <div className="space-y-6 py-2">
      {/* Profile Header */}
      <div className="flex items-start gap-4">
        <Avatar className="size-16 border-2 border-border shrink-0">
          <AvatarImage
            src={account.avatarUrl || undefined}
            alt={account.displayName || account.username}
          />
          <AvatarFallback className="text-lg">
            {(account.displayName || account.username).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-lg truncate">
              {account.displayName || account.username}
            </span>
            {account.isVerified && (
              <BadgeCheck className="size-5 text-blue-500 shrink-0" />
            )}
          </div>
          <div className="text-sm text-muted-foreground mb-1">
            @{account.username}
          </div>
          <div className="text-xs text-muted-foreground">
            Last synced: {formatRelativeTime(lastSyncedAt)}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-muted/30 p-3 text-center">
          <Users className="size-4 text-muted-foreground mx-auto mb-1" />
          <div className="font-semibold text-sm">
            {formatNumber(account.followerCount)}
          </div>
          <div className="text-xs text-muted-foreground">Followers</div>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-center">
          <Heart className="size-4 text-muted-foreground mx-auto mb-1" />
          <div className="font-semibold text-sm">
            {formatNumber(account.likesCount)}
          </div>
          <div className="text-xs text-muted-foreground">Likes</div>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-center">
          <Video className="size-4 text-muted-foreground mx-auto mb-1" />
          <div className="font-semibold text-sm">
            {formatNumber(account.videoCount)}
          </div>
          <div className="text-xs text-muted-foreground">Videos</div>
        </div>
      </div>

      {/* Posts Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Posts</span>
          {statsLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span className="text-muted-foreground tabular-nums">
              {formatNumber(syncedPosts)}/{formatNumber(totalPosts)} synced
            </span>
          )}
        </div>
        {statsLoading ? (
          <Skeleton className="h-2 w-full rounded-full" />
        ) : (
          <Progress value={Math.min(postsPercent, 100)} className="h-2" />
        )}
      </div>

      {/* Comments Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Comments</span>
          {statsLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : syncedPosts === 0 ? (
            <span className="text-muted-foreground italic text-xs">
              Import posts first
            </span>
          ) : (
            <span className="text-muted-foreground tabular-nums">
              {formatNumber(syncedComments)} synced
            </span>
          )}
        </div>
        {statsLoading ? (
          <Skeleton className="h-2 w-full rounded-full" />
        ) : syncedPosts === 0 ? (
          <div className="h-2 w-full rounded-full bg-muted" />
        ) : (
          <Progress value={commentsPercent} className="h-2" />
        )}
      </div>

      {/* Active Sync Banners */}
      {activeJobs.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Loader2 className="size-4 animate-spin shrink-0" />
            Import in progress
          </div>
          <div className="space-y-1">
            {activeJobs.map((job) => (
              <p key={job.id} className="text-xs text-primary/80">
                {getActiveJobDescription(job)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {lastFailedJob && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              Import failed
            </p>
            <p className="text-xs text-destructive/80 mt-0.5 truncate">
              {lastFailedJob.error || "An unknown error occurred during sync"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismissError(lastFailedJob.id)}
            className="shrink-0 rounded-md p-1 text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={handleProfileRefresh}
              disabled={isSyncing || isDisconnecting || isRefreshingProfile}
              className="w-full"
            >
              <RefreshCw
                className={`size-4 ${isRefreshingProfile ? "animate-spin" : ""}`}
              />
              {isRefreshingProfile ? "Refreshing..." : "Refresh Profile"}
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                FREE
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            Updates your follower count, total likes, and video count
          </TooltipContent>
        </Tooltip>
        <Button
          variant="outline"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={isSyncing || isDisconnecting}
          className="w-full text-destructive hover:text-destructive"
        >
          <Unplug className="size-4" />
          Disconnect Account
        </Button>
      </div>

      <AccountDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        username={account.username}
        isDeleting={isDisconnecting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
