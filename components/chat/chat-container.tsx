'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAnalyticsChat } from '@/hooks/use-analytics-chat';
import { ChatInput } from './chat-input';
import { MessageList } from './message-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { useSyncOptional } from '@/contexts/sync-context';

/**
 * Main chat interface component that combines all chat pieces.
 * Uses the useAnalyticsChat hook to manage conversation state
 * and renders AI-generated UI trees for analytics visualizations.
 */
export function ChatContainer() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex-shrink-0 border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Analytics Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4">
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
