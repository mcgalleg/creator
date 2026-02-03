"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Wallet,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react";

// Types
export type PostImportMode = "latest" | "date_range" | "top_performers" | "budget";
export type PostSorting = "latest" | "popular" | "oldest";
export type DateRangePreset = "last_week" | "last_month" | "last_3_months" | "last_6_months" | "all_time" | "custom";

export interface PostImportConfig {
  mode: PostImportMode;
  postsLimit?: number;
  sorting?: PostSorting;
  dateRangePreset?: DateRangePreset;
  customDateStart?: string;
  customDateEnd?: string;
  topCount?: number;
  creditBudget?: number;
  includeComments?: boolean;
  commentsPerPost?: number;
}

export interface PostImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accountUsername: string;
  totalPosts?: number;
  userCreditBalance: number;
  onImport: (config: PostImportConfig, estimatedCost: number) => void;
  isImporting?: boolean;
}

// Cost constants - per-item pricing
const CREDITS = {
  PROFILE_SYNC_BASE: 0, // Profile sync is FREE
  PER_POST: 1, // 1 credit per post
  PER_COMMENT: 0.15, // 0.15 credits per comment
};

interface CostEstimate {
  totalCredits: number;
  baseCost: number;
  postsCost: number;
  commentsCost: number;
  postsToImport: number;
  estimatedComments: number;
}

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

export function PostImportDialog({
  isOpen,
  onClose,
  accountUsername,
  totalPosts,
  userCreditBalance,
  onImport,
  isImporting = false,
}: PostImportDialogProps) {
  // Mode state
  const [mode, setMode] = useState<PostImportMode>("latest");

  // Latest posts options
  const [postsLimit, setPostsLimit] = useState(25);
  const [sorting, setSorting] = useState<PostSorting>("latest");

  // Date range options
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last_month");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");

  // Top performers options
  const [topCount, setTopCount] = useState(10);

  // Budget mode options
  const [creditBudget, setCreditBudget] = useState(100);

  // Additional options
  const [includeComments, setIncludeComments] = useState(false);
  const [commentsPerPost, setCommentsPerPost] = useState(100);

  // Cost estimate
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);

  // Calculate cost estimate whenever config changes
  useEffect(() => {
    if (!isOpen) return;
    calculateEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    mode,
    postsLimit,
    sorting,
    dateRangePreset,
    topCount,
    creditBudget,
    includeComments,
    commentsPerPost,
  ]);

  const calculateEstimate = () => {
    let postsToImport = 0;

    switch (mode) {
      case "latest":
        postsToImport = Math.min(postsLimit, totalPosts || postsLimit);
        break;
      case "date_range":
        // Estimate based on preset
        switch (dateRangePreset) {
          case "last_week":
            postsToImport = Math.min(7, totalPosts || 7);
            break;
          case "last_month":
            postsToImport = Math.min(30, totalPosts || 30);
            break;
          case "last_3_months":
            postsToImport = Math.min(90, totalPosts || 90);
            break;
          case "last_6_months":
            postsToImport = Math.min(180, totalPosts || 180);
            break;
          case "all_time":
            postsToImport = totalPosts || 100;
            break;
          case "custom":
            // Rough estimate for custom range
            postsToImport = Math.min(50, totalPosts || 50);
            break;
        }
        break;
      case "top_performers":
        postsToImport = Math.min(topCount, totalPosts || topCount);
        break;
      case "budget":
        // Calculate max posts from budget using per-item pricing
        const budgetBaseCost = CREDITS.PROFILE_SYNC_BASE; // FREE
        const remainingBudget = creditBudget - budgetBaseCost;
        if (remainingBudget <= 0) {
          postsToImport = 0;
        } else {
          const costPerPost = CREDITS.PER_POST;
          const commentsCostPerPost = includeComments
            ? commentsPerPost * CREDITS.PER_COMMENT
            : 0;
          const totalCostPerPost = costPerPost + commentsCostPerPost;
          postsToImport = Math.floor(remainingBudget / totalCostPerPost);
          if (totalPosts) {
            postsToImport = Math.min(postsToImport, totalPosts);
          }
        }
        break;
    }

    const baseCost = CREDITS.PROFILE_SYNC_BASE; // FREE
    const postsCost = Math.round(postsToImport * CREDITS.PER_POST);
    const estimatedComments = includeComments ? postsToImport * commentsPerPost : 0;
    const commentsCost = includeComments
      ? Math.round(estimatedComments * CREDITS.PER_COMMENT)
      : 0;
    const totalCredits = baseCost + postsCost + commentsCost;

    setCostEstimate({
      totalCredits: mode === "budget" ? Math.min(totalCredits, creditBudget) : totalCredits,
      baseCost,
      postsCost,
      commentsCost,
      postsToImport,
      estimatedComments,
    });
  };

  const handleImport = () => {
    if (!costEstimate || costEstimate.postsToImport === 0) return;

    const config: PostImportConfig = {
      mode,
      includeComments,
      commentsPerPost: includeComments ? commentsPerPost : undefined,
    };

    switch (mode) {
      case "latest":
        config.postsLimit = postsLimit;
        config.sorting = sorting;
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
      case "budget":
        config.creditBudget = creditBudget;
        break;
    }

    onImport(config, costEstimate.totalCredits);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const insufficientCredits = costEstimate
    ? costEstimate.totalCredits > userCreditBalance
    : false;

  const newBalance = costEstimate
    ? userCreditBalance - costEstimate.totalCredits
    : userCreditBalance;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Download className="size-5" />
            Import Posts
          </DialogTitle>
          <DialogDescription className="text-sm">
            Configure how to import posts for @{accountUsername}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Import Mode Selection */}
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as PostImportMode)}
            className="space-y-2 sm:space-y-3"
          >
            {/* Latest Posts */}
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="latest" id="latest" className="mt-1" />
              <div className="flex-1 min-w-0">
                <Label htmlFor="latest" className="flex items-center gap-2 cursor-pointer text-sm sm:text-base">
                  <TrendingUp className="size-4 text-blue-500 shrink-0" />
                  Latest Posts
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Import the most recent posts
                </p>
                {mode === "latest" && (
                  <div className="mt-3 space-y-2 sm:space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label className="text-xs sm:text-sm">Count</Label>
                      <Select
                        value={postsLimit.toString()}
                        onValueChange={(v) => setPostsLimit(parseInt(v))}
                      >
                        <SelectTrigger className="w-20 sm:w-24 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POSTS_LIMIT_OPTIONS.map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs sm:text-sm text-muted-foreground">posts</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Label className="text-xs sm:text-sm">Sort by</Label>
                      <Select
                        value={sorting}
                        onValueChange={(v) => setSorting(v as PostSorting)}
                      >
                        <SelectTrigger className="w-24 sm:w-28 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="latest">Latest</SelectItem>
                          <SelectItem value="popular">Popular</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="date_range" id="date_range" className="mt-1" />
              <div className="flex-1 min-w-0">
                <Label htmlFor="date_range" className="flex items-center gap-2 cursor-pointer text-sm sm:text-base">
                  <Calendar className="size-4 text-purple-500 shrink-0" />
                  Date Range
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Import posts within a time period
                </p>
                {mode === "date_range" && (
                  <div className="mt-3 space-y-2 sm:space-y-3">
                    <Select
                      value={dateRangePreset}
                      onValueChange={(v) => setDateRangePreset(v as DateRangePreset)}
                    >
                      <SelectTrigger className="w-full h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_RANGE_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {dateRangePreset === "custom" && (
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <Label className="text-xs sm:text-sm sm:w-12 shrink-0">From</Label>
                          <Input
                            type="date"
                            value={customDateStart}
                            onChange={(e) => setCustomDateStart(e.target.value)}
                            className="h-8 text-sm flex-1"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <Label className="text-xs sm:text-sm sm:w-12 shrink-0">To</Label>
                          <Input
                            type="date"
                            value={customDateEnd}
                            onChange={(e) => setCustomDateEnd(e.target.value)}
                            className="h-8 text-sm flex-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Top Performers */}
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="top_performers" id="top_performers" className="mt-1" />
              <div className="flex-1 min-w-0">
                <Label htmlFor="top_performers" className="flex items-center gap-2 cursor-pointer text-sm sm:text-base">
                  <Star className="size-4 text-amber-500 shrink-0" />
                  Top Performers
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Import posts with highest engagement
                </p>
                {mode === "top_performers" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Label className="text-xs sm:text-sm">Top</Label>
                    <Select
                      value={topCount.toString()}
                      onValueChange={(v) => setTopCount(parseInt(v))}
                    >
                      <SelectTrigger className="w-20 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TOP_COUNT_OPTIONS.map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs sm:text-sm text-muted-foreground">posts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Budget Mode */}
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="budget" id="budget" className="mt-1" />
              <div className="flex-1 min-w-0">
                <Label htmlFor="budget" className="flex items-center gap-2 cursor-pointer text-sm sm:text-base">
                  <Wallet className="size-4 text-green-500 shrink-0" />
                  Budget Mode
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Maximize posts within credit limit
                </p>
                {mode === "budget" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Label className="text-xs sm:text-sm">Max</Label>
                    <Input
                      type="number"
                      value={creditBudget}
                      onChange={(e) => setCreditBudget(parseInt(e.target.value) || 0)}
                      className="w-20 sm:w-24 h-8 text-sm"
                      min={1}
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">credits</span>
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>

          {/* Additional Options */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="includeComments"
                checked={includeComments}
                onCheckedChange={(checked) => setIncludeComments(checked === true)}
              />
              <Label htmlFor="includeComments" className="cursor-pointer text-sm">
                Include comments
              </Label>
            </div>

            {includeComments && (
              <div className="flex flex-wrap items-center gap-2 ml-6">
                <Label className="text-xs sm:text-sm">Comments per post</Label>
                <Select
                  value={commentsPerPost.toString()}
                  onValueChange={(v) => setCommentsPerPost(parseInt(v))}
                >
                  <SelectTrigger className="w-20 sm:w-24 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMENTS_PER_POST_OPTIONS.map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Cost Estimate */}
          {costEstimate && (
            <div className="rounded-lg bg-muted p-3 sm:p-4 space-y-2 sm:space-y-3">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Posts to import</span>
                  <span className="font-medium">{costEstimate.postsToImport}</span>
                </div>
                {includeComments && (
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Est. comments</span>
                    <span className="font-medium">~{formatNumber(costEstimate.estimatedComments)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-2 space-y-1 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Profile sync</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Posts ({costEstimate.postsToImport} × 1 credit)</span>
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
                  className="text-sm sm:text-base"
                >
                  {costEstimate.totalCredits} credits
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
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
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isImporting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              isImporting ||
              !costEstimate ||
              costEstimate.postsToImport === 0 ||
              insufficientCredits
            }
            className="w-full sm:w-auto"
          >
            {isImporting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="size-4 mr-2" />
                Import for {costEstimate?.totalCredits || 0} credits
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
