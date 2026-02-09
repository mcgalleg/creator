'use client';

import { UserButton } from '@clerk/nextjs';
import { Coins, Settings, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCredits } from '@/hooks/use-credits';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSync } from '@/contexts/sync-context';
import { AccentColorPicker } from '@/components/accent-color-picker';
import { Loader2 } from 'lucide-react';

export function CompactHeader() {
  const { balance: credits, aiTokens, loading: creditsLoading } = useCredits();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { accounts, accountsLoading, isSyncing } = useSync();

  // Prevent hydration mismatch with Clerk UserButton
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional for hydration handling
    setMounted(true);
  }, []);

  // Derive the effective selected account ID
  // If no account is explicitly selected but accounts exist, use the first one
  const effectiveSelectedAccountId = selectedAccountId ||
    (accounts.length > 0 ? String(accounts[0].id) : null);

  // Get the currently selected account
  const selectedAccount = accounts.find(
    (acc) => String(acc.id) === effectiveSelectedAccountId
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-3 md:px-4 gap-2 md:gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.png"
            alt="Not a Bot"
            width={120}
            height={40}
            className="h-16 pb-2 w-auto dark:invert"
          />
        </Link>

        {/* Separator - hidden on mobile */}
        <div className="h-7 w-px bg-border hidden sm:block" />

        {/* Account Switcher - responsive width */}
        {accountsLoading ? (
          <div className="w-[120px] sm:w-[160px] h-[36px] md:h-[32px] bg-muted animate-pulse rounded-md" />
        ) : accounts.length === 0 ? (
          <Button variant="outline" size="sm" asChild className="w-[120px] sm:w-[160px] min-h-[36px] md:min-h-[32px]">
            <Link href="/dashboard/accounts">Connect Account</Link>
          </Button>
        ) : accounts.length === 1 ? (
          <div className="flex items-center gap-2 px-3 py-1 text-sm font-medium">
            {selectedAccount?.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- External TikTok avatar URL
              <img
                src={selectedAccount.avatarUrl}
                alt={selectedAccount.username}
                className="h-5 w-5 rounded-full"
              />
            )}
            <span className="truncate">@{selectedAccount?.username}</span>
          </div>
        ) : (
          <Select value={effectiveSelectedAccountId || ''} onValueChange={setSelectedAccountId}>
            <SelectTrigger size="sm" className="w-[120px] sm:w-[160px] min-h-[36px] md:min-h-[32px]">
              <SelectValue placeholder="Select account">
                {selectedAccount && (
                  <div className="flex items-center gap-2">
                    {selectedAccount.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- External TikTok avatar URL
                      <img
                        src={selectedAccount.avatarUrl}
                        alt={selectedAccount.username}
                        className="h-4 w-4 rounded-full"
                      />
                    )}
                    <span className="truncate">@{selectedAccount.username}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={String(account.id)}>
                  <div className="flex items-center gap-2">
                    {account.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- External TikTok avatar URL
                      <img
                        src={account.avatarUrl}
                        alt={account.username}
                        className="h-4 w-4 rounded-full"
                      />
                    )}
                    <span>@{account.username}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sync Indicator */}
        {isSyncing && (
          <Badge variant="outline" className="gap-1 shrink-0 text-xs md:text-sm animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        )}

        {/* AI Tokens Badge */}
        {!creditsLoading && aiTokens !== null && (
          <Badge variant="secondary" className="gap-1 shrink-0 text-xs md:text-sm">
            <Sparkles className="h-3 w-3" />
            <span>{aiTokens >= 1000 ? `${Math.round(aiTokens / 1000)}K` : aiTokens}</span>
          </Badge>
        )}

        {/* Sync Credits Badge */}
        {!creditsLoading && (
          <Badge variant="secondary" className="gap-1 shrink-0 text-xs md:text-sm">
            <Coins className="h-3 w-3" />
            <span>{credits}</span>
          </Badge>
        )}

        {/* Theme & Accent Color - defer to avoid hydration mismatch with Radix IDs */}
        {mounted && <AccentColorPicker />}

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
