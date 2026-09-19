"use client";

// ──────────────────────────────────────────────
// Floating Dialogue Bubble - Oshikoi Subtitle UI
// ──────────────────────────────────────────────
// Displays the character's active dialogue and roleplay action
// directly above the center bottom dock when the right panel is closed.

import { useState, useEffect } from "react";
import { parseEmotion } from "@/lib/emotionParser";

function getMessageText(msg) {
  if (!msg) return "";
  if (typeof msg === "string") return msg;
  if (typeof msg.content === "string" && msg.content) return msg.content;
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p) => p.type === "text" || typeof p === "string" || p.text)
      .map((p) => (typeof p === "string" ? p : p.text || ""))
      .join("");
  }
  return "";
}

export default function FloatingDialogue({
  message,
  companionName = "Hina",
  isSpeaking = false,
  onReplayVoice,
  onOpenChatDrawer,
}) {
  const [isVisible, setIsVisible] = useState(true);

  // Extract clean text and roleplay action (handles parts and string)
  const rawText = getMessageText(message);
  const { emotion, actionText, cleanDialogue } = parseEmotion(rawText);

  // Re-show bubble when new message arrives
  useEffect(() => {
    if (rawText) {
      setIsVisible(true);
    }
  }, [rawText]);

  if (!rawText || !isVisible) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-lg animate-fadeIn pointer-events-auto">
      <div className="relative rounded-3xl bg-[#080814]/80 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl shadow-black/80 transition-all duration-300 hover:border-white/25 group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-purple-500/20 via-[#00bcd4]/20 to-pink-500/20 opacity-50 blur-lg -z-10 group-hover:opacity-75 transition-opacity" />

        {/* Top bar: Character Name, Emotion Action badge, Controls */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Pulsing speaking dot */}
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              {isSpeaking && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00bcd4] opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isSpeaking ? "bg-[#00bcd4]" : "bg-emerald-400"
                }`}
              />
            </span>

            <span className="text-white font-bold text-xs tracking-wide truncate">
              {companionName}
            </span>

            {/* Roleplay action badge */}
            {actionText && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 font-medium italic truncate max-w-[200px]">
                *{actionText}*
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Replay audio */}
            {onReplayVoice && cleanDialogue && (
              <button
                onClick={() => onReplayVoice(cleanDialogue)}
                className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Putar ulang suara"
                aria-label="Replay audio"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              </button>
            )}

            {/* Expand full history drawer */}
            {onOpenChatDrawer && (
              <button
                onClick={onOpenChatDrawer}
                className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Buka riwayat chat penuh"
                aria-label="Expand chat history"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            )}

            {/* Dismiss */}
            <button
              onClick={() => setIsVisible(false)}
              className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-white/50 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup dialog"
              aria-label="Close dialogue"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Spoken dialogue text */}
        <p className="text-white/95 text-xs sm:text-sm font-normal leading-relaxed tracking-wide selection:bg-purple-500/40">
          {cleanDialogue || rawText}
        </p>
      </div>
    </div>
  );
}
