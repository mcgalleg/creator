"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, UserPlus, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

interface ProfilePreview {
  username: string;
  displayName: string;
  followerCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  avatarUrl: string;
  bio: string;
  isVerified: boolean;
}

interface AccountConnectionFormProps {
  onConnect: (
    username: string,
    options?: { triggerSync?: boolean }
  ) => Promise<{ profile: ProfilePreview }>;
  isConnecting: boolean;
}

type FormState = "idle" | "connecting" | "success" | "error";

export function AccountConnectionForm({
  onConnect,
  isConnecting,
}: AccountConnectionFormProps) {
  const [username, setUsername] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfilePreview | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    try {
      setFormState("connecting");
      setError(null);
      setProfile(null);

      const result = await onConnect(username.trim());

      setProfile(result.profile);
      setFormState("success");
      setUsername("");

      toast.success("Account connected successfully!", {
        description: `@${result.profile.username} has been added to your accounts.`,
      });

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setFormState("idle");
        setProfile(null);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect account";
      setError(message);
      setFormState("error");

      toast.error("Failed to connect account", {
        description: message,
      });
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.replace(/^@/, ""));
                  if (formState === "error") {
                    setFormState("idle");
                    setError(null);
                  }
                }}
                disabled={isConnecting || formState === "connecting"}
                className="pl-8"
              />
            </div>
            <Button
              type="submit"
              disabled={isConnecting || formState === "connecting" || !username.trim()}
            >
              {formState === "connecting" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>

          {/* Error State */}
          {formState === "error" && error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success State with Profile Preview */}
          {formState === "success" && profile && (
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-4" />
                Account connected successfully!
              </div>
              <div className="flex items-start gap-4">
                <Avatar className="size-12">
                  <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
                  <AvatarFallback>
                    {profile.displayName?.charAt(0) || profile.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{profile.displayName}</span>
                    {profile.isVerified && (
                      <BadgeCheck className="size-4 text-blue-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">@{profile.username}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{formatNumber(profile.followerCount)} followers</Badge>
                    <Badge variant="secondary">{formatNumber(profile.likesCount)} likes</Badge>
                    <Badge variant="secondary">{profile.videoCount} videos</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
