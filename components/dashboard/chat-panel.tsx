'use client';

import { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, AlertCircle, X, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAnalyticsChat } from '@/hooks/use-analytics-chat';
import { ChatInput } from '@/components/chat/chat-input';
import { MessageList } from '@/components/chat/message-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useDrawingBridgeOptional } from '@/contexts/drawing-bridge-context';
import { useSyncOptional } from '@/contexts/sync-context';
import { useCredits } from '@/hooks/use-credits';
import { Button } from '@/components/ui/button';
import type { DiagramResult } from '@/hooks/use-analytics-chat';

/**
 * Chat panel component that integrates with the analytics chat hook.
 * Visualizations render inline in the chat by default.
 * Diagrams are pushed to the Excalidraw Draw tab via the drawing bridge.
 */
export function ChatPanel({ onClose }: { onClose?: () => void }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const drawingBridge = useDrawingBridgeOptional();
  const syncContext = useSyncOptional();
  const { aiTokens } = useCredits();

  const handleDiagramGenerated = useCallback((diagram: DiagramResult) => {
    if (drawingBridge) {
      drawingBridge.pushElements({
        title: diagram.title,
        elements: diagram.elements,
      });
    }
  }, [drawingBridge]);

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
    onDiagramGenerated: handleDiagramGenerated,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await submitMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Chat Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium flex-1">Analytics Assistant</span>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Ask me about your analytics!</p>
            <p className="text-sm mt-2">Try:</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>&quot;Show my top 5 videos&quot;</li>
              <li>&quot;What&apos;s my engagement rate?&quot;</li>
              <li>&quot;Compare my performance this week&quot;</li>
            </ul>
          </div>
        ) : (
          <MessageList
            messages={messages}
            uiTrees={uiTrees}
            getMessageText={getMessageText}
          />
        )}

        {/* Loading skeleton while generating */}
        {isGenerating && (
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
        <div ref={messagesEndRef} />
      </div>

      {/* AI tokens depleted prompt */}
      {aiTokens !== null && aiTokens <= 0 && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="flex-1 text-muted-foreground">
            You&apos;re out of AI tokens.{" "}
            <Link href="/pricing" className="font-medium text-primary hover:underline">
              Subscribe for 1M/month
              <ArrowRight className="inline ml-0.5 h-3 w-3" />
            </Link>
          </span>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 border-t bg-background">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading || isGenerating}
        />
      </div>
    </div>
  );
}
