"use client";

import { Coins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBalanceDisplayProps {
  balance: number;
  loading?: boolean;
  pendingCost?: number;
  variant?: "default" | "compact" | "inline";
  className?: string;
}

/**
 * Reusable credit balance indicator
 *
 * Variants:
 * - default: Full display with icon and label
 * - compact: Just icon and number
 * - inline: Inline text format
 */
export function CreditBalanceDisplay({
  balance,
  loading = false,
  pendingCost,
  variant = "default",
  className,
}: CreditBalanceDisplayProps) {
  const formattedBalance = balance.toLocaleString();
  const newBalance = pendingCost ? balance - pendingCost : null;
  const formattedNewBalance = newBalance !== null ? newBalance.toLocaleString() : null;
  const isInsufficient = pendingCost !== undefined && balance < pendingCost;

  if (loading) {
    return (
      <div className={cn("flex items-center gap-1.5 text-muted-foreground", className)}>
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("text-sm", className)}>
        {pendingCost !== undefined ? (
          <>
            <span className={cn(isInsufficient && "text-destructive")}>
              {formattedBalance}
            </span>
            <span className="text-muted-foreground"> → </span>
            <span className={cn(
              isInsufficient ? "text-destructive" : "text-foreground"
            )}>
              {formattedNewBalance}
            </span>
            <span className="text-muted-foreground"> credits</span>
          </>
        ) : (
          <>
            <span>{formattedBalance}</span>
            <span className="text-muted-foreground"> credits</span>
          </>
        )}
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Coins className="size-4 text-amber-500" />
        {pendingCost !== undefined ? (
          <span className={cn("text-sm font-medium", isInsufficient && "text-destructive")}>
            {formattedBalance} → {formattedNewBalance}
          </span>
        ) : (
          <span className="text-sm font-medium">{formattedBalance}</span>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2",
      isInsufficient && "border-destructive/50 bg-destructive/5",
      className
    )}>
      <Coins className={cn(
        "size-5",
        isInsufficient ? "text-destructive" : "text-amber-500"
      )} />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Your balance</span>
        {pendingCost !== undefined ? (
          <span className={cn(
            "text-sm font-medium",
            isInsufficient && "text-destructive"
          )}>
            {formattedBalance} → {formattedNewBalance} credits
          </span>
        ) : (
          <span className="text-sm font-medium">{formattedBalance} credits</span>
        )}
      </div>
    </div>
  );
}
