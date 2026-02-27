'use client';

import { Sparkles } from 'lucide-react';
import { AstriqLogo } from '@/components/astriq-logo';

const SUGGESTIONS = [
  { label: 'Top videos', prompt: 'Show me my top performing videos this month' },
  { label: 'Engagement rate', prompt: "What's my engagement rate this week?" },
  { label: 'Best time to post', prompt: "What's my best time to post?" },
  { label: 'Content ideas', prompt: 'Give me 5 content ideas based on my niche' },
  { label: 'Weekly comparison', prompt: 'Compare my engagement this week vs last' },
  { label: 'Trend analysis', prompt: 'What trends should I hop on this week?' },
];

interface WorkspaceEmptyStateProps {
  onSuggestionClick: (prompt: string) => void;
}

export function WorkspaceEmptyState({ onSuggestionClick }: WorkspaceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-6">
        <AstriqLogo variant="icon" size="lg" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mb-2">
        What can I help you analyze?
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Ask about your TikTok analytics, get content ideas, or generate visual reports.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
        {SUGGESTIONS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => onSuggestionClick(chip.prompt)}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground hover:bg-accent/50"
          >
            <Sparkles className="h-3 w-3" />
            {chip.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground/60">
        Type <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">/</kbd> in the input for more prompts
      </p>
    </div>
  );
}
