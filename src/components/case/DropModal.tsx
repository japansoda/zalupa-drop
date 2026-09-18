'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ExternalLink, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { SkinEntity } from '../../lib/types';
import { RARITY_CONFIG } from '../../data/skins';
import { RarityBadge } from '../ui/RarityBadge';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { sound } from '../../lib/sound';

interface DropModalProps {
  skin: SkinEntity | null;
  onKeep: () => void;
  onSell: () => void;
}

export const DropModal: React.FC<DropModalProps> = ({ skin, onKeep, onSell }) => {
  if (!skin) return null;

  const config = RARITY_CONFIG[skin.rarity] || RARITY_CONFIG.milspec;
  const isHighTier = skin.rarity === 'gold' || skin.rarity === 'covert' || skin.rarity === 'contraband';

  useEffect(() => {
    if (isHighTier) {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#facc15', '#ffffff', '#10b981'],
      });
    }
  }, [isHighTier]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-yellow-400/40 overflow-hidden flex flex-col items-center text-center shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
          <span className="text-xs uppercase font-black tracking-widest text-white/70">
            ВЫ ВЫБИЛИ ПРЕДМЕТ!
          </span>
          <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
        </div>

        <div className="relative w-56 h-56 my-2 flex items-center justify-center">
          <img
            src={skin.image}
            alt={skin.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain filter drop-shadow-2xl"
          />
        </div>

        <div className="flex flex-col items-center gap-1.5 mb-5 w-full">
          <div className="flex items-center gap-2 mb-1">
            <RarityBadge rarity={skin.rarity} size="md" />
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 font-bold">
              {skin.wearLabel}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {skin.weapon}
          </h2>
          <p className="text-lg sm:text-xl font-black tracking-wide" style={{ color: config.color }}>
            {skin.skinName}
          </p>

          <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-2xl bg-black/60 border border-white/10">
            <DropCoinIcon size={22} />
            <span className="font-mono font-black text-xl text-yellow-400">
              {skin.priceDc.toLocaleString('ru-RU')} DC
            </span>
            <span className="text-xs text-white/40">
              (~${skin.priceUsd.toFixed(2)})
            </span>
          </div>
        </div>

        <a
          href={skin.steamMarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 mb-6 underline-offset-4 hover:underline transition-colors"
        >
          <span>Открыть на Торговой площадке Steam</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onKeep();
            }}
            className="w-full py-3.5 px-4 rounded-xl glass-button text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-white/15 cursor-pointer active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>В инвентарь</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSell();
            }}
            className="w-full py-3.5 px-4 rounded-xl btn-yellow text-black font-black text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Продать ({skin.priceDc.toLocaleString('ru-RU')} DC)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
