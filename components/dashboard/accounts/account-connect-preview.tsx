"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditBalanceDisplay } from "@/components/dashboard/credit-balance-display";
import { PostImportDialog, type PostImportConfig } from "@/components/dashboard/post-import-dialog";
import { BadgeCheck, Users, Heart, Video, Loader2, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatNumber } from "./shared-utils";
import type { TikTokProfile } from "./account-detail-panel";

interface AccountConnectPreviewProps {
  profile: TikTokProfile;
  userCreditBalance: number;
  onConnect: (
    username: string,
    options?: {
      triggerSync?: boolean;
      postsLimit?: number;
      includeComments?: boolean;
    }
  ) => Promise<{ profile: { username: string } }>;
  onCancel: () => void;
  isConnecting: boolean;
  onRefreshCredits?: () => void;
}

export function AccountConnectPreview({
  profile,
  userCreditBalance,
  onConnect,
  onCancel,
  isConnecting,
  onRefreshCredits,
}: AccountConnectPreviewProps) {
  const [importPosts, setImportPosts] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [customImportConfig, setCustomImportConfig] = useState<PostImportConfig | null>(null);
  const [customImportCost, setCustomImportCost] = useState<number | null>(null);

  const selectedCost = importPosts && customImportConfig ? customImportCost ?? 0 : 0;
  const hasEnoughCredits = userCreditBalance >= selectedCost;
  const isFreeOption = selectedCost === 0;
  const needsConfiguration = importPosts && !customImportConfig;

  const handleImportConfig = (config: PostImportConfig, estimatedCost: number) => {
    setCustomImportConfig(config);
    setCustomImportCost(estimatedCost);
    setShowImportDialog(false);
  };

  const handleConnect = async () => {
    try {
      const triggerSync = importPosts && !!customImportConfig;
      const includeComments = customImportConfig?.includeComments ?? false;
      const postsLimit = customImportConfig?.postsLimit ?? customImportConfig?.topCount ?? 50;

      const result = await onConnect(profile.username, {
        triggerSync,
        postsLimit,
        includeComments,
      });

      toast.success("Account connected successfully!", {
        description: `@${result.profile.username} has been added to your accounts.`,
      });

      onRefreshCredits?.();
      onCancel(); // Close the panel
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect account";
      toast.error("Failed to connect account", {
        description: `${message}. You can try again.`,
      });
    }
  };

  const handleImportToggle = (wantsPosts: boolean) => {
    setImportPosts(wantsPosts);
    if (wantsPosts) {
      // Force configuration dialog open when selecting import
      if (!customImportConfig) {
        setShowImportDialog(true);
      }
    } else {
      setCustomImportConfig(null);
      setCustomImportCost(null);
    }
  };

  const handleImportDialogClose = () => {
    setShowImportDialog(false);
    // If they dismiss without configuring, revert to "Connect only"
    if (!customImportConfig) {
      setImportPosts(false);
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* Profile Preview */}
      <div className="flex items-start gap-4">
        <Avatar className="size-14 border-2 border-border shrink-0">
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
          <div className="text-sm text-muted-foreground mb-3">
            @{profile.username}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
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

      {/* Options: Connect only vs Connect & Import */}
      <div className="space-y-3">
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
            <div className={cn(
              "size-4 rounded-full border-2 flex items-center justify-center",
              !importPosts ? "border-primary" : "border-muted-foreground/50"
            )}>
              {!importPosts && <div className="size-2 rounded-full bg-primary" />}
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

        <div className={cn(
          "rounded-lg border transition-colors",
          importPosts
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50"
        )}>
          <button
            type="button"
            onClick={() => handleImportToggle(true)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "size-4 rounded-full border-2 flex items-center justify-center",
                importPosts ? "border-primary" : "border-muted-foreground/50"
              )}>
                {importPosts && <div className="size-2 rounded-full bg-primary" />}
              </div>
              <div>
                <span className="font-medium">Connect & Import Posts</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Import posts with engagement data
                </p>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0">
              {customImportConfig ? `${customImportCost} credits` : "Paid"}
            </Badge>
          </button>

          {importPosts && (
            <div className="px-4 pb-4 pt-0">
              {customImportConfig ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {customImportConfig.mode === "latest" && `${customImportConfig.postsLimit} latest posts`}
                    {customImportConfig.mode === "date_range" && `Posts from ${customImportConfig.dateRangePreset?.replace("_", " ")}`}
                    {customImportConfig.mode === "top_performers" && `Top ${customImportConfig.topCount} posts`}
                    {customImportConfig.includeComments && " + comments"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowImportDialog(true)}
                    className="text-sm text-primary hover:underline flex items-center gap-1.5 mt-1.5"
                  >
                    <Settings2 className="size-3.5" />
                    Edit import options
                  </button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choose how many posts and what data to import
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

      {/* Action Button */}
      <Button
        onClick={handleConnect}
        disabled={isConnecting || needsConfiguration || (!hasEnoughCredits && !isFreeOption)}
        className="w-full"
      >
        {isConnecting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Connecting...
          </>
        ) : needsConfiguration ? (
          "Configure import to continue"
        ) : isFreeOption ? (
          "Connect Account"
        ) : (
          `Connect for ${selectedCost} credits`
        )}
      </Button>

      {/* Post Import Dialog for configuring import options */}
      <PostImportDialog
        isOpen={showImportDialog}
        onClose={handleImportDialogClose}
        accountUsername={profile.username}
        totalPosts={profile.videoCount}
        userCreditBalance={userCreditBalance}
        onImport={handleImportConfig}
      />
    </div>
  );
}
