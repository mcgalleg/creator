"use client";

import { useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CreditBalanceDisplay } from "@/components/dashboard/credit-balance-display";
import { PostImportConfigPanel } from "@/components/dashboard/post-import-config-panel";
import type { PostImportConfig } from "@/components/dashboard/post-import-dialog";
import { BadgeCheck, Users, Heart, Video, Loader2 } from "lucide-react";
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
  const [importConfig, setImportConfig] = useState<PostImportConfig | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const handleConfigChange = useCallback((config: PostImportConfig, cost: number) => {
    setImportConfig(config);
    setEstimatedCost(cost);
  }, []);

  const insufficientCredits = estimatedCost > userCreditBalance;

  const handleConnect = async () => {
    try {
      const includeComments = importConfig?.includeComments ?? false;
      const postsLimit = importConfig?.postsLimit ?? importConfig?.topCount ?? 50;

      const result = await onConnect(profile.username, {
        triggerSync: true,
        postsLimit,
        includeComments,
      });

      toast.success("Account connected successfully!", {
        description: `@${result.profile.username} has been added to your accounts.`,
      });

      onRefreshCredits?.();
      onCancel();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect account";
      toast.error("Failed to connect account", {
        description: `${message}. You can try again.`,
      });
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

      {/* Import Configuration (inline) */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Import Settings</h4>
        <PostImportConfigPanel
          accountUsername={profile.username}
          totalPosts={profile.videoCount}
          userCreditBalance={userCreditBalance}
          onConfigChange={handleConfigChange}
        />
      </div>

      {/* Credit Balance */}
      <CreditBalanceDisplay
        balance={userCreditBalance}
        pendingCost={estimatedCost > 0 ? estimatedCost : undefined}
      />

      {/* Action Button */}
      <Button
        onClick={handleConnect}
        disabled={isConnecting || insufficientCredits}
        className="w-full"
      >
        {isConnecting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Connecting...
          </>
        ) : insufficientCredits ? (
          "Insufficient credits"
        ) : (
          `Connect & Import for ${estimatedCost} credits`
        )}
      </Button>
    </div>
  );
}
