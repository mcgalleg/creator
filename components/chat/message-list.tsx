'use client';

import { useState } from 'react';
import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { AnalyticsRenderer } from './analytics-renderer';
import type { UITree } from '@/hooks/use-analytics-chat';
import { useDrawingBridgeOptional } from '@/contexts/drawing-bridge-context';
import { Button } from '@/components/ui/button';
import { Pencil, Check, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { VisualizationReference } from './visualization-reference';
import { useFeaturesOptional } from '@/contexts/feature-context';

interface MessageListProps {
  messages: UIMessage[];
  uiTrees: UITree[];
  getMessageText: (message: UIMessage) => string;
  canvasNodeIds?: Map<string, string>; // messageId -> nodeId mapping
  onViewOnCanvas?: (nodeId: string) => void;
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

/**
 * Compact card shown in chat when a diagram is created via createDiagram tool.
 */
function DiagramCreatedCard({ title }: { title: string }) {
  const drawingBridge = useDrawingBridgeOptional();
  const featureContext = useFeaturesOptional();
  const hasCanvasAccess = featureContext?.hasAccess("canvas") ?? false;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
        <Pencil className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground">Diagram added to Draw tab</p>
      </div>
      {hasCanvasAccess && drawingBridge && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs shrink-0"
          onClick={() => drawingBridge.markContentViewed()}
        >
          View in Draw
        </Button>
      )}
    </div>
  );
}

interface PinButtonProps {
  uiTree: UITree;
  label?: string;
  size?: 'sm' | 'xs';
  variant?: 'default' | 'inline';
}

function PinButton({ uiTree, label, size = 'sm', variant = 'default' }: PinButtonProps) {
  const drawingBridge = useDrawingBridgeOptional();
  const featureContext = useFeaturesOptional();
  const [status, setStatus] = useState<'idle' | 'pinning' | 'pinned'>('idle');

  const hasCanvasAccess = featureContext?.hasAccess("canvas") ?? false;

  if (!drawingBridge || !hasCanvasAccess) {
    return null;
  }

  const handlePin = async () => {
    setStatus('pinning');
    try {
      // For UI trees, we don't push to drawing bridge (they render inline)
      // This button is kept for consistency but could be removed
      setStatus('pinned');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to pin:', error);
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
        <Pencil className={cn('pin-icon', isXs ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      )}
      {status === 'pinned' ? 'Done!' : isXs ? 'Pin' : 'Pin to Canvas'}
    </Button>
  );
}

/**
 * Renders a single component with an inline pin button
 */
function PinnableComponentWrapper({
  tree,
}: {
  tree: UITree;
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
 *
 * When canvasNodeIds is provided, visualizations are shown as compact reference
 * cards instead of full inline renderings. This allows the chat to remain
 * lightweight while the full visualizations live on the canvas.
 */
export function MessageList({ messages, uiTrees, getMessageText, canvasNodeIds, onViewOnCanvas }: MessageListProps) {
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
        let hasDiagram = false;
        let diagramTitle = '';

        if (message.role === 'assistant') {
          for (const part of message.parts) {
            if (typeof part.type === 'string') {
              if (part.type === 'tool-generateUI') {
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
              if (part.type === 'tool-createDiagram') {
                const toolPart = part as {
                  type: string;
                  state: string;
                  output?: { title?: string; elements?: unknown[] };
                };
                if (toolPart.state === 'output-available' && toolPart.output?.elements) {
                  hasDiagram = true;
                  diagramTitle = toolPart.output.title || 'Diagram';
                }
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
                  : (hasUITree || hasDiagram)
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

              {/* Diagram created card */}
              {hasDiagram && (
                <div className={cn('w-full', text && 'mt-4')}>
                  <DiagramCreatedCard title={diagramTitle} />
                </div>
              )}

              {/* Rendered UI tree */}
              {currentTree && (
                <div className={cn('w-full', text && 'mt-4')}>
                  {(() => {
                    // If we have canvas node IDs, show compact reference cards instead of full visualizations
                    const nodeId = canvasNodeIds?.get(message.id);
                    if (canvasNodeIds && nodeId) {
                      return (
                        <VisualizationReference
                          title={extractTitle(currentTree)}
                          nodeId={nodeId}
                          componentType={currentTree.component}
                          onViewOnCanvas={() => onViewOnCanvas?.(nodeId)}
                        />
                      );
                    }

                    // If canvasNodeIds is provided but no nodeId for this message yet,
                    // show a minimal placeholder (visualization is being added to canvas)
                    if (canvasNodeIds) {
                      return (
                        <VisualizationReference
                          title={extractTitle(currentTree)}
                          nodeId=""
                          componentType={currentTree.component}
                        />
                      );
                    }

                    // Fallback: render full visualization inline (legacy behavior)
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
