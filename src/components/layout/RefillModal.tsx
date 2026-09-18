'use client';

import React from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { sound } from '../../lib/sound';

export const RefillModal: React.FC = () => {
  const { isRefillOpen, setRefillOpen, refillDemoBalance, balance } = useGameStore();

  if (!isRefillOpen) return null;

  const handleRefill = (amount: number) => {
    refillDemoBalance(amount);
  };

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
              Демо-Пополнение <Sparkles className="w-4 h-4 text-yellow-400" />
            </h3>
            <p className="text-xs text-white/50">
              Бесплатное восстановление валюты DropCoin (DC)
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between mb-5">
          <span className="text-xs font-semibold text-white/60">Текущий баланс:</span>
          <div className="flex items-center gap-1.5">
            <DropCoinIcon size={18} />
            <span className="font-mono font-black text-white text-base">
              {balance.toLocaleString('ru-RU')} DC
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[
            { label: '+5 000 DC', amount: 5000, desc: 'Для разогрева' },
            { label: '+10 000 DC', amount: 10000, desc: 'Стандартный пак' },
            { label: '+50 000 DC', amount: 50000, desc: 'Хайроллер' },
            { label: '+100 000 DC', amount: 100000, desc: 'Безлимит кейсов' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleRefill(item.amount)}
              className="glass-card p-3.5 rounded-xl flex flex-col items-center justify-center border border-white/10 hover:border-yellow-400 hover:bg-yellow-400/10 transition-all text-center cursor-pointer group active:scale-95"
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
            Это симулятор в целях развлечения и портфолио. Валюта <strong>DropCoin (DC)</strong> не имеет реальной ценности, не подлежит покупке за рубли/доллары и выводу.
          </span>
        </div>
      </div>
    </div>
  );
};
