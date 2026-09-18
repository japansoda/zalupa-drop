import React, { useState, useEffect, useRef } from 'react';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { sound } from '../../lib/sound';
import { useGameStore } from '../../store/useGameStore';
import { useLanguage } from '../../lib/i18n';
import { Rocket, AlertTriangle, Check, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CrashGame: React.FC = () => {
  const { balance, deductBalance, addBalance, recordCrash } = useGameStore();
  const { t } = useLanguage();

  const [betDc, setBetDc] = useState<number>(500);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'crashed' | 'cashed_out'>('idle');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [crashPoint, setCrashPoint] = useState<number>(2.00);
  const [history, setHistory] = useState<number[]>([1.45, 2.80, 1.15, 6.20, 1.05, 3.40, 12.50, 1.85]);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References to keep animation loop in sync
  const stateRef = useRef<'idle' | 'running' | 'crashed' | 'cashed_out'>('idle');
  const multRef = useRef<number>(1.00);
  const crashPointRef = useRef<number>(2.00);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    multRef.current = multiplier;
  }, [multiplier]);

  // Fair crash point generator
  const generateCrashPoint = (): number => {
    if (Math.random() < 0.04) return 1.00;
    const r = Math.random();
    const result = Math.max(1.01, Number((0.96 / (1 - r)).toFixed(2)));
    return Math.min(result, 250);
  };

  const handleStartRound = () => {
    if (gameState === 'running') return;
    if (balance < betDc) {
      useGameStore.getState().setRefillOpen(true);
      return;
    }

    const deducted = deductBalance(betDc);
    if (!deducted) return;

    sound.playClick();
    const point = generateCrashPoint();
    crashPointRef.current = point;
    setCrashPoint(point);
    multRef.current = 1.00;
    setMultiplier(1.00);
    stateRef.current = 'running';
    setGameState('running');
    startTimeRef.current = performance.now();
    particlesRef.current = [];

    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      // Smooth exponential growth: 1 + 0.08 * t^1.85
      const current = Number((1.00 + 0.08 * Math.pow(elapsed * 1.5, 1.85)).toFixed(2));

      if (current >= crashPointRef.current) {
        const finalPoint = crashPointRef.current;
        multRef.current = finalPoint;
        setMultiplier(finalPoint);
        stateRef.current = 'crashed';
        setGameState('crashed');
        sound.playCrash();
        setHistory((prev) => [finalPoint, ...prev.slice(0, 9)]);
        recordCrash(-betDc);

        // Spawn explosion particles
        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 8 + 2;
          particlesRef.current.push({
            x: 0,
            y: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: Math.random() > 0.4 ? '#EF4444' : '#FACC15',
          });
        }
        return;
      }

      multRef.current = current;
      setMultiplier(current);
      requestRef.current = requestAnimationFrame(tick);
    };

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(tick);
  };

  const handleCashout = () => {
    if (gameState !== 'running') return;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    const winAmount = Math.floor(betDc * multRef.current);
    addBalance(winAmount);
    sound.playCashout();
    stateRef.current = 'cashed_out';
    setGameState('cashed_out');
    recordCrash(winAmount - betDc);

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FACC15', '#FFFFFF', '#10B981'],
    });
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Continuous Canvas Render Loop (60 FPS smooth graphics)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const padLeft = 50;
      const padBottom = 40;
      const padTop = 30;
      const padRight = 50;
      const plotW = width - padLeft - padRight;
      const plotH = height - padBottom - padTop;

      const currentMult = multRef.current;
      const st = stateRef.current;

      // Dynamic scales
      const maxM = Math.max(2.0, currentMult * 1.25);
      const elapsed = st === 'running' || st === 'crashed' || st === 'cashed_out'
        ? Math.max(0.1, (performance.now() - startTimeRef.current) / 1000)
        : 1.0;
      const maxT = Math.max(4.0, elapsed * 1.25);

      // Draw horizontal multiplier grid lines
      const gridLevels = [1.5, 2.0, 5.0, 10.0, 25.0, 50.0, 100.0];
      ctx.lineWidth = 1;
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      gridLevels.forEach((lvl) => {
        if (lvl <= maxM) {
          const y = height - padBottom - ((lvl - 1) / (maxM - 1)) * plotH;
          if (y >= padTop && y <= height - padBottom) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(width - padRight, y);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillText(`${lvl}x`, padLeft - 8, y);
          }
        }
      });

      // Bottom baseline axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padLeft, height - padBottom);
      ctx.lineTo(width - padRight, height - padBottom);
      ctx.stroke();

      if (st !== 'idle') {
        // Build trajectory points
        const points: Array<{ x: number; y: number }> = [];
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * elapsed;
          const m = 1.00 + 0.08 * Math.pow(t * 1.5, 1.85);
          const clampedM = Math.min(m, currentMult);

          const px = padLeft + (t / maxT) * plotW;
          const py = height - padBottom - ((clampedM - 1) / (maxM - 1)) * plotH;
          points.push({ x: px, y: py });
        }

        if (points.length > 1) {
          const endPt = points[points.length - 1];

          // Fill under curve
          ctx.beginPath();
          ctx.moveTo(padLeft, height - padBottom);
          for (let pt of points) {
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.lineTo(endPt.x, height - padBottom);
          ctx.closePath();

          const fillGrad = ctx.createLinearGradient(0, endPt.y, 0, height - padBottom);
          if (st === 'crashed') {
            fillGrad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
            fillGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
          } else {
            fillGrad.addColorStop(0, 'rgba(250, 204, 21, 0.25)');
            fillGrad.addColorStop(1, 'rgba(250, 204, 21, 0.0)');
          }
          ctx.fillStyle = fillGrad;
          ctx.fill();

          // Stroke trajectory curve
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.strokeStyle = st === 'crashed' ? '#EF4444' : '#FACC15';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Rocket / Orb head
          if (st === 'running') {
            // Spawn flame trail particle
            if (Math.random() < 0.6) {
              particlesRef.current.push({
                x: endPt.x,
                y: endPt.y,
                vx: -Math.random() * 3 - 1,
                vy: Math.random() * 2 - 1,
                life: 0.8,
                color: Math.random() > 0.3 ? '#FACC15' : '#FFFFFF',
              });
            }

            // Glowing rocket head
            ctx.shadowColor = '#FACC15';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(endPt.x, endPt.y, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FACC15';
            ctx.beginPath();
            ctx.arc(endPt.x, endPt.y, 9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else if (st === 'crashed') {
            ctx.fillStyle = '#EF4444';
            ctx.beginPath();
            ctx.arc(endPt.x, endPt.y, 8, 0, Math.PI * 2);
            ctx.fill();
          } else if (st === 'cashed_out') {
            ctx.fillStyle = '#10B981';
            ctx.beginPath();
            ctx.arc(endPt.x, endPt.y, 8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Render & update particles
          const currentParticles = particlesRef.current;
          for (let i = currentParticles.length - 1; i >= 0; i--) {
            const p = currentParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;

            if (p.life <= 0) {
              currentParticles.splice(i, 1);
            } else {
              ctx.fillStyle = p.color;
              ctx.globalAlpha = p.life;
              ctx.beginPath();
              ctx.arc(
                (st === 'crashed' ? endPt.x : 0) + p.x,
                (st === 'crashed' ? endPt.y : 0) + p.y,
                st === 'crashed' ? 3 : 2,
                0,
                Math.PI * 2
              );
              ctx.fill();
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* History Badges */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        <span className="text-xs font-black text-white/40 uppercase shrink-0">{t('crash.history')}</span>
        {history.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 border ${
              mult >= 10
                ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                : mult >= 2
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-white/5 text-white/50 border-white/10'
            }`}
          >
            {mult.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Main Game Stage */}
      <div className="relative w-full h-80 sm:h-96 rounded-3xl bg-[#0e0f14] border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
        <canvas
          ref={canvasRef}
          width={800}
          height={384}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Multiplier Display */}
        <div className="relative z-10 flex flex-col items-center select-none text-center">
          <span
            className={`font-mono font-black text-6xl sm:text-8xl tracking-tight filter drop-shadow-[0_0_30px_rgba(0,0,0,0.9)] ${
              gameState === 'crashed'
                ? 'text-red-500 animate-shake'
                : gameState === 'cashed_out'
                ? 'text-emerald-400'
                : gameState === 'running'
                ? 'text-yellow-400'
                : 'text-white'
            }`}
          >
            {multiplier.toFixed(2)}x
          </span>

          {gameState === 'crashed' && (
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-extrabold text-sm uppercase mt-2">
              <AlertTriangle className="w-4 h-4" /> {t('crash.crashed')} {multiplier.toFixed(2)}x!
            </div>
          )}

          {gameState === 'cashed_out' && (
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold text-sm uppercase mt-2">
              <Check className="w-4 h-4" /> {t('crash.cashedOut')} {Math.floor(betDc * multiplier).toLocaleString('ru-RU')} DC!
            </div>
          )}
        </div>
      </div>

      {/* Betting Control Box */}
      <div className="rounded-3xl p-6 bg-[#0e0f14] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        {/* Bet Input */}
        <div className="flex flex-col gap-2 w-full sm:w-1/2">
          <label className="text-xs font-bold text-white/60 uppercase tracking-wider">{t('crash.bet')}</label>
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-black/60 border border-white/10">
            <DropCoinIcon size={24} />
            <input
              type="number"
              min="10"
              max={balance}
              value={betDc}
              onChange={(e) => setBetDc(Math.max(10, Number(e.target.value)))}
              disabled={gameState === 'running'}
              className="w-full bg-transparent font-mono font-black text-xl text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-1">
            {[100, 500, 1000, 2500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setBetDc(amt);
                }}
                disabled={gameState === 'running'}
                className="py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white hover:text-yellow-400 transition-colors cursor-pointer"
              >
                +{amt}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setBetDc((prev) => Math.max(10, Math.floor(prev / 2)));
              }}
              disabled={gameState === 'running'}
              className="py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              1/2
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setBetDc((prev) => Math.min(balance || 10, prev * 2));
              }}
              disabled={gameState === 'running'}
              className="py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              2X
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setBetDc(balance || 500);
              }}
              disabled={gameState === 'running'}
              className="py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-yellow-400 transition-colors cursor-pointer"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-1/2 flex flex-col">
          {gameState === 'running' ? (
            <button
              type="button"
              onClick={handleCashout}
              className="w-full py-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xl uppercase tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{t('crash.cashout')} ({Math.floor(betDc * multiplier).toLocaleString('ru-RU')} DC)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRound}
              className="w-full py-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xl uppercase tracking-wider shadow-[0_0_30px_rgba(250,204,21,0.4)] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Rocket className="w-5 h-5 text-black" />
              <span>{t('crash.placeBet')} ({betDc.toLocaleString('ru-RU')} DC)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
