"use client";

// ──────────────────────────────────────────────
// Avatar Floating Dock - Centered Oshikoi Layout
// ──────────────────────────────────────────────
// Replicates the 2-row bottom dock from the Oshikoi screenshot:
// Row 1 (Top): Camera button (left) · Microphone button (center) · Settings gear (right)
// Row 2 (Bottom): Speaker mute pill (left) · Text input "Pesan" (center) · Send button (right)

import { useState, useRef, useEffect } from "react";
import { useAppSettings } from "@/lib/settingsContext";
import { useAuth } from "@/lib/authContext";

export default function AvatarDock({ onSendMessage, isSpeaking }) {
  const { settings, toggleMute, openSettings } = useAppSettings();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { isMuted } = settings.ui;

  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Setup Web Speech Recognition for the mic button
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "id-ID";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setMessage(transcript);
            // If authenticated, automatically send the voice message
            if (isAuthenticated && onSendMessage) {
              onSendMessage(transcript);
              setMessage("");
            }
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [isAuthenticated, onSendMessage]);

  const handleMicClick = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!recognitionRef.current) {
      alert("Browser Anda belum mendukung input suara Web Speech API. Silakan coba di Google Chrome / Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("[Dock Mic]", e);
      }
    }
  };

  const handleSend = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    const text = message.trim();
    if (!text) return;
    onSendMessage?.(text);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSnapshot = () => {
    try {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `Aiko-Avatar-${Date.now()}.png`;
        link.href = image;
        link.click();
      } else {
        window.print();
      }
    } catch {
      alert("Snapshot avatar berhasil diambil!");
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 px-3.5 py-2.5 rounded-2xl sm:rounded-3xl bg-[#1d1e2a]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/70 w-[92vw] max-w-[390px] sm:max-w-[430px] select-none transition-all">
      {/* ── Top Row: Camera, Mic, Settings ── */}
      <div className="flex items-center justify-between px-1">
        {/* Camera (Left) */}
        <button
          onClick={handleSnapshot}
          className="w-8 h-8 rounded-full text-white/50 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Ambil Foto Avatar (Snapshot)"
          aria-label="Camera snapshot"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </button>

        {/* Microphone (Center) */}
        <button
          onClick={handleMicClick}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isListening
              ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50 scale-110"
              : "text-white/50 hover:text-white"
          }`}
          title={isListening ? "Sedang mendengarkan... (Klik untuk kirim)" : "Bicara Langsung dengan Karakter (Mic)"}
          aria-label="Voice microphone"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
        </button>

        {/* Settings Gear (Right) */}
        <button
          onClick={() => openSettings("background")}
          className="w-8 h-8 rounded-full text-white/50 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Buka Pengaturan"
          aria-label="Open settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="w-full h-px bg-white/[0.07]" />

      {/* ── Bottom Row: Speaker Pill Toggle, Input "Pesan", Send Paperplane ── */}
      <div className="flex items-center gap-2">
        {/* Speaker Pill Toggle (Cyan Pill when active) */}
        <button
          onClick={toggleMute}
          className={`h-7 px-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isMuted
              ? "bg-white/10 text-white/40"
              : "bg-[#00bcd4] text-[#0a1820] shadow-md shadow-[#00bcd4]/30"
          }`}
          title={isMuted ? "Suara Dimatikan (Muted)" : "Suara Karakter Aktif (Unmuted)"}
          aria-label="Toggle speaker"
        >
          {isMuted ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-3.75l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.215-1.625.59-2.332a2.008 2.008 0 011.67-1.418h2.24z"
              />
            </svg>
          ) : (
            <svg
              className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5A2.25 2.25 0 002.25 9.75v4.5A2.25 2.25 0 004.5 16.5h1.94l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06zM15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.06 4.5 4.5 0 000-6.364.75.75 0 010-1.062z" />
            </svg>
          )}
        </button>

        {/* Input Text Box */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pesan"
          className="flex-1 bg-transparent text-white/95 text-xs sm:text-sm placeholder-white/40 italic outline-none px-1"
        />

        {/* Send Paperplane Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            message.trim()
              ? "text-[#00bcd4] hover:text-white"
              : "text-white/20 cursor-not-allowed"
          }`}
          title="Kirim Pesan"
          aria-label="Send message"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
