'use client';

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { ExternalLink, Check, ShoppingBag, FlaskConical, ShieldCheck, Zap, Sparkles, Ticket, Anchor, Egg, RotateCcw } from 'lucide-react';
import { SkinEntity } from '../../lib/types';
import { RARITY_CONFIG } from '../../data/skins';
import { RarityBadge } from '../ui/RarityBadge';
import { WearBadge } from '../ui/WearBadge';
import { StatTrakBadge } from '../ui/StatTrakBadge';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { SkinImage } from '../ui/SkinImage';
import { sound } from '../../lib/sound';
import { useGameStore } from '../../store/useGameStore';
import { useLanguage } from '../../lib/i18n';
import { getSteamMarketListingUrl, isStatTrakableItem } from '../../lib/steam';

interface DropModalProps {
  skin?: SkinEntity | null;
  skins?: SkinEntity[];
  bonusConsumables?: { potions: number; saveTokens: number; zeus: number; hooks?: number; eggs?: number };
  onKeep: (remaining?: SkinEntity[]) => void;
  onSell: (remaining?: SkinEntity[]) => void;
  onSpinAgain?: () => void;
  spinAgainCost?: number;
  openCount?: number;
}

export const DropModal: React.FC<DropModalProps> = ({
  skin,
  skins,
  bonusConsumables,
  onKeep,
  onSell,
  onSpinAgain,
  spinAgainCost,
  openCount,
}) => {
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
    bonusConsumables && ((bonusConsumables.potions || 0) + (bonusConsumables.saveTokens || 0) + (bonusConsumables.zeus || 0) + (bonusConsumables.hooks || 0) + (bonusConsumables.eggs || 0) > 0)
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
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs uppercase font-black tracking-widest text-white/70">
            {isMulti
              ? locale === 'ru'
                ? `ВЫ ВЫБИЛИ ${items.length} ПРЕДМЕТА!`
                : `YOU WON ${items.length} ITEMS!`
              : locale === 'ru'
              ? 'ВЫ ВЫБИЛИ ПРЕДМЕТ!'
              : 'YOU WON AN ITEM!'}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
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
                    {/* Bonus Extra Drop Tag */}
                    {hasBonus && (
                      <div className="absolute top-0 right-0 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-black text-black bg-yellow-400 shadow-sm">
                        {bonusConsumables?.potions ? (
                          <FlaskConical className="w-3.5 h-3.5" />
                        ) : (
                          <Ticket className="w-3.5 h-3.5" />
                        )}
                        <span>+{locale === 'ru' ? 'БОНУС' : 'BONUS'}</span>
                      </div>
                    )}

                    <SkinImage
                      src={single.image}
                      alt={single.name}
                      size={280}
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
                      {single.statTrak && isStatTrakableItem(single) && <StatTrakBadge size="sm" />}
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
                    href={getSteamMarketListingUrl(single)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 mb-4 underline-offset-4 hover:underline transition-colors"
                  >
                    <span>{locale === 'ru' ? 'Открыть лот на Торговой площадке Steam' : 'View listing on Steam Community Market'}</span>
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
                        {it.statTrak && isStatTrakableItem(it) && <StatTrakBadge size="xs" />}
                        <WearBadge skin={it} size="xs" />
                      </div>
                      <RarityBadge rarity={it.rarity} size="sm" />
                    </div>

                    <div className="w-full h-24 sm:h-40 flex items-center justify-center my-1 sm:my-2 relative">
                      <SkinImage
                        src={it.image}
                        alt={it.name}
                        size={180}
                        className="w-full h-20 sm:h-36 object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform duration-200"
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

        {/* ── EXTRA BONUS DROP SHOWCASE ── */}
        {hasBonus && bonusConsumables && (
          <div className="w-full mb-5 p-4 rounded-2xl glass-panel border border-white/10 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-2 text-center">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white/70">
                {locale === 'ru' ? 'ДОПОЛНИТЕЛЬНЫЙ ДРОП' : 'BONUS DROP'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black text-black bg-yellow-400 shadow-sm">
                +{(bonusConsumables.potions || 0) + (bonusConsumables.saveTokens || 0) + (bonusConsumables.zeus || 0) + (bonusConsumables.hooks || 0) + (bonusConsumables.eggs || 0)}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              {/* Luck Potion Bonus Card */}
              {bonusConsumables.potions > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl glass-card border border-white/10 text-left w-full sm:max-w-md">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/60 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {locale === 'ru' ? 'Зелье удачи' : 'Luck Potion'}
                      </span>
                      <span className="text-[10px] font-mono font-black text-white/60 bg-white/5 px-1.5 py-0.5 rounded">
                        {bonusConsumables.potions}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/40 mt-0.5">
                      +15% · {locale === 'ru' ? '3 действия' : '3 actions'}
                    </span>
                  </div>
                </div>
              )}

              {/* Save Token (Guardian Aegis) Bonus Card */}
              {bonusConsumables.saveTokens > 0 && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl glass-card border border-white/10 text-left w-full sm:max-w-md"
                  style={{ borderBottomWidth: '3px', borderBottomColor: '#facc15' }}
                >
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white truncate">
                        {locale === 'ru' ? 'Жетон сохранения' : 'Guardian Aegis'}
                      </span>
                      <span className="text-[10px] font-mono font-black text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                        {bonusConsumables.saveTokens}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/40 mt-0.5">
                      {locale === 'ru'
                        ? 'Ангельские крылья и нимб · Скин не сгорает при неудаче'
                        : 'Angelic wings & halo · Skin is saved on failure'}
                    </span>
                  </div>
                </div>
              )}

              {/* Zeus x27 Bonus Card */}
              {bonusConsumables.zeus > 0 && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl glass-card border border-white/10 text-left w-full sm:max-w-md"
                  style={{ borderBottomWidth: '3px', borderBottomColor: '#38bdf8' }}
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white truncate">
                        Zeus x27
                      </span>
                      <span className="text-[10px] font-mono font-black text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded border border-sky-400/20">
                        {bonusConsumables.zeus}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/40 mt-0.5">
                      {locale === 'ru'
                        ? 'Молния по стрелке · Реролл барабана и +5% удачи'
                        : 'Lightning bolt strike · Arrow reroll and +5% luck'}
                    </span>
                  </div>
                </div>
              )}

              {/* Grappling Hook Bonus Card */}
              {(bonusConsumables.hooks || 0) > 0 && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl glass-card border border-white/10 text-left w-full sm:max-w-md"
                  style={{ borderBottomWidth: '3px', borderBottomColor: '#fb923c' }}
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                    <Anchor className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white truncate">
                        {locale === 'ru' ? 'Крюк-кошка' : 'Grappling Hook'}
                      </span>
                      <span className="text-[10px] font-mono font-black text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20">
                        {bonusConsumables.hooks}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/40 mt-0.5">
                      {locale === 'ru'
                        ? 'Зацеп за предмет mid-spin · 50/50 на выигрыш'
                        : 'Mid-spin item hook · 50/50 win grab'}
                    </span>
                  </div>
                </div>
              )}

              {/* Chicken Egg Bonus Card */}
              {(bonusConsumables.eggs || 0) > 0 && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl glass-card border border-white/10 text-left w-full sm:max-w-md"
                  style={{ borderBottomWidth: '3px', borderBottomColor: '#eab308' }}
                >
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
                    <Egg className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white truncate">
                        {locale === 'ru' ? 'Куриное яйцо CS2' : 'CS2 Chicken Egg'}
                      </span>
                      <span className="text-[10px] font-mono font-black text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                        {bonusConsumables.eggs}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/40 mt-0.5">
                      {locale === 'ru'
                        ? 'Отправлено в инкубатор фермы · Высиживается боевая курица!'
                        : 'Sent to farm incubator · Hatches a combat chicken!'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Keep / Sell / Spin Again Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {onSpinAgain && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onKeep(items);
                onSpinAgain();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-[0_0_25px_rgba(250,204,21,0.45)]"
            >
              <RotateCcw className="w-4 h-4 stroke-[3]" />
              <span>
                {locale === 'ru'
                  ? `Крутить еще ${openCount && openCount > 1 ? `(${openCount}x)` : ''} ${
                      spinAgainCost ? `· ${spinAgainCost.toLocaleString('ru-RU')} DC` : ''
                    }`
                  : `Spin Again ${openCount && openCount > 1 ? `(${openCount}x)` : ''} ${
                      spinAgainCost ? `· ${spinAgainCost.toLocaleString('ru-RU')} DC` : ''
                    }`}
              </span>
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onKeep(items);
              }}
              className="w-full py-3 px-4 rounded-xl glass-button text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-white/15 cursor-pointer active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>
                {isMulti
                  ? locale === 'ru'
                    ? `В инвентарь (${items.length})`
                    : `Claim all (${items.length})`
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
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all border border-white/10"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isMulti
                  ? locale === 'ru'
                    ? `Продать всё (+${totalPriceDc.toLocaleString('ru-RU')} DC)`
                    : `Sell all (+${totalPriceDc.toLocaleString('ru-RU')} DC)`
                  : locale === 'ru'
                  ? `Продать (+${totalPriceDc.toLocaleString('ru-RU')} DC)`
                  : `Sell (+${totalPriceDc.toLocaleString('ru-RU')} DC)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
