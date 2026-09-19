"use client";

// ──────────────────────────────────────────────
// Typing Indicator - Animated dots while AI thinks
// ──────────────────────────────────────────────

/**
 * TypingIndicator
 *
 * Three animated dots that pulse sequentially,
 * shown while waiting for the AI to respond.
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3" role="status" aria-label="AI is typing">
      <div
        className="w-2 h-2 rounded-full bg-indigo-400/70 animate-bounce"
        style={{ animationDelay: "0ms", animationDuration: "1.2s" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-indigo-400/70 animate-bounce"
        style={{ animationDelay: "200ms", animationDuration: "1.2s" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-indigo-400/70 animate-bounce"
        style={{ animationDelay: "400ms", animationDuration: "1.2s" }}
      />
    </div>
  );
}
