'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { useMemo, useCallback } from 'react';

/**
 * Represents a UI component tree structure for rendering analytics visualizations.
 * This is the output format of the generateUI tool.
 */
export interface UITree {
  component: string;
  props: Record<string, unknown>;
  children?: UITree[];
}

/**
 * Represents analytics data fetched from the fetchAnalyticsData tool.
 */
export interface AnalyticsData {
  type: string;
  data: unknown;
}

/**
 * Tool invocation part extracted from messages.
 * In AI SDK v6, tool parts are typed as `tool-{toolName}`.
 */
interface ToolPart {
  type: string;
  toolCallId: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

/**
 * Extract tool parts from a UIMessage.
 * Tool parts have types like 'tool-generateUI' or 'tool-fetchAnalyticsData'.
 */
function extractToolParts(message: UIMessage): ToolPart[] {
  const toolParts: ToolPart[] = [];

  for (const part of message.parts) {
    // Check if this is a tool part (type starts with 'tool-')
    if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
      toolParts.push(part as unknown as ToolPart);
    }
  }

  return toolParts;
}

/**
 * Custom hook for managing the analytics chat interface.
 * Wraps the AI SDK's useChat hook and provides convenient accessors
 * for extracted UI trees and analytics data from tool invocations.
 */
export function useAnalyticsChat() {
  const {
    id,
    messages,
    status,
    error,
    sendMessage,
    stop,
    setMessages,
    regenerate,
  } = useChat({
    // Uses default transport with /api/chat endpoint
  });

  /**
   * Extract UI trees from generateUI tool call results in messages.
   * Only includes tool calls that have completed with output.
   */
  const uiTrees = useMemo(() => {
    const trees: UITree[] = [];

    for (const message of messages) {
      if (message.role === 'assistant') {
        const toolParts = extractToolParts(message);

        for (const toolPart of toolParts) {
          // Check if this is a generateUI tool with output
          if (
            toolPart.type === 'tool-generateUI' &&
            toolPart.state === 'output-available' &&
            toolPart.output
          ) {
            trees.push(toolPart.output as UITree);
          }
        }
      }
    }

    return trees;
  }, [messages]);

  /**
   * Extract analytics data from fetchAnalyticsData tool call results in messages.
   * Only includes tool calls that have completed with output.
   */
  const analyticsData = useMemo(() => {
    const data: AnalyticsData[] = [];

    for (const message of messages) {
      if (message.role === 'assistant') {
        const toolParts = extractToolParts(message);

        for (const toolPart of toolParts) {
          // Check if this is a fetchAnalyticsData tool with output
          if (
            toolPart.type === 'tool-fetchAnalyticsData' &&
            toolPart.state === 'output-available' &&
            toolPart.output
          ) {
            // Extract the query type from input if available
            const input = toolPart.input as { query?: string } | undefined;
            data.push({
              type: input?.query || 'unknown',
              data: toolPart.output,
            });
          }
        }
      }
    }

    return data;
  }, [messages]);

  /**
   * Get the latest UI tree (most recent visualization).
   */
  const latestUITree = useMemo(() => {
    return uiTrees[uiTrees.length - 1] || null;
  }, [uiTrees]);

  /**
   * Get the latest analytics data.
   */
  const latestData = useMemo(() => {
    return analyticsData[analyticsData.length - 1] || null;
  }, [analyticsData]);

  /**
   * Check if the chat is currently generating/streaming a response.
   */
  const isGenerating = useMemo(() => {
    return status === 'streaming' || status === 'submitted';
  }, [status]);

  /**
   * Check if the chat is in a loading state (submitted but not yet streaming).
   */
  const isLoading = useMemo(() => {
    return status === 'submitted';
  }, [status]);

  /**
   * Check if there are any pending tool calls (tools with input but no output yet).
   */
  const hasPendingToolCalls = useMemo(() => {
    for (const message of messages) {
      if (message.role === 'assistant') {
        const toolParts = extractToolParts(message);

        for (const toolPart of toolParts) {
          if (
            toolPart.state === 'input-streaming' ||
            toolPart.state === 'input-available'
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [messages]);

  /**
   * Clear the chat history and reset state.
   */
  const clearChat = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  /**
   * Submit a message to the chat.
   * This is a convenience wrapper around sendMessage.
   */
  const submitMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      await sendMessage({ text });
    },
    [sendMessage]
  );

  /**
   * Get all text content from messages (excluding tool parts).
   * Useful for displaying message history without tool invocation details.
   */
  const getMessageText = useCallback((message: UIMessage): string => {
    const textParts: string[] = [];

    for (const part of message.parts) {
      if (part.type === 'text') {
        textParts.push((part as { type: 'text'; text: string }).text);
      }
    }

    return textParts.join('\n');
  }, []);

  return {
    // Chat identification
    id,

    // Message state
    messages,

    // Status information
    status,
    isLoading,
    isGenerating,
    hasPendingToolCalls,
    error,

    // Actions
    sendMessage,
    submitMessage,
    stop,
    clearChat,
    setMessages,
    regenerate,

    // Extracted data
    uiTrees,
    analyticsData,
    latestUITree,
    latestData,

    // Utilities
    getMessageText,
  };
}

/**
 * Type for the return value of useAnalyticsChat.
 * Useful for typing components that receive the hook's return value as props.
 */
export type UseAnalyticsChatReturn = ReturnType<typeof useAnalyticsChat>;
