'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ExternalLink, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { SkinEntity } from '../../lib/types';
import { RARITY_CONFIG } from '../../data/skins';
import { RarityBadge } from '../ui/RarityBadge';
import { WearBadge } from '../ui/WearBadge';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { sound } from '../../lib/sound';

interface DropModalProps {
  skin?: SkinEntity | null;
  skins?: SkinEntity[];
  onKeep: () => void;
  onSell: () => void;
}

export const DropModal: React.FC<DropModalProps> = ({ skin, skins, onKeep, onSell }) => {
  const items: SkinEntity[] = (skins && skins.length > 0) ? skins : (skin ? [skin] : []);
  if (items.length === 0) return null;

  const isMulti = items.length > 1;
  const totalPriceDc = items.reduce((sum, item) => sum + item.priceDc, 0);
  const totalPriceUsd = items.reduce((sum, item) => sum + item.priceUsd, 0);

  const hasHighTier = items.some(
    s => s.rarity === 'gold' || s.rarity === 'covert' || s.rarity === 'contraband' || s.rarity === 'classified'
  );

  useEffect(() => {
    if (hasHighTier || isMulti) {
      confetti({
        particleCount: isMulti ? 180 : 140,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#facc15', '#ffffff', '#10b981', '#84cc16'],
      });
    }
  }, [hasHighTier, isMulti]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in overflow-y-auto">
      <div
        className={`relative w-full ${
          isMulti ? 'max-w-3xl' : 'max-w-md'
        } glass-panel rounded-3xl p-6 sm:p-8 border border-yellow-400/40 overflow-hidden flex flex-col items-center text-center shadow-2xl my-auto`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
          <span className="text-xs uppercase font-black tracking-widest text-white/70">
            {isMulti ? `ВЫ ВЫБИЛИ ${items.length} ПРЕДМЕТА!` : 'ВЫ ВЫБИЛИ ПРЕДМЕТ!'}
          </span>
          <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
        </div>

        {/* Single item display */}
        {!isMulti && (
          <div className="w-full flex flex-col items-center">
            {(() => {
              const single = items[0];
              const config = RARITY_CONFIG[single.rarity] || RARITY_CONFIG.milspec;
              return (
                <>
                  <div className="relative w-56 h-56 my-2 flex items-center justify-center">
                    <img
                      src={single.image}
                      alt={single.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain filter drop-shadow-2xl"
                    />
                  </div>

                  <div className="flex flex-col items-center gap-1.5 mb-5 w-full">
                    <div className="flex items-center gap-2 mb-1 flex-wrap justify-center">
                      {single.statTrak && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 font-mono font-black uppercase tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                          StatTrak™
                        </span>
                      )}
                      <RarityBadge rarity={single.rarity} size="md" />
                      <WearBadge skin={single} size="sm" showFullLabel />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {single.weapon}
                    </h2>
                    <p className="text-lg sm:text-xl font-black tracking-wide" style={{ color: config.color }}>
                      {single.skinName}
                    </p>

                    <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-2xl bg-black/60 border border-white/10">
                      <DropCoinIcon size={22} />
                      <span className="font-mono font-black text-xl text-yellow-400">
                        {single.priceDc.toLocaleString('ru-RU')} DC
                      </span>
                      <span className="text-xs text-white/40">
                        (~${single.priceUsd.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  <a
                    href={single.steamMarketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 mb-6 underline-offset-4 hover:underline transition-colors"
                  >
                    <span>Открыть на Торговой площадке Steam</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              );
            })()}
          </div>
        )}

        {/* Multi-item grid display */}
        {isMulti && (
          <div className="w-full my-4">
            <div className={`grid gap-4 ${items.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
              {items.map((it, idx) => {
                const config = RARITY_CONFIG[it.rarity] || RARITY_CONFIG.milspec;
                return (
                  <div
                    key={`${it.id}_${idx}`}
                    className="rounded-2xl glass-card p-4 flex flex-col justify-between border hover:border-yellow-400/40 transition-all text-left"
                    style={{ borderBottomWidth: '3px', borderBottomColor: config.color }}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1">
                        {it.statTrak && (
                          <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/40">
                            ST
                          </span>
                        )}
                        <WearBadge skin={it} size="xs" />
                      </div>
                      <RarityBadge rarity={it.rarity} size="sm" />
                    </div>

                    <div className="w-full h-32 flex items-center justify-center my-2">
                      <img
                        src={it.image}
                        alt={it.name}
                        referrerPolicy="no-referrer"
                        className="w-28 h-28 object-contain filter drop-shadow-lg"
                      />
                    </div>

                    <div className="flex flex-col mt-2">
                      <span className="text-xs font-bold text-white truncate">{it.weapon}</span>
                      <span className="text-xs font-black truncate mb-2" style={{ color: config.color }}>
                        {it.skinName}
                      </span>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <DropCoinIcon size={14} />
                          <span className="font-mono text-xs font-bold text-yellow-400">
                            {it.priceDc.toLocaleString('ru-RU')} DC
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">
                          ${it.priceUsd.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total stats */}
            <div className="flex items-center justify-center gap-3 my-6 py-3 px-6 rounded-2xl bg-black/60 border border-yellow-400/30">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">Общий выигрыш:</span>
              <div className="flex items-center gap-1.5">
                <DropCoinIcon size={22} />
                <span className="font-mono font-black text-2xl text-yellow-400">
                  {totalPriceDc.toLocaleString('ru-RU')} DC
                </span>
              </div>
              <span className="text-xs text-white/40">
                (~${totalPriceUsd.toFixed(2)})
              </span>
            </div>
          </div>
        )}

        {/* Keep / Sell Buttons */}
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
            <span>{isMulti ? 'Забрать всё в инвентарь' : 'В инвентарь'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSell();
            }}
            className="w-full py-3.5 px-4 rounded-xl btn-yellow text-black font-black text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {isMulti
                ? `Продать всё (+${totalPriceDc.toLocaleString('ru-RU')} DC)`
                : `Продать (${totalPriceDc.toLocaleString('ru-RU')} DC)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
