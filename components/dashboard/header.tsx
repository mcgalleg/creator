'use client';

import { UserButton } from '@clerk/nextjs';
import { Coins } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

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
          <span className="text-lg font-bold">TikTok Analytics</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          {credits !== null && (
            <Badge variant="secondary" className="gap-1">
              <Coins className="h-3 w-3" />
              {credits} credits
            </Badge>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
