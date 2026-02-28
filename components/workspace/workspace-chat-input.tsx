'use client';

import { useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SlashCommandMenu,
  type SlashCommandMenuHandle,
} from './slash-command-menu';

interface WorkspaceChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Rendered inside the input box, below the textarea — e.g. account chips */
  toolbar?: React.ReactNode;
}

export function WorkspaceChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled,
  placeholder = 'Type / for suggestions...',
  toolbar,
}: WorkspaceChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<SlashCommandMenuHandle>(null);
  const isDisabled = isLoading || disabled;

  const slashMenuOpen = value.startsWith('/');
  const slashFilter = slashMenuOpen ? value.slice(1) : '';

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // Clamp to ~6 rows max (approx 144px)
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [value]);

  const handleSlashSelect = useCallback(
    (prompt: string) => {
      onChange(prompt);
      // Refocus textarea and move cursor to end
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.selectionStart = el.selectionEnd = prompt.length;
        }
      });
    },
    [onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashMenuOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onChange('');
        return;
      }
      if (menuRef.current?.handleKeyDown(e)) {
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative rounded-2xl border bg-background shadow-sm transition-shadow focus-within:shadow-md">
      <SlashCommandMenu
        ref={menuRef}
        open={slashMenuOpen}
        search={slashFilter}
        onSelect={handleSlashSelect}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={1}
        className="w-full resize-none bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
      />
      {/* Bottom toolbar: chips on the left, submit button on the right */}
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <div className="flex-1 min-w-0">{toolbar}</div>
        <Button
          type="button"
          size="icon"
          disabled={isDisabled || !value.trim()}
          onClick={onSubmit}
          className="h-8 w-8 shrink-0 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
