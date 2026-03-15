'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart } from 'ai';
import { useMemo, useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useCredits, deductAiTokens } from '@/hooks/use-credits';

/**
 * Options for configuring the useAnalyticsChat hook.
 */
export interface UseAnalyticsChatOptions {
  /**
   * The currently selected account IDs. When this set changes, the chat resets
   * so the AI assistant starts fresh with the new account context.
   */
  selectedAccountIds?: number[];

  /**
   * IDs of enabled MCP connectors (e.g. ['excalidraw']).
   */
  enabledConnectors?: string[];
}

/**
 * Custom hook for managing the analytics chat interface.
 * Wraps the AI SDK's useChat hook and provides convenient accessors
 * for extracted UI trees and diagram results from tool invocations.
 */
export function useAnalyticsChat(options?: UseAnalyticsChatOptions) {
  const { selectedAccountIds, enabledConnectors } = options || {};
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const { refresh: refreshCredits } = useCredits();
  const pollTimersRef: MutableRefObject<ReturnType<typeof setTimeout>[]> = useRef([]);
  // Serialize the account IDs array for stable comparison
  const accountIdsKey = selectedAccountIds?.slice().sort().join(',') ?? '';
  const connectorsKey = enabledConnectors?.slice().sort().join(',') ?? '';
  const prevAccountIdsKeyRef = useRef(accountIdsKey);

  // Model context from MCP Apps (ui/update-model-context)
  const modelContextRef = useRef<{ content?: unknown[]; structuredContent?: Record<string, unknown> } | null>(null);

  const updateModelContext = useCallback((ctx: { content?: unknown[]; structuredContent?: Record<string, unknown> } | null) => {
    modelContextRef.current = ctx;
  }, []);

  // Keep refs for values used inside transport closure so it always reads latest
  const selectedAccountIdsRef = useRef(selectedAccountIds);
  selectedAccountIdsRef.current = selectedAccountIds;
  const enabledConnectorsRef = useRef(enabledConnectors);
  enabledConnectorsRef.current = enabledConnectors;

  // Recreate transport when selectedAccountIds or enabledConnectors changes
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            messages,
            selectedAccountIds: selectedAccountIdsRef.current?.length ? selectedAccountIdsRef.current : undefined,
            enabledConnectors: enabledConnectorsRef.current?.length ? enabledConnectorsRef.current : undefined,
            modelContext: modelContextRef.current ?? undefined,
          },
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountIdsKey, connectorsKey]
  );

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
    transport,
    onFinish: ({ message }) => {
      // Optimistically deduct tokens from the cached balance so the
      // header chip updates immediately, without waiting for Polar's
      // eventually-consistent meter to catch up.
      const totalTokens = (
        message.metadata as { totalUsage?: { totalTokens?: number } } | undefined
      )?.totalUsage?.totalTokens;
      if (totalTokens && totalTokens > 0) {
        deductAiTokens(totalTokens);
      }

      // Background revalidation to reconcile with Polar's real balance.
      pollTimersRef.current.forEach(clearTimeout);
      pollTimersRef.current = [3_000, 10_000].map((delay) =>
        setTimeout(() => refreshCredits(), delay)
      );
    },
    onError: (error) => {
      if (
        error.message?.includes('402') ||
        error.message?.includes('Insufficient AI tokens') ||
        (error as { status?: number }).status === 402
      ) {
        setInsufficientCredits(true);
      }
    },
  });

  // Clean up poll timers on unmount
  useEffect(() => {
    const timers = pollTimersRef;
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // Reset chat when the selected accounts change
  useEffect(() => {
    if (prevAccountIdsKeyRef.current !== accountIdsKey && messages.length > 0) {
      setMessages([]);
    }
    prevAccountIdsKeyRef.current = accountIdsKey;
  }, [accountIdsKey, messages.length, setMessages]);

  const isGenerating = status === 'streaming' || status === 'submitted';
  const isLoading = status === 'submitted';

  /**
   * Check if there are any pending tool calls (tools with input but no output yet).
   */
  const hasPendingToolCalls = useMemo(() => {
    for (const message of messages) {
      if (message.role === 'assistant') {
        for (const part of message.parts) {
          if (
            isToolUIPart(part) &&
            (part.state === 'input-streaming' || part.state === 'input-available')
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
    insufficientCredits,

    // Actions
    sendMessage,
    submitMessage,
    stop,
    clearChat,
    setMessages,
    regenerate,
    updateModelContext,

    // Utilities
    getMessageText,
  };
}

/**
 * Type for the return value of useAnalyticsChat.
 * Useful for typing components that receive the hook's return value as props.
 */
export type UseAnalyticsChatReturn = ReturnType<typeof useAnalyticsChat>;
