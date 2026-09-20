"use client";

// ──────────────────────────────────────────────
// Home Page - Oshikoi-style 3D AI Companion
// ──────────────────────────────────────────────
// Assembles:
// - Dynamic scenic wallpaper with blur/brightness
// - Left sidebar with profile, gems, menu
// - Central transparent 3D WebGL Avatar canvas
// - Floating bottom dock (Camera, Mute, Marquee, Mic, Settings)
// - Right glassmorphism chat panel with roleplay & voice replay
// - User settings customization modal

import { useState, useCallback, useRef, useEffect, useSyncExternalStore } from "react";
import type * as THREE from "three";
import AvatarCanvas from "@/components/three/AvatarCanvas";
import ChatPanel from "@/components/chat/ChatPanel";
import Sidebar from "@/components/layout/Sidebar";
import AvatarDock from "@/components/three/AvatarDock";
import ModelLoadingScreen from "@/components/three/ModelLoadingScreen";
import SettingsModal from "@/components/settings/SettingsModal";
import GoogleAuthModal from "@/components/auth/GoogleAuthModal";
import FloatingDialogue from "@/components/chat/FloatingDialogue";
import { parseEmotion } from "@/lib/emotionParser";
import { SettingsProvider, useAppSettings } from "@/lib/settingsContext";
import { AuthProvider } from "@/lib/authContext";
import { getTTSEngine } from "@/lib/ttsEngine";

const emptySubscribe = () => () => {};

const ChatPanelComponent = ChatPanel as any;
const AvatarCanvasComponent = AvatarCanvas as any;

/**
 * Inner application view wrapped by SettingsProvider
 */
function MainAppView() {
  const { settings, currentBgUrl, currentModelUrl, updateAvatar, updateCompanion } = useAppSettings();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [currentEmotion, setCurrentEmotion] = useState("neutral");
  const [latestAssistantMessage, setLatestAssistantMessage] = useState<any>(null);

  const chatRef = useRef<{ sendMessage: (text: string) => void } | null>(null);
  const sceneRef = useRef<THREE.Group | null>(null);
  const ttsRef = useRef<ReturnType<typeof getTTSEngine> | null>(null);

  const handleLatestMessageChange = useCallback((msg: any) => {
    setLatestAssistantMessage(msg);
    const text = typeof msg?.content === "string" ? msg.content : "";
    const { emotion } = parseEmotion(text);
    if (emotion) {
      setCurrentEmotion(emotion);
    }
  }, []);

  // On mobile screens, start with chat panel closed to display avatar & dock
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsChatOpen(false);
    }
  }, []);

  // Initialize TTS engine on first user interaction
  useEffect(() => {
    const initTTS = () => {
      if (!ttsRef.current) {
        const tts = getTTSEngine();
        tts.init();

        tts.onSpeakStart = () => setIsSpeaking(true);
        tts.onSpeakEnd = () => setIsSpeaking(false);

        // Connect viseme updates to the GLB avatar
        tts.onVisemeUpdate = (weights: Record<string, number>) => {
          const scene = sceneRef.current;
          if (scene?.userData?.setVisemeWeights) {
            scene.userData.setVisemeWeights(weights);
          }
        };

        ttsRef.current = tts;
      }
    };

    window.addEventListener("click", initTTS, { once: true });
    window.addEventListener("keydown", initTTS, { once: true });

    return () => {
      window.removeEventListener("click", initTTS);
      window.removeEventListener("keydown", initTTS);
    };
  }, []);

  // Stop active speech if user toggles mute
  useEffect(() => {
    if (settings.ui.isMuted && ttsRef.current) {
      ttsRef.current.stop();
      setIsSpeaking(false);
    }
  }, [settings.ui.isMuted]);

  // Handle GLB model loaded
  const handleModelLoaded = useCallback((scene: THREE.Group) => {
    sceneRef.current = scene;
    setModelReady(true);
    console.log("[Home] GLB avatar loaded and ready");
  }, []);

  // Handle AI response - trigger TTS and emotion
  const handleAiResponse = useCallback(
    (text: string) => {
      const { emotion } = parseEmotion(text);
      if (emotion) {
        setCurrentEmotion(emotion);
      }
      if (settings.ui.isMuted || !settings.voice.autoPlay) {
        return;
      }
      let tts = ttsRef.current;
      if (!tts) {
        tts = getTTSEngine();
        tts.init();
        tts.onSpeakStart = () => setIsSpeaking(true);
        tts.onSpeakEnd = () => setIsSpeaking(false);
        tts.onVisemeUpdate = (weights: Record<string, number>) => {
          const scene = sceneRef.current;
          if (scene?.userData?.setVisemeWeights) {
            scene.userData.setVisemeWeights(weights);
          }
        };
        ttsRef.current = tts;
      }
      tts.speak(text, {
        gender: settings.voice.gender,
        pitch: settings.voice.pitch,
        rate: settings.voice.rate,
        volume: settings.voice.volume,
        voiceURI: settings.voice.voiceURI,
      });
    },
    [settings.ui.isMuted, settings.voice]
  );

  // Handle voice recognition input from AvatarDock
  const handleVoiceInput = useCallback((transcript: string) => {
    setVoiceTranscript(transcript);
    setIsChatOpen(true);
  }, []);

  // Toggle chat panel visibility
  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const handleFallbackToDefault = useCallback(() => {
    updateAvatar({
      modelId: "akari",
      modelUrl: "/models/avatar.glb",
      customModelUrl: "",
    });
    updateCompanion({ name: "Akari" });
  }, [updateAvatar, updateCompanion]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050510] select-none">
      {/* ── 1. Scenic Anime Background Layer ── */}
      {currentBgUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${currentBgUrl})`,
            filter: `blur(${settings.background.blur}px) brightness(${settings.background.brightness}%)`,
            transform: "scale(1.03)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#060612] z-0 pointer-events-none">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>
      )}

      {/* Subtle dark ambient overlay for UI contrast */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none z-0" />

      {/* ── Mobile Top Header Bar (Oshikoi Style) ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-b from-[#0a0c18]/90 via-[#0a0c18]/60 to-transparent backdrop-blur-sm">
        {/* User Info & Stats */}
        <div className="flex items-center gap-2">
          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden text-sm">
            👤
          </div>

          {/* User Name */}
          <span className="text-white font-bold text-xs" suppressHydrationWarning>
            {settings.userProfile?.name || "heka"}
          </span>

          {/* Gem Pill */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[11px] text-sky-400 font-medium" suppressHydrationWarning>
            <span>💎</span>
            <span>{settings.userProfile?.gems ?? 5}</span>
          </div>

          {/* Candy/Ticket Pill */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[11px] text-pink-400 font-medium" suppressHydrationWarning>
            <span>🍬</span>
            <span>{settings.userProfile?.tickets ?? 537}</span>
          </div>

          {/* Hekari Capsule */}
          <div className="px-2 py-0.5 rounded-full bg-[#00bcd4]/20 border border-[#00bcd4]/40 text-[10px] text-[#00bcd4] font-semibold">
            hekari
          </div>
        </div>

        {/* Right Toggle Button (Toggle Chat History Drawer) */}
        <button
          onClick={toggleChat}
          className="w-8 h-8 rounded-xl bg-black/40 border border-white/15 text-white/70 hover:text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
          title={isChatOpen ? "Sembunyikan Riwayat Chat" : "Buka Riwayat Chat"}
          aria-label="Toggle chat history"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </button>
      </header>

      {/* ── 2. Left Sidebar (Oshikoi Navigation & Profile) ── */}
      {!settings.ui.isFocusMode && <Sidebar />}

      {/* ── 3. Central 3D Avatar Canvas (Full Viewport) ── */}
      <div
        className={`absolute inset-0 z-10 transition-all duration-500 ${
          !settings.ui.isFocusMode && settings.ui.isSidebarOpen ? "md:left-64" : "left-0"
        } ${isChatOpen ? "md:right-[420px]" : "right-0"}`}
        style={{ backgroundColor: "transparent" }}
      >
        {isMounted && (
          <AvatarCanvasComponent
            modelUrl={currentModelUrl}
            onModelLoaded={handleModelLoaded}
            onFallbackToDefault={handleFallbackToDefault}
            isSpeaking={isSpeaking}
            currentEmotion={currentEmotion}
          />
        )}
      </div>

      {/* ── Cute Oshikoi Mascot 3D Model Loading Screen ── */}
      <ModelLoadingScreen
        isModelReady={modelReady}
        companionName={settings.companion?.name}
      />

      {/* ── Floating Subtitle Dialogue Bubble (when chat panel drawer is closed) ── */}
      {!isChatOpen && latestAssistantMessage && (
        <FloatingDialogue
          message={latestAssistantMessage}
          companionName={settings.companion?.name || "Akari"}
          isSpeaking={isSpeaking}
          onReplayVoice={handleAiResponse}
          onOpenChatDrawer={() => setIsChatOpen(true)}
        />
      )}

      {/* ── 4. Centered Floating Bottom Avatar Dock ── */}
      <AvatarDock
        onSendMessage={(text: string) => {
          chatRef.current?.sendMessage(text);
        }}
        isSpeaking={isSpeaking}
      />

      {/* ── 5. Right Chat Panel Overlay ── */}
      <ChatPanelComponent
        ref={chatRef}
        onAiResponse={handleAiResponse}
        onLatestMessageChange={handleLatestMessageChange}
        isOpen={isChatOpen}
        onToggle={toggleChat}
        externalInput={voiceTranscript}
      />

      {/* ── 6. User Settings Modal ── */}
      <SettingsModal />

      {/* ── 7. Google Auth Modal ── */}
      <GoogleAuthModal />
    </main>
  );
}

/**
 * Root export wrapping MainAppView with global SettingsProvider and AuthProvider
 */
export default function Home() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <MainAppView />
      </AuthProvider>
    </SettingsProvider>
  );
}
