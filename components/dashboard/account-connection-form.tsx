"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertCircle, UserPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { TikTokPreviewCard, type PostImportConfig } from "./tiktok-preview-card";

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

interface PreviewData {
  profile: TikTokProfile;
}

interface AccountConnectionFormProps {
  onConnect: (
    username: string,
    options?: {
      triggerSync?: boolean;
      postsLimit?: number;
      includeComments?: boolean;
    }
  ) => Promise<{ profile: { username: string } }>;
  isConnecting: boolean;
  connectedUsernames: string[];
  isLoadingAccounts: boolean;
  userCreditBalance: number;
  onRefreshCredits?: () => void;
}

type FormStep = "input" | "loading" | "preview" | "connecting";

export function AccountConnectionForm({
  onConnect,
  isConnecting,
  connectedUsernames,
  isLoadingAccounts,
  userCreditBalance,
  onRefreshCredits,
}: AccountConnectionFormProps) {
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<FormStep>("input");
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [pendingImportConfig, setPendingImportConfig] = useState<PostImportConfig | null>(null);

  // Check if account is already connected
  const isAlreadyConnected = useCallback(
    (usernameToCheck: string) =>
      connectedUsernames.some(
        (u) => u.toLowerCase() === usernameToCheck.toLowerCase()
      ),
    [connectedUsernames]
  );

  const handleCheckAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (isAlreadyConnected(normalizedUsername)) {
      setError("This account is already connected");
      return;
    }

    try {
      setStep("loading");
      setError(null);

      const response = await fetch(`/api/tiktok/preview?username=${encodeURIComponent(normalizedUsername)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile");
      }

      setPreviewData(data);
      setPendingImportConfig(null);
      setStep("preview");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch profile";
      setError(message);
      setStep("input");

      toast.error("Could not find account", {
        description: message,
      });
    }
  };

  const handleConnect = async (importConfig?: PostImportConfig) => {
    if (!previewData) return;

    const normalizedUsername = previewData.profile.username;

    try {
      setStep("connecting");
      setError(null);
      setPendingImportConfig(importConfig ?? null);

      // Determine sync options based on import config
      const triggerSync = !!importConfig;
      const includeComments = importConfig?.includeComments ?? false;
      const postsLimit = importConfig?.postsLimit ?? importConfig?.topCount ?? 50;

      const result = await onConnect(normalizedUsername, {
        triggerSync,
        postsLimit,
        includeComments,
      });

      setStep("input");
      setUsername("");
      setPreviewData(null);
      setPendingImportConfig(null);

      toast.success("Account connected successfully!", {
        description: `@${result.profile.username} has been added to your accounts.`,
      });

      onRefreshCredits?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect account";
      setError(message);
      setStep("preview");

      toast.error("Failed to connect account", {
        description: `${message}. You can try again.`,
      });
    }
  };

  const handleBackToInput = () => {
    setStep("input");
    setPreviewData(null);
    setError(null);
  };

  // Render loading state (fetching preview)
  if (step === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Connect TikTok Account
          </CardTitle>
          <CardDescription>
            Checking @{username}...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render preview state
  if (step === "preview" && previewData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Connect TikTok Account
          </CardTitle>
          <CardDescription>
            Review the account and choose what to import.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TikTokPreviewCard
            profile={previewData.profile}
            userCreditBalance={userCreditBalance}
            onConnect={handleConnect}
            onCancel={handleBackToInput}
            isConnecting={isConnecting}
          />

          {/* Error display */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render connecting state
  if (step === "connecting") {
    const connectingMessage = !pendingImportConfig
      ? "Saving account..."
      : pendingImportConfig.includeComments
      ? "Connecting and importing posts with comments..."
      : "Connecting and importing posts...";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Connect TikTok Account
          </CardTitle>
          <CardDescription>
            Connecting @{previewData?.profile.username || username}...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{connectingMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render input state (default)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="size-5" />
          Connect TikTok Account
        </CardTitle>
        <CardDescription>
          Enter your TikTok username to connect your account and start tracking analytics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCheckAccount} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                type="text"
                placeholder="username"
                autoComplete="off"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.replace(/^@/, ""));
                  if (error) {
                    setError(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && username.trim() && !isConnecting) {
                    e.preventDefault();
                    handleCheckAccount(e as unknown as React.FormEvent);
                  }
                }}
                disabled={isConnecting}
                className="pl-8"
              />
            </div>
            <Button
              type="submit"
              disabled={isConnecting || !username.trim()}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Check Account
                </>
              )}
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
