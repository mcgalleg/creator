"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  BadgeCheck,
  Users,
  Heart,
  Video,
  MoreVertical,
  RefreshCw,
  Unplug,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { formatNumber, formatRelativeTime, getActiveJobDescription } from "./shared-utils";
import { AccountDeleteDialog } from "./account-delete-dialog";
import { useDismissedErrors } from "@/hooks/use-dismissed-errors";
import type { TikTokAccount, AccountSyncData } from "@/hooks/use-accounts";

interface AccountCompactCardProps {
  account: TikTokAccount;
  syncData?: AccountSyncData;
  isSelected?: boolean;
  isSyncing?: boolean;
  isDisconnecting?: boolean;
  onClick: () => void;
  onProfileRefresh?: (accountId: number) => void;
  onDelete?: (accountId: number) => Promise<void>;
}

export function AccountCompactCard({
  account,
  syncData,
  isSelected,
  isSyncing = false,
  isDisconnecting = false,
  onClick,
  onProfileRefresh,
  onDelete,
}: AccountCompactCardProps) {
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dismissedErrors, dismissError] = useDismissedErrors();

  const activeJobs = syncData?.activeJobs ?? [];
  const hasActiveJobs = activeJobs.length > 0;
  const stats = syncData?.stats;

  const syncedPosts = stats?.syncedPosts ?? 0;
  const totalPosts = stats?.totalPosts ?? account.videoCount ?? 0;
  const postsPercent = totalPosts > 0 ? (syncedPosts / totalPosts) * 100 : 0;

  const syncedComments = stats?.syncedComments ?? 0;

  const lastSyncedAt = stats?.lastSyncedAt ?? account.lastSyncedAt;

  // Only show a failed job if no successful sync completed after it
  const lastCompletedAt = stats?.lastCompletedJobAt;
  const recentJobs = syncData?.recentJobs ?? [];
  const lastFailedJob = recentJobs.find(
    (j) =>
      j.status === "failed" &&
      !dismissedErrors.has(j.id) &&
      (!lastCompletedAt ||
        new Date(j.completedAt ?? j.createdAt) > new Date(lastCompletedAt))
  );

  const handleProfileRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRefreshingProfile || !onProfileRefresh) return;
    setIsRefreshingProfile(true);
    try {
      onProfileRefresh(account.id);
    } finally {
      setTimeout(() => setIsRefreshingProfile(false), 2000);
    }
  };

  const handleDisconnectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete(account.id);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 cursor-pointer ${
          isSelected ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        {/* Header row */}
        <div className="flex items-center gap-3">
          <Avatar className="size-12 border shrink-0">
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
              <span className="font-semibold truncate text-sm">
                {account.displayName || account.username}
              </span>
              {account.isVerified && (
                <BadgeCheck className="size-4 text-blue-500 shrink-0" />
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              @{account.username}
            </div>
          </div>

          <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
            {formatRelativeTime(lastSyncedAt)}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
                <span className="sr-only">Account actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleProfileRefresh}
                disabled={
                  isSyncing || isDisconnecting || isRefreshingProfile
                }
              >
                <RefreshCw
                  className={`size-4 ${isRefreshingProfile ? "animate-spin" : ""}`}
                />
                {isRefreshingProfile ? "Refreshing..." : "Refresh Profile"}
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] px-1.5 py-0"
                >
                  FREE
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDisconnectClick}
                disabled={isSyncing || isDisconnecting}
                className="text-destructive focus:text-destructive"
              >
                <Unplug className="size-4" />
                Disconnect Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="rounded-md bg-muted/30 px-3 py-2 text-center">
            <Users className="size-3.5 text-muted-foreground mx-auto mb-0.5" />
            <div className="font-semibold text-sm">
              {formatNumber(account.followerCount)}
            </div>
            <div className="text-[11px] text-muted-foreground">Followers</div>
          </div>
          <div className="rounded-md bg-muted/30 px-3 py-2 text-center">
            <Heart className="size-3.5 text-muted-foreground mx-auto mb-0.5" />
            <div className="font-semibold text-sm">
              {formatNumber(account.likesCount)}
            </div>
            <div className="text-[11px] text-muted-foreground">Likes</div>
          </div>
          <div className="rounded-md bg-muted/30 px-3 py-2 text-center">
            <Video className="size-3.5 text-muted-foreground mx-auto mb-0.5" />
            <div className="font-semibold text-sm">
              {formatNumber(account.videoCount)}
            </div>
            <div className="text-[11px] text-muted-foreground">Videos</div>
          </div>
        </div>

        {/* Sync progress rows */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium w-20 shrink-0">Posts</span>
            <Progress
              value={Math.min(postsPercent, 100)}
              className="h-1.5 flex-1"
            />
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {formatNumber(syncedPosts)}/{formatNumber(totalPosts)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium w-20 shrink-0">Comments</span>
            <Progress
              value={syncedComments > 0 ? 100 : 0}
              className="h-1.5 flex-1"
            />
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {formatNumber(syncedComments)}
            </span>
          </div>
        </div>

        {/* Active sync banner */}
        {hasActiveJobs && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mt-3">
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

        {/* Error banner */}
        {lastFailedJob && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 mt-3">
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
              onClick={(e) => {
                e.stopPropagation();
                dismissError(lastFailedJob.id);
              }}
              className="shrink-0 rounded-md p-1 text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <AccountDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        username={account.username}
        isDeleting={isDisconnecting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
