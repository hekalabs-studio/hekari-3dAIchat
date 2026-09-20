"use client";

// ──────────────────────────────────────────────
// Settings Modal - Full User Customization
// ──────────────────────────────────────────────
// Multi-tab modal allowing users to customize:
// - Latar Belakang (Presets, Custom URL, Blur, Brightness)
// - Suara & TTS (Voice selection, Pitch, Speed, Test voice)
// - Kepribadian & AI (Name, Persona, Model Provider, Prompt)
// - Avatar 3D (Breathing, Sway, Motion sensitivity)
// - Profil (User name, Title)

import { useState, useEffect } from "react";
import {
  useAppSettings,
  BACKGROUND_PRESETS,
  PERSONA_PRESETS,
  AVATAR_PRESETS,
} from "@/lib/settingsContext";
import { useAuth } from "@/lib/authContext";
import { getTTSEngine } from "@/lib/ttsEngine";
import {
  saveCustomModelToStorage,
  clearCustomModelFromStorage,
} from "@/lib/customModelStorage";

export default function SettingsModal() {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const {
    settings,
    settingsModal,
    openSettings,
    closeSettings,
    updateBackground,
    updateCompanion,
    updateVoice,
    updateAvatar,
    updateUserProfile,
    resetSettings,
  } = useAppSettings();

  const activeTab = settingsModal.activeTab || "background";
  const [availableVoices, setAvailableVoices] = useState([]);
  const [testPlaying, setTestPlaying] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Handle custom model file selection from local PC
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    // Recommend max 120MB for smooth browser loading
    if (file.size > 120 * 1024 * 1024) {
      setUploadError("Ukuran file terlalu besar (maksimal 120MB untuk kenyamanan memori peramban).");
      return;
    }

    setUploadLoading(true);
    try {
      const { blobUrl } = await saveCustomModelToStorage(file, file.name);
      updateAvatar({
        modelId: "custom",
        customModelUrl: blobUrl,
        customModelName: file.name,
      });

      // Synchronize character name if it was set to standard default
      if (settings.companion?.name === "Akari" || settings.companion?.name === "Ren" || !settings.companion?.name) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        const titleName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        updateCompanion({ name: titleName });
      }
    } catch (err) {
      console.error("[SettingsModal] IndexedDB save error, using direct blob URL:", err);
      const directBlobUrl = URL.createObjectURL(file);
      updateAvatar({
        modelId: "custom",
        customModelUrl: directBlobUrl,
        customModelName: file.name,
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemoveCustomModel = async () => {
    await clearCustomModelFromStorage();
    updateAvatar({
      modelId: "akari",
      modelUrl: "/models/avatar.glb",
      customModelUrl: "",
      customModelName: "",
    });
    updateCompanion({ name: "Akari" });
  };

  // Fetch speech synthesis voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!settingsModal.isOpen) return null;

  const handleTestVoice = () => {
    setTestPlaying(true);
    const tts = getTTSEngine();
    tts.init();
    tts.speak(
      `Halo ${settings.userProfile.name}! Aku ${settings.companion.name}. Senang sekali bisa menemanimu hari ini!`,
      {
        gender: settings.voice.gender,
        pitch: settings.voice.pitch,
        rate: settings.voice.rate,
        volume: settings.voice.volume,
        voiceURI: settings.voice.voiceURI,
      }
    );
    setTimeout(() => setTestPlaying(false), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateBackground({
            id: "custom",
            customUrl: event.target.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: "background", label: "Latar Belakang", icon: "🖼️" },
    { id: "voice", label: "Suara (TTS)", icon: "🔊" },
    { id: "persona", label: "Kepribadian & AI", icon: "✨" },
    { id: "avatar", label: "Avatar 3D", icon: "💃" },
    { id: "profile", label: "Profil Saya", icon: "👤" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0c0c16]/95 border border-white/[0.12] shadow-2xl shadow-black/80 overflow-hidden">
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm">
              ⚙️
            </div>
            <div>
              <h3 className="text-white text-base font-semibold tracking-tight">
                Pengaturan Kustomisasi
              </h3>
              <p className="text-white/40 text-xs">
                Sesuaikan tampilan, suara, dan kepribadian companion sesukamu
              </p>
            </div>
          </div>

          <button
            data-close-settings="true"
            onClick={closeSettings}
            className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Tab Bar Navigation ── */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-white/[0.06] bg-black/30 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => openSettings(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600/30 text-white border border-indigo-500/40 shadow-sm"
                  : "text-white/50 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab Content Body ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
          {/* TAB 1: LATAR BELAKANG */}
          {activeTab === "background" && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3 block">
                  Pilih Preset Latar Belakang
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  {BACKGROUND_PRESETS.map((preset) => {
                    const isSelected = settings.background.id === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => updateBackground({ id: preset.id })}
                        className={`relative rounded-2xl p-3 cursor-pointer overflow-hidden border transition-all ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30"
                            : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15]"
                        }`}
                      >
                        {preset.url ? (
                          <div
                            className="h-24 rounded-xl bg-cover bg-center mb-2.5 border border-white/10"
                            style={{ backgroundImage: `url(${preset.url})` }}
                          />
                        ) : (
                          <div className="h-24 rounded-xl bg-gradient-to-br from-[#050510] to-[#121226] mb-2.5 border border-white/10 flex items-center justify-center text-white/30 text-xs">
                            Dark Studio
                          </div>
                        )}
                        <p className="text-white text-xs font-semibold flex items-center justify-between">
                          <span>{preset.label}</span>
                          {isSelected && <span className="text-indigo-400">✓</span>}
                        </p>
                        <p className="text-white/40 text-[10px] mt-0.5 leading-snug">
                          {preset.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL / Upload */}
              <div className="pt-2 border-t border-white/[0.06] space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 block">
                  Atau Gunakan Gambar Sendiri (URL / Upload)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.background.customUrl || ""}
                    onChange={(e) =>
                      updateBackground({
                        id: "custom",
                        customUrl: e.target.value,
                      })
                    }
                    placeholder="https://example.com/wallpaper.jpg"
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50"
                  />
                  <label className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5">
                    <span>Unggah</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Blur and Brightness Sliders */}
              <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/70">Efek Blur Latar Belakang</span>
                    <span className="text-indigo-400 font-medium">
                      {settings.background.blur}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={settings.background.blur}
                    onChange={(e) =>
                      updateBackground({ blur: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/70">Kecerahan Latar Belakang</span>
                    <span className="text-indigo-400 font-medium">
                      {settings.background.brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="130"
                    step="5"
                    value={settings.background.brightness}
                    onChange={(e) =>
                      updateBackground({ brightness: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUARA (TTS) */}
          {activeTab === "voice" && (
            <div className="space-y-5">
              {/* Voice Gender Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2.5 block">
                  Pilihan Gender Suara (Voice Over)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateVoice({ gender: "female", pitch: 1.15 })}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      settings.voice.gender === "female"
                        ? "bg-[#00bcd4]/15 border-[#00bcd4] text-white shadow-lg shadow-[#00bcd4]/20"
                        : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center text-xl flex-shrink-0">
                      👩
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Perempuan (Female)</p>
                      <p className="text-[10px] text-white/40">Suara lembut, manis & ramah</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateVoice({ gender: "male", pitch: 0.88 })}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      settings.voice.gender === "male"
                        ? "bg-[#00bcd4]/15 border-[#00bcd4] text-white shadow-lg shadow-[#00bcd4]/20"
                        : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-xl flex-shrink-0">
                      👨
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Laki-laki (Male)</p>
                      <p className="text-[10px] text-white/40">Suara tenang, berat & hangat</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Voice Selector */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Pilihan Suara Spesifik (Speech Voice)
                </label>
                <select
                  value={settings.voice.voiceURI || ""}
                  onChange={(e) => updateVoice({ voiceURI: e.target.value })}
                  className="w-full bg-[#121224] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Otomatis (Sesuai Gender & Bahasa Indonesia)</option>
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
                <p className="text-white/30 text-[11px] mt-1.5">
                  Browser akan otomatis menyelaraskan nada dan filter suara sesuai gender yang Anda pilih.
                </p>
              </div>

              {/* Pitch & Speed Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/70">Kecepatan Bicara (Speed)</span>
                    <span className="text-indigo-400 font-medium">{settings.voice.rate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.05"
                    value={settings.voice.rate}
                    onChange={(e) => updateVoice({ rate: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/70">Nada Suara (Pitch)</span>
                    <span className="text-indigo-400 font-medium">{settings.voice.pitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.5"
                    step="0.05"
                    value={settings.voice.pitch}
                    onChange={(e) => updateVoice({ pitch: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Test Voice Button */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-semibold">Uji Coba Suara</p>
                  <p className="text-white/40 text-[11px]">Dengarkan sampel suara dengan pengaturan di atas</p>
                </div>
                <button
                  onClick={handleTestVoice}
                  disabled={testPlaying}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium hover:scale-105 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                >
                  <span>{testPlaying ? "Sedang Bicara..." : "▶ Putar Suara"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: KEPRIBADIAN & AI */}
          {activeTab === "persona" && (
            <div className="space-y-5">
              {/* Companion Name */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Nama AI Companion
                </label>
                <input
                  type="text"
                  value={settings.companion.name}
                  onChange={(e) => updateCompanion({ name: e.target.value })}
                  placeholder="Misal: Akari / Aiko"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Persona Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2.5 block">
                  Gaya Kepribadian (Persona)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERSONA_PRESETS.map((p) => {
                    const isSelected = settings.companion.persona === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => updateCompanion({ persona: p.id })}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500/30"
                            : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
                        }`}
                      >
                        <p className="text-white text-xs font-semibold flex items-center justify-between">
                          <span>{p.label}</span>
                          {isSelected && <span className="text-indigo-400">✓</span>}
                        </p>
                        <p className="text-white/40 text-[10px] mt-1 leading-snug">
                          {p.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Model Provider Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2.5 block">
                  Model AI (Otak Utama Companion)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      key: "groq",
                      label: "Groq (Ultra Fast)",
                      desc: "Respon super kilat < 1 detik (Default Utama)",
                      icon: "⚡",
                      color: "#f55036",
                    },
                    {
                      key: "google",
                      label: "Gemini 3.6 Flash",
                      desc: "Pemahaman konteks luas oleh Google",
                      icon: "◆",
                      color: "#4285f4",
                    },
                    {
                      key: "mistral",
                      label: "Mistral 7B",
                      desc: "Model open-source cerdas & ekspresif",
                      icon: "▲",
                      color: "#ff7000",
                    },
                    {
                      key: "anthropic",
                      label: "Claude Sonnet 3.5",
                      desc: "Kecerdasan emosional tinggi oleh Anthropic",
                      icon: "✦",
                      color: "#d4a574",
                    },
                  ].map((prov) => {
                    const isSelected = (settings.companion.modelProvider || "groq") === prov.key;
                    return (
                      <div
                        key={prov.key}
                        onClick={() => updateCompanion({ modelProvider: prov.key })}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#00bcd4]/15 border-[#00bcd4] ring-1 ring-[#00bcd4]/30 shadow-lg shadow-[#00bcd4]/15"
                            : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
                        }`}
                      >
                        <p className="text-white text-xs font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span style={{ color: prov.color }}>{prov.icon}</span>
                            <span>{prov.label}</span>
                          </span>
                          {isSelected && <span className="text-[#00bcd4] font-bold">✓ Aktif</span>}
                        </p>
                        <p className="text-white/40 text-[10px] mt-1 leading-snug">
                          {prov.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Instruksi Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={settings.companion.customPrompt || ""}
                  onChange={(e) => updateCompanion({ customPrompt: e.target.value })}
                  placeholder="Contoh: Suka memanggilku 'Onii-chan' atau suka membahas game dan anime..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-white/25 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: AVATAR 3D */}
          {activeTab === "avatar" && (
            <div className="space-y-5">
              {/* 3D Model Presets */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3 block">
                  Pilih Model Karakter 3D (Tersedia Beragam Model)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected =
                      settings.avatar.modelId === preset.id ||
                      (preset.id === "ren" && settings.avatar.modelId === "hina");
                    return (
                      <div
                        key={preset.id}
                        data-avatar-preset={preset.id}
                        onClick={() => {
                          updateAvatar({
                            modelId: preset.id,
                            modelUrl: preset.url,
                          });
                          if (preset.defaultVoiceGender) {
                            updateVoice({
                              gender: preset.defaultVoiceGender,
                              pitch: preset.defaultVoiceGender === "male" ? 0.88 : 1.15,
                            });
                          }
                          if (preset.name && preset.id !== "custom") {
                            updateCompanion({ name: preset.name });
                          }
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#00bcd4]/15 border-[#00bcd4] shadow-lg shadow-[#00bcd4]/20"
                            : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center overflow-hidden text-2xl flex-shrink-0">
                            {preset.image ? (
                              <img src={preset.image} alt={preset.name} className="w-full h-full object-cover object-top" />
                            ) : (
                              preset.thumb
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-white text-xs font-bold truncate">
                                {preset.name}
                              </p>
                              {isSelected && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-[#00bcd4] font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00bcd4] animate-pulse" />
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-white/45 text-[11px] line-clamp-2 mt-0.5 leading-snug">
                              {preset.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom GLB URL / Upload (if custom chosen) */}
              {settings.avatar.modelId === "custom" && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-[#00bcd4]/30 space-y-3.5 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-white block">
                        File Model 3D Kustom Komputer
                      </label>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Format didukung: <strong>.glb</strong> (disarankan) atau <strong>.vrm</strong>
                      </p>
                    </div>
                    {settings.avatar.customModelName && (
                      <span className="px-2 py-0.5 rounded-full bg-[#00bcd4]/15 border border-[#00bcd4]/30 text-[10px] text-[#00bcd4] font-medium">
                        Tersimpan Lokal
                      </span>
                    )}
                  </div>

                  {/* Active file display card */}
                  {settings.avatar.customModelName ? (
                    <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#00bcd4]/20 border border-[#00bcd4]/40 flex items-center justify-center text-sm flex-shrink-0">
                          📦
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {settings.avatar.customModelName}
                          </p>
                          <p className="text-[10px] text-emerald-400 font-medium">
                            Aktif & tersimpan otomatis di IndexedDB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <label className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium cursor-pointer transition-colors">
                          <span>Ganti</span>
                          <input
                            type="file"
                            accept=".glb,.gltf,.vrm"
                            onChange={handleFileSelected}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveCustomModel}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Hapus model dan kembali ke Akari"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label
                        className={`w-full p-4 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                          uploadLoading
                            ? "bg-white/[0.08] border-[#00bcd4] animate-pulse"
                            : "bg-white/[0.02] border-white/20 hover:bg-white/[0.06] hover:border-[#00bcd4]"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#00bcd4]/15 text-[#00bcd4] flex items-center justify-center text-lg">
                          {uploadLoading ? "⏳" : "📁"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {uploadLoading
                              ? "Menyimpan ke memori browser..."
                              : "Klik untuk Pilih File .glb / .vrm"}
                          </p>
                          <p className="text-[11px] text-white/40 mt-0.5">
                            File akan otomatis disimpan di browser Anda (IndexedDB)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".glb,.gltf,.vrm"
                          onChange={handleFileSelected}
                          disabled={uploadLoading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {uploadError && (
                    <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                      {uploadError}
                    </p>
                  )}

                  {/* Remote URL fallback option */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] text-white/50 block">
                      Atau masukkan URL online langsung (.glb):
                    </label>
                    <input
                      type="text"
                      value={
                        settings.avatar.customModelUrl?.startsWith("blob:")
                          ? ""
                          : settings.avatar.customModelUrl || ""
                      }
                      onChange={(e) => {
                        updateAvatar({
                          modelId: "custom",
                          customModelUrl: e.target.value,
                          customModelName: e.target.value ? "Online GLB Model" : "",
                        });
                      }}
                      placeholder="https://example.com/character.glb"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-[#00bcd4]"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[10px] text-white/50 leading-relaxed">
                    💡 <strong>Tips Penting:</strong> Gunakan file <strong>.glb</strong> (Binary GLTF) yang sudah memuat tekstur secara mandiri, atau file <strong>.vrm</strong> dari VRoid Studio. File <code>.gltf</code> biasa yang terpisah dengan folder tekstur / <code>.bin</code> tidak dapat dimuat langsung via peramban.
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/70">Kecepatan Bernapas (Breathing)</span>
                    <span className="text-indigo-400 font-medium">
                      {settings.avatar.breathingSpeed}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.avatar.breathingSpeed}
                    onChange={(e) =>
                      updateAvatar({ breathingSpeed: parseFloat(e.target.value) })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/70">Intensitas Ayunan (Sway)</span>
                    <span className="text-indigo-400 font-medium">
                      {settings.avatar.swayIntensity}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={settings.avatar.swayIntensity}
                    onChange={(e) =>
                      updateAvatar({ swayIntensity: parseFloat(e.target.value) })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-semibold">Gestur Bicara (Speaking Gestures)</p>
                  <p className="text-white/40 text-[11px]">Gerakan kepala & tubuh saat AI sedang bersuara</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.avatar.speakingGestures}
                  onChange={(e) =>
                    updateAvatar({ speakingGestures: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 5: PROFIL */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              {/* Google Account Status Card */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                    Status Akun Google
                  </span>
                  {isAuthenticated ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Terhubung
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-medium">
                      Tamu (Belum Login)
                    </span>
                  )}
                </div>

                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-11 h-11 rounded-full border border-purple-400/40 object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base">
                          {(user?.name || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm font-semibold">{user?.name}</p>
                        <p className="text-white/40 text-xs">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-red-500/20 text-white/70 hover:text-red-300 text-xs border border-white/[0.08] hover:border-red-500/30 transition-all cursor-pointer"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-white/40 text-xs">
                      Masuk untuk membuka akses AI &amp; menyimpan riwayat.
                    </p>
                    <button
                      onClick={openAuthModal}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.43 7.37 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.57 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                      </svg>
                      <span>Masuk Google</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Nama Panggilan Anda
                </label>
                <input
                  type="text"
                  value={settings.userProfile.name}
                  onChange={(e) => updateUserProfile({ name: e.target.value })}
                  placeholder="heka"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-white/30 text-[10px] mt-1">
                  Nama ini akan dipakai oleh AI saat menyapa atau berbicara dengan Anda.
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-semibold">Kembalikan ke Default</p>
                  <p className="text-white/40 text-[11px]">Reset semua preferensi dan latar belakang</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Reset semua pengaturan ke bawaan awal?")) {
                      resetSettings();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium border border-red-500/30 transition-colors"
                >
                  Reset Semua
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-black/40 flex items-center justify-between">
          <p className="text-white/30 text-[11px]">
            Pengaturan tersimpan otomatis ke peramban (localStorage)
          </p>
          <button
            data-close-settings="true"
            onClick={closeSettings}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/30"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
