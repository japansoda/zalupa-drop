'use client';

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { ExternalLink, Check, ShoppingBag, Sparkles, Gift, Ticket, FlaskConical } from 'lucide-react';
import { SkinEntity } from '../../lib/types';
import { UpgradeToken } from '../../lib/consumables';
import { RARITY_CONFIG } from '../../data/skins';
import { RarityBadge } from '../ui/RarityBadge';
import { WearBadge } from '../ui/WearBadge';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { sound } from '../../lib/sound';
import { useGameStore } from '../../store/useGameStore';
import { useLanguage } from '../../lib/i18n';

interface DropModalProps {
  skin?: SkinEntity | null;
  skins?: SkinEntity[];
  bonusConsumables?: { tokens: UpgradeToken[]; potions: number };
  onKeep: (remaining?: SkinEntity[]) => void;
  onSell: (remaining?: SkinEntity[]) => void;
}

export const DropModal: React.FC<DropModalProps> = ({ skin, skins, bonusConsumables, onKeep, onSell }) => {
  const { t, locale } = useLanguage();
  const rawItems: SkinEntity[] = useMemo(() => {
    return (skins && skins.length > 0) ? skins : (skin ? [skin] : []);
  }, [skins, skin]);

  const [items, setItems] = useState<SkinEntity[]>(rawItems);

  useEffect(() => {
    setItems(rawItems);
  }, [rawItems]);

  if (items.length === 0) return null;

  const isMulti = items.length > 1;
  const totalPriceDc = items.reduce((sum, item) => sum + item.priceDc, 0);
  const totalPriceUsd = items.reduce((sum, item) => sum + item.priceUsd, 0);

  const hasHighTier = items.some(
    s => s.rarity === 'gold' || s.rarity === 'covert' || s.rarity === 'contraband' || s.rarity === 'classified'
  );

  const hasBonus = Boolean(
    bonusConsumables && (bonusConsumables.tokens.length > 0 || bonusConsumables.potions > 0)
  );

  useEffect(() => {
    if (hasHighTier || isMulti || hasBonus) {
      confetti({
        particleCount: hasBonus ? 160 : isMulti ? 180 : 140,
        spread: 85,
        origin: { y: 0.6 },
        colors: hasBonus
          ? ['#34d399', '#facc15', '#10b981', '#a7f3d0', '#ffffff']
          : ['#facc15', '#ffffff', '#10b981', '#84cc16'],
      });
    }
    if (hasBonus) {
      setTimeout(() => {
        sound.playReward();
      }, 300);
    }
  }, [hasHighTier, isMulti, hasBonus]);

  const handleSellIndividual = (itemToSell: SkinEntity, index: number) => {
    sound.playCashout();
    useGameStore.getState().addBalance(itemToSell.priceDc);
    const remaining = items.filter((_, idx) => idx !== index);
    setItems(remaining);
    if (remaining.length === 0) {
      onSell([]);
    }
  };

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
            {isMulti
              ? locale === 'ru'
                ? `ВЫ ВЫБИЛИ ${items.length} ПРЕДМЕТА!`
                : `YOU WON ${items.length} ITEMS!`
              : locale === 'ru'
              ? 'ВЫ ВЫБИЛИ ПРЕДМЕТ!'
              : 'YOU WON AN ITEM!'}
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
                  <div className="relative w-56 h-56 my-2 flex items-center justify-center group">
                    {/* Bonus Extra Drop Tag Floating on Item */}
                    {hasBonus && (
                      <div className="absolute top-0 right-0 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-mono font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-bounce">
                        <Gift className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{locale === 'ru' ? '+ДОП. ДРОП' : '+EXTRA DROP'}</span>
                        <span>{bonusConsumables?.potions ? '🧪' : '🎟️'}</span>
                      </div>
                    )}

                    <img
                      src={single.image}
                      alt={single.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-200"
                    />

                    {/* Quick Sell on Hover */}
                    <div className="absolute inset-x-6 bottom-2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                      <button
                        type="button"
                        onClick={() => handleSellIndividual(single, 0)}
                        className="w-full py-2.5 px-4 rounded-xl btn-yellow text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(250,204,21,0.6)] cursor-pointer active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>
                          {locale === 'ru'
                            ? `Продать за ${single.priceDc.toLocaleString('ru-RU')} DC`
                            : `Sell for ${single.priceDc.toLocaleString('ru-RU')} DC`}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 mb-4 w-full">
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
                    className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 mb-4 underline-offset-4 hover:underline transition-colors"
                  >
                    <span>{locale === 'ru' ? 'Открыть на Торговой площадке Steam' : 'View on Steam Community Market'}</span>
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
                    className="relative rounded-2xl glass-card p-4 flex flex-col justify-between border hover:border-yellow-400/50 transition-all text-left group overflow-hidden"
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

                    <div className="w-full h-32 flex items-center justify-center my-2 relative">
                      <img
                        src={it.image}
                        alt={it.name}
                        referrerPolicy="no-referrer"
                        className="w-28 h-28 object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform duration-200"
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

                    {/* Quick Sell on Hover overlay for individual item */}
                    <div className="absolute inset-x-3 bottom-3 z-30 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSellIndividual(it, idx);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl btn-yellow text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[0_0_18px_rgba(250,204,21,0.55)] cursor-pointer active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>
                          {locale === 'ru'
                            ? `Продать за ${it.priceDc.toLocaleString('ru-RU')} DC`
                            : `Sell for ${it.priceDc.toLocaleString('ru-RU')} DC`}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total stats */}
            <div className="flex items-center justify-center gap-3 my-4 py-3 px-6 rounded-2xl bg-black/60 border border-yellow-400/30">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                {locale === 'ru' ? 'Общий выигрыш:' : 'Total win:'}
              </span>
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

        {/* ── EXTRA BONUS DROP SHOWCASE (ЗЕЛЬЯ И ТОКЕНЫ КАК ДОП. ДРОП) ── */}
        {hasBonus && bonusConsumables && (
          <div className="w-full mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#0d1512]/90 to-emerald-950/60 border border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.25)] flex flex-col items-center gap-3 relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-center">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300">
                {locale === 'ru' ? 'ДОПОЛНИТЕЛЬНЫЙ ДРОП' : 'EXTRA BONUS DROP'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/80 text-[10px] font-mono font-black text-emerald-300 shrink-0">
                +БОНУС
              </span>
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              {/* Luck Potion Bonus Card */}
              {bonusConsumables.potions > 0 && (
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#091f15] border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-left w-full sm:max-w-md group">
                  <div className="relative w-12 h-12 rounded-xl bg-emerald-900/60 border border-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                    <FlaskConical className="w-6 h-6 text-emerald-400 animate-pulse" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {locale === 'ru' ? 'Зелье удачи' : 'Luck Potion'}
                      </span>
                      <span className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-400/40">
                        x{bonusConsumables.potions}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-amber-400 font-bold">
                        {locale === 'ru' ? '★ Контрабанда' : '★ Contraband'}
                      </span>
                      <span className="text-white/20">•</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        +15%
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50 mt-0.5 truncate">
                      {locale === 'ru' ? '+15% к шансу в апгрейдере (3 раза)' : '+15% upgrader chance (3 spins)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Token Bonus Cards */}
              {bonusConsumables.tokens.map((tok, idx) => {
                const rConf = RARITY_CONFIG[tok.rarity] || RARITY_CONFIG.milspec;
                return (
                  <div
                    key={`${tok.id}_${idx}`}
                    className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#12131c] border text-left shadow-md transition-all w-full sm:max-w-md"
                    style={{ borderColor: rConf.color, boxShadow: `0 0 15px ${rConf.color}35` }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{ backgroundColor: `${rConf.color}15`, borderColor: rConf.color }}
                    >
                      <Ticket className="w-6 h-6" style={{ color: rConf.color }} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white truncate">
                          {t('token.' + tok.rarity) || tok.name}
                        </span>
                        <span className="text-[10px] font-mono font-black text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/30">
                          x1
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold" style={{ color: rConf.color }}>
                          {t('rarity.' + tok.rarity) || rConf.label}
                        </span>
                        <span className="text-white/20">•</span>
                        <span className="text-xs font-mono font-bold text-yellow-400">
                          +{tok.valueDc.toLocaleString('ru-RU')} DC
                        </span>
                      </div>
                      <span className="text-[11px] text-white/50 mt-0.5 truncate">
                        {locale === 'ru'
                          ? `Цель для апгрейда: до ${tok.maxTargetDc.toLocaleString('ru-RU')} DC`
                          : `Upgrade target: up to ${tok.maxTargetDc.toLocaleString('ru-RU')} DC`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Keep / Sell Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onKeep(items);
            }}
            className="w-full py-3.5 px-4 rounded-xl glass-button text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-white/15 cursor-pointer active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>
              {isMulti
                ? locale === 'ru'
                  ? `Забрать всё в инвентарь (${items.length})`
                  : `Claim all to inventory (${items.length})`
                : locale === 'ru'
                ? 'В инвентарь'
                : 'Claim to inventory'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSell(items);
            }}
            className="w-full py-3.5 px-4 rounded-xl btn-yellow text-black font-black text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {isMulti
                ? locale === 'ru'
                  ? `Продать всё (+${totalPriceDc.toLocaleString('ru-RU')} DC)`
                  : `Sell all (+${totalPriceDc.toLocaleString('ru-RU')} DC)`
                : locale === 'ru'
                ? `Продать (${totalPriceDc.toLocaleString('ru-RU')} DC)`
                : `Sell (${totalPriceDc.toLocaleString('ru-RU')} DC)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
