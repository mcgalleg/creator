"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { CommentSyncDialog } from "./comment-sync-dialog";
import { PostImportDialog, PostImportConfig } from "./post-import-dialog";
import {
  BadgeCheck,
  Users,
  Heart,
  Video,
  RefreshCw,
  Trash2,
  FolderOpen,
  Check,
  Lock,
  Clock,
  Loader2,
  Plus,
  User,
  FileText,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TikTokAccount, SyncJob, CommentSyncJob } from "@/hooks/use-accounts";

interface AccountStats {
  syncedPosts: number;
  totalPosts: number;
  syncedComments: number;
  estimatedComments: number;
  lastSyncedAt: string | null;
}

type NodeStatus = "synced" | "partial" | "available" | "locked" | "syncing";

interface AccountDataTreeProps {
  account: TikTokAccount;
  syncStatus: SyncJob | null;
  commentSyncStatus?: CommentSyncJob | null;
  onSync: (accountId: number, config?: PostImportConfig) => void;
  onProfileRefresh?: (accountId: number) => void;
  onDelete: (accountId: number) => Promise<void>;
  isSyncing: boolean;
  isDisconnecting: boolean;
  userCreditBalance?: number;
  onCommentSyncStarted?: (accountId: number, jobId: number, mode: CommentSyncJob["mode"], postCount: number) => void;
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

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "Never";
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

function getNodeStatus(
  synced: number,
  total: number,
  isSyncing: boolean,
  isLocked: boolean
): NodeStatus {
  if (isSyncing) return "syncing";
  if (isLocked) return "locked";
  if (synced === 0 && total > 0) return "available";
  if (synced > 0 && synced < total) return "partial";
  if (synced > 0 && synced >= total) return "synced";
  return "available";
}

function NodeStatusIcon({ status }: { status: NodeStatus }) {
  switch (status) {
    case "synced":
      return <Check className="size-4 text-green-500" />;
    case "partial":
      return <FolderOpen className="size-4 text-amber-500" />;
    case "available":
      return <div className="size-4 rounded-full border-2 border-muted-foreground/30" />;
    case "locked":
      return <Lock className="size-4 text-muted-foreground/50" />;
    case "syncing":
      return <Loader2 className="size-4 text-primary animate-spin" />;
  }
}

export function AccountDataTree({
  account,
  syncStatus,
  commentSyncStatus,
  onSync,
  onProfileRefresh,
  onDelete,
  isSyncing,
  isDisconnecting,
  userCreditBalance,
  onCommentSyncStarted,
}: AccountDataTreeProps) {
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentSyncOpen, setCommentSyncOpen] = useState(false);
  const [postImportOpen, setPostImportOpen] = useState(false);

  // Fetch account stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch(`/api/accounts/${account.id}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch account stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [account.id, syncStatus]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await onDelete(account.id);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handlePostImport = async (config: PostImportConfig, _estimatedCost: number) => {
    // Call the onSync prop with the configuration
    onSync(account.id, config);
    setPostImportOpen(false);
  };

  const handleProfileRefresh = async () => {
    if (!onProfileRefresh || isRefreshingProfile) return;
    setIsRefreshingProfile(true);
    try {
      onProfileRefresh(account.id);
    } finally {
      // Reset after a short delay to allow the UI to update
      setTimeout(() => setIsRefreshingProfile(false), 2000);
    }
  };

  // Determine node statuses
  const postsSyncing = isSyncing && (syncStatus?.type === "posts" || syncStatus?.type === "full");
  const commentsSyncing =
    (isSyncing && syncStatus?.type === "comments") ||
    commentSyncStatus?.status === "running";

  const postsStatus = getNodeStatus(
    stats?.syncedPosts ?? 0,
    stats?.totalPosts ?? account.videoCount ?? 0,
    postsSyncing,
    false
  );

  // Comments are locked if no posts have been synced
  const commentsLocked = (stats?.syncedPosts ?? 0) === 0;
  const commentsStatus = getNodeStatus(
    stats?.syncedComments ?? 0,
    stats?.estimatedComments ?? 0,
    commentsSyncing,
    commentsLocked
  );

  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        {/* Header with Avatar and Actions */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-12 border">
              <AvatarImage
                src={account.avatarUrl || undefined}
                alt={account.displayName || account.username}
              />
              <AvatarFallback>
                {(account.displayName || account.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {account.displayName || account.username}
                </span>
                {account.isVerified && (
                  <BadgeCheck className="size-4 text-blue-500" />
                )}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>@{account.username}</span>
                <span className="text-muted-foreground/50">•</span>
                <Clock className="size-3" />
                <span>Last synced {formatDate(stats?.lastSyncedAt ?? account.lastSyncedAt)}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleDeleteClick}
            disabled={isSyncing || isDisconnecting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        {/* Data Tree */}
        <div className="space-y-1">
          {/* Profile Node */}
          <div className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <Check className="size-4 text-green-500" />
              <span className="font-medium">Profile</span>
            </div>
            <div className="flex items-center gap-3 ml-auto text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {formatNumber(account.followerCount)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="size-3.5" />
                {formatNumber(account.likesCount)}
              </span>
              <span className="flex items-center gap-1">
                <Video className="size-3.5" />
                {account.videoCount || 0}
              </span>
              {onProfileRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProfileRefresh}
                  disabled={isSyncing || isDisconnecting || isRefreshingProfile}
                  className="h-7 px-2"
                >
                  {isRefreshingProfile ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-3.5" />
                      Refresh
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Posts Node */}
          <div className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors border-t border-border/50">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <NodeStatusIcon status={postsStatus} />
              <span className="font-medium">Posts</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {statsLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : postsSyncing ? (
                <span className="text-sm text-muted-foreground">
                  Importing posts...
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {stats?.syncedPosts ?? 0} of {stats?.totalPosts ?? account.videoCount ?? 0} synced
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPostImportOpen(true)}
                disabled={isSyncing || isDisconnecting}
                className="h-7 px-2"
              >
                {postsSyncing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Importing...
                  </>
                ) : postsStatus === "available" ? (
                  <>
                    <Plus className="size-3.5" />
                    Import
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-3.5" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Comments Node */}
          <div className={cn(
            "flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors border-t border-border/50",
            commentsLocked && "opacity-60"
          )}>
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <NodeStatusIcon status={commentsStatus} />
              <span className="font-medium">Comments</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {statsLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : commentsLocked ? (
                <span className="text-sm text-muted-foreground italic">
                  Requires posts
                </span>
              ) : commentsSyncing ? (
                <span className="text-sm text-muted-foreground">
                  Importing comments...
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {stats?.syncedComments ?? 0} synced
                  {(stats?.estimatedComments ?? 0) > 0 && (
                    <> • ~{formatNumber(stats?.estimatedComments ?? 0)} available</>
                  )}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCommentSyncOpen(true)}
                disabled={isSyncing || isDisconnecting || commentsLocked}
                className="h-7 px-2"
              >
                {commentsSyncing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Sync Error Badge */}
        {syncStatus && syncStatus.status === "failed" && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant="destructive" className="gap-1.5">
              Sync failed: {syncStatus.error || "Unknown error"}
            </Badge>
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
              <span className="font-medium">@{account.username}</span>? This will
              delete all synced posts and comments for this account. This action
              cannot be undone.
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
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
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
        pendingSyncStatus={commentSyncStatus}
        onSyncStarted={onCommentSyncStarted}
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
