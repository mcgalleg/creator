'use client';

import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { AnalyticsRenderer } from './analytics-renderer';
import type { UITree } from '@/hooks/use-analytics-chat';

interface MessageListProps {
  messages: UIMessage[];
  uiTrees: UITree[];
  getMessageText: (message: UIMessage) => string;
}

/**
 * Displays the list of chat messages with rendered UI trees for analytics.
 * User messages are aligned to the right, assistant messages to the left.
 */
export function MessageList({ messages, uiTrees, getMessageText }: MessageListProps) {
  // Track which UI tree we're on (matching them to assistant messages with generateUI)
  let treeIndex = 0;

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        const text = getMessageText(message);

        // Check if this assistant message has a generateUI tool call with output
        let hasUITree = false;
        let currentTreeIndex = -1;

        if (message.role === 'assistant') {
          for (const part of message.parts) {
            if (
              typeof part.type === 'string' &&
              part.type === 'tool-generateUI'
            ) {
              const toolPart = part as {
                type: string;
                state: string;
                output?: unknown;
              };
              if (toolPart.state === 'output-available' && toolPart.output) {
                hasUITree = true;
                currentTreeIndex = treeIndex;
                treeIndex++;
                break;
              }
            }
          }
        }

        return (
          <div
            key={message.id}
            className={cn(
              'flex',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'rounded-lg px-4 py-3',
                isUser
                  ? 'max-w-[85%] bg-primary text-primary-foreground'
                  : hasUITree
                    ? 'w-full bg-muted'
                    : 'max-w-[85%] bg-muted'
              )}
            >
              {/* Text content */}
              {text && (
                <p className="text-sm whitespace-pre-wrap">{text}</p>
              )}

              {/* Rendered UI tree */}
              {hasUITree && currentTreeIndex >= 0 && uiTrees[currentTreeIndex] && (
                <div className={cn('w-full', text && 'mt-4')}>
                  <AnalyticsRenderer tree={uiTrees[currentTreeIndex]} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
