'use client';

import { useEffect, useState } from 'react';
import { useJsonRenderMessage, Renderer, JSONUIProvider, type DataPart } from '@json-render/react';
import { isToolUIPart } from 'ai';
import { registry } from '@/lib/registry';
import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './markdown-renderer';

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

  return (
    <div className={cn('flex message-appear', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-lg px-4 py-3',
          isUser
            ? 'max-w-[85%] bg-primary text-primary-foreground'
            : (hasSpec || diagramElements) ? 'w-full min-w-0 bg-muted' : 'max-w-[85%] bg-muted'
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
          <div className="w-full mt-3">
            <DiagramPreview elements={diagramElements} />
          </div>
        )}

        {hasSpec && (
          <div className="w-full min-w-0 overflow-x-auto mt-3">
            <JSONUIProvider registry={registry} initialState={spec!.state}>
              <Renderer spec={spec!} registry={registry} loading={isStreaming} />
            </JSONUIProvider>
          </div>
        )}
      </div>
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

        if (!cancelled) setSvgHtml(svg.outerHTML);
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
