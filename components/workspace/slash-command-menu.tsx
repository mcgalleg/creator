'use client';

import { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { PROMPT_CATALOG } from '@/lib/prompt-catalog';

export interface SlashCommandMenuHandle {
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
}

interface SlashCommandMenuProps {
  open: boolean;
  search: string;
  onSelect: (prompt: string) => void;
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, SlashCommandMenuProps>(
  function SlashCommandMenu({ open, search, onSelect }, ref) {
    const commandRef = useRef<HTMLDivElement>(null);

    const dispatchKey = useCallback(
      (key: string) => {
        const el = commandRef.current;
        if (!el) return;
        // Dispatch a keyboard event into the cmdk container
        el.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
        );
      },
      []
    );

    useImperativeHandle(ref, () => ({
      handleKeyDown(e: React.KeyboardEvent): boolean {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          dispatchKey(e.key);
          return true;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          // Find the currently aria-selected item and trigger its select
          const selected = commandRef.current?.querySelector(
            '[cmdk-item][aria-selected="true"]'
          ) as HTMLElement | null;
          if (selected) {
            selected.click();
          }
          return true;
        }
        return false;
      },
    }));

    if (!open) return null;

    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
        <Command
          ref={commandRef}
          className="rounded-xl border bg-popover shadow-lg"
          shouldFilter={true}
        >
          {/* Hidden input drives cmdk's built-in fuzzy matching */}
          <div className="sr-only">
            <CommandInput value={search} />
          </div>
          <CommandList className="max-h-[320px]">
            <CommandEmpty>No matching prompts</CommandEmpty>
            {PROMPT_CATALOG.map((category) => (
              <CommandGroup key={category.name} heading={category.name}>
                {category.items.map((item) => (
                  <CommandItem
                    key={item.prompt}
                    value={`${item.label} ${item.prompt}`}
                    onSelect={() => onSelect(item.prompt)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="font-medium text-sm">{item.label}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {item.prompt}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </div>
    );
  }
);
