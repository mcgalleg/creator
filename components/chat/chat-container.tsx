'use client';

import { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import { useAnalyticsChat } from '@/hooks/use-analytics-chat';
import { ChatInput } from './chat-input';
import { MessageList } from './message-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useSyncOptional } from '@/contexts/sync-context';

/**
 * Main chat interface component that combines all chat pieces.
 * Uses the useAnalyticsChat hook to manage conversation state
 * and renders AI-generated UI trees for analytics visualizations.
 */
export function ChatContainer() {
  const [input, setInput] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const rafIdRef = useRef<number>(0);
  const syncContext = useSyncOptional();

  const {
    messages,
    submitMessage,
    isLoading,
    isGenerating,
    uiTrees,
    error,
    getMessageText,
  } = useAnalyticsChat({
    selectedAccountId: syncContext?.selectedAccountId,
  });

  // Track whether user is near the bottom of the scroll container
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    // Consider "near bottom" if within 150px of the bottom edge
    // (generous threshold so CSS smooth scroll mid-animation doesn't false-negative)
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  // Auto-scroll: use direct scrollTop (no competing smooth animations)
  // and debounce to one update per animation frame
  useEffect(() => {
    if (!isNearBottomRef.current) return;

    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [messages, isGenerating]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafIdRef.current);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    // User just sent a message — they want to see the response
    isNearBottomRef.current = true;
    await submitMessage(message);
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex-shrink-0 border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Analytics Assistant
        </CardTitle>
      </CardHeader>

      <CardContent ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scroll-smooth p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Ask me about your TikTok analytics!</p>
            <p className="text-sm mt-2">Try:</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>&quot;Show my top 5 videos&quot;</li>
              <li>&quot;What&apos;s my engagement rate?&quot;</li>
              <li>&quot;Compare my performance this week&quot;</li>
            </ul>
            <Link href="/docs/ai-copilot" className="text-xs text-primary hover:underline mt-3 inline-block">
              Learn more about AI Copilot
            </Link>
          </div>
        ) : (
          <MessageList
            messages={messages}
            uiTrees={uiTrees}
            getMessageText={getMessageText}
          />
        )}

        {/* Loading skeleton: only show while waiting for first token, not during active streaming */}
        {isLoading && (
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

        {/* Scroll anchor */}
        <div />
      </CardContent>

      <div className="flex-shrink-0 p-4 border-t">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading || isGenerating}
        />
      </div>
    </Card>
  );
}
