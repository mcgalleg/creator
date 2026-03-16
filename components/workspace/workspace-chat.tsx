'use client';

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Sparkles, ArrowRight, X, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import { useAnalyticsChat } from '@/hooks/use-analytics-chat';
import { MessageList } from '@/components/chat/message-list';
import { WorkspaceChatInput } from './workspace-chat-input';
import { WorkspaceEmptyState } from './workspace-empty-state';
import { WorkspaceSyncBanner } from './workspace-sync-banner';
import { ConnectorPopover } from './connector-popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useSyncOptional } from '@/contexts/sync-context';
import { useCredits } from '@/hooks/use-credits';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const emptySubscribe = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;

interface WorkspaceChatProps {
  accounts: Array<{ id: number; username: string; avatarUrl: string | null }>;
  goals?: string[];
}

/**
 * Primary workspace view — centered, full-width AI chat interface.
 * Uses RAF-debounced scroll with near-bottom detection for smooth streaming.
 */
export function WorkspaceChat({ accounts: serverAccounts, goals }: WorkspaceChatProps) {
  const [input, setInput] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const rafIdRef = useRef<number>(0);
  const hasAutoSubmittedRef = useRef(false);
  const syncContext = useSyncOptional();
  const { aiTokens } = useCredits();
  const searchParams = useSearchParams();

  // Prefer live accounts from SyncContext (updates without page refresh),
  // fall back to server-rendered props for initial load.
  const liveAccounts = syncContext?.accounts;
  const accounts = liveAccounts && liveAccounts.length > 0
    ? liveAccounts.map((a) => ({ id: a.id, username: a.username, avatarUrl: a.avatarUrl }))
    : serverAccounts;

  // Account selection: auto-select for single account, empty for multi
  const STORAGE_KEY = 'astriq:selectedAccountIds';
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>(() => {
    if (syncContext?.selectedAccountId) return [syncContext.selectedAccountId];
    if (serverAccounts.length === 1) return [serverAccounts[0].id];
    return [];
  });

  // Restore persisted selection from localStorage after hydration
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as number[];
        const valid = parsed.filter((id) =>
          accounts.some((a) => a.id === id)
        );
        if (valid.length > 0) {
          setSelectedAccountIds(valid);
        }
      }
    } catch {}
  }, [accounts]);

  // Persist selection to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedAccountIds));
    } catch {}
  }, [selectedAccountIds]);

  // Auto-select newly added accounts so users see them immediately
  const prevAccountIdsRef = useRef(new Set(accounts.map((a) => a.id)));
  useEffect(() => {
    const currentIds = new Set(accounts.map((a) => a.id));
    const newIds = [...currentIds].filter((id) => !prevAccountIdsRef.current.has(id));
    if (newIds.length > 0) {
      setSelectedAccountIds((prev) => [...prev, ...newIds.filter((id) => !prev.includes(id))]);
    }
    prevAccountIdsRef.current = currentIds;
  }, [accounts]);

  const addAccount = useCallback((id: number) => {
    setSelectedAccountIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeAccount = useCallback((id: number) => {
    setSelectedAccountIds((prev) => prev.filter((aid) => aid !== id));
  }, []);

  const unselectedAccounts = accounts.filter((a) => !selectedAccountIds.includes(a.id));
  const isSingleAccount = accounts.length === 1;
  const noAccountSelected = accounts.length > 1 && selectedAccountIds.length === 0;

  // Defer Radix components to avoid hydration mismatch from dynamic IDs
  const isMounted = useSyncExternalStore(emptySubscribe, returnTrue, returnFalse);

  // Connector state — fetched from API via SWR
  const { data: enabledConnectors = [], mutate: mutateConnectors } = useSWR<string[]>(
    '/api/connectors/me',
    fetcher,
  );

  const handleConnectorToggle = useCallback(async (id: string, enabled: boolean) => {
    // Optimistic update
    const next = enabled
      ? [...enabledConnectors, id]
      : enabledConnectors.filter((c) => c !== id);
    mutateConnectors(next, false);

    try {
      await fetch('/api/connectors/me/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectorId: id, enabled }),
      });
      mutateConnectors();
    } catch {
      // Revert on error
      mutateConnectors();
    }
  }, [enabledConnectors, mutateConnectors]);

  const [isArtifactRendering, setIsArtifactRendering] = useState(false);

  const {
    messages,
    submitMessage,
    isLoading,
    isGenerating,
    error,
    insufficientCredits,
    updateModelContext,
  } = useAnalyticsChat({
    selectedAccountIds,
    enabledConnectors,
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

  const toolbarContent = (
    <div className="flex items-center gap-1.5 flex-wrap">
      <ConnectorPopover
        enabledConnectors={enabledConnectors}
        onToggle={handleConnectorToggle}
      />
      {accounts.length > 0 && (
        <>
        {selectedAccountIds.map((id) => {
          const acct = accounts.find((a) => a.id === id);
          if (!acct) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm"
            >
              {acct.avatarUrl && (
                <Image src={acct.avatarUrl} alt={acct.username} width={18} height={18} className="h-4.5 w-4.5 rounded-full" unoptimized />
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
          isMounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
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
                        <Image src={account.avatarUrl} alt={account.username} width={16} height={16} className="h-4 w-4 rounded-full" unoptimized />
                      )}
                      <span>@{account.username}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          )
        )}
        </>
      )}
    </div>
  );

  const inputElement = (
    <div className="space-y-3">
      <WorkspaceChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading || isBusy}
        disabled={tokensExhausted || noAccountSelected}
        placeholder={noAccountSelected ? 'Select an account to start chatting' : undefined}
        toolbar={toolbarContent}
      />
    </div>
  );

  const hasMessages = messages.length > 0;

  // Empty state: centered layout with input inline (like Claude AI new chat)
  if (!hasMessages) {
    return (
      <div className="flex flex-col h-full">
        <WorkspaceSyncBanner />
        <div className="flex-1 flex flex-col items-center justify-center">
          <WorkspaceEmptyState onSuggestionClick={handleSuggestionClick} goals={goals}>
            {inputElement}
          </WorkspaceEmptyState>
        </div>
      </div>
    );
  }

  // Active chat: floating input over scrollable messages
  return (
    <div className="relative h-full">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
        <div className="mx-auto max-w-3xl px-4 py-6 pb-48">
          <WorkspaceSyncBanner />
          <MessageList
            messages={messages}
            isStreaming={isGenerating}
            onBusyChange={setIsArtifactRendering}
            onAppMessage={submitMessage}
            onUpdateModelContext={updateModelContext}
          />

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
            insufficientCredits ? (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5 text-sm">
                <div className="space-y-1.5">
                    <p className="font-medium text-foreground">You&apos;ve used all your AI tokens <span className="text-base">😊</span></p>
                    <p className="text-muted-foreground">
                      Recharge to keep the insights flowing — pick up a token pack or upgrade your plan for monthly tokens.
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <Link
                        href="/pricing#ai-tokens"
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Get more tokens
                      </Link>
                      <Link
                        href="/pricing"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        View plans
                        <ArrowRight className="inline ml-0.5 h-3 w-3" />
                      </Link>
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive text-sm mt-4 p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Error: {error.message}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Floating input with gradient fade — no hard divider */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none">
        <div className="h-20 bg-gradient-to-t from-background to-transparent" />
        <div className="bg-background pointer-events-auto pb-4">
          <div className="mx-auto max-w-3xl px-4">
            {inputElement}
          </div>
        </div>
      </div>
    </div>
  );
}
