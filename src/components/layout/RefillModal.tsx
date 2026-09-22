'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';

interface TierOption {
  amount: number;
  label: string;
  badge: string;
  badgeEn: string;
  theme: 'blue' | 'purple' | 'pink' | 'red' | 'gold' | 'cyan' | 'emerald' | 'legend';
}

const REFILL_TIERS: TierOption[] = [
  { amount: 10000, label: '10 000', badge: 'СТАРТ', badgeEn: 'START', theme: 'blue' },
  { amount: 50000, label: '50 000', badge: 'ТАКТИК', badgeEn: 'TACTIC', theme: 'purple' },
  { amount: 100000, label: '100 000', badge: 'ПРОФИ', badgeEn: 'PRO', theme: 'pink' },
  { amount: 250000, label: '250 000', badge: 'ЭЛИТА', badgeEn: 'ELITE', theme: 'red' },
  { amount: 500000, label: '500 000', badge: 'ХАЙРОЛЛ', badgeEn: 'HIGHROLL', theme: 'gold' },
  { amount: 1000000, label: '1 000 000', badge: 'МАГНАТ', badgeEn: 'TYCOON', theme: 'cyan' },
  { amount: 2500000, label: '2 500 000', badge: 'ОЛИГАРХ', badgeEn: 'OLIGARCH', theme: 'emerald' },
  { amount: 5000000, label: '5 000 000', badge: 'MAX CS2', badgeEn: 'MAX CS2', theme: 'legend' },
];

const THEME_STYLES: Record<TierOption['theme'], { border: string; bg: string; text: string; badge: string }> = {
  blue: {
    border: 'border-blue-500/30 hover:border-blue-400',
    bg: 'bg-blue-950/20 hover:bg-blue-900/35',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  purple: {
    border: 'border-purple-500/30 hover:border-purple-400',
    bg: 'bg-purple-950/20 hover:bg-purple-900/35',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  pink: {
    border: 'border-pink-500/30 hover:border-pink-400',
    bg: 'bg-pink-950/20 hover:bg-pink-900/35',
    text: 'text-pink-400',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  red: {
    border: 'border-red-500/35 hover:border-red-400',
    bg: 'bg-red-950/20 hover:bg-red-900/35',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  gold: {
    border: 'border-yellow-400/40 hover:border-yellow-300',
    bg: 'bg-yellow-950/25 hover:bg-yellow-900/40',
    text: 'text-yellow-400',
    badge: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
  },
  cyan: {
    border: 'border-cyan-400/40 hover:border-cyan-300',
    bg: 'bg-cyan-950/25 hover:bg-cyan-900/40',
    text: 'text-cyan-400',
    badge: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
  },
  emerald: {
    border: 'border-emerald-400/40 hover:border-emerald-300',
    bg: 'bg-emerald-950/25 hover:bg-emerald-900/40',
    text: 'text-emerald-400',
    badge: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
  },
  legend: {
    border: 'border-amber-400/70 hover:border-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    bg: 'bg-gradient-to-br from-amber-950/40 via-yellow-950/30 to-black/60 hover:from-amber-900/50',
    text: 'text-amber-300',
    badge: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black',
  },
};

export const RefillModal: React.FC = () => {
  const { isRefillOpen, setRefillOpen, refillDemoBalance, balance, addPotion, addSaveToken, addZeus, potionsCount, saveTokensCount, zeusCount } = useGameStore();
  const { t, locale } = useLanguage();

  const [successAnimation, setSuccessAnimation] = useState<number | null>(null);

  if (!isRefillOpen) return null;

  const triggerRewardAnimation = (amount: number) => {
    sound.playReward();
    setSuccessAnimation(amount);
    refillDemoBalance(amount);
    setTimeout(() => {
      setSuccessAnimation(null);
    }, 1500);
  };

  const handleGetPotions = () => {
    sound.playReward();
    addPotion(3);
  };

  const handleGetSaveTokens = () => {
    sound.playAngelicChime();
    addSaveToken(1);
  };

  const handleGetZeus = () => {
    sound.playZeusShock();
    addZeus(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-x-hidden">
      <motion.div 
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="relative w-full max-w-2xl glass-panel rounded-2xl sm:rounded-3xl border border-yellow-400/30 p-3.5 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.95)] max-h-[88vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Splash Notification (Bottom) */}
        <AnimatePresence>
          {successAnimation !== null && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="absolute inset-x-3 sm:inset-x-6 bottom-3 z-30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-950/95 border border-emerald-400 flex items-center justify-center gap-2 shadow-2xl"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              <span className="text-emerald-300 font-black text-xs sm:text-sm font-mono truncate">
                +{successAnimation.toLocaleString('ru-RU')} DC {locale === 'ru' ? 'успешно начислено!' : 'added!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shrink-0">
              <DropCoinIcon size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-xl font-black uppercase text-white tracking-tight truncate">
                  {t('refill.title')}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase shrink-0">
                  {locale === 'ru' ? 'МГНОВЕННО' : 'INSTANT'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-white/50 truncate">
                {locale === 'ru' ? 'Начисление виртуальных монет' : 'Instant free DC refill'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-black/70 border border-white/15">
              <DropCoinIcon size={14} />
              <span className="font-mono font-black text-yellow-400 text-xs sm:text-sm whitespace-nowrap">
                {balance.toLocaleString('ru-RU')} DC
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setRefillOpen(false);
              }}
              className="text-white/40 hover:text-white w-7 h-7 sm:w-8 sm:h-8 rounded-xl glass-button flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Responsive 8-Tier Cards Grid (2 cols on mobile x 4 cols on tablet+) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 my-2 sm:my-3">
          {REFILL_TIERS.map((tier) => {
            const styles = THEME_STYLES[tier.theme];
            return (
              <button
                key={tier.amount}
                type="button"
                onClick={() => triggerRewardAnimation(tier.amount)}
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col justify-between items-center text-center border transition-all cursor-pointer group hover:scale-[1.02] active:scale-95 h-20 sm:h-24 relative overflow-hidden ${styles.border} ${styles.bg}`}
              >
                <div className="w-full flex items-center justify-between">
                  <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded border uppercase font-black tracking-wider ${styles.badge}`}>
                    {locale === 'ru' ? tier.badge : tier.badgeEn}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-white/40 uppercase group-hover:text-white/80 transition-colors">
                    +{tier.label}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5 my-auto">
                  <DropCoinIcon size={18} />
                  <span className={`font-mono font-black text-sm sm:text-base ${styles.text}`}>
                    +{tier.label}
                  </span>
                </div>

                <span className="text-[8px] sm:text-[9px] font-bold text-white/30 uppercase tracking-wider group-hover:text-yellow-400 transition-colors">
                  {locale === 'ru' ? 'Получить' : 'Claim'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Free Consumables & Boosters Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 mb-1 sm:mb-2">
          {/* Luck Potions */}
          <button
            type="button"
            onClick={handleGetPotions}
            className="px-2.5 py-2 rounded-xl flex items-center justify-between border border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-400 hover:bg-emerald-900/30 transition-all cursor-pointer group active:scale-98 min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0">🧪</span>
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="font-bold text-xs text-emerald-400 group-hover:text-emerald-300 truncate">
                  {locale === 'ru' ? '+3 Зелья удачи' : '+3 Luck Potions'}
                </span>
                <span className="text-[8.5px] text-white/40 mt-0.5 truncate">
                  +15% {locale === 'ru' ? 'удача' : 'luck'}
                </span>
              </div>
            </div>
            <div className="px-1.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 font-mono font-bold text-[10px] text-emerald-300 shrink-0 ml-1.5">
              {potionsCount} {locale === 'ru' ? 'шт.' : 'pcs'}
            </div>
          </button>

          {/* Guardian Aegis / Save Tokens */}
          <button
            type="button"
            onClick={handleGetSaveTokens}
            className="px-2.5 py-2 rounded-xl flex items-center justify-between border border-yellow-500/30 bg-yellow-950/20 hover:border-yellow-400 hover:bg-yellow-900/30 transition-all cursor-pointer group active:scale-98 min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0">🪽</span>
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="font-bold text-xs text-yellow-400 group-hover:text-yellow-300 truncate">
                  {locale === 'ru' ? '+1 Жетон оберега' : '+1 Guardian Aegis'}
                </span>
                <span className="text-[8.5px] text-white/40 mt-0.5 truncate">
                  {locale === 'ru' ? 'Защита от сгорания' : 'Burn Protection'}
                </span>
              </div>
            </div>
            <div className="px-1.5 py-0.5 rounded-lg bg-yellow-500/15 border border-yellow-500/30 font-mono font-bold text-[10px] text-yellow-300 shrink-0 ml-1.5">
              {saveTokensCount} {locale === 'ru' ? 'шт.' : 'pcs'}
            </div>
          </button>

          {/* Zeus x27 */}
          <button
            type="button"
            onClick={handleGetZeus}
            className="px-2.5 py-2 rounded-xl flex items-center justify-between border border-sky-500/30 bg-sky-950/20 hover:border-sky-400 hover:bg-sky-900/30 transition-all cursor-pointer group active:scale-98 min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0">⚡</span>
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="font-bold text-xs text-sky-400 group-hover:text-sky-300 truncate">
                  +1 Zeus x27
                </span>
                <span className="text-[8.5px] text-white/40 mt-0.5 truncate">
                  {locale === 'ru' ? 'Электрошок +5%' : 'Electro shock +5%'}
                </span>
              </div>
            </div>
            <div className="px-1.5 py-0.5 rounded-lg bg-sky-500/15 border border-sky-500/30 font-mono font-bold text-[10px] text-sky-300 shrink-0 ml-1.5">
              {zeusCount} {locale === 'ru' ? 'шт.' : 'pcs'}
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
