'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pin, PinOff, Loader2 } from 'lucide-react';
import { UITree } from '@/hooks/use-analytics-chat';

interface PinButtonProps {
  tree: UITree;
  isPinned?: boolean;
  pinnedId?: number;
  onPin: (tree: UITree, title: string) => Promise<void>;
  onUnpin: (id: number) => Promise<void>;
}

export function PinButton({ tree, isPinned, pinnedId, onPin, onUnpin }: PinButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isPinned && pinnedId) {
        await onUnpin(pinnedId);
      } else {
        // Could prompt for title here
        const title = tree.props.title as string || 'Pinned Visualization';
        await onPin(tree, title);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={loading}
      title={isPinned ? 'Unpin' : 'Pin to dashboard'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPinned ? (
        <PinOff className="h-4 w-4" />
      ) : (
        <Pin className="h-4 w-4" />
      )}
    </Button>
  );
}
