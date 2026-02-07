"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, ChevronRight, Loader2 } from "lucide-react";
import { formatNumber } from "./shared-utils";
import type { TikTokAccount, AccountSyncData } from "@/hooks/use-accounts";

interface AccountCompactCardProps {
  account: TikTokAccount;
  syncData?: AccountSyncData;
  isSelected?: boolean;
  onClick: () => void;
}

export function AccountCompactCard({
  account,
  syncData,
  isSelected,
  onClick,
}: AccountCompactCardProps) {
  const activeJobs = syncData?.activeJobs ?? [];
  const hasActiveJobs = activeJobs.length > 0;
  const hasError = syncData?.recentJobs?.some((j) => j.status === "failed");
  const stats = syncData?.stats;
  const syncedPosts = stats?.syncedPosts ?? 0;
  const syncedComments = stats?.syncedComments ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
        isSelected ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <Avatar className="size-10 border shrink-0">
        <AvatarImage
          src={account.avatarUrl || undefined}
          alt={account.displayName || account.username}
        />
        <AvatarFallback>
          {(account.displayName || account.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold truncate text-sm">
            {account.displayName || account.username}
          </span>
          {account.isVerified && (
            <BadgeCheck className="size-4 text-blue-500 shrink-0" />
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          @{account.username}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {hasActiveJobs ? (
          <Badge variant="secondary" className="gap-1 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Loader2 className="size-3 animate-spin" />
            Syncing...
          </Badge>
        ) : hasError ? (
          <Badge variant="destructive" className="text-xs">Error</Badge>
        ) : (
          <>
            {syncedPosts > 0 && (
              <Badge variant="secondary" className="text-xs">
                {formatNumber(syncedPosts)} posts
              </Badge>
            )}
            {syncedComments > 0 && (
              <Badge variant="secondary" className="text-xs">
                {formatNumber(syncedComments)} comments
              </Badge>
            )}
          </>
        )}
      </div>

      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </button>
  );
}
