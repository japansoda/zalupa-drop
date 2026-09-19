'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { sound } from '../../lib/sound';
import { UPGRADE_TOKENS } from '../../lib/consumables';
import { useLanguage } from '../../lib/i18n';

interface TierOption {
  amount: number;
  label: string;
  badge: string;
  theme: 'blue' | 'purple' | 'pink' | 'red' | 'gold' | 'cyan' | 'emerald' | 'legend';
}

const REFILL_TIERS: TierOption[] = [
  { amount: 10000, label: '10 000', badge: 'СТАРТ', theme: 'blue' },
  { amount: 50000, label: '50 000', badge: 'ТАКТИК', theme: 'purple' },
  { amount: 100000, label: '100 000', badge: 'ПРОФИ', theme: 'pink' },
  { amount: 250000, label: '250 000', badge: 'ЭЛИТА', theme: 'red' },
  { amount: 500000, label: '500 000', badge: 'ХАЙРОЛЛ', theme: 'gold' },
  { amount: 1000000, label: '1 000 000', badge: 'МАГНАТ', theme: 'cyan' },
  { amount: 2500000, label: '2 500 000', badge: 'ОЛИГАРХ', theme: 'emerald' },
  { amount: 5000000, label: '5 000 000', badge: 'MAX CS2', theme: 'legend' },
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
  const { isRefillOpen, setRefillOpen, refillDemoBalance, balance, addPotion, addToken, potionsCount, tokens } = useGameStore();
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

  const handleGetTokens = () => {
    sound.playReward();
    UPGRADE_TOKENS.forEach((tok) => addToken(tok.id, 1));
  };

  const totalTokensOwned = Object.values(tokens).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="relative w-full max-w-3xl glass-panel rounded-3xl border border-yellow-400/30 p-5 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Splash Notification (Bottom) */}
        <AnimatePresence>
          {successAnimation !== null && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="absolute inset-x-6 bottom-4 z-30 p-3 rounded-2xl bg-emerald-950/95 border border-emerald-400 flex items-center justify-center gap-2 shadow-2xl"
            >
              <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-emerald-300 font-black text-sm font-mono">
                +{successAnimation.toLocaleString('ru-RU')} DC {locale === 'ru' ? 'успешно начислено на баланс!' : 'successfully added!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shrink-0">
              <DropCoinIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight">
                  {t('refill.title')}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  МГНОВЕННО
                </span>
              </div>
              <p className="text-xs text-white/50">
                {locale === 'ru' ? 'Выберите желаемый номинал для начисления DC' : 'Select desired amount to refill DC'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 border border-white/15">
              <DropCoinIcon size={16} />
              <span className="font-mono font-black text-yellow-400 text-sm">
                {balance.toLocaleString('ru-RU')} DC
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setRefillOpen(false);
              }}
              className="text-white/40 hover:text-white w-8 h-8 rounded-xl glass-button flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Spacious 8-Tier Cards Grid (4 cols x 2 rows) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {REFILL_TIERS.map((tier) => {
            const styles = THEME_STYLES[tier.theme];
            return (
              <button
                key={tier.amount}
                type="button"
                onClick={() => triggerRewardAnimation(tier.amount)}
                className={`p-3.5 rounded-2xl flex flex-col justify-between items-center text-center border transition-all cursor-pointer group hover:scale-[1.02] active:scale-95 h-24 sm:h-26 relative overflow-hidden ${styles.border} ${styles.bg}`}
              >
                <div className="w-full flex items-center justify-between">
                  <span className={`text-[9px] px-2 py-0.5 rounded-md border uppercase font-black tracking-wider ${styles.badge}`}>
                    {tier.badge}
                  </span>
                  <span className="text-[9px] font-bold text-white/40 uppercase group-hover:text-white/80 transition-colors">
                    +{tier.label}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 my-auto">
                  <DropCoinIcon size={22} />
                  <span className={`font-mono font-black text-base sm:text-lg ${styles.text}`}>
                    +{tier.label}
                  </span>
                </div>

                <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider group-hover:text-yellow-400 transition-colors">
                  {locale === 'ru' ? 'Получить' : 'Claim'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Free Consumables & Boosters Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={handleGetPotions}
            className="px-4 py-2.5 rounded-2xl flex items-center justify-between border border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-400 hover:bg-emerald-900/30 transition-all cursor-pointer group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🧪</span>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-bold text-xs sm:text-sm text-emerald-400 group-hover:text-emerald-300">
                  +3 Зелья удачи
                </span>
                <span className="text-[10px] text-white/40 mt-0.5">+15% шанс на ценный дроп</span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 font-mono font-bold text-xs text-emerald-300">
              {potionsCount} шт.
            </div>
          </button>

          <button
            type="button"
            onClick={handleGetTokens}
            className="px-4 py-2.5 rounded-2xl flex items-center justify-between border border-yellow-500/30 bg-yellow-950/20 hover:border-yellow-400 hover:bg-yellow-900/30 transition-all cursor-pointer group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎟️</span>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-bold text-xs sm:text-sm text-yellow-400 group-hover:text-yellow-300">
                  +1 Все жетоны апгрейда
                </span>
                <span className="text-[10px] text-white/40 mt-0.5">Мультипликаторы 2x, 3x, 5x, 10x</span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/30 font-mono font-bold text-xs text-yellow-300">
              {totalTokensOwned} шт.
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
