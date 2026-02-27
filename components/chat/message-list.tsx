'use client';

import { useEffect, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { useJsonRenderMessage, Renderer, JSONUIProvider, type DataPart } from '@json-render/react';
import { isToolUIPart } from 'ai';
import { registry } from '@/lib/registry';
import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './markdown-renderer';
import { useArtifactCopy } from '@/hooks/use-artifact-copy';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Copy, Check, Download, Image } from 'lucide-react';

interface MessageListProps {
  messages: UIMessage[];
  isStreaming: boolean;
}

/**
 * Displays the list of chat messages with progressive spec rendering.
 */
export function MessageList({ messages, isStreaming }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, i) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={isStreaming && i === messages.length - 1}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message, isStreaming }: { message: UIMessage; isStreaming: boolean }) {
  const { spec, text, hasSpec } = useJsonRenderMessage(message.parts as DataPart[]);
  const { ref: captureRef, copyAsImage, downloadAsPng, copyAsText, isCopying } = useArtifactCopy();

  // Extract diagram from tool parts (createDiagram stays tool-based)
  let diagramElements: unknown[] | null = null;
  if (message.role === 'assistant') {
    for (const part of message.parts) {
      if (!isToolUIPart(part)) continue;
      if (
        part.type === 'tool-createDiagram' &&
        part.state === 'output-available' &&
        part.output
      ) {
        const output = part.output as { elements?: unknown[] };
        if (output.elements) {
          diagramElements = output.elements;
        }
      }
    }
  }

  const isUser = message.role === 'user';
  const hasRichContent = hasSpec || !!diagramElements;
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
            <p className="text-sm whitespace-pre-wrap">{text}</p>
          ) : (
            <MarkdownRenderer content={text} />
          )
        )}

        {diagramElements && (
          <div ref={!hasSpec ? captureRef : undefined} className="w-full mt-3">
            <DiagramPreview elements={diagramElements} />
          </div>
        )}

        {hasSpec && (
          <div ref={captureRef} className="w-full min-w-0 overflow-x-auto mt-3">
            <JSONUIProvider registry={registry} initialState={spec!.state ?? {}}>
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
    <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-background/80 border shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
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

/**
 * Lightweight static SVG preview of Excalidraw diagram elements.
 */
function DiagramPreview({ elements }: { elements: unknown[] }) {
  const [svgHtml, setSvgHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function generateSvg() {
      try {
        const { loadExcalidraw } = await import('@/lib/excalidraw-loader');
        const { exportToSvg, convertToExcalidrawElements } = await loadExcalidraw();

        // Filter out non-drawable entries like cameraUpdate before converting
        const drawableElements = elements.filter(
          (el): el is Record<string, unknown> =>
            typeof el === "object" && el !== null && (el as Record<string, unknown>).type !== "cameraUpdate"
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const converted = convertToExcalidrawElements(drawableElements as any);

        const svg = await exportToSvg({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          elements: converted as any,
          appState: { exportWithDarkMode: false, exportBackground: false },
          files: null,
        });

        if (!cancelled) setSvgHtml(DOMPurify.sanitize(svg.outerHTML, { USE_PROFILES: { svg: true } }));
      } catch (err) {
        console.error('Failed to generate Excalidraw SVG preview:', err);
      }
    }

    if (elements.length > 0) generateSvg();
    return () => { cancelled = true; };
  }, [elements]);

  if (!svgHtml) {
    return (
      <div className="flex items-center justify-center min-h-[120px] text-sm text-muted-foreground">
        Loading diagram...
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
