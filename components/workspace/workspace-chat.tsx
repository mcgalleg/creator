'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Sparkles, ArrowRight, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAnalyticsChat } from '@/hooks/use-analytics-chat';
import { MessageList } from '@/components/chat/message-list';
import { WorkspaceChatInput } from './workspace-chat-input';
import { WorkspaceEmptyState } from './workspace-empty-state';
import { WorkspaceSyncBanner } from './workspace-sync-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { useSyncOptional } from '@/contexts/sync-context';
import { useCredits } from '@/hooks/use-credits';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkspaceChatProps {
  accounts: Array<{ id: number; username: string; avatarUrl: string | null }>;
  goals?: string[];
}

/**
 * Primary workspace view — centered, full-width AI chat interface.
 * Replaces the old split-pane ChatPanel + ViewTabs layout.
 * Uses RAF-debounced scroll with near-bottom detection for smooth streaming.
 */
export function WorkspaceChat({ accounts, goals }: WorkspaceChatProps) {
  const [input, setInput] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const rafIdRef = useRef<number>(0);
  const hasAutoSubmittedRef = useRef(false);
  const syncContext = useSyncOptional();
  const { aiTokens } = useCredits();
  const searchParams = useSearchParams();

  // Account selection: auto-select for single account, empty for multi
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>(() => {
    if (syncContext?.selectedAccountId) return [syncContext.selectedAccountId];
    if (accounts.length === 1) return [accounts[0].id];
    return [];
  });

  const addAccount = useCallback((id: number) => {
    setSelectedAccountIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeAccount = useCallback((id: number) => {
    setSelectedAccountIds((prev) => prev.filter((aid) => aid !== id));
  }, []);

  const unselectedAccounts = accounts.filter((a) => !selectedAccountIds.includes(a.id));
  const isSingleAccount = accounts.length === 1;
  const noAccountSelected = accounts.length > 1 && selectedAccountIds.length === 0;

  const [isArtifactRendering, setIsArtifactRendering] = useState(false);

  const {
    messages,
    submitMessage,
    isLoading,
    isGenerating,
    error,
    insufficientCredits,
  } = useAnalyticsChat({
    selectedAccountIds,
  });

  const isBusy = isGenerating || isArtifactRendering;
  const tokensExhausted = insufficientCredits || (aiTokens !== null && aiTokens <= 0);

  // Near-bottom detection for scroll
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  // RAF-debounced auto-scroll — only scrolls when user is near bottom
  useEffect(() => {
    if (!isNearBottomRef.current) return;
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [messages, isBusy]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafIdRef.current);
  }, []);

  // Auto-submit ?q= query param from hero-prompt flow
  useEffect(() => {
    if (hasAutoSubmittedRef.current) return;
    const q = searchParams.get('q');
    if (q && q.trim()) {
      hasAutoSubmittedRef.current = true;
      submitMessage(q.trim());
    }
  }, [searchParams, submitMessage]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isLoading || noAccountSelected) return;
    const message = input;
    setInput('');
    isNearBottomRef.current = true;
    submitMessage(message);
  }, [input, isLoading, noAccountSelected, submitMessage]);

  const handleSuggestionClick = useCallback((prompt: string) => {
    if (noAccountSelected) return;
    isNearBottomRef.current = true;
    submitMessage(prompt);
  }, [noAccountSelected, submitMessage]);

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-3xl px-4 py-6">
          <WorkspaceSyncBanner />
          {messages.length === 0 ? (
            <WorkspaceEmptyState onSuggestionClick={handleSuggestionClick} goals={goals} />
          ) : (
            <MessageList
              messages={messages}
              isStreaming={isGenerating}
              onBusyChange={setIsArtifactRendering}
            />
          )}

          {/* Loading skeleton while generating or rendering artifacts */}
          {isBusy && (
            <div className="flex justify-start mt-4">
              <div className="bg-muted rounded-lg px-4 py-3 max-w-[85%]">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm mt-4 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Error: {error.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom input area */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-3xl px-4 py-4 space-y-3">
          {/* AI tokens depleted prompt */}
          {tokensExhausted && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="flex-1 text-muted-foreground">
                You&apos;re out of AI tokens.{' '}
                <Link href="/pricing" className="font-medium text-primary hover:underline">
                  Subscribe for 1M/month
                  <ArrowRight className="inline ml-0.5 h-3 w-3" />
                </Link>
              </span>
            </div>
          )}

          <WorkspaceChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading || isBusy}
            disabled={tokensExhausted || noAccountSelected}
            placeholder={noAccountSelected ? 'Select an account to start chatting' : undefined}
            toolbar={
              accounts.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedAccountIds.map((id) => {
                    const acct = accounts.find((a) => a.id === id);
                    if (!acct) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm"
                      >
                        {acct.avatarUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={acct.avatarUrl} alt={acct.username} className="h-4.5 w-4.5 rounded-full" />
                        )}
                        <span className="truncate max-w-[120px]">@{acct.username}</span>
                        {!isSingleAccount && (
                          <button
                            type="button"
                            onClick={() => removeAccount(id)}
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                            aria-label={`Remove @${acct.username}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                  {!isSingleAccount && unselectedAccounts.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {unselectedAccounts.map((account) => (
                          <DropdownMenuItem key={account.id} onSelect={() => addAccount(account.id)}>
                            <div className="flex items-center gap-2">
                              {account.avatarUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={account.avatarUrl} alt={account.username} className="h-4 w-4 rounded-full" />
                              )}
                              <span>@{account.username}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
