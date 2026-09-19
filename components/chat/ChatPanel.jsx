"use client";

// ──────────────────────────────────────────────
// Chat Panel - Oshikoi Style AI Chat UI
// ──────────────────────────────────────────────
// Integrates with useAppSettings for custom persona, companion name,
// user profile, and system instructions.
// Features Oshikoi top toolbar (Focus mode, Clear chat, Settings, Close),
// model provider selector, message roleplay parsing, and voice replay.

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useChat } from "@ai-sdk/react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { useAppSettings } from "@/lib/settingsContext";
import { useAuth } from "@/lib/authContext";

/**
 * Available AI providers with their display info.
 */
const AI_PROVIDERS = [
  {
    key: "google",
    label: "Gemini 3.6 Flash",
    provider: "Google",
    color: "#4285f4",
    icon: "◆",
  },
  {
    key: "groq",
    label: "Groq (Ultra Fast)",
    provider: "Groq",
    color: "#f55036",
    icon: "⚡",
  },
  {
    key: "mistral",
    label: "Mistral 7B",
    provider: "Mistral",
    color: "#ff7000",
    icon: "▲",
  },
  {
    key: "anthropic",
    label: "Claude Sonnet 3.5",
    provider: "Anthropic",
    color: "#d4a574",
    icon: "✦",
  },
  {
    key: "xai",
    label: "Groq / xAI",
    provider: "Groq",
    color: "#1da1f2",
    icon: "𝕏",
  },
];

/**
 * Extract display text from a message (handles Vercel AI SDK format).
 */
function getMessageText(msg) {
  if (!msg) return "";
  if (typeof msg.content === "string") return msg.content;
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p) => p.type === "text" || typeof p === "string" || p.text)
      .map((p) => (typeof p === "string" ? p : p.text || ""))
      .join("");
  }
  return "";
}

/**
 * ChatPanel
 *
 * @param {Object} props
 * @param {(text: string) => void} props.onAiResponse - Called with full AI response for TTS
 * @param {boolean} props.isOpen - Whether the chat panel is visible
 * @param {() => void} props.onToggle - Toggle panel visibility
 * @param {string} props.externalInput - Transcript from speech-to-text
 */
const ChatPanel = forwardRef(function ChatPanel(
  {
    onAiResponse,
    onLatestMessageChange,
    isOpen = true,
    onToggle,
    externalInput = "",
  },
  ref
) {
  const { settings, updateCompanion, openSettings, toggleFocusMode } = useAppSettings();
  const { isAuthenticated, openAuthModal } = useAuth();

  const selectedProvider = settings.companion?.modelProvider || "google";
  const [input, setInput] = useState("");
  const [prevExternalInput, setPrevExternalInput] = useState(externalInput);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Synchronize external voice input from AvatarDock during render
  if (externalInput !== prevExternalInput) {
    setPrevExternalInput(externalInput);
    if (externalInput && externalInput.trim()) {
      setInput((prev) => (prev ? `${prev} ${externalInput.trim()}` : externalInput.trim()));
    }
  }

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const dropdownRef = useRef(null);

  // ── Vercel AI SDK useChat hook ──
  const { messages, sendMessage, status, error, setMessages } = useChat();

  const isLoading = status === "submitted" || status === "streaming";
  const isStreaming = status === "streaming";

  // Focus input when external input arrives
  useEffect(() => {
    if (externalInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [externalInput]);

  // Notify parent of latest assistant message for Floating Dialogue
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant") {
        onLatestMessageChange?.(lastMessage);
      }
    }
  }, [messages, onLatestMessageChange]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const lastSpokenMessageIdRef = useRef(null);

  // Trigger TTS when an assistant message finishes streaming and status is ready
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant") {
        const messageId = lastMessage.id || `${messages.length}-${lastMessage.content?.slice(0, 15)}`;
        const voiceActive = settings.voice?.autoPlay !== false && !settings.ui?.isMuted;
        if (voiceActive && lastSpokenMessageIdRef.current !== messageId) {
          lastSpokenMessageIdRef.current = messageId;
          const text = getMessageText(lastMessage);
          if (text) {
            console.log("[ChatPanel] Triggering TTS for message:", text.slice(0, 40));
            onAiResponse?.(text);
          }
        }
      }
    }
  }, [messages, status, onAiResponse, settings.voice?.autoPlay, settings.ui?.isMuted]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Send a message with current settings and persona.
   */
  const handleSendText = useCallback(
    (textToSend) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      const text = (textToSend || "").trim();
      if (!text || isLoading) return;

      sendMessage(
        { text },
        {
          body: {
            modelProvider: selectedProvider,
            companionName: settings.companion?.name || "Ren",
            userName: settings.userProfile?.name || "heka",
            persona: settings.companion?.persona || "romantic",
            modelId: settings.avatar?.modelId || "ren",
            customInstructions: settings.companion?.customPrompt || "",
          },
        }
      );
    },
    [isAuthenticated, openAuthModal, isLoading, sendMessage, selectedProvider, settings.companion, settings.userProfile, settings.avatar]
  );

  useImperativeHandle(
    ref,
    () => ({
      sendMessage: (text) => {
        handleSendText(text);
      },
    }),
    [handleSendText]
  );

  const handleSend = useCallback(() => {
    handleSendText(input);
    setInput("");

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "24px";
    }
  }, [handleSendText, input]);

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      handleSend();
    }
  };

  const handleProviderSelect = (providerKey) => {
    updateCompanion({ modelProvider: providerKey });
    setIsDropdownOpen(false);
  };

  const handleClearChat = () => {
    if (setMessages) {
      setMessages([]);
    }
    setShowClearConfirm(false);
  };

  // Get current provider info
  const currentProvider =
    AI_PROVIDERS.find((p) => p.key === selectedProvider) || AI_PROVIDERS[0];

  const companionName = settings.companion?.name || "Aiko";
  const userName = settings.userProfile?.name || "User";

  return (
    <>
      {/* Toggle button (visible when panel is closed on desktop) */}
      {!isOpen && (
        <button
          id="chat-toggle-button"
          onClick={onToggle}
          className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white shadow-xl shadow-purple-500/30 items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-purple-500/50 cursor-pointer"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 20.25v-2.625c0-.621.504-1.125 1.125-1.125h.75c.103 0 .205-.014.302-.04A9.72 9.72 0 013 12c0-5.385 4.365-9.75 9.75-9.75S22.5 6.615 22.5 12s-4.365 9.75-9.75 9.75a9.715 9.715 0 01-5.073-1.427"
            />
          </svg>
        </button>
      )}

      {/* Chat Panel */}
      <div
        id="chat-panel"
        className={`fixed right-0 top-0 h-full z-40 flex flex-col transition-all duration-500 ease-out ${
          isOpen
            ? "w-full sm:w-[420px] translate-x-0 opacity-100"
            : "w-full sm:w-[420px] translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Oshikoi Dark Glassmorphism background */}
        <div className="absolute inset-0 bg-[#080812]/75 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl" />

        {/* ── Oshikoi Header Toolbar ── */}
        <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08]">
          {/* Avatar and Name */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-purple-500/20">
                <div className="w-full h-full rounded-full bg-[#0e0e1a] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {companionName.charAt(0)}
                  </span>
                </div>
              </div>
              {/* Online pulse indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#080812] shadow-sm shadow-emerald-400/50" />
            </div>

            <div>
              <h2 className="text-white font-semibold text-sm tracking-wide flex items-center gap-1.5">
                {companionName}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.08] text-purple-300 font-normal">
                  {settings.companion?.persona || "Manis"}
                </span>
              </h2>
              <p className="text-white/40 text-[11px]">
                {isStreaming ? "Sedang mengetik..." : "Online • Siap menemani"}
              </p>
            </div>
          </div>

          {/* Action Toolbar Icons (Oshikoi Style) */}
          <div className="flex items-center gap-1">
            {/* Focus Mode Toggle */}
            <button
              onClick={toggleFocusMode}
              className={`p-2 rounded-lg transition-colors text-white/50 hover:text-white ${
                settings.focusMode ? "bg-purple-600/30 text-purple-300" : "hover:bg-white/[0.08]"
              }`}
              title={settings.focusMode ? "Keluar Mode Fokus" : "Mode Fokus (Sembunyikan Sidebar)"}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </button>

            {/* Clear Chat Button */}
            <div className="relative">
              <button
                onClick={() => setShowClearConfirm(!showClearConfirm)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
                title="Hapus riwayat obrolan"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>

              {/* Clear confirmation popover */}
              {showClearConfirm && (
                <div className="absolute right-0 top-full mt-2 w-48 p-3 rounded-xl bg-[#121222] border border-white/[0.12] shadow-2xl z-50 animate-fadeIn">
                  <p className="text-white/80 text-xs font-medium mb-2.5">Hapus semua pesan?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearChat}
                      className="flex-1 py-1 px-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-[11px] font-medium transition-colors"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-1 px-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white/70 text-[11px] transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => openSettings("persona")}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Pengaturan Karakter"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>

            {/* Close / Collapse Button */}
            <button
              id="chat-close-button"
              onClick={onToggle}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Tutup panel obrolan"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Model Selector ── */}
        <div className="relative px-4 py-3 border-b border-white/[0.06]">
          <div ref={dropdownRef} className="relative">
            <button
              id="model-selector-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="text-sm"
                  style={{ color: currentProvider.color }}
                >
                  {currentProvider.icon}
                </span>
                <div className="text-left">
                  <p className="text-white/80 text-xs font-medium">
                    {currentProvider.label}
                  </p>
                  <p className="text-white/30 text-[10px]">
                    {currentProvider.provider}
                  </p>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-white/40 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-xl border border-white/[0.1] shadow-2xl shadow-black/50 z-50 animate-fadeIn">
                {AI_PROVIDERS.map((provider) => (
                  <button
                    key={provider.key}
                    onClick={() => handleProviderSelect(provider.key)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white/[0.06] transition-colors ${
                      selectedProvider === provider.key
                        ? "bg-white/[0.04]"
                        : ""
                    }`}
                  >
                    <span
                      className="text-sm w-5 text-center"
                      style={{ color: provider.color }}
                    >
                      {provider.icon}
                    </span>
                    <div className="text-left flex-1">
                      <p className="text-white/80 text-xs font-medium">
                        {provider.label}
                      </p>
                      <p className="text-white/30 text-[10px]">
                        {provider.provider}
                      </p>
                    </div>
                    {selectedProvider === provider.key && (
                      <svg
                        className="w-3.5 h-3.5 text-indigo-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div className="relative flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-indigo-500/10">
                <svg
                  className="w-8 h-8 text-indigo-400/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
              </div>
              <h3 className="text-white/80 font-medium text-base mb-2">
                Sapa {companionName}!
              </h3>
              <p className="text-white/40 text-xs sm:text-sm leading-relaxed max-w-[280px]">
                Mulai percakapan santai atau roleplay dengan {companionName}. Kamu juga bisa mengganti model AI atau kustomisasi persona.
              </p>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={getMessageText(msg)}
              companionName={companionName}
              userName={userName}
              onReplayVoice={(text) => onAiResponse?.(text)}
              isStreaming={
                msg.role === "assistant" &&
                isStreaming &&
                msg.id === messages[messages.length - 1]?.id
              }
              timestamp={
                msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : undefined
              }
            />
          ))}

          {/* Typing indicator (shown while waiting for first token) */}
          {status === "submitted" && (
            <div className="flex items-start gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-md rounded-2xl rounded-bl-md border border-white/[0.08]">
                <TypingIndicator />
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mx-2 mb-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fadeIn">
              <p className="text-red-400/90 text-xs font-medium">
                {error.message || "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div className="relative px-4 pb-4 pt-2 border-t border-white/[0.06]">
          {!isAuthenticated ? (
            <div
              onClick={openAuthModal}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-purple-500/30 hover:border-purple-400/60 backdrop-blur-xl cursor-pointer group transition-all duration-300 shadow-lg shadow-purple-950/20"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.43 7.37 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.57 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white text-xs font-semibold group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                      <span>Masuk dengan Akun Google</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </p>
                    <p className="text-white/50 text-[11px] mt-0.5">
                      Klik di sini untuk mengaktifkan AI &amp; mulai chat
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-semibold text-xs shadow-md group-hover:bg-purple-100 transition-colors"
                >
                  Masuk →
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2.5 bg-white/[0.04] rounded-2xl border border-white/[0.08] px-4 py-2.5 focus-within:border-indigo-500/30 focus-within:bg-white/[0.06] transition-all duration-200">
                <textarea
                  ref={inputRef}
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-transparent text-white/90 text-sm placeholder-white/25 resize-none outline-none max-h-32 scrollbar-thin"
                  style={{ minHeight: "24px" }}
                  onInput={(e) => {
                    // Auto-resize textarea
                    e.target.style.height = "24px";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                  }}
                />

                {/* Send button */}
                <button
                  id="chat-send-button"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    input.trim() && !isLoading
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105"
                      : "bg-white/[0.06] text-white/20 cursor-not-allowed"
                  }`}
                  aria-label="Send message"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </button>
              </div>

              {/* Hint text */}
              <p className="text-white/15 text-[10px] text-center mt-2">
                Press Enter to send · Shift+Enter for new line ·{" "}
                <span style={{ color: currentProvider.color + "80" }}>
                  {currentProvider.label}
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
});

export default ChatPanel;
