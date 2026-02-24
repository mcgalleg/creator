"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { PostImportConfigPanel } from "@/components/dashboard/post-import-config-panel";
import type { PostImportConfig } from "@/components/dashboard/post-import-dialog";
import type { SyncJob } from "@/hooks/use-accounts";

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
  const [currentConfig, setCurrentConfig] = useState<PostImportConfig | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const postsSyncing = activeJobs.some(
    (j) => j.type === "posts" || j.type === "full"
  );

  const handleConfigChange = useCallback((config: PostImportConfig, cost: number) => {
    setCurrentConfig(config);
    setEstimatedCost(cost);
  }, []);

  const handleImport = () => {
    if (!currentConfig) return;
    onImport(currentConfig);
  };

  const insufficientCredits = estimatedCost > userCreditBalance;
  const isEstimate = currentConfig?.mode === "date_range";

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

      <PostImportConfigPanel
        totalPosts={totalPosts}
        userCreditBalance={userCreditBalance}
        syncedPostCount={syncedPostCount}
        onConfigChange={handleConfigChange}
      />

      {/* Import Button */}
      <Button
        onClick={handleImport}
        disabled={
          isImporting ||
          postsSyncing ||
          !currentConfig ||
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
            Import for {isEstimate ? "~" : ""}{estimatedCost} credits
          </>
        )}
      </Button>
    </div>
  );
}
