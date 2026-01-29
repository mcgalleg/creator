"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  FileText,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import type { SyncJob } from "@/hooks/use-accounts";

interface SyncStatusProps {
  job: SyncJob | null;
  accountUsername?: string;
}

export function SyncStatus({ job, accountUsername }: SyncStatusProps) {
  const prevStatusRef = useRef<string | null>(null);

  // Show toast notifications when sync status changes
  useEffect(() => {
    if (!job) return;

    const prevStatus = prevStatusRef.current;
    const currentStatus = job.status;

    // Only show toast when status changes
    if (prevStatus && prevStatus !== currentStatus) {
      if (currentStatus === "completed") {
        toast.success("Sync completed successfully!", {
          description: accountUsername
            ? `@${accountUsername} data has been updated.`
            : `Synced ${job.postsCount ?? 0} posts.`,
        });
      } else if (currentStatus === "failed") {
        toast.error("Sync failed", {
          description: job.error || "An error occurred during sync.",
        });
      }
    }

    prevStatusRef.current = currentStatus;
  }, [job, accountUsername]);

  if (!job) {
    return null;
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case "running":
        return <RefreshCw className="size-5 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="size-5 text-green-500" />;
      case "failed":
        return <AlertCircle className="size-5 text-destructive" />;
      case "pending":
        return <Clock className="size-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case "running":
        return "Syncing in progress...";
      case "completed":
        return "Sync completed";
      case "failed":
        return "Sync failed";
      case "pending":
        return "Sync pending";
      default:
        return "Unknown status";
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case "running":
        return "border-blue-500/50 bg-blue-500/10";
      case "completed":
        return "border-green-500/50 bg-green-500/10";
      case "failed":
        return "border-destructive/50 bg-destructive/10";
      case "pending":
        return "border-muted bg-muted/50";
      default:
        return "";
    }
  };

  const getProgressDescription = () => {
    if (job.status === "running") {
      if (job.type === "full") {
        return "Fetching profile, posts, and comments...";
      }
      return "Fetching profile and posts...";
    }
    return null;
  };

  const formatDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt) return null;

    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const durationMs = end.getTime() - start.getTime();

    if (durationMs < 1000) {
      return `${durationMs}ms`;
    }
    if (durationMs < 60000) {
      return `${Math.round(durationMs / 1000)}s`;
    }
    return `${Math.round(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`;
  };

  return (
    <Card className={getStatusColor()}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-base">{getStatusText()}</CardTitle>
          </div>
          <Badge variant="secondary">
            {job.type === "full" ? "Full Sync" : "Posts Sync"}
          </Badge>
        </div>
        {accountUsername && (
          <CardDescription>@{accountUsername}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar for Running Jobs */}
        {job.status === "running" && (
          <div className="space-y-2">
            <Progress value={undefined} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {getProgressDescription()}
            </p>
          </div>
        )}

        {/* Error Message */}
        {job.status === "failed" && job.error && (
          <div className="text-sm text-destructive">{job.error}</div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Posts Count */}
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <FileText className="size-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {job.postsCount ?? (job.status === "running" ? "..." : "0")}
              </div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
          </div>

          {/* Comments Count */}
          {job.type === "full" && (
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {job.commentsCount ?? (job.status === "running" ? "..." : "0")}
                </div>
                <div className="text-xs text-muted-foreground">Comments</div>
              </div>
            </div>
          )}

          {/* Credits */}
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <Coins className="size-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {job.creditsUsed ?? job.creditsEstimated ?? "0"}
              </div>
              <div className="text-xs text-muted-foreground">
                {job.creditsUsed ? "Credits used" : "Est. credits"}
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <Clock className="size-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {formatDuration(job.startedAt, job.completedAt) || "..."}
              </div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        {(job.startedAt || job.completedAt) && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {job.startedAt && (
              <span>
                Started: {new Date(job.startedAt).toLocaleString()}
              </span>
            )}
            {job.completedAt && (
              <span className="ml-4">
                Finished: {new Date(job.completedAt).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
