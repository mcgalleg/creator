"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { PostImportConfigPanel } from "./post-import-config-panel";

// Types
export type PostImportMode = "latest" | "date_range" | "top_performers";
export type DateRangePreset = "last_week" | "last_month" | "last_3_months" | "last_6_months" | "all_time" | "custom";

export interface PostImportConfig {
  mode: PostImportMode;
  postsLimit?: number;
  dateRangePreset?: DateRangePreset;
  customDateStart?: string;
  customDateEnd?: string;
  topCount?: number;
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
  syncedPostCount?: number;
}

export function PostImportDialog({
  isOpen,
  onClose,
  accountUsername,
  totalPosts,
  userCreditBalance,
  onImport,
  isImporting = false,
  syncedPostCount,
}: PostImportDialogProps) {
  const [currentConfig, setCurrentConfig] = useState<PostImportConfig | null>(null);
  const [currentCost, setCurrentCost] = useState(0);

  const handleConfigChange = useCallback((config: PostImportConfig, estimatedCost: number) => {
    setCurrentConfig(config);
    setCurrentCost(estimatedCost);
  }, []);

  const handleImport = () => {
    if (!currentConfig) return;
    onImport(currentConfig, currentCost);
  };

  const insufficientCredits = currentCost > userCreditBalance;
  const isEstimate = currentConfig?.mode === "date_range";

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

        <div className="py-4">
          <PostImportConfigPanel
            accountUsername={accountUsername}
            totalPosts={totalPosts}
            userCreditBalance={userCreditBalance}
            syncedPostCount={syncedPostCount}
            onConfigChange={handleConfigChange}
          />
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
            disabled={isImporting || !currentConfig || insufficientCredits}
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
                Import for {isEstimate ? "~" : ""}{currentCost} credits
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
