'use client';

import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Type, StickyNote, Maximize, Trash2 } from 'lucide-react';

interface CommandPaletteProps {
  onAddNode?: (type: string, data?: Record<string, unknown>) => void;
  onFitView?: () => void;
  onClearCanvas?: () => void;
}

export function CommandPalette({ onAddNode, onFitView, onClearCanvas }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    command();
    setOpen(false);
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      onClearCanvas?.();
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Canvas">
          <CommandItem onSelect={() => runCommand(() => onAddNode?.('text-note', { content: '' }))}>
            <Type className="mr-2 h-4 w-4" />
            Add text note
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onAddNode?.('sticky-note', { content: '', color: 'yellow' }))}>
            <StickyNote className="mr-2 h-4 w-4" />
            Add sticky note
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onFitView?.())}>
            <Maximize className="mr-2 h-4 w-4" />
            Zoom to fit
          </CommandItem>
          <CommandItem onSelect={() => runCommand(handleClearCanvas)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear canvas
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
