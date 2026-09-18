"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useAppStore } from "@/lib/store/useAppStore";
import { CurrencyBadge } from "@/components/ui/CurrencyBadge";
import { Button } from "@/components/ui/Button";
import { sound } from "@/lib/sound";
import {
  Sparkles,
  Zap,
} from "lucide-react";

export default function CrashPage() {
  const balance = useAppStore((s) => s.balance);
  const deductBalance = useAppStore((s) => s.deductBalance);
  const addBalance = useAppStore((s) => s.addBalance);
  const recordMiniGame = useAppStore((s) => s.recordMiniGame);
  const setRefillModalOpen = useAppStore((s) => s.setRefillModalOpen);

  const [betDC, setBetDC] = useState<number>(500);
  const [gameState, setGameState] = useState<"idle" | "running" | "crashed" | "cashed_out">("idle");
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(2.0);
  const [history, setHistory] = useState<number[]>([1.45, 2.12, 1.15, 4.88, 1.92, 12.4, 1.05]);

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleQuickBet = (amt: number) => {
    if (gameState === "running") return;
    setBetDC(amt);
  };

  const generateCrashPoint = (): number => {
    const r = Math.random();
    if (r < 0.06) {
      return 1.0 + Math.random() * 0.1;
    } else if (r < 0.6) {
      return 1.1 + Math.random() * 1.4;
    } else if (r < 0.9) {
      return 2.5 + Math.random() * 4.5;
    } else {
      return 7.0 + Math.random() * 20.0;
    }
  };

  const handleStartGame = () => {
    if (gameState === "running") return;

    if (balance < betDC) {
      setRefillModalOpen(true);
      return;
    }

    const deducted = deductBalance(betDC);
    if (!deducted) return;

    const targetCrash = generateCrashPoint();
    setCrashPoint(targetCrash);
    setMultiplier(1.0);
    setGameState("running");
    startTimeRef.current = performance.now();

    const loop = (time: number) => {
      const elapsed = (time - startTimeRef.current) / 1000;
      const current = Math.pow(Math.E, 0.15 * elapsed);

      if (current >= targetCrash) {
        setMultiplier(targetCrash);
        setGameState("crashed");
        sound.playCrashBoom();
        setHistory((prev) => [targetCrash, ...prev.slice(0, 7)]);
        recordMiniGame(betDC, 0);
        return;
      }

      setMultiplier(current);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const handleCashout = () => {
    if (gameState !== "running") return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const winAmount = Math.round(betDC * multiplier);
    addBalance(winAmount);
    setGameState("cashed_out");
    sound.playCashout();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#34d399", "#ffd700"],
    });

    setHistory((prev) => [multiplier, ...prev.slice(0, 7)]);
    recordMiniGame(betDC, winAmount);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (gameState !== "idle") {
      const progress = Math.min(1, (multiplier - 1) / Math.max(2, crashPoint - 1));
      const endX = 40 + progress * (w - 80);
      const endY = h - 30 - Math.pow(progress, 1.6) * (h - 70);

      ctx.beginPath();
      ctx.moveTo(40, h - 30);
      ctx.quadraticCurveTo(w * 0.4, h - 30, endX, endY);

      if (gameState === "crashed") {
        ctx.strokeStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
      } else if (gameState === "cashed_out") {
        ctx.strokeStyle = "#10b981";
        ctx.shadowColor = "#10b981";
      } else {
        ctx.strokeStyle = "#a855f7";
        ctx.shadowColor = "#a855f7";
      }
      ctx.shadowBlur = 18;
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
  }, [multiplier, gameState, crashPoint]);

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-cyan-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Легендарный режим CS2</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider">
          Режим <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Краш</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto font-medium">
          Сделайте ставку, наблюдайте за ростом коэффициента и успейте забрать выигрыш до краша!
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
          История:
        </span>
        {history.map((m, idx) => (
          <span
            key={idx}
            className={`px-3 py-1 rounded-xl text-xs font-black border backdrop-blur-md ${
              m >= 2.0
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : m >= 1.5
                ? "bg-purple-500/20 border-purple-500/40 text-purple-400"
                : "bg-rose-500/20 border-rose-500/40 text-rose-400"
            }`}
          >
            {m.toFixed(2)}x
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-3xl liquid-glass p-6 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block border-b border-white/[0.1] pb-3">
              Параметры ставки
            </span>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">
                Размер ставки в DropCoins:
              </label>
              <div className="flex items-center justify-center liquid-glass-pill rounded-2xl p-3">
                <CurrencyBadge amount={betDC} size="lg" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[200, 500, 1000, 2500].map((amt) => (
                <button
                  key={amt}
                  disabled={gameState === "running"}
                  onClick={() => handleQuickBet(amt)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    betDC === amt
                      ? "bg-violet-600 text-white border-violet-400 shadow-md"
                      : "liquid-glass-button text-slate-300"
                  }`}
                >
                  {amt} DC
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={gameState === "running"}
                onClick={() => setBetDC(Math.max(50, Math.floor(betDC / 2)))}
                className="flex-1 py-2 rounded-xl text-xs font-bold liquid-glass-button text-slate-300"
              >
                1/2
              </button>
              <button
                disabled={gameState === "running"}
                onClick={() => setBetDC(betDC * 2)}
                className="flex-1 py-2 rounded-xl text-xs font-bold liquid-glass-button text-slate-300"
              >
                2X
              </button>
              <button
                disabled={gameState === "running"}
                onClick={() => setBetDC(balance)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-yellow-500/25 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/35"
              >
                MAX
              </button>
            </div>
          </div>

          {gameState === "running" ? (
            <Button
              variant="success"
              size="xl"
              onClick={handleCashout}
              className="w-full shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse font-black"
            >
              Забрать {Math.round(betDC * multiplier)} DC
            </Button>
          ) : (
            <Button
              variant="gold"
              size="xl"
              onClick={handleStartGame}
              className="w-full shadow-2xl"
              leftIcon={<Zap className="w-5 h-5" />}
            >
              Сделать ставку ({betDC} DC)
            </Button>
          )}
        </div>

        <div className="lg:col-span-2 relative rounded-3xl liquid-glass p-6 shadow-2xl flex flex-col items-center justify-center min-h-[380px] overflow-hidden">
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          <div className="relative z-10 flex flex-col items-center justify-center text-center select-none">
            <span
              className={`text-6xl sm:text-7xl font-black tracking-tighter leading-none transition-colors ${
                gameState === "crashed"
                  ? "text-rose-500"
                  : gameState === "cashed_out"
                  ? "text-emerald-400"
                  : gameState === "running"
                  ? "text-white"
                  : "text-slate-500"
              }`}
            >
              {multiplier.toFixed(2)}x
            </span>

            <div className="mt-3">
              {gameState === "running" && (
                <span className="text-sm font-bold text-cyan-300 uppercase tracking-widest animate-pulse">
                  Ракета взлетает... Заберите DC!
                </span>
              )}
              {gameState === "crashed" && (
                <span className="text-sm font-bold text-rose-400 uppercase tracking-widest">
                  КРАШ! Раунд завершен.
                </span>
              )}
              {gameState === "cashed_out" && (
                <span className="text-sm font-bold text-emerald-300 uppercase tracking-widest">
                  ВЫИГРЫШ: +{Math.round(betDC * multiplier)} DC!
                </span>
              )}
              {gameState === "idle" && (
                <span className="text-sm font-semibold text-slate-400">
                  Укажите ставку и нажмите «Сделать ставку»
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}