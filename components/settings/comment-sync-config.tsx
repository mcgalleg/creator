"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PostSelectionSheet } from "@/components/dashboard/post-selection-sheet";
import {
  MessageCircle,
  ListChecks,
  TrendingUp,
  Calendar,
  Coins,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { CREDIT_RATES, calculateCommentCredits } from "@/lib/credits";

type SyncMode = "selection" | "top-performers" | "date-range";

interface CostEstimate {
  postsCount: number;
  estimatedComments: number;
  creditCost: number;
}

interface CommentSyncConfigProps {
  accountId: number;
}

export function CommentSyncConfig({ accountId }: CommentSyncConfigProps) {
  // Sync mode state
  const [syncMode, setSyncMode] = React.useState<SyncMode>("selection");

  // Selection mode state
  const [selectedPostIds, setSelectedPostIds] = React.useState<Set<string>>(new Set());
  const [selectedPostComments, setSelectedPostComments] = React.useState<Map<string, number>>(new Map());
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  // Top performers mode state
  const [topN, setTopN] = React.useState<string>("10");

  // Date range mode state
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [maxCommentsPerPost, setMaxCommentsPerPost] = React.useState<string>("100");

  const [isSyncing, setIsSyncing] = React.useState(false);

  // Calculate cost estimate based on sync mode
  const maxComments = parseInt(maxCommentsPerPost) || 100;
  const costEstimate = React.useMemo((): CostEstimate => {
    let postsCount = 0;
    let estimatedComments = 0;

    switch (syncMode) {
      case "selection": {
        postsCount = selectedPostIds.size;
        // Use actual comment counts, capped at maxComments per post
        for (const tiktokId of selectedPostIds) {
          const actual = selectedPostComments.get(tiktokId) ?? 0;
          estimatedComments += Math.min(actual, maxComments);
        }
        break;
      }
      case "top-performers": {
        postsCount = parseInt(topN) || 10;
        estimatedComments = postsCount * maxComments;
        break;
      }
      case "date-range": {
        // Estimate — exact count requires server data
        postsCount = 10;
        estimatedComments = postsCount * maxComments;
        break;
      }
    }

    return {
      postsCount,
      estimatedComments,
      creditCost: calculateCommentCredits(estimatedComments),
    };
  }, [syncMode, selectedPostIds, selectedPostComments, topN, maxComments]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // TODO: Implement actual sync API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Sync started with mode:", syncMode);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const canSync =
    costEstimate.postsCount > 0 &&
    costEstimate.estimatedComments > 0 &&
    !isSyncing;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comment Sync Configuration
          </CardTitle>
          <CardDescription>
            Configure how you want to sync comments from your TikTok posts. Choose a
            sync mode that fits your needs and budget.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Sync Mode Selection */}
          <RadioGroup
            value={syncMode}
            onValueChange={(value) => setSyncMode(value as SyncMode)}
            className="space-y-4"
          >
            {/* Sync by Selection */}
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="selection" id="selection" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="selection" className="font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    Sync by Selection
                  </div>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Manually select which posts to sync comments for.
                </p>

                {syncMode === "selection" && (
                  <div className="pt-2 space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPickerOpen(true)}
                    >
                      Select Posts
                      {selectedPostIds.size > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedPostIds.size} selected
                        </Badge>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Sync Top Performers */}
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="top-performers" id="top-performers" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="top-performers" className="font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Sync Top Performers
                  </div>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync comments from your best-performing posts by engagement.
                </p>

                {syncMode === "top-performers" && (
                  <div className="pt-2">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="top-n" className="text-sm whitespace-nowrap">
                        Top posts:
                      </Label>
                      <Select value={topN} onValueChange={setTopN}>
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Sync by Date Range */}
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="date-range" id="date-range" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="date-range" className="font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Sync by Date Range
                  </div>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Sync comments from posts within a specific date range.
                </p>

                {syncMode === "date-range" && (
                  <div className="pt-2 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="start-date" className="text-sm">
                          Start Date
                        </Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="end-date" className="text-sm">
                          End Date
                        </Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="max-comments" className="text-sm whitespace-nowrap">
                        Max comments per post:
                      </Label>
                      <Select
                        value={maxCommentsPerPost}
                        onValueChange={setMaxCommentsPerPost}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                          <SelectItem value="1000">1,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </RadioGroup>

          {/* Cost Estimation */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Cost Estimation
            </h4>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Posts</p>
                <p className="text-lg font-semibold">{costEstimate.postsCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Est. Comments</p>
                <p className="text-lg font-semibold">
                  {costEstimate.estimatedComments.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Credit Cost</p>
                <p className="text-lg font-semibold text-primary">
                  {costEstimate.creditCost.toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {CREDIT_RATES.PER_COMMENT} credits per comment synced
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSync}
            disabled={!canSync}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing Comments...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Sync Comments
                {costEstimate.creditCost > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {costEstimate.creditCost} credits
                  </Badge>
                )}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <PostSelectionSheet
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        accountId={accountId}
        selectedTiktokIds={selectedPostIds}
        onConfirm={(ids, commentCounts) => {
          setSelectedPostIds(ids);
          setSelectedPostComments(commentCounts);
        }}
      />
    </>
  );
}
