"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  TrendingUp,
  Calendar,
  AlertCircle,
  Loader2,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { formatNumber } from "./shared-utils";
import { InlinePostSelector } from "./inline-post-selector";
import { CREDIT_RATES, calculateCommentCredits } from "@/lib/credits";
import type { SyncJob } from "@/hooks/use-accounts";

type SyncMode = "selection" | "top_performers" | "date_range";

interface CostEstimate {
  credits: number;
  postCount: number;
  estimatedComments: number;
}

interface AccountCommentsTabProps {
  accountId: number;
  accountUsername: string;
  activeCommentJobs?: SyncJob[];
  onSyncStarted?: () => void;
  userCreditBalance?: number;
  syncedPostCount?: number;
}

export function AccountCommentsTab({
  accountId,
  activeCommentJobs,
  onSyncStarted,
  userCreditBalance = 0,
  syncedPostCount,
}: AccountCommentsTabProps) {
  const [mode, setMode] = useState<SyncMode>("top_performers");
  const [topCount, setTopCount] = useState(10);
  const [maxPerPost, setMaxPerPost] = useState(100);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [selectedPostComments, setSelectedPostComments] = useState<Map<string, number>>(new Map());
  const [selectedPostSyncedCounts, setSelectedPostSyncedCounts] = useState<Map<string, number>>(new Map());
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [syncing, setSyncing] = useState(false);

  const hasActiveCommentSync = (activeCommentJobs?.length ?? 0) > 0;
  const insufficientCredits = costEstimate ? costEstimate.credits > userCreditBalance : false;
  const newBalance = costEstimate ? userCreditBalance - costEstimate.credits : userCreditBalance;

  // Calculate cost estimate when config changes
  useEffect(() => {
    let postCount = 0;
    let estimatedComments = 0;

    switch (mode) {
      case "selection":
        postCount = selectedPostIds.size;
        for (const tiktokId of selectedPostIds) {
          const actual = selectedPostComments.get(tiktokId) ?? 0;
          estimatedComments += Math.min(actual, maxPerPost);
        }
        break;
      case "top_performers":
        postCount = syncedPostCount != null ? Math.min(topCount, syncedPostCount) : topCount;
        estimatedComments = postCount * maxPerPost;
        break;
      case "date_range":
        postCount = 0;
        estimatedComments = 0;
        break;
    }

    setCostEstimate({
      credits: calculateCommentCredits(estimatedComments),
      postCount,
      estimatedComments,
    });
  }, [mode, topCount, maxPerPost, selectedPostIds, selectedPostComments, dateStart, dateEnd, syncedPostCount]);

  const handleSync = async () => {
    if (!costEstimate || (mode !== "date_range" && costEstimate.postCount === 0)) {
      toast.error("Please configure the sync options");
      return;
    }

    setSyncing(true);
    try {
      const config: Record<string, unknown> = { mode, maxPerPost };

      switch (mode) {
        case "selection":
          config.selectedPostIds = Array.from(selectedPostIds);
          break;
        case "top_performers":
          config.topCount = topCount;
          break;
        case "date_range":
          config.dateRange = {
            start: new Date(dateStart).toISOString(),
            end: new Date(dateEnd).toISOString(),
          };
          break;
      }

      const response = await fetch(`/api/accounts/${accountId}/sync/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start comment sync");
      }

      onSyncStarted?.();

      toast.success("Comment sync started", {
        description: `Syncing comments for ${costEstimate.postCount} posts (~${costEstimate.estimatedComments} comments)`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start sync";
      toast.error("Sync failed", { description: message });
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectionChange = (
    ids: Set<string>,
    commentCounts: Map<string, number>,
    syncedCounts: Map<string, number>
  ) => {
    setSelectedPostIds(ids);
    setSelectedPostComments(commentCounts);
    setSelectedPostSyncedCounts(syncedCounts);
  };

  return (
    <div className="space-y-4 py-2">
      {/* Active Sync Banner */}
      {hasActiveCommentSync && (
        <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Loader2 className="size-4 animate-spin" />
            Comment sync in progress
          </div>
          <p className="text-xs text-muted-foreground">
            It may take several minutes to complete.
          </p>
        </div>
      )}

      {/* Sync Mode Selection */}
      <RadioGroup
        value={mode}
        onValueChange={(value) => setMode(value as SyncMode)}
        className="space-y-2"
      >
        {/* Top Performers */}
        <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
          <RadioGroupItem value="top_performers" id="comments-top" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="comments-top" className="flex items-center gap-2 cursor-pointer text-sm">
              <TrendingUp className="size-4 text-green-500" />
              Top Performers
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Sync comments from your highest engagement posts
            </p>
            {mode === "top_performers" && (
              <div className="mt-3 flex items-center gap-2">
                <Label className="text-xs">Top</Label>
                <NumberInput
                  value={topCount}
                  onChange={setTopCount}
                  min={1}
                  max={syncedPostCount ?? 50}
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">posts</span>
              </div>
            )}
          </div>
        </div>

        {/* Select Posts */}
        <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
          <RadioGroupItem value="selection" id="comments-selection" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="comments-selection" className="flex items-center gap-2 cursor-pointer text-sm">
              <ListChecks className="size-4 text-blue-500" />
              Select Posts
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Choose specific posts to sync comments for
            </p>
            {mode === "selection" && selectedPostIds.size > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedPostIds.size} post{selectedPostIds.size !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
          <RadioGroupItem value="date_range" id="comments-date-range" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="comments-date-range" className="flex items-center gap-2 cursor-pointer text-sm">
              <Calendar className="size-4 text-purple-500" />
              Date Range
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Sync comments for posts within a date range
            </p>
            {mode === "date_range" && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-10">From</Label>
                  <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-10">To</Label>
                  <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            )}
          </div>
        </div>
      </RadioGroup>

      {/* Inline Post Selector — shown when "Select Posts" mode active */}
      {mode === "selection" && (
        <InlinePostSelector
          accountId={accountId}
          selectedTiktokIds={selectedPostIds}
          onSelectionChange={handleSelectionChange}
        />
      )}

      {/* Max Comments Per Post */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Max comments per post</Label>
        <NumberInput
          value={maxPerPost}
          onChange={setMaxPerPost}
          min={1}
          max={1000}
          className="w-full"
        />
      </div>

      {/* Already synced warning */}
      {mode === "selection" && (() => {
        const alreadySyncedCount = [...selectedPostIds].filter(
          (id) => (selectedPostSyncedCounts.get(id) ?? 0) > 0
        ).length;
        return alreadySyncedCount > 0 ? (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm space-y-1">
            <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
              <AlertCircle className="size-4 shrink-0" />
              {alreadySyncedCount} of {selectedPostIds.size} selected post{selectedPostIds.size !== 1 ? "s" : ""} already synced
            </div>
            <p className="text-muted-foreground text-xs">
              Re-syncing updates comment metrics and fetches new comments. Credits are charged for all comments processed.
            </p>
          </div>
        ) : null;
      })()}

      {/* Cost Estimate */}
      {costEstimate && (
        <div className="rounded-lg bg-muted p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Posts to sync</span>
            <span className="font-medium">
              {mode === "date_range" ? "\u2014" : costEstimate.postCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Est. comments</span>
            <span className="font-medium">
              {mode === "date_range" ? "\u2014" : `~${formatNumber(costEstimate.estimatedComments)}`}
            </span>
          </div>
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="font-medium text-sm">Estimated Cost</span>
            {mode === "date_range" ? (
              <span className="text-xs text-muted-foreground">Calculated after sync</span>
            ) : (
              <Badge
                variant={insufficientCredits ? "destructive" : "secondary"}
                className="text-sm"
              >
                {costEstimate.credits} credits
              </Badge>
            )}
          </div>
          {mode !== "date_range" && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Your balance</span>
              <span className={insufficientCredits ? "text-destructive" : ""}>
                {userCreditBalance} → {newBalance} credits
              </span>
            </div>
          )}
          {insufficientCredits && mode !== "date_range" && (
            <p className="text-xs text-destructive flex items-start gap-1">
              <AlertCircle className="size-3 mt-0.5 shrink-0" />
              Insufficient credits. Reduce scope or{" "}
              <a
                href="/pricing#credits"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-destructive/80 font-medium"
              >
                add credits
              </a>
              .
            </p>
          )}
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <AlertCircle className="size-3 mt-0.5 shrink-0" />
            {CREDIT_RATES.PER_COMMENT} credits per comment. Actual cost may vary.
          </p>
        </div>
      )}

      {/* Sync Button */}
      <Button
        onClick={handleSync}
        disabled={
          syncing ||
          !costEstimate ||
          (mode !== "date_range" && costEstimate.postCount === 0) ||
          (mode === "date_range" && (!dateStart || !dateEnd)) ||
          hasActiveCommentSync ||
          (mode !== "date_range" && insufficientCredits)
        }
        className="w-full"
      >
        {syncing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <MessageCircle className="size-4" />
            Sync Comments
          </>
        )}
      </Button>
    </div>
  );
}
