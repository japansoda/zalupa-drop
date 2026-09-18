"use client";

import React from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { CurrencyBadge } from "./ui/CurrencyBadge";
import { useAppStore } from "@/lib/store/useAppStore";
import { Coins, Sparkles, RefreshCw, Zap } from "lucide-react";

export const RefillModal: React.FC = () => {
  const isRefillModalOpen = useAppStore((s) => s.isRefillModalOpen);
  const setRefillModalOpen = useAppStore((s) => s.setRefillModalOpen);
  const refillBalance = useAppStore((s) => s.refillBalance);
  const resetBalanceToDemo = useAppStore((s) => s.resetBalanceToDemo);

  const packs = [
    { amount: 1000, label: "Стартовый набор", icon: Zap, color: "from-blue-500/20 to-cyan-500/20" },
    { amount: 5000, label: "Популярный буст", icon: Coins, color: "from-purple-500/20 to-indigo-500/20" },
    { amount: 10000, label: "Капитанский запас", icon: Sparkles, color: "from-amber-500/20 to-yellow-500/20" },
    { amount: 50000, label: "Хайроллер Пак", icon: Coins, color: "from-rose-500/20 to-amber-500/20" },
  ];

  const handleSelectPack = (amount: number) => {
    refillBalance(amount);
    setRefillModalOpen(false);
  };

  const handleReset = () => {
    resetBalanceToDemo();
    setRefillModalOpen(false);
  };

  return (
    <Modal
      isOpen={isRefillModalOpen}
      onClose={() => setRefillModalOpen(false)}
      title={
        <div className="flex items-center gap-2 text-yellow-400">
          <Coins className="w-5 h-5" />
          <span>Бесплатное пополнение DropCoins</span>
        </div>
      }
      maxWidth="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          В <span className="text-yellow-400 font-semibold">Zalupa Drop</span> игра ведется исключительно на бесплатную виртуальную валюту. Настоящие депозиты и вывод средств отсутствуют! Выберите сумму пополнения:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {packs.map((pack) => {
            const Icon = pack.icon;
            return (
              <button
                key={pack.amount}
                onClick={() => handleSelectPack(pack.amount)}
                className={`group p-4 rounded-xl border border-white/10 hover:border-yellow-400/40 bg-gradient-to-br ${pack.color} hover:bg-white/[0.08] backdrop-blur-md transition-all text-left flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white uppercase tracking-wider">
                    {pack.label}
                  </span>
                  <Icon className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                </div>
                <CurrencyBadge amount={pack.amount} size="md" showPlus />
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="text-slate-400 hover:text-white"
          >
            Сбросить баланс до 10 000 DC
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRefillModalOpen(false)}
          >
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};
