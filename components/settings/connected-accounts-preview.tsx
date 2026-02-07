"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Users, CheckCircle } from "lucide-react";

interface TikTokAccount {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number;
  isVerified: boolean;
}

function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function ConnectedAccountsPreview() {
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch("/api/accounts");
        if (!res.ok) {
          if (res.status === 404) {
            // No accounts endpoint or no accounts
            setAccounts([]);
            return;
          }
          throw new Error("Failed to fetch accounts");
        }
        const data = await res.json();
        setAccounts(data.accounts || []);
      } catch (err) {
        // If the endpoint doesn't exist yet, just show empty state
        if (err instanceof Error && err.message.includes("404")) {
          setAccounts([]);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load accounts");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Connected Accounts
            <Skeleton className="h-6 w-6 rounded-full" />
          </CardTitle>
          <CardDescription>Your linked TikTok accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Your linked TikTok accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Connected Accounts
          <Badge variant="secondary" className="text-xs">
            {accounts.length}
          </Badge>
        </CardTitle>
        <CardDescription>Your linked TikTok accounts</CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              No accounts connected yet
            </p>
            <p className="text-xs text-muted-foreground">
              Connect your TikTok account to start syncing analytics
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.slice(0, 3).map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={account.avatarUrl || undefined}
                      alt={account.username}
                    />
                    <AvatarFallback>
                      {account.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm">
                        @{account.username}
                      </span>
                      {account.isVerified && (
                        <CheckCircle className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatFollowerCount(account.followerCount)} followers
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {accounts.length > 3 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                +{accounts.length - 3} more accounts
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard/accounts">
            Manage Accounts
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
