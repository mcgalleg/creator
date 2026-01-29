'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { shortcutDefinitions, type ShortcutDefinition } from '@/hooks/use-keyboard-shortcuts';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ShortcutKey({ shortcut }: { shortcut: string }) {
  const keys = shortcut.split(' / ').flatMap((k) => k.split(' + '));

  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && (
            <span className="text-muted-foreground text-xs">
              {shortcut.includes(' / ') && index === keys.indexOf(key) ? '/' : '+'}
            </span>
          )}
          <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded shadow-sm">
            {key}
          </kbd>
        </span>
      ))}
    </div>
  );
}

function ShortcutCategory({
  title,
  shortcuts,
}: {
  title: string;
  shortcuts: ShortcutDefinition[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.key}
            className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
          >
            <span className="text-sm text-foreground">{shortcut.description}</span>
            <ShortcutKey shortcut={shortcut.key} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const canvasShortcuts = shortcutDefinitions.filter((s) => s.category === 'canvas');
  const nodeShortcuts = shortcutDefinitions.filter((s) => s.category === 'nodes');
  const navigationShortcuts = shortcutDefinitions.filter((s) => s.category === 'navigation');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick reference for keyboard shortcuts available in the canvas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <ShortcutCategory title="Canvas" shortcuts={canvasShortcuts} />
          <ShortcutCategory title="Nodes" shortcuts={nodeShortcuts} />
          <ShortcutCategory title="Navigation" shortcuts={navigationShortcuts} />
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">Esc</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
