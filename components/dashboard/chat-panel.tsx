'use client';

import { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { useAnalyticsChat, type UITree } from '@/hooks/use-analytics-chat';
import { ChatInput } from '@/components/chat/chat-input';
import { MessageList } from '@/components/chat/message-list';
import { Skeleton } from '@/components/ui/skeleton';
import { usePinToCanvasOptional } from '@/contexts/pin-to-canvas-context';

/**
 * Extracts a title from a UI tree for display purposes.
 */
function extractTitle(tree: UITree): string | null {
  if (tree.props?.title && typeof tree.props.title === 'string') {
    return tree.props.title;
  }
  if (tree.props?.label && typeof tree.props.label === 'string') {
    return tree.props.label;
  }
  // Use component name as fallback (convert PascalCase to Title Case)
  if (tree.component) {
    return tree.component.replace(/([A-Z])/g, ' $1').trim();
  }
  return null;
}

/**
 * Chat panel component that integrates with the analytics chat hook.
 * This is the left-side panel in the split-pane layout.
 */
export function ChatPanel() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track canvas node IDs for each message
  const [canvasNodeIds, setCanvasNodeIds] = useState<Map<string, string>>(new Map());

  // Get canvas context for rendering visualizations
  const pinContext = usePinToCanvasOptional();

  const {
    messages,
    submitMessage,
    isLoading,
    isGenerating,
    uiTrees,
    error,
    getMessageText,
  } = useAnalyticsChat({
    onVisualizationGenerated: async (newTrees) => {
      if (!pinContext) return;

      // Render each new tree to the canvas
      for (const tree of newTrees) {
        try {
          const nodeId = await pinContext.renderToCanvas({
            title: extractTitle(tree) || 'Visualization',
            uiTree: tree,
          });

          // Find the message that contains this tree and associate the node ID
          // We look for the most recent assistant message
          const assistantMessages = messages.filter(m => m.role === 'assistant');
          const latestMessage = assistantMessages[assistantMessages.length - 1];

          if (latestMessage) {
            setCanvasNodeIds(prev => {
              const next = new Map(prev);
              next.set(latestMessage.id, nodeId);
              return next;
            });
          }
        } catch (error) {
          console.error('Failed to render visualization to canvas:', error);
        }
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Handle "View on Canvas" button click - could implement pan-to-node later
  const handleViewOnCanvas = useCallback((nodeId: string) => {
    // For now, just log - could implement canvas panning to the node
    console.log('View on canvas:', nodeId);
  }, []);

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
        <span className="text-sm font-medium">Analytics Assistant</span>
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
            canvasNodeIds={canvasNodeIds}
            onViewOnCanvas={handleViewOnCanvas}
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
