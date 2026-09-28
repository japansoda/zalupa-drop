'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  FlaskConical,
  ShieldCheck,
  Zap,
  Anchor,
  Egg,
  Coins,
  Sliders,
  CheckCircle2,
  Shield,
  CreditCard,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { fireConfetti } from '../../lib/confetti';
import { useGameStore } from '../../store/useGameStore';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';

interface TierOption {
  amount: number;
  bonusPct: number;
  label: string;
  badge: string;
  badgeEn: string;
  theme: 'blue' | 'purple' | 'pink' | 'red' | 'gold' | 'cyan' | 'emerald' | 'legend';
}

const REFILL_TIERS: TierOption[] = [
  { amount: 10000, bonusPct: 0, label: '10 000', badge: 'СТАРТ', badgeEn: 'START', theme: 'blue' },
  { amount: 50000, bonusPct: 5, label: '50 000', badge: 'ТАКТИК', badgeEn: 'TACTIC', theme: 'purple' },
  { amount: 100000, bonusPct: 10, label: '100 000', badge: 'ПРОФИ', badgeEn: 'PRO', theme: 'pink' },
  { amount: 250000, bonusPct: 15, label: '250 000', badge: 'ЭЛИТА', badgeEn: 'ELITE', theme: 'red' },
  { amount: 500000, bonusPct: 20, label: '500 000', badge: 'ХАЙРОЛЛ', badgeEn: 'HIGHROLL', theme: 'gold' },
  { amount: 1000000, bonusPct: 25, label: '1 000 000', badge: 'МАГНАТ', badgeEn: 'TYCOON', theme: 'cyan' },
  { amount: 2500000, bonusPct: 35, label: '2 500 000', badge: 'ОЛИГАРХ', badgeEn: 'OLIGARCH', theme: 'emerald' },
  { amount: 5000000, bonusPct: 50, label: '5 000 000', badge: 'MAX CS2', badgeEn: 'MAX CS2', theme: 'legend' },
];

const THEME_STYLES: Record<
  TierOption['theme'],
  { border: string; bg: string; text: string; badge: string; glow: string }
> = {
  blue: {
    border: 'border-blue-500/30 hover:border-blue-400/80',
    bg: 'bg-gradient-to-b from-blue-950/30 to-[#0e101a] hover:from-blue-900/40',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]',
  },
  purple: {
    border: 'border-purple-500/30 hover:border-purple-400/80',
    bg: 'bg-gradient-to-b from-purple-950/30 to-[#0e101a] hover:from-purple-900/40',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]',
  },
  pink: {
    border: 'border-pink-500/30 hover:border-pink-400/80',
    bg: 'bg-gradient-to-b from-pink-950/30 to-[#0e101a] hover:from-pink-900/40',
    text: 'text-pink-400',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    glow: 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.25)]',
  },
  red: {
    border: 'border-red-500/35 hover:border-red-400/80',
    bg: 'bg-gradient-to-b from-red-950/30 to-[#0e101a] hover:from-red-900/40',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
    glow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]',
  },
  gold: {
    border: 'border-yellow-400/40 hover:border-yellow-300',
    bg: 'bg-gradient-to-b from-yellow-950/35 to-[#0e101a] hover:from-yellow-900/45',
    text: 'text-yellow-400',
    badge: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
    glow: 'group-hover:shadow-[0_0_25px_rgba(250,204,21,0.3)]',
  },
  cyan: {
    border: 'border-cyan-400/40 hover:border-cyan-300',
    bg: 'bg-gradient-to-b from-cyan-950/35 to-[#0e101a] hover:from-cyan-900/45',
    text: 'text-cyan-400',
    badge: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
    glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]',
  },
  emerald: {
    border: 'border-emerald-400/40 hover:border-emerald-300',
    bg: 'bg-gradient-to-b from-emerald-950/35 to-[#0e101a] hover:from-emerald-900/45',
    text: 'text-emerald-400',
    badge: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
    glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]',
  },
  legend: {
    border: 'border-amber-400/70 hover:border-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.35)]',
    bg: 'bg-gradient-to-b from-amber-950/50 via-yellow-950/30 to-[#0e101a] hover:from-amber-900/60',
    text: 'text-amber-300',
    badge: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black',
    glow: 'group-hover:shadow-[0_0_35px_rgba(245,158,11,0.5)]',
  },
};

const PAYMENT_METHODS = [
  { name: 'CS2 Skins', icon: Flame, color: '#f59e0b' },
  { name: 'Steam Pay', icon: Shield, color: '#38bdf8' },
  { name: 'СБП / МИР', icon: CreditCard, color: '#10b981' },
  { name: 'USDT / BTC', icon: Coins, color: '#eab308' },
];

export const RefillModal: React.FC = () => {
  const {
    isRefillOpen,
    setRefillOpen,
    refillDemoBalance,
    balance,
    addPotion,
    addSaveToken,
    addZeus,
    addHook,
    addEggToken,
    potionsCount,
    saveTokensCount,
    zeusCount,
    hookCount,
    farmEggTokens,
  } = useGameStore();

  const { t, locale } = useLanguage();
  const isRu = locale === 'ru';

  const [activeTab, setActiveTab] = useState<'tiers' | 'consumables' | 'custom'>('tiers');
  const [successAnimation, setSuccessAnimation] = useState<{ amount: string; text: string } | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(50000);

  if (!isRefillOpen) return null;

  const triggerRewardAnimation = (amount: number, labelText?: string) => {
    sound.playReward();
    refillDemoBalance(amount);
    fireConfetti({
      tier: 'mid',
      origin: { y: 0.65 },
      colors: ['#FACC15', '#FFFFFF', '#38BDF8', '#10B981'],
    });

    setSuccessAnimation({
      amount: `+${amount.toLocaleString('ru-RU')} DC`,
      text: labelText || (isRu ? 'успешно начислено!' : 'added to balance!'),
    });

    setTimeout(() => {
      setSuccessAnimation(null);
    }, 2200);
  };

  const handleGetPotions = () => {
    sound.playReward();
    addPotion(3);
    setSuccessAnimation({
      amount: '+3',
      text: isRu ? 'Зелья удачи получены (+15% к удаче)' : 'Luck Potions claimed (+15% luck)',
    });
    setTimeout(() => setSuccessAnimation(null), 2000);
  };

  const handleGetSaveTokens = () => {
    sound.playAngelicChime();
    addSaveToken(1);
    setSuccessAnimation({
      amount: '+1',
      text: isRu ? 'Жетон оберега получен (Защита от сгорания)' : 'Guardian Aegis claimed',
    });
    setTimeout(() => setSuccessAnimation(null), 2000);
  };

  const handleGetZeus = () => {
    sound.playZeusShock();
    addZeus(1);
    setSuccessAnimation({
      amount: '+1',
      text: isRu ? 'Zeus x27 получен (Электрошок рулетки)' : 'Zeus x27 claimed',
    });
    setTimeout(() => setSuccessAnimation(null), 2000);
  };

  const handleGetHook = () => {
    sound.playReward();
    addHook(1);
    setSuccessAnimation({
      amount: '+1',
      text: isRu ? 'Крюк-кошка получен (Зацеп карты 50/50)' : 'Grappling Hook claimed',
    });
    setTimeout(() => setSuccessAnimation(null), 2000);
  };

  const handleGetEgg = () => {
    sound.playReward();
    addEggToken(1);
    setSuccessAnimation({
      amount: '+1',
      text: isRu ? 'Яйцо курочки получено (Для птицефермы)' : 'Chicken Egg claimed',
    });
    setTimeout(() => setSuccessAnimation(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-x-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) setRefillOpen(false);
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-3xl rounded-3xl bg-[#0b0c13] border border-white/10 p-4 sm:p-6 shadow-[0_0_80px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Toast Notification */}
        <AnimatePresence>
          {successAnimation !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute inset-x-4 sm:inset-x-8 bottom-4 z-40 p-3 rounded-2xl bg-emerald-950/95 border border-emerald-400 flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(16,185,129,0.4)] backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              <span className="text-emerald-300 font-black text-sm font-mono truncate">
                {successAnimation.amount} {successAnimation.text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
              <DropCoinIcon size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-black uppercase text-white tracking-tight truncate">
                  {t('refill.title')}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase shrink-0">
                  {isRu ? 'ДЕМО • БЕСПЛАТНО' : 'DEMO • FREE'}
                </span>
              </div>
              <p className="text-[11px] text-white/50 truncate">
                {isRu ? 'Мгновенное пополнение монет и расходников' : 'Instant free DC refill & powerups'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 shadow-inner">
              <DropCoinIcon size={16} />
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
              className="text-white/40 hover:text-white w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/10">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('tiers');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'tiers'
                ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{isRu ? 'Пакеты DC' : 'DC Packages'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('consumables');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'consumables'
                ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isRu ? 'Расходники' : 'Consumables'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('custom');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isRu ? 'Своя сумма' : 'Custom'}</span>
          </button>
        </div>

        {/* Tab 1: DC Packages */}
        {activeTab === 'tiers' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-1 animate-in fade-in zoom-in-95 duration-150">
            {REFILL_TIERS.map((tier) => {
              const styles = THEME_STYLES[tier.theme];
              return (
                <button
                  key={tier.amount}
                  type="button"
                  onClick={() => triggerRewardAnimation(tier.amount)}
                  className={`p-3 rounded-2xl flex flex-col justify-between items-center text-center border transition-all cursor-pointer group hover:-translate-y-0.5 active:scale-95 h-28 relative overflow-hidden ${styles.border} ${styles.bg} ${styles.glow}`}
                >
                  {/* Top Bar: Badge & Bonus Tag */}
                  <div className="w-full flex items-center justify-between">
                    <span className={`text-[8.5px] px-1.5 py-0.5 rounded-md border uppercase font-black tracking-wider ${styles.badge}`}>
                      {isRu ? tier.badge : tier.badgeEn}
                    </span>
                    {tier.bonusPct > 0 ? (
                      <span className="text-[8.5px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        +{tier.bonusPct}%
                      </span>
                    ) : (
                      <span className="text-[8px] text-white/30 uppercase font-bold">Base</span>
                    )}
                  </div>

                  {/* Middle: Big Coin Value */}
                  <div className="flex items-center justify-center gap-1.5 my-auto">
                    <DropCoinIcon size={20} />
                    <span className={`font-mono font-black text-sm sm:text-base ${styles.text}`}>
                      +{tier.label}
                    </span>
                  </div>

                  {/* Bottom: Action Label */}
                  <div className="w-full pt-1.5 border-t border-white/5 flex items-center justify-center gap-1">
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-wider group-hover:text-yellow-400 transition-colors">
                      {isRu ? 'Забрать' : 'Claim'}
                    </span>
                    <ArrowRight className="w-2.5 h-2.5 text-white/40 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Consumables & Boosters */}
        {activeTab === 'consumables' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1 animate-in fade-in zoom-in-95 duration-150">
            {/* 1. Luck Potions */}
            <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-black/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <FlaskConical className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs sm:text-sm text-white truncate">
                      {isRu ? 'Зелье удачи (+3 шт)' : 'Luck Potions (+3)'}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {potionsCount} {isRu ? 'в наличии' : 'owned'}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50 mt-0.5 truncate">
                    {isRu ? '+15% шанс на топ-скины в рулетке' : '+15% chance for top skins'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetPotions}
                className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
              >
                {isRu ? 'Взять' : 'Add'}
              </button>
            </div>

            {/* 2. Guardian Aegis / Save Tokens */}
            <div className="p-3.5 rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-950/20 to-black/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(250,204,21,0.25)]">
                  <ShieldCheck className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs sm:text-sm text-white truncate">
                      {isRu ? 'Жетон оберега (+1 шт)' : 'Guardian Aegis (+1)'}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/30">
                      {saveTokensCount} {isRu ? 'в наличии' : 'owned'}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50 mt-0.5 truncate">
                    {isRu ? 'Защищает скин от сгорания в апгрейдере' : 'Shields skin from burn on loss'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetSaveTokens}
                className="py-2 px-3 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
              >
                {isRu ? 'Взять' : 'Add'}
              </button>
            </div>

            {/* 3. Zeus x27 */}
            <div className="p-3.5 rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/20 to-black/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                  <Zap className="w-6 h-6 text-sky-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs sm:text-sm text-white truncate">
                      Zeus x27 (+1 шт)
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                      {zeusCount} {isRu ? 'в наличии' : 'owned'}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50 mt-0.5 truncate">
                    {isRu ? 'Шок рулетки + переролл с бонусом +5%' : 'Mid-spin shock reroll +5% boost'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetZeus}
                className="py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
              >
                {isRu ? 'Взять' : 'Add'}
              </button>
            </div>

            {/* 4. Grappling Hook */}
            <div className="p-3.5 rounded-2xl border border-orange-500/30 bg-gradient-to-b from-orange-950/20 to-black/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                  <Anchor className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs sm:text-sm text-white truncate">
                      {isRu ? 'Крюк-кошка (+1 шт)' : 'Grappling Hook (+1)'}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                      {hookCount} {isRu ? 'в наличии' : 'owned'}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50 mt-0.5 truncate">
                    {isRu ? 'Принудительный зацеп карты или сектора 50/50' : 'Catch flying card or sector 50/50'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetHook}
                className="py-2 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
              >
                {isRu ? 'Взять' : 'Add'}
              </button>
            </div>

            {/* 5. Chicken Egg */}
            <div className="sm:col-span-2 p-3.5 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-black/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <Egg className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs sm:text-sm text-white truncate">
                      {isRu ? 'Яйцо курочки (+1 шт)' : 'Chicken Egg (+1)'}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      {farmEggTokens} {isRu ? 'в наличии' : 'owned'}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50 mt-0.5 truncate">
                    {isRu ? 'Для инкубации на птицеферме и сбора скинов CS2' : 'For chicken farm breeding & drops'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetEgg}
                className="py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
              >
                {isRu ? 'Взять яйцо' : 'Claim Egg'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Custom Amount Refill */}
        {activeTab === 'custom' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase text-white/60 tracking-wider">
                {isRu ? 'Введите желаемую сумму монет' : 'Enter desired amount'}
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none">
                  <DropCoinIcon size={24} />
                </div>
                <input
                  type="number"
                  min={1000}
                  max={50000000}
                  step={5000}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full py-3.5 pl-12 pr-4 rounded-xl bg-black/60 border border-white/20 font-mono font-black text-lg sm:text-xl text-yellow-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                />
              </div>
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-2">
              {[25000, 100000, 500000, 1000000, 5000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setCustomAmount(preset);
                  }}
                  className={`py-1.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    customAmount === preset
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300 font-black'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                  }`}
                >
                  +{preset.toLocaleString('ru-RU')} DC
                </button>
              ))}
            </div>

            {/* Claim button */}
            <button
              type="button"
              onClick={() => {
                if (customAmount > 0) triggerRewardAnimation(customAmount);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(250,204,21,0.35)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 mt-1"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isRu
                  ? `Начислить ${customAmount.toLocaleString('ru-RU')} DC`
                  : `Add ${customAmount.toLocaleString('ru-RU')} DC`}
              </span>
            </button>
          </div>
        )}

        {/* Footer Payment Providers & Security Bar */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.name}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] font-bold text-white/50 select-none"
                >
                  <Icon className="w-3 h-3" style={{ color: method.color }} />
                  <span>{method.name}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRu ? 'Безопасное мгновенное начисление' : 'Instant free demo refill'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
