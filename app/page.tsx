"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CASES_DATABASE } from "@/lib/data/cases";
import { CaseCard } from "@/components/case/CaseCard";
import { Button } from "@/components/ui/Button";
import {
  Package,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  Flame,
  Crown,
  Zap,
  Coins,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredCases =
    selectedCategory === "all"
      ? CASES_DATABASE
      : CASES_DATABASE.filter((c) => c.category === selectedCategory);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950/80 p-8 sm:p-12 backdrop-blur-2xl shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Бесплатный симулятор CS2 дропов</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none uppercase">
              Zalupa <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400">Drop</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">
              Оригинальный симулятор открытия кейсов, честного апгрейдера и мини-игр. Никаких донатов и потери реальных денег — только чистый азарт и культовые скины!
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <a href="#cases-grid">
                <Button
                  variant="gold"
                  size="lg"
                  leftIcon={<Package className="w-5 h-5" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Кейсы CS2
                </Button>
              </a>

              <Link href="/upgrader">
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<TrendingUp className="w-5 h-5" />}
                >
                  Апгрейдер
                </Button>
              </Link>

              <Link href="/crash">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                >
                  Краш
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Mascot / Logo Card */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-amber-500/20 rounded-full blur-2xl animate-pulse-glow" />
            <div className="relative w-full h-full rounded-3xl bg-slate-900/80 border border-white/10 p-6 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl group hover:border-purple-500/50 transition-all duration-500">
              <img
                src="/logo.png"
                alt="Zalupa Drop"
                className="max-h-[85%] max-w-[85%] object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-500"
              />
              <span className="text-xs font-bold text-yellow-400 mt-2 tracking-widest uppercase">
                10 000 DC на старте!
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cases Showcase Section */}
      <section id="cases-grid" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                Коллекция кейсов
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Выберите кейс и испытайте шанс выбить легендарный Dragon Lore или нож
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-900/80 p-1.5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
            {[
              { id: "all", label: "Все", icon: Package },
              { id: "popular", label: "Популярные", icon: Flame },
              { id: "knives", label: "Ножи и Перчатки", icon: Crown },
              { id: "exclusive", label: "Эксклюзив", icon: Zap },
              { id: "cheap", label: "Бюджетные", icon: Coins },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid of Cases */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} />
          ))}
        </div>
      </section>
    </div>
  );
}
