"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountConnectBar } from "@/components/dashboard/accounts/account-connect-bar";
import { AccountConnectPreview } from "@/components/dashboard/accounts/account-connect-preview";
import type { TikTokProfile } from "@/components/dashboard/accounts/account-detail-panel";
import { useCredits } from "@/hooks/use-credits";
import { useSync } from "@/contexts/sync-context";
import { toast } from "sonner";

interface OnboardingConnectProps {
  onBack: () => void;
  onSkip: () => void;
  onConnected: () => void;
}

export function OnboardingConnect({ onBack, onSkip, onConnected }: OnboardingConnectProps) {
  const [profile, setProfile] = useState<TikTokProfile | null>(null);
  const { balance: creditBalance, refresh: refreshCredits } = useCredits();
  const { connectAccount, connecting: isConnecting } = useSync();

  const handleConnect = async (
    username: string,
    options?: {
      triggerSync?: boolean;
      postsLimit?: number;
      includeComments?: boolean;
    }
  ) => {
    try {
      const result = await connectAccount(username, options);

      toast.success("Account connected!", {
        description: `@${result.profile.username} has been added to your accounts.`,
      });

      onConnected();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect account";
      toast.error("Failed to connect account", { description: message });
      throw err;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="max-w-lg mx-auto w-full space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Connect your TikTok account
          </h1>
          <p className="text-muted-foreground">
            Enter your TikTok username to get started. We&apos;ll pull in your profile
            and you can choose what data to import.
          </p>
        </div>

        <AccountConnectBar
          onProfileFound={setProfile}
          connectedUsernames={[]}
          isLoadingAccounts={false}
        />

        {profile && (
          <AccountConnectPreview
            profile={profile}
            userCreditBalance={creditBalance}
            onConnect={handleConnect}
            onCancel={() => setProfile(null)}
            isConnecting={isConnecting}
            onRefreshCredits={refreshCredits}
          />
        )}

        <div className="text-center pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now — I&apos;ll connect later
          </button>
        </div>
      </div>
    </div>
  );
}
