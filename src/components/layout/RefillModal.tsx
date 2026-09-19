'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Coins, 
  Zap, 
  ArrowRight,
  Plus
} from 'lucide-react';
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
    bg: 'bg-blue-950/20 hover:bg-blue-900/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  purple: {
    border: 'border-purple-500/30 hover:border-purple-400',
    bg: 'bg-purple-950/20 hover:bg-purple-900/30',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  pink: {
    border: 'border-pink-500/30 hover:border-pink-400',
    bg: 'bg-pink-950/20 hover:bg-pink-900/30',
    text: 'text-pink-400',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  red: {
    border: 'border-red-500/35 hover:border-red-400',
    bg: 'bg-red-950/20 hover:bg-red-900/30',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  gold: {
    border: 'border-yellow-400/40 hover:border-yellow-300',
    bg: 'bg-yellow-950/25 hover:bg-yellow-900/35',
    text: 'text-yellow-400',
    badge: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
  },
  cyan: {
    border: 'border-cyan-400/40 hover:border-cyan-300',
    bg: 'bg-cyan-950/25 hover:bg-cyan-900/35',
    text: 'text-cyan-400',
    badge: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
  },
  emerald: {
    border: 'border-emerald-400/40 hover:border-emerald-300',
    bg: 'bg-emerald-950/25 hover:bg-emerald-900/35',
    text: 'text-emerald-400',
    badge: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
  },
  legend: {
    border: 'border-amber-400/70 hover:border-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    bg: 'bg-gradient-to-r from-amber-950/40 to-black/60 hover:from-amber-900/50',
    text: 'text-amber-300',
    badge: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black',
  },
};

export const RefillModal: React.FC = () => {
  const { isRefillOpen, setRefillOpen, refillDemoBalance, balance, addPotion, addToken, potionsCount, tokens } = useGameStore();
  const { t, locale } = useLanguage();

  const [customAmount, setCustomAmount] = useState<string>('500000');
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

  const handleCustomRefill = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customAmount.replace(/\D/g, ''), 10);
    if (isNaN(val) || val <= 0) return;
    const clamped = Math.min(Math.max(val, 1000), 5000000);
    triggerRewardAnimation(clamped);
  };

  const addCustomPill = (increment: number) => {
    sound.playClick();
    const current = parseInt(customAmount.replace(/\D/g, ''), 10) || 0;
    const next = Math.min(5000000, current + increment);
    setCustomAmount(String(next));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="relative w-full max-w-xl glass-panel rounded-2xl border border-yellow-400/30 p-4 sm:p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Splash Notification */}
        <AnimatePresence>
          {successAnimation !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-x-4 top-3 z-30 p-2.5 rounded-xl bg-emerald-950/95 border border-emerald-400 flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-emerald-300 font-black text-xs font-mono">
                +{successAnimation.toLocaleString('ru-RU')} DC {locale === 'ru' ? 'успешно начислено!' : 'added!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header: Left Title + Right Balance & Close */}
        <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shrink-0">
              <DropCoinIcon size={20} />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight">
                {t('refill.title')}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                МГНОВЕННО
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10">
              <DropCoinIcon size={14} />
              <span className="font-mono font-black text-yellow-400 text-xs">
                {balance.toLocaleString('ru-RU')} DC
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setRefillOpen(false);
              }}
              className="text-white/40 hover:text-white w-7 h-7 rounded-lg glass-button flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. COMPACT TIERED BUTTONS (4 columns x 2 rows) */}
        <div className="mb-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {REFILL_TIERS.map((tier) => {
              const styles = THEME_STYLES[tier.theme];
              return (
                <button
                  key={tier.amount}
                  type="button"
                  onClick={() => triggerRewardAnimation(tier.amount)}
                  className={`p-2 rounded-xl flex items-center justify-between border transition-all cursor-pointer group active:scale-95 ${styles.border} ${styles.bg}`}
                >
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-black tracking-wider ${styles.badge}`}>
                    {tier.badge}
                  </span>

                  <div className="flex items-center gap-1">
                    <span className={`font-mono font-black text-xs ${styles.text}`}>
                      +{tier.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. CUSTOM AMOUNT REFILL INPUT & CHIPS */}
        <form onSubmit={handleCustomRefill} className="mb-3 p-2.5 rounded-xl bg-black/40 border border-white/10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                <DropCoinIcon size={15} />
              </div>
              <input
                id="custom-dc-input"
                type="text"
                value={customAmount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setCustomAmount(cleaned);
                }}
                className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-black/70 border border-white/15 focus:border-yellow-400 text-white font-mono font-bold text-xs outline-none transition-colors"
                placeholder="500000"
              />
            </div>

            <button
              type="submit"
              className="btn-yellow px-4 py-1.5 rounded-lg text-black font-black text-xs uppercase flex items-center justify-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{locale === 'ru' ? 'ПОПОЛНИТЬ' : 'TOP UP'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick Increment Chips */}
          <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-white/5">
            {[
              { label: '+50K', val: 50000 },
              { label: '+100K', val: 100000 },
              { label: '+500K', val: 500000 },
              { label: '+1M', val: 1000000 },
              { label: 'MAX 5M', val: 5000000, isMax: true },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  if (chip.isMax) {
                    setCustomAmount('5000000');
                    sound.playClick();
                  } else {
                    addCustomPill(chip.val);
                  }
                }}
                className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer text-center ${
                  chip.isMax 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30' 
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </form>

        {/* 3. FREE CONSUMABLES & BOOSTER AIRDROP */}
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <button
            type="button"
            onClick={handleGetPotions}
            className="px-2.5 py-2 rounded-xl flex items-center justify-between border border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-400 hover:bg-emerald-900/30 transition-all cursor-pointer group active:scale-95"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🧪</span>
              <div className="flex flex-col text-left leading-none">
                <span className="font-bold text-xs text-emerald-400 group-hover:text-emerald-300">
                  +3 Зелья удачи
                </span>
                <span className="text-[9px] text-white/40 mt-0.5">+15% шанс</span>
              </div>
            </div>
            <span className="text-[10px] text-emerald-300/80 font-mono font-bold">
              {potionsCount} шт.
            </span>
          </button>

          <button
            type="button"
            onClick={handleGetTokens}
            className="px-2.5 py-2 rounded-xl flex items-center justify-between border border-yellow-500/30 bg-yellow-950/20 hover:border-yellow-400 hover:bg-yellow-900/30 transition-all cursor-pointer group active:scale-95"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🎟️</span>
              <div className="flex flex-col text-left leading-none">
                <span className="font-bold text-xs text-yellow-400 group-hover:text-yellow-300">
                  +1 Все жетоны
                </span>
                <span className="text-[9px] text-white/40 mt-0.5">2x, 3x, 5x, 10x</span>
              </div>
            </div>
            <span className="text-[10px] text-yellow-300/80 font-mono font-bold">
              {totalTokensOwned} шт.
            </span>
          </button>
        </div>

        {/* Minimal Muted Footer Note */}
        <div className="text-[10px] text-white/30 text-center font-mono pt-1 border-t border-white/5">
          ⚡ Виртуальный демо-баланс для открытия кейсов, контрактов и апгрейдера
        </div>
      </motion.div>
    </div>
  );
};



