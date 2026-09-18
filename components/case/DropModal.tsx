"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { RARITY_MAP, Skin } from "@/lib/types";
import { sound } from "@/lib/sound";
import { CurrencyBadge } from "../ui/CurrencyBadge";
import { Button } from "../ui/Button";
import { RarityBadge } from "../ui/RarityBadge";
import { OptimizedSkinImage } from "../ui/OptimizedSkinImage";
import { ExternalLink, Check, DollarSign } from "lucide-react";

interface DropModalProps {
  isOpen: boolean;
  wonSkins: Skin[];
  onKeepAll: () => void;
  onSellAll: () => void;
  onSellItem: (index: number) => void;
  soldIndices: number[];
}

export const DropModal: React.FC<DropModalProps> = ({
  isOpen,
  wonSkins,
  onKeepAll,
  onSellAll,
  onSellItem,
  soldIndices,
}) => {
  useEffect(() => {
    if (!isOpen || wonSkins.length === 0) return;

    const hasGold = wonSkins.some((s) => s.rarity === "special");
    const hasCovert = wonSkins.some((s) => s.rarity === "covert");
    const hasClassified = wonSkins.some((s) => s.rarity === "classified");

    if (hasGold) {
      sound.playWinGold();
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#ffd700", "#ffaa00", "#ffffff"],
      });
    } else if (hasCovert || hasClassified) {
      sound.playWinRare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#eb4b4b", "#d32ce6", "#8847ff"],
      });
    } else {
      sound.playWinCommon();
    }
  }, [isOpen, wonSkins]);

  if (!isOpen || wonSkins.length === 0) return null;

  const totalUnsoldDC = wonSkins.reduce(
    (sum, skin, idx) => (!soldIndices.includes(idx) ? sum + skin.priceDC : sum),
    0
  );

  const isSingle = wonSkins.length === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md animate-in fade-in" />

      {/* Main Container */}
      <div className="relative w-full max-w-2xl liquid-glass-modal rounded-3xl p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-300 text-center">
        {/* Top Header */}
        <div className="mb-6">
          <span className="text-xs font-black tracking-widest text-amber-400 uppercase bg-amber-500/15 px-3.5 py-1 rounded-full border border-amber-500/30">
            {isSingle ? "Поздравляем с дропом!" : `Вы открыли ${wonSkins.length} кейса!`}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            {isSingle ? wonSkins[0].name : "Ваш выигрыш"}
          </h2>
        </div>

        {/* Skins Presentation */}
        <div
          className={`gap-4 my-6 ${
            isSingle
              ? "flex flex-col items-center justify-center"
              : "grid grid-cols-2 sm:grid-cols-3 max-h-[380px] overflow-y-auto p-2"
          }`}
        >
          {wonSkins.map((skin, idx) => {
            const isSold = soldIndices.includes(idx);
            const config = RARITY_MAP[skin.rarity] || RARITY_MAP.consumer;

            if (isSingle) {
              return (
                <div
                  key={idx}
                  className="relative flex flex-col items-center p-6 rounded-3xl border-2 w-full max-w-md liquid-glass shadow-2xl transition-all"
                  style={{
                    borderColor: `${config.color}90`,
                    boxShadow: `0 0 50px ${config.color}30`,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-3xl opacity-20 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${config.color}, transparent 70%)`,
                    }}
                  />

                  <div className="relative w-64 h-44 flex items-center justify-center mb-4">
                    <OptimizedSkinImage
                      src={skin.imageUrl}
                      alt={skin.name}
                      weaponType={skin.weapon}
                      rarityColor={config.color}
                      className="w-full h-full hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  <div className="space-y-2 z-10">
                    <RarityBadge rarity={skin.rarity} wear={skin.wear} size="md" />
                    <CurrencyBadge amount={skin.priceDC} size="xl" />
                  </div>

                  {/* Steam Link */}
                  <a
                    href={skin.steamMarketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mt-4 border-b border-transparent hover:border-white transition-all"
                  >
                    <span>Открыть на Торговой площадке Steam</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            }

            // Multi-open card
            return (
              <div
                key={idx}
                className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border ${
                  isSold ? "opacity-40 grayscale" : ""
                } liquid-glass`}
                style={{ borderColor: `${config.color}70` }}
              >
                <div className="relative w-full h-24 flex items-center justify-center">
                  <OptimizedSkinImage
                    src={skin.imageUrl}
                    alt={skin.name}
                    weaponType={skin.weapon}
                    rarityColor={config.color}
                    className="w-full h-full"
                  />
                </div>
                <div className="w-full text-center mt-2">
                  <span className="text-[11px] font-bold text-white truncate block">
                    {skin.name}
                  </span>
                  <span className="text-[11px] font-extrabold text-yellow-400">
                    {skin.priceDC} DC
                  </span>
                </div>

                {!isSold && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSellItem(idx)}
                    className="w-full mt-2 text-[10px] h-6 py-0 text-slate-400 hover:text-yellow-400"
                  >
                    Продать
                  </Button>
                )}
                {isSold && (
                  <span className="text-[10px] text-slate-500 font-bold uppercase mt-2">
                    Продано
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-white/[0.1]">
          {totalUnsoldDC > 0 && (
            <Button
              variant="gold"
              size="lg"
              onClick={onSellAll}
              className="w-full sm:w-auto"
              leftIcon={<DollarSign className="w-5 h-5" />}
            >
              {isSingle
                ? `Продать за ${wonSkins[0].priceDC} DC`
                : `Продать все за ${totalUnsoldDC} DC`}
            </Button>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={onKeepAll}
            className="w-full sm:w-auto"
            leftIcon={<Check className="w-5 h-5" />}
          >
            Оставить в инвентаре
          </Button>
        </div>
      </div>
    </div>
  );
};