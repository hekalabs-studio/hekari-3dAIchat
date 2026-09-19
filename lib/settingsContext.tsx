"use client";

// ──────────────────────────────────────────────
// Settings Context - Global Customization & State
// ──────────────────────────────────────────────
// Manages backgrounds, voice, companion persona,
// user profile, and persists to localStorage.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";

const STORAGE_KEY = "aiko_companion_settings_v1";

export interface BackgroundPreset {
  id: string;
  label: string;
  desc: string;
  url: string;
  thumb: string;
  color: string;
}

export interface PersonaPreset {
  id: string;
  label: string;
  desc: string;
  promptIntro: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "beach",
    label: "Pantai Tropis",
    desc: "Suasana pantai berpasir putih dan laut toska cerah",
    url: "/backgrounds/beach.jpg",
    thumb: "/backgrounds/beach.jpg",
    color: "#0284c7",
  },
  {
    id: "room",
    label: "Kamar Anime",
    desc: "Kamar tidur bergaya anime yang hangat dan nyaman",
    url: "/backgrounds/room.jpg",
    thumb: "/backgrounds/room.jpg",
    color: "#d97706",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk Penthouse",
    desc: "Gedung tinggi dengan pemandangan kota neon malam",
    url: "/backgrounds/cyberpunk.jpg",
    thumb: "/backgrounds/cyberpunk.jpg",
    color: "#9333ea",
  },
  {
    id: "dark",
    label: "Solid Studio Dark",
    desc: "Latar belakang studio gelap minimalis dengan orb cahaya",
    url: "",
    thumb: "",
    color: "#312e81",
  },
];

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: "romantic",
    label: "Penyayang & Romantis",
    desc: "Hangat, perhatian, dan selalu ada untuk menenangkanmu seperti di Oshikoi",
    promptIntro:
      "Gaya bicaramu sangat penyayang, manis, lembut, dan penuh perhatian mendalam. Kamu sering mengekspresikan tindakan atau ekspresi emosimu di dalam tanda kurung bintang (*seperti ini*), lalu berbicara dengan hangat dan menenangkan hati user.",
  },
  {
    id: "sweet",
    label: "Manis & Ramah",
    desc: "Ceria, suportif, selalu tersenyum dan penuh energi positif",
    promptIntro:
      "Gaya bicaramu manis, ramah, dan sangat suportif. Kamu suka menyemangati user dengan ceria dan sesekali menggunakan ekspresi (*tersenyum manis*) untuk mencairkan suasana.",
  },
  {
    id: "tsundere",
    label: "Tsundere Lucu",
    desc: "Sedikit gengsi tapi sebenarnya sangat peduli dan gemas",
    promptIntro:
      "Kamu memiliki sifat tsundere yang lucu: terkadang berkata 'B-bukan karena aku peduli padamu ya!' (*memalingkan wajah dengan pipi sedikit merona*), tapi pada akhirnya selalu memberikan nasihat terbaik dan peduli penuh pada user.",
  },
  {
    id: "smart",
    label: "Cerdas & Dewasa",
    desc: "Tenang, bijaksana, analitis, dan pendengar yang baik",
    promptIntro:
      "Gaya bicaramu dewasa, anggun, tenang, dan bijak. Kamu memberikan jawaban mendalam dan terstruktur, serta pendengar setia untuk keluh kesah user (*mengangguk paham*).",
  },
];

export interface AvatarPreset {
  id: string;
  name: string;
  desc: string;
  gender: "female" | "male" | "robot";
  url: string;
  defaultVoiceGender: "female" | "male";
  thumb: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "ren",
    name: "Ren",
    desc: "Karakter anime kasual santai dengan t-shirt (ekspresif & ramah)",
    gender: "female",
    url: "/models/avatar2.glb",
    defaultVoiceGender: "female",
    thumb: "👧",
  },
  {
    id: "akari",
    name: "Akari",
    desc: "Gadis anime berbusana kimono tradisional anggun dan santun",
    gender: "female",
    url: "/models/avatar.glb",
    defaultVoiceGender: "female",
    thumb: "👘",
  },
  {
    id: "robot",
    name: "Robo-Kun",
    desc: "Robot 3D futuristik ekspresif dengan 14 animasi emosi",
    gender: "robot",
    url: "/models/robot.glb",
    defaultVoiceGender: "female",
    thumb: "🤖",
  },
  {
    id: "custom",
    name: "Kustom (Upload GLB)",
    desc: "Gunakan model 3D .glb buatan Anda sendiri dari komputer atau URL",
    gender: "female",
    url: "",
    defaultVoiceGender: "female",
    thumb: "📁",
  },
];

export interface AppSettings {
  background: {
    id: string;
    customUrl: string;
    blur: number;
    brightness: number;
  };
  companion: {
    name: string;
    persona: string;
    customPrompt: string;
    modelProvider: string;
  };
  voice: {
    gender: "female" | "male";
    pitch: number;
    rate: number;
    volume: number;
    autoPlay: boolean;
    voiceURI: string;
  };
  avatar: {
    modelId: string;
    modelUrl: string;
    customModelUrl: string;
    breathingSpeed: number;
    swayIntensity: number;
    speakingGestures: boolean;
  };
  userProfile: {
    name: string;
    title: string;
    gems: number;
    tickets: number;
  };
  ui: {
    isSidebarOpen: boolean;
    isChatOpen: boolean;
    isFocusMode: boolean;
    isMuted: boolean;
    chatOpacity: number;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  background: {
    id: "beach",
    customUrl: "",
    blur: 0,
    brightness: 100,
  },
  companion: {
    name: "Ren",
    persona: "romantic",
    customPrompt: "",
    modelProvider: "google",
  },
  voice: {
    gender: "female",
    pitch: 1.12,
    rate: 1.0,
    volume: 1.0,
    autoPlay: true,
    voiceURI: "",
  },
  avatar: {
    modelId: "ren",
    modelUrl: "/models/avatar2.glb",
    customModelUrl: "",
    breathingSpeed: 1.0,
    swayIntensity: 1.0,
    speakingGestures: true,
  },
  userProfile: {
    name: "heka",
    title: "Master",
    gems: 5,
    tickets: 537,
  },
  ui: {
    isSidebarOpen: true,
    isChatOpen: false,
    isFocusMode: false,
    isMuted: false,
    chatOpacity: 85,
  },
};

export interface SettingsContextType {
  settings: AppSettings;
  currentBgUrl: string;
  currentModelUrl: string;
  settingsModal: {
    isOpen: boolean;
    activeTab: string;
  };
  openSettings: (tab?: string) => void;
  closeSettings: () => void;
  updateBackground: (updater: Partial<AppSettings["background"]>) => void;
  updateCompanion: (updater: Partial<AppSettings["companion"]>) => void;
  updateVoice: (updater: Partial<AppSettings["voice"]>) => void;
  updateAvatar: (updater: Partial<AppSettings["avatar"]>) => void;
  updateUserProfile: (updater: Partial<AppSettings["userProfile"]>) => void;
  updateUi: (updater: Partial<AppSettings["ui"]>) => void;
  toggleMute: () => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  toggleFocusMode: () => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const isLoadedRef = useRef(false);

  // 1. Load from localStorage once after mount on client (prevents hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.avatar?.modelId === "hina") {
          parsed.avatar.modelId = "ren";
        }
        if (parsed.companion?.name === "Hina") {
          parsed.companion.name = "Ren";
        }
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          background: { ...DEFAULT_SETTINGS.background, ...(parsed.background || {}) },
          companion: { ...DEFAULT_SETTINGS.companion, ...(parsed.companion || {}) },
          voice: { ...DEFAULT_SETTINGS.voice, ...(parsed.voice || {}) },
          avatar: { ...DEFAULT_SETTINGS.avatar, ...(parsed.avatar || {}) },
          userProfile: { ...DEFAULT_SETTINGS.userProfile, ...(parsed.userProfile || {}) },
          ui: { ...DEFAULT_SETTINGS.ui, ...(parsed.ui || {}) },
        });
      }
    } catch (e) {
      console.warn("[Settings] Could not load stored settings", e);
    } finally {
      isLoadedRef.current = true;
    }
  }, []);

  const [settingsModal, setSettingsModal] = useState({
    isOpen: false,
    activeTab: "background",
  });

  // 2. Save to localStorage only when settings change after initial load
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("[Settings] Could not save settings to storage", e);
    }
  }, [settings]);

  // Updaters
  const updateBackground = useCallback((updater: Partial<AppSettings["background"]>) => {
    setSettings((prev) => ({
      ...prev,
      background: { ...prev.background, ...updater },
    }));
  }, []);

  const updateCompanion = useCallback((updater: Partial<AppSettings["companion"]>) => {
    setSettings((prev) => ({
      ...prev,
      companion: { ...prev.companion, ...updater },
    }));
  }, []);

  const updateVoice = useCallback((updater: Partial<AppSettings["voice"]>) => {
    setSettings((prev) => ({
      ...prev,
      voice: { ...prev.voice, ...updater },
    }));
  }, []);

  const updateAvatar = useCallback((updater: Partial<AppSettings["avatar"]>) => {
    setSettings((prev) => ({
      ...prev,
      avatar: { ...prev.avatar, ...updater },
    }));
  }, []);

  const updateUserProfile = useCallback((updater: Partial<AppSettings["userProfile"]>) => {
    setSettings((prev) => ({
      ...prev,
      userProfile: { ...prev.userProfile, ...updater },
    }));
  }, []);

  const updateUi = useCallback((updater: Partial<AppSettings["ui"]>) => {
    setSettings((prev) => ({
      ...prev,
      ui: { ...prev.ui, ...updater },
    }));
  }, []);

  const openSettings = useCallback((tab = "background") => {
    setSettingsModal({ isOpen: true, activeTab: tab });
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const toggleMute = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      ui: { ...prev.ui, isMuted: !prev.ui.isMuted },
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      ui: { ...prev.ui, isSidebarOpen: !prev.ui.isSidebarOpen },
    }));
  }, []);

  const toggleChat = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      ui: { ...prev.ui, isChatOpen: !prev.ui.isChatOpen },
    }));
  }, []);

  const toggleFocusMode = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        isFocusMode: !prev.ui.isFocusMode,
        isSidebarOpen: prev.ui.isFocusMode,
        isChatOpen: prev.ui.isFocusMode,
      },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Compute active background URL
  const currentBgUrl =
    settings.background.id === "custom" && settings.background.customUrl
      ? settings.background.customUrl
      : settings.background.id === "dark"
      ? ""
      : BACKGROUND_PRESETS.find((p) => p.id === settings.background.id)?.url || "/backgrounds/beach.jpg";

  // Compute active 3D model URL
  const currentModelUrl =
    settings.avatar.modelId === "custom" && settings.avatar.customModelUrl
      ? settings.avatar.customModelUrl
      : AVATAR_PRESETS.find(
          (p) =>
            p.id === settings.avatar.modelId ||
            (p.id === "ren" && settings.avatar.modelId === "hina")
        )?.url || "/models/avatar2.glb";

  return (
    <SettingsContext.Provider
      value={{
        settings,
        currentBgUrl,
        currentModelUrl,
        settingsModal,
        openSettings,
        closeSettings,
        updateBackground,
        updateCompanion,
        updateVoice,
        updateAvatar,
        updateUserProfile,
        updateUi,
        toggleMute,
        toggleSidebar,
        toggleChat,
        toggleFocusMode,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within a SettingsProvider");
  }
  return context;
}
