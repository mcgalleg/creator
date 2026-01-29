'use client';

import { useState } from 'react';
import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { AnalyticsRenderer } from './analytics-renderer';
import type { UITree } from '@/hooks/use-analytics-chat';
import { usePinToCanvasOptional } from '@/contexts/pin-to-canvas-context';
import { Button } from '@/components/ui/button';
import { Pin, Check, Loader2, PinOff } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';

interface MessageListProps {
  messages: UIMessage[];
  uiTrees: UITree[];
  getMessageText: (message: UIMessage) => string;
}

/**
 * Extracts a title from the UI tree for the pinned component.
 * Looks for common title props or uses a default.
 */
function extractTitle(uiTree: UITree, fallback?: string): string {
  // Try to find a title in the root component's props
  if (uiTree.props?.title && typeof uiTree.props.title === 'string') {
    return uiTree.props.title;
  }

  // Try label for MetricCard components
  if (uiTree.props?.label && typeof uiTree.props.label === 'string') {
    return uiTree.props.label;
  }

  // Try to find a title in children (e.g., card with title child)
  if (uiTree.children) {
    for (const child of uiTree.children) {
      if (child.props?.title && typeof child.props.title === 'string') {
        return child.props.title;
      }
    }
  }

  // Component type as fallback
  if (uiTree.component) {
    return uiTree.component.replace(/([A-Z])/g, ' $1').trim();
  }

  return fallback || 'Analytics Visualization';
}

/**
 * Checks if a UI tree component is "pinnable" (meaningful standalone visualization)
 */
function isPinnableComponent(tree: UITree): boolean {
  const pinnableTypes = [
    'Card',
    'MetricCard',
    'MetricGroup',
    'BarChart',
    'LineChart',
    'AreaChart',
    'PieChart',
    'DataTable',
    'VideoCard',
    'TopVideosGrid',
    'EngagementTimeline',
  ];
  return pinnableTypes.includes(tree.component);
}

/**
 * Gets pinnable children from a UI tree (for multi-component responses)
 */
function getPinnableChildren(tree: UITree): UITree[] {
  // If the root itself is pinnable and has no pinnable children, return empty
  if (isPinnableComponent(tree)) {
    return [];
  }

  // Layout components (Row, Column, Grid) may contain multiple pinnable items
  const layoutTypes = ['Row', 'Column', 'Grid'];
  if (layoutTypes.includes(tree.component) && tree.children) {
    return tree.children.filter(isPinnableComponent);
  }

  // Check direct children
  if (tree.children) {
    const pinnable = tree.children.filter(isPinnableComponent);
    if (pinnable.length > 1) {
      return pinnable;
    }
  }

  return [];
}

interface PinButtonProps {
  uiTree: UITree;
  label?: string;
  size?: 'sm' | 'xs';
  variant?: 'default' | 'inline';
}

function PinButton({ uiTree, label, size = 'sm', variant = 'default' }: PinButtonProps) {
  const pinContext = usePinToCanvasOptional();
  const [status, setStatus] = useState<'idle' | 'pinning' | 'pinned'>('idle');

  if (!pinContext) {
    return null;
  }

  const handlePin = async () => {
    setStatus('pinning');
    try {
      const title = extractTitle(uiTree, label);
      await pinContext.pinToCanvas({ title, uiTree });
      setStatus('pinned');
      // Reset after a delay
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to pin to canvas:', error);
      setStatus('idle');
    }
  };

  const isXs = size === 'xs';
  const isInline = variant === 'inline';

  return (
    <Button
      variant="ghost"
      size={isXs ? 'sm' : 'sm'}
      onClick={handlePin}
      disabled={status === 'pinning'}
      className={cn(
        'pin-button gap-1 transition-all',
        isXs ? 'h-6 px-2 text-[10px]' : 'gap-1.5 text-xs',
        isInline && 'bg-background/90 backdrop-blur-sm shadow-sm border border-border/50 hover:bg-background',
        status === 'pinned' && 'text-green-500 pin-button-success'
      )}
    >
      {status === 'pinning' ? (
        <Loader2 className={cn('animate-spin', isXs ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      ) : status === 'pinned' ? (
        <Check className={cn(isXs ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      ) : (
        <Pin className={cn('pin-icon', isXs ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      )}
      {status === 'pinned' ? 'Pinned!' : isXs ? 'Pin' : 'Pin to Canvas'}
    </Button>
  );
}

/**
 * Renders a single component with an inline pin button
 */
function PinnableComponentWrapper({
  tree,
  index,
}: {
  tree: UITree;
  index: number;
}) {
  return (
    <div className="group/pinnable relative">
      <AnalyticsRenderer tree={tree} />
      {/* Inline pin button that appears on hover - larger hit area prevents flicker */}
      <div className="absolute -top-1 -right-1 p-3 z-10 opacity-0 group-hover/pinnable:opacity-100 transition-opacity duration-200">
        <PinButton uiTree={tree} size="xs" variant="inline" />
      </div>
    </div>
  );
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

        const currentTree = hasUITree && currentTreeIndex >= 0 ? uiTrees[currentTreeIndex] : null;

        return (
          <div
            key={message.id}
            className={cn(
              'flex message-appear',
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
                isUser ? (
                  <p className="text-sm whitespace-pre-wrap">{text}</p>
                ) : (
                  <MarkdownRenderer content={text} />
                )
              )}

              {/* Rendered UI tree */}
              {currentTree && (
                <div className={cn('w-full', text && 'mt-4')}>
                  {(() => {
                    const pinnableChildren = getPinnableChildren(currentTree);
                    const hasMultiplePinnable = pinnableChildren.length > 1;

                    if (hasMultiplePinnable) {
                      // Multiple pinnable components - render each with its own pin button
                      return (
                        <div className="space-y-4">
                          {/* Render any non-pinnable content first (like headings) */}
                          {currentTree.children
                            ?.filter((child) => !isPinnableComponent(child))
                            .map((child, idx) => (
                              <AnalyticsRenderer key={`np-${idx}`} tree={child} />
                            ))}

                          {/* Render each pinnable component with its own pin button */}
                          {pinnableChildren.map((child, idx) => (
                            <PinnableComponentWrapper
                              key={`p-${idx}`}
                              tree={child}
                              index={idx}
                            />
                          ))}

                          {/* Option to pin all together */}
                          <div className="mt-3 flex justify-end border-t border-border/50 pt-3">
                            <PinButton uiTree={currentTree} label="All Components" />
                          </div>
                        </div>
                      );
                    }

                    // Single component or simple tree - render normally
                    return (
                      <>
                        <div className="group/pinnable relative">
                          <AnalyticsRenderer tree={currentTree} />
                          {/* Inline pin button for single component - larger hit area prevents flicker */}
                          {isPinnableComponent(currentTree) && (
                            <div className="absolute -top-1 -right-1 p-3 z-10 opacity-0 group-hover/pinnable:opacity-100 transition-opacity duration-200">
                              <PinButton uiTree={currentTree} size="xs" variant="inline" />
                            </div>
                          )}
                        </div>

                        {/* Pin to Canvas button */}
                        <div className="mt-3 flex justify-end border-t border-border/50 pt-3">
                          <PinButton uiTree={currentTree} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
