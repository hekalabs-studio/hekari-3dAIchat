// ──────────────────────────────────────────────
// Memory Manager - Sliding Window Context Management
// ──────────────────────────────────────────────
// Works with the Vercel AI SDK's UIMessage format.
// Trims older messages when the context window approaches its limit,
// keeping the most recent conversation turns intact.

// ── Configuration ──────────────────────────────
const MAX_CONTEXT_TOKENS = parseInt(
  process.env.MAX_CONTEXT_TOKENS || "150000",
  10
);
const SUMMARY_TRIGGER_RATIO = 0.75;
const RECENT_WINDOW_SIZE = 30; // Keep last 30 messages

/**
 * Rough token estimation: ~4 characters per token.
 * Good enough for context budgeting; not used for billing.
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Extract clean string text from a message (supports string content and UIMessage parts).
 */
function getMessageText(msg) {
  if (!msg) return "";
  if (typeof msg.content === "string") return msg.content;
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .map((p) => (typeof p === "string" ? p : p.text || ""))
      .filter(Boolean)
      .join(" ");
  }
  if (Array.isArray(msg.content)) {
    return msg.content
      .map((p) => (typeof p === "string" ? p : p.text || ""))
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

/**
 * Estimate tokens for an array of messages.
 * Handles both simple string content and Vercel AI SDK's
 * parts-based message format.
 */
function estimateMessagesTokens(messages) {
  return messages.reduce((total, msg) => {
    const text = getMessageText(msg);
    const contentTokens = estimateTokens(text);
    return total + estimateTokens(msg.role) + contentTokens + 4;
  }, 0);
}

/**
 * Prepare the context for an API call.
 *
 * Since useChat sends the full message array from the client,
 * we just need to trim it if it exceeds the context budget.
 *
 * Strategy:
 * 1. If total tokens < budget → return all messages as-is
 * 2. If over budget → keep only the last RECENT_WINDOW_SIZE messages
 * 3. Generate a brief text summary placeholder for dropped messages
 *
 * @param {Array} messages - The full messages array from useChat
 * @returns {{ messages: Array, summary: string|null }}
 */
export function prepareContext(messages) {
  if (!messages || messages.length === 0) {
    return { messages: [], summary: null };
  }

  const totalTokens = estimateMessagesTokens(messages);
  const triggerThreshold = MAX_CONTEXT_TOKENS * SUMMARY_TRIGGER_RATIO;

  // Under budget - return everything as-is
  if (totalTokens < triggerThreshold) {
    return { messages, summary: null };
  }

  // ── Context exceeds budget - trim to recent window ──
  const recentStart = Math.max(0, messages.length - RECENT_WINDOW_SIZE);
  const droppedMessages = messages.slice(0, recentStart);
  const recentMessages = messages.slice(recentStart);

  let summary = null;

  if (droppedMessages.length > 0) {
    // Build a lightweight summary from dropped messages
    // (no external API call - just extract key content)
    const summaryParts = [];

    for (const msg of droppedMessages) {
      const role = msg.role === "user" ? "User" : "Akari";
      const content = getMessageText(msg);

      // Take first 100 chars of each message for the summary
      if (content) {
        summaryParts.push(
          `${role}: ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`
        );
      }
    }

    summary = summaryParts.join("\n");

    console.log(
      `[MemoryManager] Trimmed ${droppedMessages.length} old messages. ` +
        `Keeping ${recentMessages.length} recent. ` +
        `Summary: ${estimateTokens(summary)} tokens.`
    );
  }

  return {
    messages: recentMessages,
    summary,
  };
}

/**
 * Get memory stats for debugging.
 */
export function getMemoryStats(messages) {
  return {
    messageCount: messages?.length || 0,
    estimatedTokens: messages ? estimateMessagesTokens(messages) : 0,
    maxTokens: MAX_CONTEXT_TOKENS,
    budgetUsed: messages
      ? (
          (estimateMessagesTokens(messages) / MAX_CONTEXT_TOKENS) *
          100
        ).toFixed(1) + "%"
      : "0%",
  };
}
