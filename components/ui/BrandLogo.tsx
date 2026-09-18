"use client";

import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  showText = true,
  className = "",
}) => {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem SVG with Liquid Glass Glow */}
      <div
        className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center rounded-xl p-1.5 transition-all duration-300 group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]"
        >
          <defs>
            <linearGradient id="logoG" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="facetG" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
            </linearGradient>
          </defs>

          {/* Hex Shield Shard */}
          <path
            d="M24 3L41 12.8V35.2L24 45L7 35.2V12.8L24 3Z"
            stroke="url(#logoG)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="rgba(18, 22, 34, 0.5)"
          />

          {/* Inner Facet */}
          <path d="M24 9L36 17V31L24 39L12 31V17L24 9Z" fill="url(#facetG)" opacity="0.3" />

          {/* Inner Diamond Drop */}
          <path d="M18 21L24 14L30 21L24 34L18 21Z" fill="url(#logoG)" />

          <circle cx="24" cy="24" r="2.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Modern Esports Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-wider text-white uppercase ${textSizes[size]} transition-colors`}
            >
              ZALUPA
            </span>
            <span
              className={`font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 uppercase ${textSizes[size]}`}
            >
              DROP
            </span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest ml-0.5">
              CS2
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">
            Liquid Glass Simulator
          </span>
        </div>
      )}
    </div>
  );
};