"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { RARITY_MAP, LiveDrop } from "@/lib/types";
import { CurrencyBadge } from "./ui/CurrencyBadge";
import { Modal } from "./ui/Modal";
import { OptimizedSkinImage } from "./ui/OptimizedSkinImage";
import { ExternalLink } from "lucide-react";
import { Button } from "./ui/Button";

export const LiveFeed: React.FC = () => {
  const liveFeed = useAppStore((s) => s.liveFeed);
  const [selectedDrop, setSelectedDrop] = useState<LiveDrop | null>(null);

  if (liveFeed.length === 0) {
    return (
      <div className="h-14 border-b border-white/[0.08] liquid-glass-pill flex items-center justify-center text-xs text-slate-400">
        <span className="animate-pulse">Ожидание новых дропов в реальном времени...</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full border-b border-white/[0.08] liquid-glass-nav overflow-hidden py-2 select-none">
        {/* Left and Right Fade overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#090a10] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#090a10] to-transparent z-10 pointer-events-none" />

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-black uppercase tracking-wider shrink-0 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Live Дропы
          </div>

          {liveFeed.slice(0, 15).map((drop) => {
            const config = RARITY_MAP[drop.skin.rarity] || RARITY_MAP.consumer;
            return (
              <button
                key={drop.id}
                onClick={() => setSelectedDrop(drop)}
                className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${config.borderClass} liquid-glass hover:border-white/30 transition-all shrink-0 cursor-pointer text-left`}
              >
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
                  style={{ backgroundColor: config.color }}
                />

                <div className="relative w-11 h-8 shrink-0 flex items-center justify-center">
                  <OptimizedSkinImage
                    src={drop.skin.imageUrl}
                    alt={drop.skin.name}
                    weaponType={drop.skin.weapon}
                    rarityColor={config.color}
                    className="w-full h-full group-hover:scale-110 transition-transform"
                  />
                </div>

                <div className="flex flex-col pr-1">
                  <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[120px] leading-tight">
                    {drop.skin.weapon}
                  </span>
                  <span
                    className="text-[10px] truncate max-w-[120px] font-extrabold leading-tight"
                    style={{ color: config.color }}
                  >
                    {drop.skin.skinName}
                  </span>
                </div>

                <span className="text-[10px] text-yellow-400 font-black bg-yellow-500/15 px-1.5 py-0.5 rounded-md border border-yellow-500/30">
                  {drop.skin.priceDC} DC
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drop Info Modal */}
      {selectedDrop && (
        <Modal
          isOpen={Boolean(selectedDrop)}
          onClose={() => setSelectedDrop(null)}
          title="Информация о выпавшем предмете"
        >
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            <div
              className="relative w-56 h-40 flex items-center justify-center rounded-3xl p-4 border liquid-glass shadow-2xl"
              style={{
                borderColor: `${RARITY_MAP[selectedDrop.skin.rarity]?.color}70`,
                backgroundColor: `${RARITY_MAP[selectedDrop.skin.rarity]?.color}15`,
              }}
            >
              <OptimizedSkinImage
                src={selectedDrop.skin.imageUrl}
                alt={selectedDrop.skin.name}
                weaponType={selectedDrop.skin.weapon}
                rarityColor={RARITY_MAP[selectedDrop.skin.rarity]?.color}
                className="w-full h-full hover:scale-105 transition-transform"
              />
            </div>

            <div>
              <div
                className="text-xs font-black uppercase tracking-wider mb-1"
                style={{ color: RARITY_MAP[selectedDrop.skin.rarity]?.color }}
              >
                {RARITY_MAP[selectedDrop.skin.rarity]?.nameRu}
              </div>
              <h3 className="text-xl font-bold text-white">
                {selectedDrop.skin.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Игрок: <span className="text-slate-200 font-bold">{selectedDrop.userName}</span>
              </p>
            </div>

            <CurrencyBadge amount={selectedDrop.skin.priceDC} size="lg" />

            <div className="flex items-center gap-3 w-full pt-2">
              <a
                href={selectedDrop.skin.steamMarketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Открыть в Steam
                </Button>
              </a>
              <Button
                variant="primary"
                size="md"
                onClick={() => setSelectedDrop(null)}
              >
                Понятно
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};