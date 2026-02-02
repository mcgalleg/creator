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
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle,
  TrendingUp,
  Calendar,
  Wallet,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type SyncMode = "selection" | "top_performers" | "date_range" | "budget";

interface Post {
  id: number;
  tiktokId: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  postedAt: string;
}

interface CommentSyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: number;
  accountUsername: string;
}

interface CostEstimate {
  credits: number;
  postCount: number;
  estimatedComments: number;
}

export function CommentSyncDialog({
  isOpen,
  onClose,
  accountId,
  accountUsername,
}: CommentSyncDialogProps) {
  const [mode, setMode] = useState<SyncMode>("top_performers");
  const [topCount, setTopCount] = useState(10);
  const [maxPerPost, setMaxPerPost] = useState(100);
  const [creditBudget, setCreditBudget] = useState(100);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Fetch posts when in selection mode
  useEffect(() => {
    if (isOpen && mode === "selection" && posts.length === 0) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only fetch on mode change to selection
  }, [isOpen, mode, posts.length]);

  // Calculate cost estimate whenever config changes
  useEffect(() => {
    if (!isOpen) return;
    calculateEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Config values are the dependencies we care about
  }, [isOpen, mode, topCount, maxPerPost, creditBudget, selectedPostIds, dateStart, dateEnd]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await fetch(`/api/dashboard/recent-posts?accountId=${accountId}&limit=50`);
      const data = await response.json();
      if (response.ok && data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const calculateEstimate = () => {
    let postCount = 0;

    switch (mode) {
      case "selection":
        postCount = selectedPostIds.length;
        break;
      case "top_performers":
        postCount = topCount;
        break;
      case "date_range":
        // Estimate based on average posts per day
        postCount = Math.min(50, 10); // Default estimate
        break;
      case "budget":
        // Calculate max posts from budget
        const costPerPost = Math.ceil(maxPerPost / 100) * 15 + 6;
        postCount = Math.floor(creditBudget / costPerPost);
        break;
    }

    const estimatedComments = postCount * maxPerPost;
    const commentsCost = Math.ceil(estimatedComments / 100) * 15;
    const actorFees = postCount * 6;
    const credits = commentsCost + actorFees;

    setCostEstimate({
      credits: mode === "budget" ? Math.min(credits, creditBudget) : credits,
      postCount,
      estimatedComments,
    });
  };

  const handleSync = async () => {
    if (!costEstimate || costEstimate.postCount === 0) {
      toast.error("Please configure the sync options");
      return;
    }

    setSyncing(true);
    try {
      const config: Record<string, unknown> = {
        mode,
        maxPerPost,
      };

      switch (mode) {
        case "selection":
          config.selectedPostIds = selectedPostIds;
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
        case "budget":
          config.creditBudget = creditBudget;
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

      toast.success("Comment sync started", {
        description: `Syncing comments for ${costEstimate.postCount} posts (~${costEstimate.estimatedComments} comments)`,
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start sync";
      toast.error("Sync failed", { description: message });
    } finally {
      setSyncing(false);
    }
  };

  const togglePostSelection = (tiktokId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(tiktokId)
        ? prev.filter((id) => id !== tiktokId)
        : [...prev, tiktokId]
    );
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-5" />
            Sync Comments
          </DialogTitle>
          <DialogDescription>
            Configure how to sync comments for @{accountUsername}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sync Mode Selection */}
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as SyncMode)}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="top_performers" id="top_performers" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="top_performers" className="flex items-center gap-2 cursor-pointer">
                  <TrendingUp className="size-4 text-green-500" />
                  Top Performers
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Sync comments from your highest engagement posts
                </p>
                {mode === "top_performers" && (
                  <div className="mt-3 flex items-center gap-2">
                    <Label className="text-sm">Top</Label>
                    <Select
                      value={topCount.toString()}
                      onValueChange={(v) => setTopCount(parseInt(v))}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 25, 50].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">posts</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="selection" id="selection" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="selection" className="flex items-center gap-2 cursor-pointer">
                  <MessageCircle className="size-4 text-blue-500" />
                  Select Posts
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose specific posts to sync comments for
                </p>
                {mode === "selection" && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {loadingPosts ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : posts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No posts available</p>
                    ) : (
                      posts.map((post) => (
                        <div
                          key={post.tiktokId}
                          className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50"
                        >
                          <Checkbox
                            id={post.tiktokId}
                            checked={selectedPostIds.includes(post.tiktokId)}
                            onCheckedChange={() => togglePostSelection(post.tiktokId)}
                          />
                          <Label
                            htmlFor={post.tiktokId}
                            className="flex-1 text-sm cursor-pointer truncate"
                          >
                            {post.description || "No description"}
                          </Label>
                          <Badge variant="secondary" className="text-xs">
                            {formatNumber(post.comments)} comments
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="date_range" id="date_range" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="date_range" className="flex items-center gap-2 cursor-pointer">
                  <Calendar className="size-4 text-purple-500" />
                  Date Range
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Sync comments for posts within a date range
                </p>
                {mode === "date_range" && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm w-12">From</Label>
                      <Input
                        type="date"
                        value={dateStart}
                        onChange={(e) => setDateStart(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm w-12">To</Label>
                      <Input
                        type="date"
                        value={dateEnd}
                        onChange={(e) => setDateEnd(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="budget" id="budget" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="budget" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="size-4 text-amber-500" />
                  Budget Mode
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Set a credit limit and prioritize high-engagement posts
                </p>
                {mode === "budget" && (
                  <div className="mt-3 flex items-center gap-2">
                    <Label className="text-sm">Max</Label>
                    <Input
                      type="number"
                      value={creditBudget}
                      onChange={(e) => setCreditBudget(parseInt(e.target.value) || 0)}
                      className="w-24 h-8"
                      min={15}
                    />
                    <span className="text-sm text-muted-foreground">credits</span>
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>

          {/* Max Comments Per Post */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Max comments per post</Label>
            <Select
              value={maxPerPost.toString()}
              onValueChange={(v) => setMaxPerPost(parseInt(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[50, 100, 200, 500].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} comments
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost Estimate */}
          {costEstimate && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Posts to sync</span>
                <span className="font-medium">{costEstimate.postCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Est. comments</span>
                <span className="font-medium">~{formatNumber(costEstimate.estimatedComments)}</span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="font-medium">Estimated Cost</span>
                <Badge variant="secondary" className="text-base">
                  {costEstimate.credits} credits
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <AlertCircle className="size-3 mt-0.5 shrink-0" />
                15 credits per 100 comments. Actual cost may vary based on comment availability.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={syncing}>
            Cancel
          </Button>
          <Button
            onClick={handleSync}
            disabled={syncing || !costEstimate || costEstimate.postCount === 0}
          >
            {syncing ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <MessageCircle className="size-4 mr-2" />
                Sync Comments
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
