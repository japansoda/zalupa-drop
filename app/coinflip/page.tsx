"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { useAppStore } from "@/lib/store/useAppStore";
import { CurrencyBadge } from "@/components/ui/CurrencyBadge";
import { Button } from "@/components/ui/Button";
import { sound } from "@/lib/sound";
import {
  CircleDollarSign,
  Shield,
  Bomb,
  User,
  Bot,
  Sparkles,
  Trophy,
} from "lucide-react";

export default function CoinflipPage() {
  const balance = useAppStore((s) => s.balance);
  const deductBalance = useAppStore((s) => s.deductBalance);
  const addBalance = useAppStore((s) => s.addBalance);
  const recordMiniGame = useAppStore((s) => s.recordMiniGame);
  const setRefillModalOpen = useAppStore((s) => s.setRefillModalOpen);

  const [betDC, setBetDC] = useState<number>(500);
  const [selectedSide, setSelectedSide] = useState<"CT" | "T">("CT");
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [coinRotation, setCoinRotation] = useState<number>(0);
  const [winnerSide, setWinnerSide] = useState<"CT" | "T" | null>(null);

  const botName = "Bot_S1mple";

  const handleStartFlip = () => {
    if (isFlipping) return;

    if (balance < betDC) {
      setRefillModalOpen(true);
      return;
    }

    const ok = deductBalance(betDC);
    if (!ok) return;

    setIsFlipping(true);
    setWinnerSide(null);
    sound.playCoinFlip();

    // 50/50 outcome
    const willWin = Math.random() >= 0.5;
    const winningSide: "CT" | "T" = willWin
      ? selectedSide
      : selectedSide === "CT"
      ? "T"
      : "CT";

    // 6 full rotations (2160 deg) + side alignment
    // CT is 0 deg (or multiples of 360), T is 180 deg
    const targetDeg = 2160 + (winningSide === "CT" ? 0 : 180);
    setCoinRotation(targetDeg);

    setTimeout(() => {
      setIsFlipping(false);
      setWinnerSide(winningSide);

      if (willWin) {
        sound.playWinCommon();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#3b82f6", "#f59e0b", "#10b981"],
        });
        const payout = betDC * 2;
        addBalance(payout);
        recordMiniGame(betDC, payout);
      } else {
        sound.playUpgradeFail();
        recordMiniGame(betDC, 0);
      }
    }, 3200);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <CircleDollarSign className="w-4 h-4 text-amber-400" />
          <span>Дуэль 50/50 против бота</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider">
          Монетка <span className="text-amber-400">CS2 Coinflip</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Выберите сторону (Спецназ или Террористы), сделайте ставку и удвойте свои DropCoins!
        </p>
      </div>

      {/* Main Coinflip Arena */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900/80 border border-white/[0.08] p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-8">
        {/* Opponents Matchup Header */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          {/* Player */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Вы (Игрок)</span>
              <span
                className={`text-xs font-bold ${
                  selectedSide === "CT" ? "text-blue-400" : "text-amber-400"
                }`}
              >
                Сторона: {selectedSide === "CT" ? "Контр-террористы (CT)" : "Террористы (T)"}
              </span>
            </div>
          </div>

          <span className="text-lg font-black text-slate-500">VS</span>

          {/* Bot */}
          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-sm font-bold text-white block">{botName}</span>
              <span
                className={`text-xs font-bold ${
                  selectedSide === "CT" ? "text-amber-400" : "text-blue-400"
                }`}
              >
                Сторона: {selectedSide === "CT" ? "Террористы (T)" : "Контр-террористы (CT)"}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Bot className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 3D Animated Coin Wheel */}
        <div className="flex flex-col items-center justify-center py-6">
          <div
            style={{ perspective: "1000px" }}
            className="w-48 h-48 sm:w-56 sm:h-56 relative flex items-center justify-center"
          >
            <div
              style={{
                transform: `rotateY(${coinRotation}deg)`,
                transformStyle: "preserve-3d",
                transition: isFlipping
                  ? "transform 3.2s cubic-bezier(0.15, 0.9, 0.25, 1)"
                  : "none",
              }}
              className="w-full h-full relative rounded-full shadow-[0_0_40px_rgba(0,0,0,0.8)]"
            >
              {/* Front Side: CT (Blue) */}
              <div
                style={{ backfaceVisibility: "hidden" }}
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-900 via-blue-600 to-cyan-500 border-4 border-cyan-300 flex flex-col items-center justify-center shadow-inner"
              >
                <Shield className="w-20 h-20 text-white filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                <span className="text-base font-black text-white tracking-widest mt-1">
                  CT
                </span>
              </div>

              {/* Back Side: T (Orange) */}
              <div
                style={{
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden",
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-900 via-orange-600 to-yellow-500 border-4 border-yellow-300 flex flex-col items-center justify-center shadow-inner"
              >
                <Bomb className="w-20 h-20 text-white filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                <span className="text-base font-black text-white tracking-widest mt-1">
                  T
                </span>
              </div>
            </div>
          </div>

          {/* Winner announcement */}
          {winnerSide && (
            <div className="mt-6 text-center animate-in zoom-in-95">
              <span
                className={`text-xl sm:text-2xl font-black uppercase tracking-wider block ${
                  winnerSide === selectedSide ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {winnerSide === selectedSide
                  ? `🎉 Вы победили! (+${betDC * 2} DC)`
                  : "💀 Бот забрал банк!"}
              </span>
            </div>
          )}
        </div>

        {/* Side Selection and Bet Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/[0.08]">
          {/* Side Selector */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Выберите вашу сторону:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isFlipping}
                onClick={() => setSelectedSide("CT")}
                className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 font-black transition-all ${
                  selectedSide === "CT"
                    ? "bg-blue-600/25 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Shield className="w-5 h-5 text-blue-400" />
                <span>Спецназ (CT)</span>
              </button>

              <button
                disabled={isFlipping}
                onClick={() => setSelectedSide("T")}
                className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 font-black transition-all ${
                  selectedSide === "T"
                    ? "bg-amber-600/25 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Bomb className="w-5 h-5 text-amber-400" />
                <span>Террористы (T)</span>
              </button>
            </div>
          </div>

          {/* Bet size */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Размер ставки:
            </span>
            <div className="flex items-center gap-2">
              {[200, 500, 1000, 2500].map((amt) => (
                <button
                  key={amt}
                  disabled={isFlipping}
                  onClick={() => setBetDC(amt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    betDC === amt
                      ? "bg-violet-600 text-white border-violet-400"
                      : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]"
                  }`}
                >
                  {amt} DC
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">Текущий банк:</span>
              <CurrencyBadge amount={betDC * 2} size="md" />
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2">
          <Button
            variant="gold"
            size="xl"
            disabled={isFlipping}
            onClick={handleStartFlip}
            className="w-full"
            leftIcon={<CircleDollarSign className="w-6 h-6" />}
          >
            {isFlipping
              ? "Монетка крутится..."
              : `Бросить монетку (${betDC} DC)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
