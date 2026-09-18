'use client';

import React from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { sound } from '../../lib/sound';
import { UPGRADE_TOKENS } from '../../lib/consumables';
import { useLanguage } from '../../lib/i18n';

export const RefillModal: React.FC = () => {
  const { isRefillOpen, setRefillOpen, refillDemoBalance, balance, addPotion, addToken, potionsCount, tokens } = useGameStore();
  const { t, locale } = useLanguage();

  if (!isRefillOpen) return null;

  const handleRefill = (amount: number) => {
    sound.playReward();
    refillDemoBalance(amount);
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
      <div 
        className="relative w-full max-w-md glass-panel rounded-2xl border border-yellow-400/30 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            sound.playClick();
            setRefillOpen(false);
          }}
          className="absolute top-4 right-4 text-white/40 hover:text-white w-8 h-8 rounded-lg glass-button flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shadow-lg">
            <DropCoinIcon size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
              {t('refill.title')} <Sparkles className="w-4 h-4 text-yellow-400" />
            </h3>
            <p className="text-xs text-white/50">
              {t('refill.subtitle')}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-white/60">{t('refill.currentBalance')}</span>
          <div className="flex items-center gap-1.5">
            <DropCoinIcon size={18} />
            <span className="font-mono font-black text-white text-base">
              {balance.toLocaleString('ru-RU')} DC
            </span>
          </div>
        </div>

        {/* Free Consumables demo grant */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">{t('refill.bonusTitle')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleGetPotions}
              className="glass-card p-3 rounded-xl flex flex-col items-center justify-center border border-emerald-500/40 bg-emerald-950/25 hover:border-emerald-400 hover:bg-emerald-900/35 transition-all text-center cursor-pointer group active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              <div className="flex items-center gap-1">
                <span className="text-base">🧪</span>
                <span className="font-black text-xs text-emerald-400 group-hover:text-emerald-300">
                  {t('refill.potionsBtn')}
                </span>
              </div>
              <span className="text-[10px] text-white/50 mt-0.5">{t('refill.potionsDesc')}</span>
              <span className="text-[9px] text-emerald-300/80 font-mono mt-0.5">
                {locale === 'ru' ? `(${potionsCount} шт. в запасе)` : `(${potionsCount} in stock)`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleGetTokens}
              className="glass-card p-3 rounded-xl flex flex-col items-center justify-center border border-yellow-500/40 bg-yellow-950/25 hover:border-yellow-400 hover:bg-yellow-900/35 transition-all text-center cursor-pointer group active:scale-95 shadow-[0_0_15px_rgba(250,204,21,0.15)]"
            >
              <div className="flex items-center gap-1">
                <span className="text-base">🎟️</span>
                <span className="font-black text-xs text-yellow-400 group-hover:text-yellow-300">
                  {t('refill.tokensBtn')}
                </span>
              </div>
              <span className="text-[10px] text-white/50 mt-0.5">{t('refill.tokensDesc')}</span>
              <span className="text-[9px] text-yellow-300/80 font-mono mt-0.5">
                {locale === 'ru' ? `(${totalTokensOwned} шт. всего)` : `(${totalTokensOwned} total)`}
              </span>
            </button>
          </div>
        </div>

        {/* DC Currency Refill Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {[
            { label: '+5 000 DC', amount: 5000, desc: t('refill.warmup') },
            { label: '+10 000 DC', amount: 10000, desc: t('refill.standard') },
            { label: '+50 000 DC', amount: 50000, desc: t('refill.highroller') },
            { label: '+100 000 DC', amount: 100000, desc: t('refill.unlimited') },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleRefill(item.amount)}
              className="glass-card p-3 rounded-xl flex flex-col items-center justify-center border border-white/10 hover:border-yellow-400 hover:bg-yellow-400/10 transition-all text-center cursor-pointer group active:scale-95"
            >
              <span className="font-black text-sm text-yellow-400 group-hover:text-yellow-300">
                {item.label}
              </span>
              <span className="text-[10px] text-white/50 mt-0.5">{item.desc}</span>
            </button>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20 flex gap-2.5 text-xs text-yellow-200/80 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <span>
            {t('refill.disclaimer')}
          </span>
        </div>
      </div>
    </div>
  );
};

