"use client";

import * as React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Video, MessageCircle, Heart, Play } from "lucide-react";

export interface Post {
  id: number;
  tiktokId: string;
  description: string | null;
  thumbnailUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  postedAt: string | null;
}

interface PostPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posts: Post[];
  selectedPostIds: number[];
  onSelectionChange: (postIds: number[]) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

function truncateText(text: string | null, maxLength: number = 60): string {
  if (!text) return "No description";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

function PostRow({
  post,
  isSelected,
  onToggle,
}: {
  post: Post;
  isSelected: boolean;
  onToggle: (postId: number) => void;
}) {
  const [imageError, setImageError] = React.useState(false);
  const showFallback = !post.thumbnailUrl || imageError;

  return (
    <div
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onToggle(post.id)}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(post.id)}
        onClick={(e) => e.stopPropagation()}
      />

      {showFallback ? (
        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded shrink-0">
          <Video className="h-6 w-6 text-muted-foreground" />
        </div>
      ) : (
        <Image
          src={post.thumbnailUrl!}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded object-cover shrink-0"
          unoptimized
          onError={() => setImageError(true)}
        />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={post.description || undefined}>
          {truncateText(post.description)}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            {formatNumber(post.plays)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {formatNumber(post.likes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {formatNumber(post.comments)}
          </span>
        </div>
      </div>

      <Badge variant="secondary" className="shrink-0">
        {formatNumber(post.comments)} comments
      </Badge>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-[200px]" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function PostPickerModal({
  open,
  onOpenChange,
  posts,
  selectedPostIds,
  onSelectionChange,
  onConfirm,
  isLoading = false,
}: PostPickerModalProps) {
  const handleToggle = (postId: number) => {
    if (selectedPostIds.includes(postId)) {
      onSelectionChange(selectedPostIds.filter((id) => id !== postId));
    } else {
      onSelectionChange([...selectedPostIds, postId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPostIds.length === posts.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(posts.map((p) => p.id));
    }
  };

  const totalComments = posts
    .filter((p) => selectedPostIds.includes(p.id))
    .reduce((sum, p) => sum + p.comments, 0);

  const allSelected = posts.length > 0 && selectedPostIds.length === posts.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Posts for Comment Sync</DialogTitle>
          <DialogDescription>
            Choose which posts you want to sync comments for. The estimated comment
            count is shown for each post.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                No posts available
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sync your posts first to select them for comment syncing.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div
                className="flex items-center gap-4 p-3 border-b mb-2 cursor-pointer hover:bg-muted/30 rounded-lg"
                onClick={handleSelectAll}
              >
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm font-medium">
                  {allSelected ? "Deselect All" : "Select All"} ({posts.length} posts)
                </span>
              </div>

              {posts.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  isSelected={selectedPostIds.includes(post.id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedPostIds.length > 0 && (
              <span>
                <strong>{selectedPostIds.length}</strong> posts selected with{" "}
                <strong>{formatNumber(totalComments)}</strong> estimated comments
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={selectedPostIds.length === 0}
          >
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
