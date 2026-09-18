"use client";

import React, { useEffect, useRef, useState } from "react";
import { CaseItem, RARITY_MAP, Skin } from "@/lib/types";
import { rollSkinFromCase } from "@/lib/data/cases";
import { sound } from "@/lib/sound";
import { OptimizedSkinImage } from "../ui/OptimizedSkinImage";

interface RouletteReelProps {
  caseItem: CaseItem;
  isSpinning: boolean;
  fastMode: boolean;
  onFinish: (wonSkin: Skin) => void;
  targetSkin: Skin | null;
}

const CARD_WIDTH = 175;
const WIN_INDEX = 42;

export const RouletteReel: React.FC<RouletteReelProps> = ({
  caseItem,
  isSpinning,
  fastMode,
  onFinish,
  targetSkin,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [reelItems, setReelItems] = useState<Skin[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const [transitionStyle, setTransitionStyle] = useState("none");
  const tickIntervalRef = useRef<NodeJS.Timeout[]>([]);

  const generateStrip = (winner: Skin | null) => {
    const items: Skin[] = [];
    for (let i = 0; i < 55; i++) {
      if (i === WIN_INDEX && winner) {
        items.push(winner);
      } else {
        items.push(rollSkinFromCase(caseItem));
      }
    }
    return items;
  };

  useEffect(() => {
    setReelItems(generateStrip(null));
  }, [caseItem]);

  useEffect(() => {
    if (!isSpinning || !targetSkin) return;

    tickIntervalRef.current.forEach((t) => clearTimeout(t));
    tickIntervalRef.current = [];

    const newItems = generateStrip(targetSkin);
    setReelItems(newItems);

    setTransitionStyle("none");
    setTranslateX(0);

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;

      const jitter = (Math.random() - 0.5) * 80;
      const targetOffset =
        WIN_INDEX * CARD_WIDTH + CARD_WIDTH / 2 - containerWidth / 2 + jitter;

      if (fastMode) {
        setTransitionStyle("transform 0.3s ease-out");
        setTranslateX(-targetOffset);
        sound.playTick(1.5);
        setTimeout(() => {
          onFinish(targetSkin);
        }, 350);
      } else {
        const durationSec = 5.2;
        setTransitionStyle(`transform ${durationSec}s cubic-bezier(0.12, 0.8, 0.33, 1)`);
        setTranslateX(-targetOffset);

        const totalTicks = 45;
        for (let i = 0; i < totalTicks; i++) {
          const progress = i / totalTicks;
          const time = Math.pow(progress, 2.2) * (durationSec * 1000 - 400);
          const t = setTimeout(() => {
            const pitch = 1.0 - progress * 0.3;
            sound.playTick(pitch);
          }, time);
          tickIntervalRef.current.push(t);
        }

        const finishTimer = setTimeout(() => {
          onFinish(targetSkin);
        }, durationSec * 1000 + 200);
        tickIntervalRef.current.push(finishTimer);
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      tickIntervalRef.current.forEach((t) => clearTimeout(t));
    };
  }, [isSpinning, targetSkin]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl liquid-glass py-6 select-none shadow-2xl">
      {/* Center Winning Marker Indicator (Arrow & Line) */}
      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center justify-between">
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
        <div className="w-0.5 h-full bg-gradient-to-b from-amber-400 via-amber-400/80 to-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.9)]" />
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
      </div>

      {/* Side shadow fades */}
      <div className="absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />

      {/* Reel strip container */}
      <div ref={containerRef} className="w-full overflow-hidden px-4">
        <div
          ref={trackRef}
          style={{
            transform: `translateX(${translateX}px)`,
            transition: transitionStyle,
          }}
          className="flex items-center gap-3 will-change-transform"
        >
          {reelItems.map((skin, idx) => {
            const config = RARITY_MAP[skin.rarity] || RARITY_MAP.consumer;
            return (
              <div
                key={`${skin.id}_${idx}`}
                style={{ width: `${CARD_WIDTH - 12}px` }}
                className={`relative shrink-0 h-48 rounded-2xl border-2 ${config.borderClass} bg-slate-900/60 backdrop-blur-xl p-3 flex flex-col items-center justify-between overflow-hidden shadow-lg`}
              >
                {/* Background color bleed */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 40%, ${config.color}, transparent 70%)`,
                  }}
                />

                {/* Top Wear / Weapon Name */}
                <div className="w-full text-center z-10">
                  <span className="text-[10px] text-slate-400 font-bold uppercase truncate block">
                    {skin.weapon}
                  </span>
                  <span
                    className="text-xs font-black truncate block leading-tight"
                    style={{ color: config.color }}
                  >
                    {skin.skinName}
                  </span>
                </div>

                {/* Skin Image */}
                <div className="relative w-28 h-20 flex items-center justify-center z-10">
                  <OptimizedSkinImage
                    src={skin.imageUrl}
                    alt={skin.name}
                    weaponType={skin.weapon}
                    rarityColor={config.color}
                    className="w-full h-full"
                  />
                </div>

                {/* Bottom Price */}
                <div className="w-full text-center z-10 pt-1 border-t border-white/[0.08]">
                  <span className="text-[11px] font-bold text-yellow-400">
                    {skin.priceDC} DC
                  </span>
                </div>

                {/* Bottom colored bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ backgroundColor: config.color }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};