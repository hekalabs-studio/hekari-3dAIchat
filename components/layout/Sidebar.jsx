"use client";

// ──────────────────────────────────────────────
// Left Sidebar - Navigation & Quick Settings
// ──────────────────────────────────────────────
// Replicates the Oshikoi left navigation bar with
// user profile, gems, menu items, and news banner.

import { useState } from "react";
import { useAppSettings } from "@/lib/settingsContext";
import { useAuth } from "@/lib/authContext";

export default function Sidebar() {
  const { settings, openSettings, toggleSidebar } = useAppSettings();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { userProfile, ui } = settings;
  const [activeMenu, setActiveMenu] = useState("Ruang Saya");
  const [dailyClaimed, setDailyClaimed] = useState(false);

  const handleMenuClick = (item) => {
    setActiveMenu(item.label);
    if (item.tab) {
      openSettings(item.tab);
    } else if (item.action === "checkin") {
      if (!dailyClaimed) {
        setDailyClaimed(true);
        alert("🎉 Check-In Harian Berhasil! Kamu mendapatkan +1 💎 dan +20 🎟️");
      } else {
        alert("Kamu sudah melakukan check-in hari ini. Kembali lagi besok ya!");
      }
    }
  };

  const personalItems = [
    {
      label: "Ruang Saya",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      label: "Panel Kontrol",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      ),
      tab: "persona",
    },
    {
      label: "Memori",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      ),
      tab: "persona",
    },
    {
      label: "Check-In Harian",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
        </svg>
      ),
      action: "checkin",
    },
    {
      label: "Ruang Ganti",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
        </svg>
      ),
      tab: "avatar",
    },
  ];

  const settingItems = [
    {
      label: "Latar Belakang",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      tab: "background",
    },
    {
      label: "Bahasa",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
        </svg>
      ),
      tab: "persona",
    },
    {
      label: "Suara",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.215-1.625.59-2.332a2.008 2.008 0 011.67-1.418h2.24z" />
        </svg>
      ),
      tab: "voice",
    },
    {
      label: "Chat Proaktif",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
      tab: "persona",
    },
  ];

  if (!ui.isSidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="hidden md:flex fixed top-4 left-4 z-40 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:bg-black/80 items-center justify-center transition-all shadow-lg cursor-pointer"
        aria-label="Open sidebar"
        title="Buka Menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
    );
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-64 bg-[#0a0a14]/80 backdrop-blur-2xl border-r border-white/[0.08] flex-col justify-between select-none transition-all duration-300">
      {/* ── Top Header & User Profile ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        {/* User Card */}
        {!isAuthenticated ? (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
            <button
              onClick={openAuthModal}
              className="flex-1 mr-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-left flex items-center gap-2.5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.43 7.37 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.57 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-semibold group-hover:text-purple-300 transition-colors">
                  Masuk Google
                </p>
                <p className="text-white/40 text-[10px] truncate">
                  Buka akses AI
                </p>
              </div>
            </button>

            {/* Minimize Sidebar Button */}
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors flex-shrink-0"
              title="Sembunyikan Sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
            <div
              onClick={() => openSettings("profile")}
              className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0 mr-1"
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border border-purple-400/40 object-cover group-hover:border-purple-300 transition-colors"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10 flex items-center justify-center text-white font-bold group-hover:border-indigo-400/50 transition-colors">
                  {(user?.name || userProfile.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white text-sm font-semibold tracking-tight group-hover:text-indigo-300 transition-colors truncate">
                  {user?.name || userProfile.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center text-[11px] text-cyan-400 font-medium">
                    💎 {userProfile.gems}
                  </span>
                  <span className="inline-flex items-center text-[11px] text-pink-400 font-medium">
                    🎟️ {userProfile.tickets}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Logout Button */}
              <button
                onClick={logout}
                className="w-7 h-7 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                title="Keluar Akun Google"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>

              {/* Minimize Sidebar Button */}
              <button
                onClick={toggleSidebar}
                className="w-7 h-7 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors flex-shrink-0"
                title="Sembunyikan Sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Section: PRIBADI ── */}
        <div className="mb-5">
          <p className="px-2 mb-1.5 text-[10px] font-semibold tracking-wider text-white/35 uppercase">
            Pribadi
          </p>
          <nav className="space-y-0.5">
            {personalItems.map((item) => {
              const isActive = activeMenu === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.08]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className={isActive ? "text-indigo-400" : "text-white/50"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Section: PENGATURAN ── */}
        <div className="mb-4">
          <p className="px-2 mb-1.5 text-[10px] font-semibold tracking-wider text-white/35 uppercase">
            Pengaturan
          </p>
          <nav className="space-y-0.5">
            {settingItems.map((item) => {
              const isActive = activeMenu === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.08]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className={isActive ? "text-indigo-400" : "text-white/50"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Bottom Section: Oshikoi / Discord Banner ── */}
      <div className="p-3 border-t border-white/[0.06] bg-black/40">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black/60 border border-white/[0.08] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                ✦
              </div>
              <span className="text-white text-xs font-semibold tracking-tight">
                hekari
              </span>
            </div>
            <button
              onClick={() => alert("Tidak ada notifikasi baru")}
              className="relative p-1 rounded-lg text-white/50 hover:text-white transition-colors"
              title="Notifikasi"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            </button>
          </div>

          <a
            href="https://discord.com"
            target="_blank"
            rel="noreferrer"
            className="w-full py-1.5 px-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-500/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
            </svg>
            Discord
          </a>

          <div className="flex items-center justify-between text-[10px] text-white/40">
            <span>Berita & pembaruan</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          </div>
        </div>
      </div>
    </aside>
  );
}
