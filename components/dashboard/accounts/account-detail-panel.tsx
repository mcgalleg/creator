"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { AccountOverviewTab } from "./account-overview-tab";
import { AccountPostsTab } from "./account-posts-tab";
import { AccountCommentsTab } from "./account-comments-tab";
import { AccountConnectPreview } from "./account-connect-preview";
import type { TikTokAccount, AccountSyncData } from "@/hooks/use-accounts";
import type { PostImportConfig } from "@/components/dashboard/post-import-dialog";

export interface TikTokProfile {
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

interface AccountDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "detail" | "connect";
  // Detail mode props
  account?: TikTokAccount;
  syncData?: AccountSyncData;
  isSyncing?: boolean;
  isDisconnecting?: boolean;
  userCreditBalance?: number;
  onSync?: (accountId: number, config?: PostImportConfig) => void;
  onProfileRefresh?: (accountId: number) => void;
  onDelete?: (accountId: number) => Promise<void>;
  onFetchSyncData?: (accountId: number) => Promise<void>;
  onRefreshCredits?: () => void;
  // Connect mode props
  connectProfile?: TikTokProfile | null;
  onConnect?: (
    username: string,
    options?: {
      triggerSync?: boolean;
      postsLimit?: number;
      includeComments?: boolean;
    }
  ) => Promise<{ profile: { username: string } }>;
  isConnecting?: boolean;
}

export function AccountDetailPanel({
  open,
  onOpenChange,
  mode,
  account,
  syncData,
  isSyncing = false,
  isDisconnecting = false,
  userCreditBalance = 0,
  onSync,
  onProfileRefresh,
  onDelete,
  onFetchSyncData,
  onRefreshCredits,
  connectProfile,
  onConnect,
  isConnecting = false,
}: AccountDetailPanelProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "sm";

  const stats = syncData?.stats;
  const syncedPosts = stats?.syncedPosts ?? 0;
  const activeJobs = syncData?.activeJobs ?? [];
  const postsSyncing = activeJobs.some((j) => j.type === "posts" || j.type === "full");
  const activeCommentJobs = activeJobs.filter((j) => j.type === "comments");

  const handlePostImport = (config: PostImportConfig) => {
    if (account && onSync) {
      onSync(account.id, config);
    }
  };

  const handleCommentSyncStarted = () => {
    if (account) {
      onFetchSyncData?.(account.id);
      onRefreshCredits?.();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[90vh] flex flex-col overflow-hidden"
            : "sm:max-w-xl w-full flex flex-col overflow-hidden"
        }
        showCloseButton={true}
      >
        {mode === "connect" && connectProfile ? (
          <>
            <SheetHeader className="shrink-0">
              <SheetTitle>Connect TikTok Account</SheetTitle>
              <SheetDescription>
                Review the account and choose what to import.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <AccountConnectPreview
                profile={connectProfile}
                userCreditBalance={userCreditBalance}
                onConnect={onConnect!}
                onCancel={() => onOpenChange(false)}
                isConnecting={isConnecting}
                onRefreshCredits={onRefreshCredits}
              />
            </div>
          </>
        ) : account ? (
          <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0">
            <SheetHeader className="shrink-0 pb-0">
              <SheetTitle className="text-base">
                {account.displayName || account.username}
              </SheetTitle>
              <TabsList className="w-full mt-2">
                <TabsTrigger value="overview" className="min-h-[44px]">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="posts" className="min-h-[44px]">
                  Posts
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="min-h-[44px]"
                  disabled={syncedPosts === 0}
                >
                  Comments
                </TabsTrigger>
              </TabsList>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
              <TabsContent value="overview">
                <AccountOverviewTab
                  account={account}
                  syncData={syncData}
                  isSyncing={isSyncing}
                  isDisconnecting={isDisconnecting}
                  onProfileRefresh={onProfileRefresh!}
                  onDelete={onDelete!}
                />
              </TabsContent>

              <TabsContent value="posts">
                <AccountPostsTab
                  totalPosts={stats?.totalPosts ?? account.videoCount ?? 0}
                  userCreditBalance={userCreditBalance}
                  onImport={handlePostImport}
                  isImporting={postsSyncing}
                  syncedPostCount={syncedPosts}
                  activeJobs={activeJobs}
                />
              </TabsContent>

              <TabsContent value="comments">
                <AccountCommentsTab
                  accountId={account.id}
                  accountUsername={account.username}
                  activeCommentJobs={activeCommentJobs}
                  onSyncStarted={handleCommentSyncStarted}
                  userCreditBalance={userCreditBalance}
                  syncedPostCount={syncedPosts}
                />
              </TabsContent>
            </div>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
