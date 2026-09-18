"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CASES_DATABASE } from "@/lib/data/cases";
import { CaseCard } from "@/components/case/CaseCard";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import {
  Package,
  TrendingUp,
  Sparkles,
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
      {/* Hero Section with Authentic Liquid Glass Stack */}
      <section className="relative rounded-3xl overflow-hidden liquid-glass p-8 sm:p-12 shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Liquid Glass CS2 Simulator</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight uppercase">
              Zalupa <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-amber-400">Drop</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">
              Оригинальный симулятор открытия кейсов в эстетике Liquid Glass. 12+ кейсов с 3D-рендерами, взвешенные шансы выпадения, честный апгрейдер 95% RTP и мини-игры без реальных денег!
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-3">
              <a href="#cases-grid">
                <Button
                  variant="gold"
                  size="lg"
                  leftIcon={<Package className="w-5 h-5" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Кейсы CS2 ({CASES_DATABASE.length})
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

          {/* Hero Emblem Card in Liquid Glass */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-amber-500/20 rounded-full blur-2xl animate-pulse-glow" />
            <div className="relative w-full h-full rounded-3xl liquid-glass p-8 flex flex-col items-center justify-center shadow-2xl group hover:border-purple-400/50 transition-all duration-500">
              <BrandLogo size="lg" showText={false} />
              <span className="text-xs font-black text-amber-400 mt-4 tracking-widest uppercase">
                10 000 DC на старте!
              </span>
              <span className="text-[11px] text-slate-400 mt-1 font-semibold">
                Без риска и донатов
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cases Showcase Section */}
      <section id="cases-grid" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Package className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                Коллекция кейсов ({CASES_DATABASE.length})
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Выберите кейс и испытайте шанс выбить легендарный нож, перчатки или Dragon Lore
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar liquid-glass p-1.5 rounded-2xl">
            {[
              { id: "all", label: "Все кейсы", icon: Package },
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid of 12+ Cases */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} />
          ))}
        </div>
      </section>
    </div>
  );
}