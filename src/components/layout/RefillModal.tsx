'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  AlertCircle, 
  Flame, 
  Coins, 
  Crown, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Plus,
  Gem
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

const THEME_STYLES: Record<TierOption['theme'], { border: string; bg: string; text: string; badgeBg: string }> = {
  blue: {
    border: 'border-blue-500/30 hover:border-blue-400',
    bg: 'bg-blue-950/20 hover:bg-blue-900/30',
    text: 'text-blue-400',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  purple: {
    border: 'border-purple-500/30 hover:border-purple-400',
    bg: 'bg-purple-950/20 hover:bg-purple-900/30',
    text: 'text-purple-400',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  pink: {
    border: 'border-pink-500/30 hover:border-pink-400',
    bg: 'bg-pink-950/20 hover:bg-pink-900/30',
    text: 'text-pink-400',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  red: {
    border: 'border-red-500/40 hover:border-red-400',
    bg: 'bg-red-950/25 hover:bg-red-900/35',
    text: 'text-red-400',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
  },
  gold: {
    border: 'border-yellow-400/50 hover:border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.15)]',
    bg: 'bg-yellow-950/30 hover:bg-yellow-900/40',
    text: 'text-yellow-400',
    badgeBg: 'bg-yellow-400/25 text-yellow-300 border-yellow-400/50 font-black',
  },
  cyan: {
    border: 'border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]',
    bg: 'bg-cyan-950/30 hover:bg-cyan-900/40',
    text: 'text-cyan-400',
    badgeBg: 'bg-cyan-400/25 text-cyan-200 border-cyan-400/50 font-black',
  },
  emerald: {
    border: 'border-emerald-400/50 hover:border-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.2)]',
    bg: 'bg-emerald-950/30 hover:bg-emerald-900/40',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-400/25 text-emerald-200 border-emerald-400/50 font-black',
  },
  legend: {
    border: 'border-amber-400/80 hover:border-yellow-300 shadow-[0_0_30px_rgba(245,158,11,0.35)]',
    bg: 'bg-gradient-to-b from-amber-950/50 to-black/60 hover:from-amber-900/60',
    text: 'text-amber-300',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black shadow-md',
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
    }, 1800);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="relative w-full max-w-2xl glass-panel rounded-3xl border border-yellow-400/40 p-5 sm:p-7 shadow-[0_0_70px_rgba(0,0,0,0.9)] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-yellow-400/20 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Success Splash Notification */}
        <AnimatePresence>
          {successAnimation !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="absolute inset-x-6 top-6 z-30 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-400 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-emerald-300 font-black text-sm font-mono">
                +{successAnimation.toLocaleString('ru-RU')} DC {locale === 'ru' ? 'успешно начислено на ваш баланс!' : 'successfully credited!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setRefillOpen(false);
          }}
          className="absolute top-4 right-4 text-white/40 hover:text-white w-9 h-9 rounded-xl glass-button flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-white/10">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-amber-600/20 border border-yellow-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.25)] shrink-0">
            <DropCoinIcon size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                {t('refill.title')}
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                МГНОВЕННО
              </span>
            </div>
            <p className="text-xs text-white/60 mt-0.5">
              {t('refill.subtitle')}
            </p>
          </div>
        </div>

        {/* Current Balance Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-black/80 via-black/60 to-black/80 border border-white/10 flex items-center justify-between mb-5 shadow-inner">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400/80" />
            <span className="text-xs font-semibold text-white/70">{t('refill.currentBalance')}</span>
          </div>
          <div className="flex items-center gap-2">
            <DropCoinIcon size={20} />
            <span className="font-mono font-black text-yellow-400 text-lg sm:text-xl">
              {balance.toLocaleString('ru-RU')} DC
            </span>
          </div>
        </div>

        {/* 1. TIERED CARDS GRID (Up to 5 Million DC) */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              {locale === 'ru' ? 'Выберите пакет пополнения:' : 'Select refill package:'}
            </span>
            <span className="text-[11px] text-yellow-400/90 font-mono font-bold">
              Лимит до 5 000 000 DC
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {REFILL_TIERS.map((tier) => {
              const styles = THEME_STYLES[tier.theme];
              return (
                <button
                  key={tier.amount}
                  type="button"
                  onClick={() => triggerRewardAnimation(tier.amount)}
                  className={`relative p-3 rounded-2xl flex flex-col items-center justify-between border transition-all text-center cursor-pointer group active:scale-95 ${styles.border} ${styles.bg}`}
                >
                  {/* Badge */}
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border mb-1.5 uppercase font-bold tracking-wider ${styles.badgeBg}`}>
                    {tier.badge}
                  </span>

                  {/* Amount */}
                  <div className="flex items-center gap-1 my-0.5">
                    <DropCoinIcon size={14} />
                    <span className={`font-mono font-black text-sm sm:text-base ${styles.text}`}>
                      +{tier.label}
                    </span>
                  </div>

                  <span className="text-[10px] text-white/40 uppercase font-semibold">
                    DropCoin
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. CUSTOM AMOUNT REFILL INPUT */}
        <form onSubmit={handleCustomRefill} className="mb-5 p-3.5 rounded-2xl bg-black/50 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="custom-dc-input" className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-yellow-400" />
              {locale === 'ru' ? 'Своя сумма (до 5M DC):' : 'Custom amount (up to 5M DC):'}
            </label>
            <span className="text-[10px] text-white/40 font-mono">1 000 — 5 000 000 DC</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <DropCoinIcon size={16} />
              </div>
              <input
                id="custom-dc-input"
                type="text"
                value={customAmount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setCustomAmount(cleaned);
                }}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/70 border border-white/15 focus:border-yellow-400 text-white font-mono font-bold text-sm outline-none transition-colors"
                placeholder="500000"
              />
            </div>

            <button
              type="submit"
              className="btn-yellow px-5 py-2.5 rounded-xl text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{locale === 'ru' ? 'ПОПОЛНИТЬ' : 'TOP UP'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick Increment Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-white/5">
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
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
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
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
              {t('refill.bonusTitle')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleGetPotions}
              className="p-3 rounded-2xl flex items-center justify-between border border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400 hover:bg-emerald-900/30 transition-all cursor-pointer group active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-lg shadow-sm">
                  🧪
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-black text-xs text-emerald-400 group-hover:text-emerald-300">
                    {t('refill.potionsBtn')}
                  </span>
                  <span className="text-[10px] text-white/50">{t('refill.potionsDesc')}</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-300/80 font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                {locale === 'ru' ? `${potionsCount} шт.` : `${potionsCount} left`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleGetTokens}
              className="p-3 rounded-2xl flex items-center justify-between border border-yellow-500/40 bg-yellow-950/20 hover:border-yellow-400 hover:bg-yellow-900/30 transition-all cursor-pointer group active:scale-95 shadow-[0_0_15px_rgba(250,204,21,0.1)]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-lg shadow-sm">
                  🎟️
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-black text-xs text-yellow-400 group-hover:text-yellow-300">
                    {t('refill.tokensBtn')}
                  </span>
                  <span className="text-[10px] text-white/50">{t('refill.tokensDesc')}</span>
                </div>
              </div>
              <span className="text-[10px] text-yellow-300/80 font-mono font-bold px-2 py-0.5 rounded-lg bg-yellow-500/15 border border-yellow-500/30">
                {locale === 'ru' ? `${totalTokensOwned} шт.` : `${totalTokensOwned} left`}
              </span>
            </button>
          </div>
        </div>

        {/* CS2 Security Disclaimer */}
        <div className="p-3 rounded-2xl bg-yellow-400/5 border border-yellow-400/20 flex gap-2.5 text-xs text-yellow-200/80 leading-relaxed items-center">
          <ShieldCheck className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-[11px]">
            {t('refill.disclaimer')}
          </span>
        </div>
      </motion.div>
    </div>
  );
};


