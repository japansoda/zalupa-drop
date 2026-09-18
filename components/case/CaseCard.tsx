"use client";

import React from "react";
import Link from "next/link";
import { CaseItem, RARITY_MAP } from "@/lib/types";
import { CurrencyBadge } from "../ui/CurrencyBadge";
import { OptimizedSkinImage } from "../ui/OptimizedSkinImage";
import { ChevronRight } from "lucide-react";

interface CaseCardProps {
  caseItem: CaseItem;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem }) => {
  // Sort preview skins by rarity / price descending
  const previewSkins = [...caseItem.skins]
    .sort((a, b) => b.priceDC - a.priceDC)
    .slice(0, 4);

  return (
    <Link
      href={`/case/${caseItem.id}`}
      className="group relative flex flex-col justify-between rounded-2xl liquid-glass p-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_-10px_rgba(139,92,246,0.35)] overflow-hidden"
    >
      {/* Background radial refraction spot */}
      <div className="absolute -right-16 -top-16 w-44 h-44 bg-purple-600/15 rounded-full blur-3xl group-hover:bg-purple-600/25 transition-all duration-500 pointer-events-none" />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {caseItem.badge ? (
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-yellow-300 border border-yellow-500/40 uppercase tracking-wider backdrop-blur-md">
              {caseItem.badge}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/[0.08] text-slate-300 border border-white/10 uppercase backdrop-blur-md">
              {caseItem.skins.length} предметов
            </span>
          )}

          <CurrencyBadge amount={caseItem.priceDC} size="sm" />
        </div>

        {/* 3D Transparent Case Render with Float Animation */}
        <div className="relative w-full h-44 flex items-center justify-center my-3">
          <div className="absolute inset-0 bg-radial from-purple-500/20 to-transparent blur-2xl scale-75 group-hover:scale-110 transition-transform duration-500" />
          <img
            src={caseItem.imageUrl}
            alt={caseItem.name}
            className="max-h-full max-w-[85%] object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] group-hover:scale-110 group-hover:rotate-1 animate-float-case transition-all duration-500"
          />
        </div>

        {/* Title and Description */}
        <div className="mt-2 text-center">
          <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
            {caseItem.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 px-1 leading-relaxed">
            {caseItem.description}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.1] space-y-3">
        {/* Drop Previews */}
        <div className="flex items-center justify-center gap-2">
          {previewSkins.map((skin) => {
            const config = RARITY_MAP[skin.rarity] || RARITY_MAP.consumer;
            return (
              <div
                key={skin.id}
                title={`${skin.name} (${skin.priceDC} DC)`}
                className={`relative w-10 h-8 rounded-lg border ${config.borderClass} ${config.bgClass} flex items-center justify-center p-0.5 transition-transform group-hover:scale-105 backdrop-blur-sm`}
              >
                <OptimizedSkinImage
                  src={skin.imageUrl}
                  alt={skin.name}
                  weaponType={skin.weapon}
                  rarityColor={config.color}
                  className="w-full h-full"
                />
              </div>
            );
          })}
        </div>

        {/* Open Button */}
        <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 group-hover:from-violet-500 group-hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.35)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.55)] transition-all">
          <span>Открыть кейс</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};