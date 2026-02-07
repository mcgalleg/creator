'use client';

import { UserButton } from '@clerk/nextjs';
import { Coins } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/credits')
      .then(res => res.json())
      .then(data => setCredits(data.balance))
      .catch(() => setCredits(null));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="md:hidden">
          {/* Mobile menu button could go here */}
          <Image
            src="/logo.png"
            alt="Not a Bot"
            width={100}
            height={33}
            className="h-6 w-auto dark:invert"
          />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          {credits !== null && (
            <Badge variant="secondary" className="gap-1">
              <Coins className="h-3 w-3" />
              {credits} credits
            </Badge>
          )}
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
