'use client';

import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { AnalyticsRenderer } from './analytics-renderer';
import type { UITree, VideoSpec } from '@/hooks/use-analytics-chat';
import { SpecPlayer } from '@/components/remotion/SpecPlayer';
import { useDrawingBridgeOptional } from '@/contexts/drawing-bridge-context';
import { Button } from '@/components/ui/button';
import { Pencil, Film, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { useHasFeatureOptional } from '@/contexts/feature-context';

interface MessageListProps {
  messages: UIMessage[];
  uiTrees: UITree[];
  videoSpecs: VideoSpec[];
  getMessageText: (message: UIMessage) => string;
}

/**
 * Loading skeleton shown while the generateVideo tool is executing.
 */
function VideoGeneratingCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Generating video...</p>
        <p className="text-xs text-muted-foreground">Building animated report from your data</p>
      </div>
    </div>
  );
}

/**
 * Compact card shown alongside the video player after creation.
 */
function VideoCreatedCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
        <Film className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Video report ready</p>
        <p className="text-xs text-muted-foreground">Click to play</p>
      </div>
    </div>
  );
}

/**
 * Compact card shown in chat when a diagram is created via createDiagram tool.
 */
function DiagramCreatedCard({ title }: { title: string }) {
  const drawingBridge = useDrawingBridgeOptional();
  const hasCanvasAccess = useHasFeatureOptional("canvas");

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
          onClick={() => drawingBridge.switchToDrawTab()}
        >
          View in Draw
        </Button>
      )}
    </div>
  );
}

/**
 * Displays the list of chat messages with rendered UI trees for analytics.
 * User messages are aligned to the right, assistant messages to the left.
 */
export function MessageList({ messages, uiTrees, videoSpecs, getMessageText }: MessageListProps) {
  // Track which UI tree we're on (matching them to assistant messages with generateUI)
  let treeIndex = 0;
  let videoIndex = 0;

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        const text = getMessageText(message);

        // Check if this assistant message has a generateUI tool call with output
        let hasUITree = false;
        let currentTreeIndex = -1;
        let hasVideo = false;
        let currentVideoIndex = -1;
        let isVideoGenerating = false;
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
                }
              }
              if (part.type === 'tool-generateVideo') {
                const toolPart = part as {
                  type: string;
                  state: string;
                  output?: unknown;
                };
                if (toolPart.state === 'output-available' && toolPart.output) {
                  hasVideo = true;
                  currentVideoIndex = videoIndex;
                  videoIndex++;
                } else if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
                  isVideoGenerating = true;
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
        const currentVideo = hasVideo && currentVideoIndex >= 0 ? videoSpecs[currentVideoIndex] : null;

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
                  : (hasUITree || hasVideo || hasDiagram || isVideoGenerating)
                    ? 'w-full bg-muted'
                    : 'max-w-[85%] bg-muted'
              )}
            >
              {/* Video & diagram cards render ABOVE text so streaming text doesn't push them down */}

              {/* Video generating indicator */}
              {isVideoGenerating && !hasVideo && (
                <div className="w-full mb-3">
                  <VideoGeneratingCard />
                </div>
              )}

              {/* Rendered video */}
              {currentVideo && (
                <div className="w-full mb-3 space-y-3">
                  <VideoCreatedCard />
                  <SpecPlayer spec={currentVideo as unknown as Record<string, unknown>} />
                </div>
              )}

              {/* Diagram created card */}
              {hasDiagram && (
                <div className="w-full mb-3">
                  <DiagramCreatedCard title={diagramTitle} />
                </div>
              )}

              {/* Rendered UI tree */}
              {currentTree && (
                <div className="w-full mb-3">
                  <AnalyticsRenderer tree={currentTree} />
                </div>
              )}

              {/* Text content — renders below media so streaming doesn't cause layout shift */}
              {text && (
                isUser ? (
                  <p className="text-sm whitespace-pre-wrap">{text}</p>
                ) : (
                  <MarkdownRenderer content={text} />
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
