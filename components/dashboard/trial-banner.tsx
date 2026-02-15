"use client";

import Link from "next/link";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TrialBannerProps {
  trialEndsAt: string;
  daysRemaining: number;
}

export function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const isUrgent = daysRemaining <= 3;

  return (
    <div
      className={
        isUrgent
          ? "bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 px-4 py-2.5"
          : "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 px-4 py-2.5"
      }
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Sparkles
            className={
              isUrgent
                ? "h-4 w-4 text-amber-500 shrink-0"
                : "h-4 w-4 text-primary shrink-0"
            }
          />
          <Badge
            variant={isUrgent ? "outline" : "secondary"}
            className={
              isUrgent
                ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                : ""
            }
          >
            Free Trial
          </Badge>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
            </span>
          </div>
        </div>
        <Button asChild size="sm" variant={isUrgent ? "default" : "outline"}>
          <Link href="/pricing">
            Upgrade Now
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
