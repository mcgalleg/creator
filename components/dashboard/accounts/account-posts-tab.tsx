"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Calendar,
  Star,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react";
import { formatNumber } from "./shared-utils";
import {
  CREDIT_RATES,
  calculateCommentCredits,
  calculatePostCredits,
} from "@/lib/credits";
import type {
  PostImportConfig,
  PostImportMode,
  DateRangePreset,
} from "@/components/dashboard/post-import-dialog";
import type { SyncJob } from "@/hooks/use-accounts";

const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "last_week", label: "Last week" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "last_6_months", label: "Last 6 months" },
  { value: "all_time", label: "All time" },
  { value: "custom", label: "Custom range" },
];

const POSTS_LIMIT_OPTIONS = [10, 25, 50, 75, 100, 150, 200];
const TOP_COUNT_OPTIONS = [5, 10, 15, 20, 25, 50];
const COMMENTS_PER_POST_OPTIONS = [50, 100, 200, 500];

interface CostEstimate {
  totalCredits: number;
  baseCost: number;
  postsCost: number;
  commentsCost: number;
  postsToImport: number;
  estimatedComments: number;
}

interface AccountPostsTabProps {
  totalPosts: number;
  userCreditBalance: number;
  onImport: (config: PostImportConfig) => void;
  isImporting: boolean;
  syncedPostCount: number;
  activeJobs: SyncJob[];
}

export function AccountPostsTab({
  totalPosts,
  userCreditBalance,
  onImport,
  isImporting,
  syncedPostCount,
  activeJobs,
}: AccountPostsTabProps) {
  const [mode, setMode] = useState<PostImportMode>("latest");
  const [postsLimit, setPostsLimit] = useState(25);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last_month");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [topCount, setTopCount] = useState(10);
  const [includeComments, setIncludeComments] = useState(false);
  const [commentsPerPost, setCommentsPerPost] = useState(100);
  const postsSyncing = activeJobs.some(
    (j) => j.type === "posts" || j.type === "full"
  );

  const costEstimate = useMemo<CostEstimate>(() => {
    let postsToImport = 0;
    switch (mode) {
      case "latest":
        postsToImport = Math.min(postsLimit, totalPosts || postsLimit);
        break;
      case "date_range":
        switch (dateRangePreset) {
          case "last_week": postsToImport = Math.min(7, totalPosts || 7); break;
          case "last_month": postsToImport = Math.min(30, totalPosts || 30); break;
          case "last_3_months": postsToImport = Math.min(90, totalPosts || 90); break;
          case "last_6_months": postsToImport = Math.min(180, totalPosts || 180); break;
          case "all_time": postsToImport = totalPosts || 100; break;
          case "custom": postsToImport = Math.min(50, totalPosts || 50); break;
        }
        break;
      case "top_performers":
        postsToImport = Math.min(topCount, totalPosts || topCount);
        break;
    }

    const baseCost = CREDIT_RATES.PROFILE_SYNC;
    const postsCost = calculatePostCredits(postsToImport);
    const estimatedComments = includeComments ? postsToImport * commentsPerPost : 0;
    const commentsCost = includeComments ? calculateCommentCredits(estimatedComments) : 0;

    return {
      totalCredits: baseCost + postsCost + commentsCost,
      baseCost,
      postsCost,
      commentsCost,
      postsToImport,
      estimatedComments,
    };
  }, [mode, postsLimit, dateRangePreset, topCount, includeComments, commentsPerPost, totalPosts]);

  const handleImport = () => {
    if (costEstimate.postsToImport === 0) return;

    const config: PostImportConfig = {
      mode,
      includeComments,
      commentsPerPost: includeComments ? commentsPerPost : undefined,
    };

    switch (mode) {
      case "latest":
        config.postsLimit = postsLimit;
        break;
      case "date_range":
        config.dateRangePreset = dateRangePreset;
        if (dateRangePreset === "custom") {
          config.customDateStart = customDateStart;
          config.customDateEnd = customDateEnd;
        }
        break;
      case "top_performers":
        config.topCount = topCount;
        break;
    }

    onImport(config);
  };

  const insufficientCredits = costEstimate.totalCredits > userCreditBalance;
  const newBalance = userCreditBalance - costEstimate.totalCredits;

  return (
    <div className="space-y-4 py-2">
      {/* Active Sync Banner */}
      {postsSyncing && (
        <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Loader2 className="size-4 animate-spin" />
            Post import in progress
          </div>
        </div>
      )}

      {/* Import Mode Selection */}
      <RadioGroup
        value={mode}
        onValueChange={(value) => setMode(value as PostImportMode)}
        className="space-y-2"
      >
        {/* Latest Posts */}
        <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
          <RadioGroupItem value="latest" id="posts-latest" className="mt-1" />
          <div className="flex-1 min-w-0">
            <Label htmlFor="posts-latest" className="flex items-center gap-2 cursor-pointer text-sm">
              <TrendingUp className="size-4 text-blue-500 shrink-0" />
              Latest Posts
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Import the most recent posts
            </p>
            {mode === "latest" && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs">Count</Label>
                  <Select value={postsLimit.toString()} onValueChange={(v) => setPostsLimit(parseInt(v))}>
                    <SelectTrigger className="w-20 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSTS_LIMIT_OPTIONS.map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">posts</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
          <RadioGroupItem value="date_range" id="posts-date-range" className="mt-1" />
          <div className="flex-1 min-w-0">
            <Label htmlFor="posts-date-range" className="flex items-center gap-2 cursor-pointer text-sm">
              <Calendar className="size-4 text-purple-500 shrink-0" />
              Date Range
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Import posts within a time period
            </p>
            {mode === "date_range" && (
              <div className="mt-3 space-y-2">
                <Select value={dateRangePreset} onValueChange={(v) => setDateRangePreset(v as DateRangePreset)}>
                  <SelectTrigger className="w-full h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DATE_RANGE_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dateRangePreset === "custom" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-10 shrink-0">From</Label>
                      <Input type="date" value={customDateStart} onChange={(e) => setCustomDateStart(e.target.value)} className="h-8 text-sm flex-1" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-10 shrink-0">To</Label>
                      <Input type="date" value={customDateEnd} onChange={(e) => setCustomDateEnd(e.target.value)} className="h-8 text-sm flex-1" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
          <RadioGroupItem value="top_performers" id="posts-top" className="mt-1" />
          <div className="flex-1 min-w-0">
            <Label htmlFor="posts-top" className="flex items-center gap-2 cursor-pointer text-sm">
              <Star className="size-4 text-amber-500 shrink-0" />
              Top Performers
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Import posts with highest engagement
            </p>
            {mode === "top_performers" && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Label className="text-xs">Top</Label>
                <Select value={topCount.toString()} onValueChange={(v) => setTopCount(parseInt(v))}>
                  <SelectTrigger className="w-20 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOP_COUNT_OPTIONS.map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">posts</span>
              </div>
            )}
          </div>
        </div>
      </RadioGroup>

      {/* Include Comments */}
      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="posts-include-comments"
            checked={includeComments}
            onCheckedChange={(checked) => setIncludeComments(checked === true)}
          />
          <Label htmlFor="posts-include-comments" className="cursor-pointer text-sm">
            Include comments
          </Label>
        </div>
        {includeComments && (
          <div className="flex flex-wrap items-center gap-2 ml-6">
            <Label className="text-xs">Comments per post</Label>
            <Select value={commentsPerPost.toString()} onValueChange={(v) => setCommentsPerPost(parseInt(v))}>
              <SelectTrigger className="w-20 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMENTS_PER_POST_OPTIONS.map((n) => (
                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Already imported warning */}
      {syncedPostCount > 0 && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm space-y-1">
          <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
            <AlertCircle className="size-4 shrink-0" />
            You already have {syncedPostCount} post{syncedPostCount !== 1 ? "s" : ""} imported
          </div>
          <p className="text-muted-foreground text-xs">
            Overlapping posts will have their metrics refreshed. Credits are charged for all posts processed.
          </p>
        </div>
      )}

      {/* Cost Estimate */}
      <div className="rounded-lg bg-muted p-3 space-y-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Posts to import</span>
              <span className="font-medium">{costEstimate.postsToImport}</span>
            </div>
            {includeComments && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Est. comments</span>
                <span className="font-medium">~{formatNumber(costEstimate.estimatedComments)}</span>
              </div>
            )}
          </div>
          <div className="border-t pt-2 space-y-1 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Profile sync</span>
              <span className="text-green-600">FREE</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Posts ({costEstimate.postsToImport} x {CREDIT_RATES.PER_POST} credit)</span>
              <span>{costEstimate.postsCost} credits</span>
            </div>
            {includeComments && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Comments (~{costEstimate.estimatedComments.toLocaleString()})</span>
                <span>{costEstimate.commentsCost} credits</span>
              </div>
            )}
          </div>
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="font-medium text-sm">Total</span>
            <Badge
              variant={insufficientCredits ? "destructive" : "secondary"}
              className="text-sm"
            >
              {costEstimate.totalCredits} credits
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Your balance</span>
            <span className={insufficientCredits ? "text-destructive" : ""}>
              {userCreditBalance} → {newBalance} credits
            </span>
          </div>
          {insufficientCredits && (
            <p className="text-xs text-destructive flex items-start gap-1">
              <AlertCircle className="size-3 mt-0.5 shrink-0" />
              Insufficient credits. Reduce scope or add credits.
            </p>
          )}
      </div>

      {/* Import Button */}
      <Button
        onClick={handleImport}
        disabled={
          isImporting ||
          postsSyncing ||
          costEstimate.postsToImport === 0 ||
          insufficientCredits
        }
        className="w-full"
      >
        {isImporting || postsSyncing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Download className="size-4" />
            Import for {costEstimate.totalCredits} credits
          </>
        )}
      </Button>
    </div>
  );
}
