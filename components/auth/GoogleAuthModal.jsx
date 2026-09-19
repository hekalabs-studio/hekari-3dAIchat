"use client";

// ──────────────────────────────────────────────
// Google Auth Modal - Oshikoi Style
// ──────────────────────────────────────────────
// Dialog for signing in or registering with Google
// to unlock full access to the 3D AI companion.

import { useState } from "react";
import { useAuth } from "@/lib/authContext";

export default function GoogleAuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginWithGoogle, loginWithCustomAccount } = useAuth();
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogleClick = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    setIsSubmitting(true);
    try {
      loginWithCustomAccount(customEmail, customName);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fadeIn">
      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-[#0e0e1a]/95 border border-white/[0.12] p-6 sm:p-8 shadow-2xl shadow-purple-950/40 animate-slideUp overflow-hidden">
        {/* Glow Accent Orbs */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] text-white/50 hover:text-white flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Header ── */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-xl shadow-purple-500/25 mb-4">
            <div className="w-full h-full rounded-2xl bg-[#0e0e1a] flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium tracking-wide mb-2">
            Akses Penuh AI Companion
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Masuk dengan Akun Google
          </h2>
          <p className="text-white/50 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Masuk untuk mulai mengobrol dengan Akari, menggunakan suara mikrofon, dan menyimpan ikatan emosional Anda.
          </p>
        </div>

        {/* ── Feature Highlights ── */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">
              ⚡
            </div>
            <div className="text-left">
              <p className="text-white/90 text-xs font-semibold">Model AI Tanpa Batas</p>
              <p className="text-white/40 text-[11px]">Dukungan Gemini 3.6 Flash, Claude 3.5 Sonnet, & Grok</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 text-sm">
              💎
            </div>
            <div className="text-left">
              <p className="text-white/90 text-xs font-semibold">Bonus Selamat Datang</p>
              <p className="text-white/40 text-[11px]">Gratis +10 Gems 💎 dan +100 Tiket Chat 🎟️</p>
            </div>
          </div>
        </div>

        {/* ── Main Google Sign-In Button ── */}
        <button
          onClick={handleGoogleClick}
          disabled={isSubmitting}
          className="w-full h-12 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg shadow-white/10 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {/* Multi-color Google 'G' Icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          <span>{isSubmitting ? "Menghubungkan..." : "Lanjutkan dengan Akun Google"}</span>
        </button>

        {/* ── Divider / Manual Option Toggle ── */}
        <div className="mt-4 pt-4 border-t border-white/[0.08] text-center">
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            {showManualInput ? "▲ Sembunyikan form manual" : "▼ Atau gunakan email Google spesifik"}
          </button>
        </div>

        {/* ── Manual Google Email Form (Optional for custom test) ── */}
        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="mt-3 space-y-2.5 animate-fadeIn">
            <div>
              <label className="block text-[11px] text-white/50 mb-1 text-left">Nama Anda</label>
              <input
                type="text"
                placeholder="Contoh: Heka Pratama"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-xs placeholder-white/20 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/50 mb-1 text-left">Alamat Email Google</label>
              <input
                type="email"
                required
                placeholder="nama@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-xs placeholder-white/20 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={!customEmail.trim() || isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-40"
            >
              Masuk Sekarang
            </button>
          </form>
        )}

        {/* ── Terms & Privacy Footer ── */}
        <p className="text-white/30 text-[10px] text-center mt-5 leading-relaxed">
          Dengan melanjutkan, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi Aiko AI Companion.
        </p>
      </div>
    </div>
  );
}
