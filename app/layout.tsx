import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { LiveFeed } from "@/components/LiveFeed";
import { Footer } from "@/components/Footer";
import { RefillModal } from "@/components/RefillModal";

export const metadata: Metadata = {
  title: "Zalupa Drop — Симулятор открытия кейсов CS2",
  description:
    "Современный бесплатный симулятор кейсов, апгрейда и мини-игр CS2. Виртуальная валюта DropCoin (DC), реалистичная рулетка и никакой потери реальных денег.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased bg-[#090a10] text-slate-100 min-h-screen flex flex-col selection:bg-purple-500/30 selection:text-purple-200 relative">
        {/* Ambient Lights for Liquid Glass Refraction */}
        <div className="ambient-canvas">
          <div className="ambient-light-1" />
          <div className="ambient-light-2" />
          <div className="ambient-light-3" />
          <div className="ambient-light-4" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <LiveFeed />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
          <RefillModal />
        </div>
      </body>
    </html>
  );
}