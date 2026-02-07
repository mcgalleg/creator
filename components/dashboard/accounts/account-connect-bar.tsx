"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { TikTokProfile } from "./account-detail-panel";

interface AccountConnectBarProps {
  onProfileFound: (profile: TikTokProfile) => void;
  connectedUsernames: string[];
  isLoadingAccounts: boolean;
}

export function AccountConnectBar({
  onProfileFound,
  connectedUsernames,
  isLoadingAccounts,
}: AccountConnectBarProps) {
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyConnected = (u: string) =>
    connectedUsernames.some((cu) => cu.toLowerCase() === u.toLowerCase());

  const handleCheckAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    const normalized = username.trim().toLowerCase();

    if (isAlreadyConnected(normalized)) {
      setError("This account is already connected");
      return;
    }

    try {
      setIsChecking(true);
      setError(null);

      const response = await fetch(
        `/api/tiktok/preview?username=${encodeURIComponent(normalized)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile");
      }

      setUsername("");
      onProfileFound(data.profile);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch profile";
      setError(message);
      toast.error("Could not find account", { description: message });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <form onSubmit={handleCheckAccount} className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
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
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && username.trim() && !isChecking) {
                e.preventDefault();
                handleCheckAccount(e as unknown as React.FormEvent);
              }
            }}
            disabled={isChecking}
            className="pl-8"
          />
        </div>
        <Button
          type="submit"
          disabled={isChecking || !username.trim()}
          className="w-full sm:w-auto"
        >
          {isChecking ? (
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

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}
    </form>
  );
}
