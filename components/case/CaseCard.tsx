"use client";

import React from "react";
import Link from "next/link";
import { CaseItem, RARITY_MAP } from "@/lib/types";
import { CurrencyBadge } from "../ui/CurrencyBadge";
import { Sparkles, ChevronRight } from "lucide-react";

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
      className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-500/40 p-5 backdrop-blur-xl shadow-glass transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_30px_-10px_rgba(124,58,237,0.3)] overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="absolute -right-16 -top-16 w-36 h-36 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all pointer-events-none" />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {caseItem.badge ? (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border border-yellow-500/30 uppercase tracking-wider">
              {caseItem.badge}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-400 border border-white/10 uppercase">
              {caseItem.skins.length} предметов
            </span>
          )}

          <CurrencyBadge amount={caseItem.priceDC} size="sm" />
        </div>

        {/* Case Image */}
        <div className="relative w-full h-44 flex items-center justify-center my-2">
          <div className="absolute inset-0 bg-radial from-purple-500/10 to-transparent blur-xl scale-75 group-hover:scale-100 transition-transform" />
          <img
            src={caseItem.imageUrl}
            alt={caseItem.name}
            className="max-h-full max-w-[85%] object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:rotate-1 transition-all duration-500"
          />
        </div>

        {/* Title and Description */}
        <div className="mt-2 text-center">
          <h3 className="text-lg font-extrabold text-white group-hover:text-purple-300 transition-colors">
            {caseItem.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 px-1">
            {caseItem.description}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-3">
        {/* Drop Previews */}
        <div className="flex items-center justify-center gap-2">
          {previewSkins.map((skin) => {
            const config = RARITY_MAP[skin.rarity] || RARITY_MAP.consumer;
            return (
              <div
                key={skin.id}
                title={`${skin.name} (${skin.priceDC} DC)`}
                className={`relative w-9 h-7 rounded-lg border ${config.borderClass} ${config.bgClass} flex items-center justify-center p-0.5 transition-transform group-hover:scale-105`}
              >
                <img
                  src={skin.imageUrl}
                  alt={skin.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            );
          })}
        </div>

        {/* Open Button */}
        <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600/80 to-indigo-600/80 group-hover:from-violet-500 group-hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.25)] group-hover:shadow-[0_0_20px_rgba(124,58,237,0.45)] transition-all">
          <span>Открыть кейс</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};
