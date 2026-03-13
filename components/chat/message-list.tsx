'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useJsonRenderMessage, Renderer, JSONUIProvider, type DataPart } from '@json-render/react';
import { isToolUIPart } from 'ai';
import { registry } from '@/lib/registry';
import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './markdown-renderer';
import { McpAppRenderer } from './mcp-app-renderer';
import useSWR from 'swr';

const connectorFetcher = (url: string) => fetch(url).then((r) => r.json());
import { useArtifactCopy } from '@/hooks/use-artifact-copy';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Copy, Check, Download, Image } from 'lucide-react';

interface MessageListProps {
  messages: UIMessage[];
  isStreaming: boolean;
  /** Called when async artifact rendering starts/finishes */
  onBusyChange?: (busy: boolean) => void;
  /** Called when an MCP App sends a message to inject into chat */
  onAppMessage?: (text: string) => void;
  /** Called when an MCP App updates model context */
  onUpdateModelContext?: (ctx: { content?: unknown[]; structuredContent?: Record<string, unknown> }) => void;
}

/**
 * Displays the list of chat messages with progressive spec rendering.
 *
 * When the stream ends on a message that contains a spec, the JSONUIProvider
 * remounts (key change) causing a full re-render. `onBusyChange` bridges
 * that gap so the parent keeps its loading indicator active until the
 * browser has actually painted the final artifact.
 */
export function MessageList({ messages, isStreaming, onBusyChange, onAppMessage, onUpdateModelContext }: MessageListProps) {
  const { data: connectorCatalog } = useSWR<Array<{ mcpServerUrl: string; sandboxPermissions: string | null }>>('/api/connectors', connectorFetcher);
  const wasStreamingRef = useRef(isStreaming);

  useEffect(() => {
    // Detect the streaming → done transition.
    // The JSONUIProvider key is now stable (message.id), so no remount happens.
    // Just signal a brief busy period for one paint cycle.
    if (wasStreamingRef.current && !isStreaming && onBusyChange) {
      onBusyChange(true);
      const rafId = requestAnimationFrame(() => onBusyChange(false));
      wasStreamingRef.current = false;
      return () => { cancelAnimationFrame(rafId); onBusyChange(false); };
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, onBusyChange]);

  return (
    <div className="space-y-4">
      {messages.map((message, i) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={isStreaming && i === messages.length - 1}
          onAppMessage={onAppMessage}
          onUpdateModelContext={onUpdateModelContext}
          connectorCatalog={connectorCatalog}
        />
      ))}
    </div>
  );
}

/** Metadata attached by the chat route when an MCP tool has a UI resource */
interface McpAppUiMeta {
  serverUrl: string;
  resourceUri: string;
}

function MessageBubble({
  message,
  isStreaming,
  onAppMessage,
  onUpdateModelContext,
  connectorCatalog,
}: {
  message: UIMessage;
  isStreaming: boolean;
  onAppMessage?: (text: string) => void;
  onUpdateModelContext?: (ctx: { content?: unknown[]; structuredContent?: Record<string, unknown> }) => void;
  connectorCatalog?: Array<{ mcpServerUrl: string; sandboxPermissions: string | null }>;
}) {
  const { spec, text, hasSpec } = useJsonRenderMessage(message.parts as DataPart[]);
  const { ref: captureRef, copyAsImage, downloadAsPng, copyAsText, isCopying } = useArtifactCopy();

  // Extract MCP App UI metadata from tool results
  let mcpAppUi: McpAppUiMeta | null = null;
  let mcpToolInput: Record<string, unknown> = {};
  let mcpToolResult: unknown = null;
  if (message.role === 'assistant') {
    for (const part of message.parts) {
      if (!isToolUIPart(part)) continue;
      if (part.state === 'output-available' && part.output) {
        const output = part.output as Record<string, unknown>;
        if (output._mcpAppUi) {
          mcpAppUi = output._mcpAppUi as McpAppUiMeta;
          mcpToolInput = (part.input ?? {}) as Record<string, unknown>;
          mcpToolResult = output;
        }
      }
    }
  }

  const isUser = message.role === 'user';
  const hasRichContent = hasSpec || !!mcpAppUi;
  const showActions = !isUser && !isStreaming;

  return (
    <div className={cn('flex message-appear', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'group relative rounded-lg px-4 py-3',
          isUser
            ? 'max-w-[85%] bg-primary text-primary-foreground'
            : hasRichContent ? 'w-full min-w-0 bg-muted' : 'max-w-[85%] bg-muted'
        )}
      >
        {text && (
          isUser ? (
            <p className="text-base whitespace-pre-wrap">{text}</p>
          ) : (
            <MarkdownRenderer content={text} />
          )
        )}

        {mcpAppUi && (
          <div className="w-full mt-3">
            <McpAppRenderer
              serverUrl={mcpAppUi.serverUrl}
              resourceUri={mcpAppUi.resourceUri}
              toolInput={mcpToolInput}
              toolResult={mcpToolResult}
              sandboxPermissions={connectorCatalog?.find((c) => c.mcpServerUrl === mcpAppUi.serverUrl)?.sandboxPermissions ?? undefined}
              onMessage={onAppMessage}
              onUpdateModelContext={onUpdateModelContext}
              isStreamActive={isStreaming}
            />
          </div>
        )}

        {hasSpec && (
          <div ref={captureRef} className="w-full min-w-0 overflow-x-auto mt-3">
            <JSONUIProvider
              key={message.id}
              registry={registry}
              initialState={spec!.state ?? {}}
            >
              <Renderer spec={spec!} registry={registry} loading={isStreaming} />
            </JSONUIProvider>
          </div>
        )}

        {showActions && (
          <ActionBar
            text={text}
            hasRichContent={hasRichContent}
            isCopying={isCopying}
            onCopyText={() => copyAsText(text ?? '')}
            onCopyImage={copyAsImage}
            onDownloadPng={() => downloadAsPng(`artifact-${message.id}`)}
          />
        )}
      </div>
    </div>
  );
}

function ActionBar({
  text,
  hasRichContent,
  isCopying,
  onCopyText,
  onCopyImage,
  onDownloadPng,
}: {
  text: string | undefined;
  hasRichContent: boolean;
  isCopying: boolean;
  onCopyText: () => void;
  onCopyImage: () => void;
  onDownloadPng: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyText = useCallback(() => {
    onCopyText();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopyText]);

  return (
    <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-background/80 border shadow-sm backdrop-blur-sm opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
      {text && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" onClick={handleCopyText}>
              {copied ? (
                <Check className="text-green-500" />
              ) : (
                <Copy />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy text</TooltipContent>
        </Tooltip>
      )}

      {hasRichContent && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" onClick={onCopyImage} disabled={isCopying}>
                <Image />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy as image</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" onClick={onDownloadPng} disabled={isCopying}>
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download PNG</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}

