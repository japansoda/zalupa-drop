"use client";

import React, { useEffect, useRef, useState } from "react";
import { CaseItem, RARITY_MAP, Skin } from "@/lib/types";
import { rollSkinFromCase } from "@/lib/data/cases";
import { sound } from "@/lib/sound";

interface RouletteReelProps {
  caseItem: CaseItem;
  isSpinning: boolean;
  fastMode: boolean;
  onFinish: (wonSkin: Skin) => void;
  targetSkin: Skin | null;
}

const CARD_WIDTH = 170; // width + margin
const WIN_INDEX = 42; // index of winning card in the reel

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

  // Generate randomized reel strip
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

  // Prepare initial strip on load
  useEffect(() => {
    setReelItems(generateStrip(null));
  }, [caseItem]);

  // Handle spin trigger
  useEffect(() => {
    if (!isSpinning || !targetSkin) return;

    // Reset ticks
    tickIntervalRef.current.forEach((t) => clearTimeout(t));
    tickIntervalRef.current = [];

    // 1. Build new reel with predetermined targetSkin at WIN_INDEX
    const newItems = generateStrip(targetSkin);
    setReelItems(newItems);

    // 2. Reset position instantly
    setTransitionStyle("none");
    setTranslateX(0);

    // Slight delay to ensure DOM update before triggering CSS transition
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;

      // Random jitter inside target card: [-50px, 50px]
      const jitter = (Math.random() - 0.5) * 80;
      const targetOffset =
        WIN_INDEX * CARD_WIDTH + CARD_WIDTH / 2 - containerWidth / 2 + jitter;

      if (fastMode) {
        // Fast instant roll
        setTransitionStyle("transform 0.3s ease-out");
        setTranslateX(-targetOffset);
        sound.playTick(1.5);
        setTimeout(() => {
          onFinish(targetSkin);
        }, 350);
      } else {
        // Full authentic CS2 spin
        const durationSec = 5.2;
        setTransitionStyle(`transform ${durationSec}s cubic-bezier(0.12, 0.8, 0.33, 1)`);
        setTranslateX(-targetOffset);

        // Schedule deceleration sound ticks
        const totalTicks = 45;
        for (let i = 0; i < totalTicks; i++) {
          // Non-linear tick delays matching deceleration
          const progress = i / totalTicks;
          // Cubic curve easing for tick intervals
          const time = Math.pow(progress, 2.2) * (durationSec * 1000 - 400);
          const t = setTimeout(() => {
            const pitch = 1.0 - progress * 0.3;
            sound.playTick(pitch);
          }, time);
          tickIntervalRef.current.push(t);
        }

        // On complete
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
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950/90 border border-white/10 shadow-2xl backdrop-blur-2xl py-6 select-none">
      {/* Center Winning Marker Indicator (Arrow & Line) */}
      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center justify-between">
        {/* Top needle arrow */}
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-yellow-400 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />

        {/* Center vertical beam */}
        <div className="w-0.5 h-full bg-gradient-to-b from-yellow-400 via-yellow-400/80 to-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />

        {/* Bottom needle arrow */}
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-yellow-400 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
      </div>

      {/* Side shadow fades */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />

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
                className={`relative shrink-0 h-48 rounded-xl border-2 ${config.borderClass} bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-3 flex flex-col items-center justify-between overflow-hidden shadow-lg`}
              >
                {/* Background color bleed */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
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
                  <img
                    src={skin.imageUrl}
                    alt={skin.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)]"
                  />
                </div>

                {/* Bottom Rarity & Price */}
                <div className="w-full text-center z-10 pt-1 border-t border-white/[0.06]">
                  <span className="text-[11px] font-bold text-yellow-400/90">
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
