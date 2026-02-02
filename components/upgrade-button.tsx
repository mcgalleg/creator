'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradeButtonProps {
  /** Optional additional CSS classes */
  className?: string;
  /** Button variant - defaults to 'default' */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** Button size - defaults to 'default' */
  size?: 'default' | 'sm' | 'lg';
}

/**
 * UpgradeButton component that navigates to the subscription settings page.
 *
 * @example
 * ```tsx
 * <UpgradeButton />
 * <UpgradeButton variant="outline" size="sm" />
 * ```
 */
export function UpgradeButton({
  className,
  variant = 'default',
  size = 'default',
}: UpgradeButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/dashboard/settings?tab=subscription');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(className)}
    >
      <Sparkles className="h-4 w-4" />
      Upgrade to Pro
    </Button>
  );
}
