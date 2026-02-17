'use client';

import { UserButton } from '@clerk/nextjs';
import { Coins, LayoutDashboard, Settings, Sparkles, Plug, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCredits } from '@/hooks/use-credits';
import { useSync } from '@/contexts/sync-context';
import { AccentColorPicker } from '@/components/accent-color-picker';
import { Loader2 } from 'lucide-react';
import { STARTER_BONUS_SYNC_CREDITS, STARTER_BONUS_AI_TOKENS } from '@/lib/credits';

interface CompactHeaderProps {
  subscriptionTier?: string;
}

export function CompactHeader({ subscriptionTier = "free" }: CompactHeaderProps) {
  const { balance: credits, aiTokens, loading: creditsLoading } = useCredits();
  const [mounted, setMounted] = useState(false);
  const { isSyncing } = useSync();
  const isMcp = subscriptionTier === "mcp";

  // Brief delay before showing credits so Polar meter balances settle after signup
  const [creditsSettled, setCreditsSettled] = useState(false);

  // Prevent hydration mismatch with Clerk UserButton
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional for hydration handling
    setMounted(true);
    const timer = setTimeout(() => setCreditsSettled(true), 2_000);
    return () => clearTimeout(timer);
  }, []);

  // Determine if credits are low (< 10% of starter grant) for amber badge
  const syncCreditsLow = credits !== undefined && credits < STARTER_BONUS_SYNC_CREDITS * 0.1;
  const aiTokensLow = aiTokens !== null && aiTokens < STARTER_BONUS_AI_TOKENS * 0.1;

  const dashboardHref = isMcp ? "/dashboard/mcp" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-3 md:px-4 gap-2 md:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.png"
            alt="Not a Bot"
            width={120}
            height={40}
            className="h-16 pb-2 w-auto dark:invert"
          />
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sync Indicator */}
        {isSyncing && (
          <Badge variant="outline" className="gap-1 shrink-0 text-xs md:text-sm animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        )}

        {/* AI Tokens Badge - hidden for MCP tier (BYOLLM) */}
        {!isMcp && !creditsLoading && creditsSettled && aiTokens !== null && (
          <Badge
            variant={aiTokensLow ? "outline" : "secondary"}
            className={`gap-1 shrink-0 text-xs md:text-sm ${aiTokensLow ? "border-amber-500/30 text-amber-600 dark:text-amber-400" : ""}`}
          >
            <Sparkles className={`h-3 w-3 ${aiTokensLow ? "text-amber-500" : ""}`} />
            <span>{aiTokens >= 1000 ? `${Math.round(aiTokens / 1000)}K` : aiTokens}</span>
          </Badge>
        )}

        {/* Sync Credits Badge */}
        {!creditsLoading && creditsSettled && (
          <Badge
            variant={syncCreditsLow ? "outline" : "secondary"}
            className={`gap-1 shrink-0 text-xs md:text-sm ${syncCreditsLow ? "border-amber-500/30 text-amber-600 dark:text-amber-400" : ""}`}
          >
            <Coins className={`h-3 w-3 ${syncCreditsLow ? "text-amber-500" : ""}`} />
            <span>{credits}</span>
          </Badge>
        )}

        {/* Theme & Accent Color - defer to avoid hydration mismatch with Radix IDs */}
        {mounted && <AccentColorPicker />}

        {/* Docs Button */}
        <Button variant="ghost" size="icon-sm" asChild className="min-h-[36px] min-w-[36px] md:min-h-[32px] md:min-w-[32px]">
          <Link href="/docs">
            <BookOpen className="h-4 w-4" />
            <span className="sr-only">Documentation</span>
          </Link>
        </Button>

        {/* Dashboard Button */}
        <Button variant="ghost" size="icon-sm" asChild className="min-h-[36px] min-w-[36px] md:min-h-[32px] md:min-w-[32px]">
          <Link href={dashboardHref}>
            {isMcp ? (
              <Plug className="h-4 w-4" />
            ) : (
              <LayoutDashboard className="h-4 w-4" />
            )}
            <span className="sr-only">{isMcp ? "MCP Hub" : "Dashboard"}</span>
          </Link>
        </Button>

        {/* Settings Button - touch-friendly sizing on mobile */}
        <Button variant="ghost" size="icon-sm" asChild className="min-h-[36px] min-w-[36px] md:min-h-[32px] md:min-w-[32px]">
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Link>
        </Button>

        {/* User Button - only render after mount to prevent hydration mismatch */}
        {mounted && <UserButton afterSignOutUrl="/" />}
      </div>
    </header>
  );
}
