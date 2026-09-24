import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../lib/i18n";
import { HorizontalScrollManager } from "../components/layout/HorizontalScrollManager";
import { MobileNav } from "../components/layout/MobileNav";
import { PresenceTracker } from "../components/layout/PresenceTracker";
import { PriceSyncManager } from "../components/layout/PriceSyncManager";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "ZALUPA DROP — CS2 Кейс Симулятор",
  description: "Премиальный симулятор открытия CS2 кейсов, апгрейдер и краш на виртуальную валюту DropCoin (DC)",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-[#090a10] text-[#e2e8f0] antialiased selection:bg-purple-600 selection:text-white pb-20 md:pb-0 overflow-x-hidden max-w-full">
        <LanguageProvider>
          <HorizontalScrollManager />
          <PresenceTracker />
          <PriceSyncManager />
          {children}
          <MobileNav />
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  );
}
