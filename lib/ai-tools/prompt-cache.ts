import type { LanguageModel, ModelMessage } from "ai";

/**
 * Detects whether a model is an Anthropic/Claude model that supports
 * prompt caching via the `cache_control` API parameter.
 */
function isAnthropicModel(model: LanguageModel): boolean {
  // Gateway models have modelId like "anthropic/claude-haiku-4-5"
  const id = typeof model === "string" ? model : model.modelId;
  return id.includes("anthropic") || id.includes("claude");
}

/**
 * Adds Anthropic cache control to the last message in a conversation.
 *
 * Enables incremental prompt caching for multi-step agentic tool-use loops.
 * Each step re-sends the full conversation; marking the last message with
 * `cacheControl` tells Anthropic to cache everything up to that point so
 * subsequent steps get cache hits on the prefix.
 *
 * For non-Anthropic models, messages pass through unchanged.
 *
 * @see https://ai-sdk.dev/cookbook/node/dynamic-prompt-caching
 */
export function addCacheControlToMessages({
  messages,
  model,
}: {
  messages: ModelMessage[];
  model: LanguageModel;
}): ModelMessage[] {
  if (messages.length === 0 || !isAnthropicModel(model)) return messages;

  return messages.map((message, index) => {
    if (index === messages.length - 1) {
      return {
        ...message,
        providerOptions: {
          ...message.providerOptions,
          anthropic: { cacheControl: { type: "ephemeral" } },
        },
      };
    }
    return message;
  });
}

/** Reusable cache control provider options for Anthropic. */
export const ANTHROPIC_CACHE_CONTROL = {
  anthropic: { cacheControl: { type: "ephemeral" } },
} as const;
