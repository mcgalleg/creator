"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditBalanceDisplay } from "./credit-balance-display";
import { PostImportDialog, PostImportConfig } from "./post-import-dialog";
import { BadgeCheck, Users, Heart, Video, Loader2, ArrowLeft, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TikTokProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  followerCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  bio: string;
  isVerified: boolean;
}

interface TikTokPreviewCardProps {
  profile: TikTokProfile;
  userCreditBalance: number;
  onConnect: (importConfig?: PostImportConfig) => void;
  onCancel: () => void;
  isConnecting: boolean;
}

export type { PostImportConfig };

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export function TikTokPreviewCard({
  profile,
  userCreditBalance,
  onConnect,
  onCancel,
  isConnecting,
}: TikTokPreviewCardProps) {
  const [importPosts, setImportPosts] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [customImportConfig, setCustomImportConfig] = useState<PostImportConfig | null>(null);
  const [customImportCost, setCustomImportCost] = useState<number | null>(null);

  // Default cost estimate for posts (25 posts × 1 credit = 25 credits)
  const defaultPostsCost = 25;
  const selectedCost = importPosts ? (customImportCost ?? defaultPostsCost) : 0;
  const hasEnoughCredits = userCreditBalance >= selectedCost;
  const isFreeOption = selectedCost === 0;

  const handleImportConfig = (config: PostImportConfig, estimatedCost: number) => {
    setCustomImportConfig(config);
    setCustomImportCost(estimatedCost);
    setShowImportDialog(false);
  };

  const handleConnect = () => {
    if (importPosts && customImportConfig) {
      onConnect(customImportConfig);
    } else {
      onConnect();
    }
  };

  const handleImportToggle = (wantsPosts: boolean) => {
    setImportPosts(wantsPosts);
    if (!wantsPosts) {
      setCustomImportConfig(null);
      setCustomImportCost(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Preview */}
      <div className="flex items-start gap-4">
        <Avatar className="size-14 sm:size-16 border-2 border-border shrink-0">
          <AvatarImage
            src={profile.avatarUrl || undefined}
            alt={profile.displayName || profile.username}
          />
          <AvatarFallback className="text-lg">
            {(profile.displayName || profile.username).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-lg truncate">
              {profile.displayName || profile.username}
            </span>
            {profile.isVerified && (
              <BadgeCheck className="size-5 text-blue-500 shrink-0" />
            )}
          </div>
          <div className="text-muted-foreground mb-3">
            @{profile.username}
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" />
              <span className="font-medium">{formatNumber(profile.followerCount)}</span>
              <span className="text-muted-foreground hidden sm:inline">followers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="size-4 text-muted-foreground" />
              <span className="font-medium">{formatNumber(profile.likesCount)}</span>
              <span className="text-muted-foreground hidden sm:inline">likes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Video className="size-4 text-muted-foreground" />
              <span className="font-medium">{profile.videoCount}</span>
              <span className="text-muted-foreground hidden sm:inline">videos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Options: Connect only vs Connect & Import */}
      <div className="space-y-3">
        {/* Connect only - FREE */}
        <button
          type="button"
          onClick={() => handleImportToggle(false)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg border p-4 text-left transition-colors",
            !importPosts
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-4 rounded-full border-2 flex items-center justify-center",
                !importPosts ? "border-primary" : "border-muted-foreground/50"
              )}
            >
              {!importPosts && (
                <div className="size-2 rounded-full bg-primary" />
              )}
            </div>
            <div>
              <span className="font-medium">Connect only</span>
              <p className="text-sm text-muted-foreground mt-0.5">
                Save account now, import posts later
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 shrink-0">
            FREE
          </Badge>
        </button>

        {/* Connect & Import Posts */}
        <div
          className={cn(
            "rounded-lg border transition-colors",
            importPosts
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50"
          )}
        >
          <button
            type="button"
            onClick={() => handleImportToggle(true)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-4 rounded-full border-2 flex items-center justify-center",
                  importPosts ? "border-primary" : "border-muted-foreground/50"
                )}
              >
                {importPosts && (
                  <div className="size-2 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <span className="font-medium">Connect & Import Posts</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Import posts with engagement data
                </p>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0">
              {customImportConfig ? `${customImportCost}` : `~${defaultPostsCost}`} credits
            </Badge>
          </button>

          {/* Configure link - shown when this option is selected */}
          {importPosts && (
            <div className="px-4 pb-4 pt-0">
              <button
                type="button"
                onClick={() => setShowImportDialog(true)}
                className="text-sm text-primary hover:underline flex items-center gap-1.5"
              >
                <Settings2 className="size-3.5" />
                {customImportConfig ? "Edit import options" : "Configure what to import"}
              </button>
              {customImportConfig && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {customImportConfig.mode === "latest" && `${customImportConfig.postsLimit} latest posts`}
                  {customImportConfig.mode === "date_range" && `Posts from ${customImportConfig.dateRangePreset?.replace("_", " ")}`}
                  {customImportConfig.mode === "top_performers" && `Top ${customImportConfig.topCount} posts`}
                  {customImportConfig.mode === "budget" && `Within ${customImportConfig.creditBudget} credit budget`}
                  {customImportConfig.includeComments && " + comments"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Credit Balance */}
      <CreditBalanceDisplay
        balance={userCreditBalance}
        pendingCost={selectedCost > 0 ? selectedCost : undefined}
      />

      {/* Insufficient credits warning */}
      {!hasEnoughCredits && !isFreeOption && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          You need {selectedCost - userCreditBalance} more credits for this option.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isConnecting}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>

        <Button
          onClick={handleConnect}
          disabled={isConnecting || (!hasEnoughCredits && !isFreeOption)}
          className="w-full sm:w-auto"
        >
          {isConnecting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Connecting...
            </>
          ) : isFreeOption ? (
            "Connect Account"
          ) : (
            `Connect for ${selectedCost} credits`
          )}
        </Button>
      </div>

      {/* Post Import Dialog */}
      <PostImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        accountUsername={profile.username}
        totalPosts={profile.videoCount}
        userCreditBalance={userCreditBalance}
        onImport={handleImportConfig}
      />
    </div>
  );
}
