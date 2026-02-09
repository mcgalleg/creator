import Link from 'next/link';
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

export function UpgradeButton({
  className,
  variant = 'default',
  size = 'default',
}: UpgradeButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      asChild
      className={cn(className)}
    >
      <Link href="/pricing">
        <Sparkles className="h-4 w-4" />
        Upgrade Now
      </Link>
    </Button>
  );
}
