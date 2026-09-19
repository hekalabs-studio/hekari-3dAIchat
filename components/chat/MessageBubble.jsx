"use client";

// ──────────────────────────────────────────────
// Message Bubble - Oshikoi Style Formatting
// ──────────────────────────────────────────────
// Separates roleplay actions (*action text*) from dialogue,
// adds copy and replay voice (TTS) action buttons.

import { useState } from "react";

export default function MessageBubble({
  role,
  content,
  isStreaming = false,
  timestamp,
  companionName = "Akari",
  userName = "heka",
  onReplayVoice,
}) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Parse content into segments of roleplay action (*...*) and dialogue text.
   */
  const parseSegments = (rawText) => {
    if (!rawText) return [];
    const segments = [];
    const regex = /\*([^*]+)\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        const text = rawText.substring(lastIndex, match.index);
        if (text.trim()) {
          segments.push({ type: "dialogue", text });
        }
      }
      segments.push({ type: "action", text: match[1] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < rawText.length) {
      const remaining = rawText.substring(lastIndex);
      if (remaining.trim()) {
        segments.push({ type: "dialogue", text: remaining });
      }
    }

    if (segments.length === 0 && rawText.trim()) {
      segments.push({ type: "dialogue", text: rawText });
    }

    return segments;
  };

  const segments = parseSegments(content);

  return (
    <div className={`flex flex-col w-full mb-4 animate-fadeIn ${isUser ? "items-end" : "items-start"}`}>
      {/* ── Message Header (Name + Timestamp) ── */}
      <div className={`flex items-center gap-2 mb-1.5 px-1 text-[11px] ${isUser ? "flex-row-reverse text-white/40" : "text-white/50"}`}>
        <span className="font-semibold text-white/80">
          {isUser ? userName : companionName}
        </span>
        {timestamp && <span>{timestamp}</span>}
      </div>

      {/* ── Message Content ── */}
      <div
        className={`relative max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed transition-all ${
          isUser
            ? "bg-[#181828]/90 backdrop-blur-md text-white/95 border border-white/[0.1] rounded-tr-sm shadow-lg shadow-black/20"
            : "bg-[#0c0c18]/80 backdrop-blur-xl text-white/90 border border-white/[0.08] rounded-tl-sm shadow-xl shadow-black/30"
        }`}
      >
        {/* Render segments */}
        {segments.map((seg, i) => {
          if (seg.type === "action") {
            return (
              <div
                key={i}
                className="my-1.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 italic text-xs leading-relaxed"
              >
                <span>{seg.text}</span>
              </div>
            );
          }
          return (
            <p key={i} className="whitespace-pre-wrap break-words my-1 font-normal">
              {seg.text}
            </p>
          );
        })}

        {/* Streaming cursor */}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse align-middle rounded-sm" />
        )}

        {/* ── Action Buttons for AI message ── */}
        {!isUser && !isStreaming && content && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/[0.06] text-white/40">
            {/* Replay Voice */}
            <button
              onClick={() => onReplayVoice?.(content)}
              className="p-1 rounded-md hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-1 text-[11px]"
              title="Putar suara"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.215-1.625.59-2.332a2.008 2.008 0 011.67-1.418h2.24z" />
              </svg>
              <span>Dengar</span>
            </button>

            {/* Copy Text */}
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-1 text-[11px]"
              title="Salin pesan"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
              <span>{copied ? "Tersalin!" : "Salin"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
