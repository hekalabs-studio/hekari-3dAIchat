"use client";

// ──────────────────────────────────────────────
// Oshikoi-style 3D Model Loading Screen
// ──────────────────────────────────────────────
// Replicates the cute mascot loading screen with
// animated chibi face, percentage progress bar,
// and "Memuat pasanganmu..." status text.

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

export default function ModelLoadingScreen({ isModelReady, companionName = "Akari" }) {
  const { progress, active } = useProgress();
  const [displayPercent, setDisplayPercent] = useState(15);
  const [isDone, setIsDone] = useState(false);

  // Smoothly interpolate progress percentage
  useEffect(() => {
    const target = Math.max(15, Math.min(100, Math.round(progress || 0)));
    const interval = setInterval(() => {
      setDisplayPercent((prev) => {
        if (isModelReady) return 100;
        if (prev < target) return prev + 1;
        return prev;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [progress, isModelReady]);

  // Fade out screen when model is ready
  useEffect(() => {
    if (isModelReady || (!active && progress === 100)) {
      const timer = setTimeout(() => {
        setIsDone(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isModelReady, active, progress]);

  if (isDone) return null;

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center transition-all duration-700 pointer-events-none ${
        isModelReady ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* ── Cute Oshikoi Mascot Face ── */}
      <div className="relative mb-6 animate-bounce" style={{ animationDuration: "2.2s" }}>
        {/* Cyan round face */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#00a6b4] shadow-2xl shadow-[#00a6b4]/40 flex flex-col items-center justify-center relative overflow-hidden border-2 border-white/20">
          {/* Eyes & Mouth */}
          <div className="flex items-center gap-6 mt-1">
            {/* Left Eye */}
            <div className="w-3.5 h-3.5 rounded-full bg-[#111c24]" />
            {/* Right Eye */}
            <div className="w-3.5 h-3.5 rounded-full bg-[#111c24]" />
          </div>

          {/* Cute Open Mouth */}
          <div className="w-3 h-3.5 rounded-full bg-[#111c24] mt-1.5" />

          {/* Blushing Cheeks */}
          <div className="absolute w-4 h-2 rounded-full bg-[#ff7388]/80 blur-[0.5px] left-3.5 top-1/2" />
          <div className="absolute w-4 h-2 rounded-full bg-[#ff7388]/80 blur-[0.5px] right-3.5 top-1/2" />

          {/* Subtle light reflection highlight */}
          <div className="absolute -top-4 -left-4 w-14 h-14 rounded-full bg-white/20 blur-md pointer-events-none" />
        </div>
      </div>

      {/* ── Progress Bar Card ── */}
      <div className="flex flex-col items-center w-52 sm:w-60">
        {/* Progress Pill Bar */}
        <div className="relative w-full h-8 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 overflow-hidden flex items-center justify-center shadow-lg">
          {/* Cyan Animated Progress Fill */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-[#00bcd4] transition-all duration-300 ease-out"
            style={{ width: `${displayPercent}%` }}
          />

          {/* Percentage Text (Overlaid) */}
          <span className="relative z-10 text-white font-bold text-sm tracking-wider drop-shadow-md">
            {displayPercent}%
          </span>
        </div>

        {/* Status Caption */}
        <p className="text-white/80 text-xs font-medium tracking-wide mt-3 drop-shadow text-center">
          Memuat pasanganmu...
        </p>
        <p className="text-white/40 text-[10px] mt-0.5">
          Menyiapkan shader {companionName}
        </p>
      </div>
    </div>
  );
}
