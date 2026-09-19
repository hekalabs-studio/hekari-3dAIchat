import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "hekari - 3D chat AI",
  description:
    "Meet hekari, your interactive 3D AI companion. Chat naturally, watch reactions, and build a real connection.",
  keywords: ["AI companion", "3D avatar", "VRM", "chatbot", "hekari"],
  authors: [{ name: "HekaLabs Studio" }],
  openGraph: {
    title: "hekari - 3D chat AI",
    description:
      "An interactive 3D AI companion with lip-sync, memory, and personality.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050510] text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
