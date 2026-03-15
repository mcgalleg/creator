'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown content with proper styling for the chat interface.
 * Handles headings, bold, lists, and other common markdown elements.
 */
import { memo } from 'react';

export const MarkdownRenderer = memo(function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-content text-base', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-3 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-3 mb-1.5 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mt-2 mb-1 first:mt-0">{children}</h4>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          // Strong/bold
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Emphasis/italic
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          // Unordered lists
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
          ),
          // Ordered lists
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
          ),
          // List items
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          // Code inline
          code: ({ children, className }) => {
            // Check if this is a code block (has language class) or inline code
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className={cn('block bg-muted/50 rounded p-2 text-sm font-mono overflow-x-auto', className)}>
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-muted/50 rounded px-1 py-0.5 text-sm font-mono">
                {children}
              </code>
            );
          },
          // Code blocks
          pre: ({ children }) => (
            <pre className="bg-muted/50 rounded-lg p-3 mb-2 overflow-x-auto">
              {children}
            </pre>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground mb-2">
              {children}
            </blockquote>
          ),
          // Horizontal rules
          hr: () => (
            <hr className="border-border my-4" />
          ),
          // Tables
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 border-b border-border">{children}</thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2">{children}</td>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
