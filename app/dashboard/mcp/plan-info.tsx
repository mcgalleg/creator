"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Database, Plug } from "lucide-react";
import { TIER_ACCOUNT_LIMITS, TIER_DATA_RETENTION } from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";

interface McpPlanInfoProps {
  tier: SubscriptionTier;
  accountCount: number;
}

export function McpPlanInfo({ tier, accountCount }: McpPlanInfoProps) {
  const accountLimit = TIER_ACCOUNT_LIMITS[tier];
  const dataRetention = TIER_DATA_RETENTION[tier];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4 text-primary" />
            Plan Info
          </CardTitle>
          <Badge variant="secondary">MCP Apps</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>
            {accountCount} of {accountLimit} accounts connected
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Database className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{dataRetention}-day data retention</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/pricing">
            Want the full dashboard? Upgrade to Creator or Pro
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
