"use client";

import React, { useEffect, useRef, useState } from "react";
import { sound } from "@/lib/sound";

interface CircularGaugeProps {
  chancePercent: number;
  isRolling: boolean;
  onFinish: (isWin: boolean) => void;
  resultAngle: number | null; // target stop angle [0, 360)
}

const RADIUS = 110;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  chancePercent,
  isRolling,
  onFinish,
  resultAngle,
}) => {
  const [currentRotation, setCurrentRotation] = useState(0);
  const [transitionStyle, setTransitionStyle] = useState("none");
  const tickTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Calculate arc stroke offset for win zone (starting from 12 o'clock / -90 deg)
  const clampedChance = Math.min(85, Math.max(1, chancePercent));
  const winStrokeLength = (clampedChance / 100) * CIRCUMFERENCE;
  const strokeDasharray = `${winStrokeLength} ${CIRCUMFERENCE}`;

  useEffect(() => {
    if (!isRolling || resultAngle === null) return;

    // Clear previous audio ticks
    tickTimersRef.current.forEach((t) => clearTimeout(t));
    tickTimersRef.current = [];

    // Reset needle rotation
    setTransitionStyle("none");
    const baseCurrent = currentRotation % 360;
    setCurrentRotation(baseCurrent);

    const spinTimer = setTimeout(() => {
      // 5 full rotations + landing target angle
      const totalTurns = 5;
      const targetRotation = baseCurrent + totalTurns * 360 + resultAngle;
      const durationSec = 4.5;

      setTransitionStyle(`transform ${durationSec}s cubic-bezier(0.12, 0.8, 0.33, 1)`);
      setCurrentRotation(targetRotation);

      // Schedule ticking sounds
      const tickCount = 35;
      for (let i = 0; i < tickCount; i++) {
        const progress = i / tickCount;
        const delay = Math.pow(progress, 2.2) * (durationSec * 1000 - 300);
        const t = setTimeout(() => {
          sound.playTick(1.2 - progress * 0.4);
        }, delay);
        tickTimersRef.current.push(t);
      }

      // Finish event
      const finishTimer = setTimeout(() => {
        const isWin = resultAngle <= (clampedChance / 100) * 360;
        onFinish(isWin);
      }, durationSec * 1000 + 200);
      tickTimersRef.current.push(finishTimer);
    }, 50);

    return () => {
      clearTimeout(spinTimer);
      tickTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, [isRolling, resultAngle]);

  return (
    <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center select-none">
      {/* Background Outer Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 via-emerald-500/10 to-yellow-500/10 rounded-full blur-2xl" />

      {/* SVG Circle Track and Win Segment */}
      <svg className="w-full h-full -rotate-90 filter drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
        {/* Full Track (Loss Zone) */}
        <circle
          cx="50%"
          cy="50%"
          r={RADIUS}
          fill="transparent"
          stroke="rgba(239, 68, 68, 0.25)"
          strokeWidth={STROKE}
        />

        {/* Win Segment (Green / Gold Glow) */}
        <circle
          cx="50%"
          cy="50%"
          r={RADIUS}
          fill="transparent"
          stroke="url(#winGradient)"
          strokeWidth={STROKE}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={0}
          strokeLinecap="round"
          className="transition-all duration-300"
        />

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="winGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>

      {/* Rotating Pointer Arrow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform"
        style={{
          transform: `rotate(${currentRotation}deg)`,
          transition: transitionStyle,
        }}
      >
        {/* Arrow pointer sitting at the top of the circle */}
        <div className="relative -top-[122px] sm:-top-[138px] flex flex-col items-center">
          <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[16px] border-t-yellow-400 filter drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
          <div className="w-1.5 h-6 bg-gradient-to-b from-yellow-400 to-transparent rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
        </div>
      </div>

      {/* Center Gauge Stats Hub */}
      <div className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center p-3 text-center">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
          Шанс успеха
        </span>
        <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400 leading-none my-1">
          {clampedChance.toFixed(2)}%
        </span>
        <span className="text-[10px] text-slate-400 font-semibold">
          RTP 95%
        </span>
      </div>
    </div>
  );
};
