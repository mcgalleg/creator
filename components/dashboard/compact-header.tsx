'use client';

import { UserButton } from '@clerk/nextjs';
import { Coins, LayoutDashboard, Settings, Sparkles, Plug, BookOpen, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useCredits } from '@/hooks/use-credits';
import { useSync } from '@/contexts/sync-context';
import { AccentColorPicker } from '@/components/accent-color-picker';
import { Loader2 } from 'lucide-react';
import { TIER_SYNC_CREDITS, TIER_AI_TOKENS, type SubscriptionTier } from '@/lib/subscriptions';
import { AstriqLogo } from '@/components/astriq-logo';

interface CompactHeaderProps {
  subscriptionTier?: string;
}

export function CompactHeader({ subscriptionTier = "free" }: CompactHeaderProps) {
  const { balance: credits, aiTokens, loading: creditsLoading } = useCredits();
  const [mounted, setMounted] = useState(false);
  const { isSyncing } = useSync();
  const isMcp = subscriptionTier === "mcp";
  const [sheetOpen, setSheetOpen] = useState(false);

  // Brief delay before showing credits so Polar meter balances settle after signup
  const [creditsSettled, setCreditsSettled] = useState(false);

  // Prevent hydration mismatch with Clerk UserButton
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional for hydration handling
    setMounted(true);
    const timer = setTimeout(() => setCreditsSettled(true), 2_000);
    return () => clearTimeout(timer);
  }, []);

  // Determine if credits are low (< 10% of current tier allocation) for amber badge
  const tier = subscriptionTier as SubscriptionTier;
  const tierSyncCredits = TIER_SYNC_CREDITS[tier] || TIER_SYNC_CREDITS.free;
  const tierAiTokens = TIER_AI_TOKENS[tier] || TIER_AI_TOKENS.free;
  const syncCreditsLow = credits !== undefined && credits < tierSyncCredits * 0.1;
  const aiTokensLow = aiTokens !== null && aiTokens < tierAiTokens * 0.1;

  const workspaceHref = isMcp ? "/workspace/mcp" : "/workspace";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-3 md:px-4 gap-2 md:gap-4">
        {/* Logo — icon-only on mobile to save space, full combo on md+ */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <AstriqLogo variant="combo" size="lg" className="hidden md:block" />
          <AstriqLogo variant="icon" size="lg" className="md:hidden" />
        </Link>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Sync Indicator */}
        {isSyncing && (
          <Badge variant="outline" className="gap-1 shrink-0 text-xs md:text-sm animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        )}

        {/* AI Tokens Badge - hidden for MCP tier (BYOLLM) */}
        {!isMcp && !creditsLoading && creditsSettled && aiTokens !== null && (
          <Link href="/pricing#ai-tokens">
            <Badge
              variant={aiTokensLow ? "outline" : "secondary"}
              className={`gap-1 shrink-0 text-xs md:text-sm cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground ${aiTokensLow ? "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500" : ""}`}
            >
              <Sparkles className={`h-3 w-3 ${aiTokensLow ? "text-amber-500" : ""}`} />
              <span>{aiTokens >= 1000 ? `${Math.round(aiTokens / 1000)}K` : aiTokens}</span>
            </Badge>
          </Link>
        )}

        {/* Sync Credits Badge */}
        {!creditsLoading && creditsSettled && (
          <Link href="/pricing#credits">
            <Badge
              variant={syncCreditsLow ? "outline" : "secondary"}
              className={`gap-1 shrink-0 text-xs md:text-sm cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground ${syncCreditsLow ? "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500" : ""}`}
            >
              <Coins className={`h-3 w-3 ${syncCreditsLow ? "text-amber-500" : ""}`} />
              <span>{credits}</span>
            </Badge>
          </Link>
        )}

        {/* Theme & Accent Color - desktop only, moves to sheet on mobile */}
        <div className="hidden md:flex">
          {mounted && <AccentColorPicker />}
        </div>

        {/* Desktop nav buttons - hidden on mobile, shown in sheet instead */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" asChild className="min-h-[32px] min-w-[32px]">
            <Link href="/docs">
              <BookOpen className="h-4 w-4" />
              <span className="sr-only">Documentation</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon-sm" asChild className="min-h-[32px] min-w-[32px]">
            <Link href={workspaceHref}>
              {isMcp ? (
                <Plug className="h-4 w-4" />
              ) : (
                <LayoutDashboard className="h-4 w-4" />
              )}
              <span className="sr-only">{isMcp ? "MCP Hub" : "Workspace"}</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon-sm" asChild className="min-h-[32px] min-w-[32px]">
            <Link href="/workspace/settings">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </div>

        {/* Mobile hamburger menu — deferred to avoid Radix aria-controls hydration mismatch */}
        {mounted && <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="md:hidden shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav className="flex flex-col gap-1 mt-4">
              <Link
                href={workspaceHref}
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {isMcp ? <Plug className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
                {isMcp ? "MCP Hub" : "Workspace"}
              </Link>
              <Link
                href="/docs"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <BookOpen className="h-4 w-4" />
                Documentation
              </Link>
              <Link
                href="/workspace/settings"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </nav>
            <div className="mt-6 px-3">
              {mounted && <AccentColorPicker />}
            </div>
          </SheetContent>
        </Sheet>}

        {/* User Button - only render after mount to prevent hydration mismatch */}
        {mounted && <UserButton afterSignOutUrl="/" />}
      </div>
    </header>
  );
}
