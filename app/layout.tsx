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
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased bg-[#090a10] text-slate-100 min-h-screen flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
        <Header />
        <LiveFeed />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
        <RefillModal />
      </body>
    </html>
  );
}
