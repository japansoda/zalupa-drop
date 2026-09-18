"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "purple" | "gold" | "cyan" | "red";
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = "none",
  glass = true,
  className = "",
  ...props
}) => {
  const glowClasses = {
    none: "",
    purple: "shadow-[0_0_30px_-5px_rgba(139,92,246,0.25)] border-purple-500/20",
    gold: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.25)] border-amber-500/20",
    cyan: "shadow-[0_0_30px_-5px_rgba(6,182,212,0.25)] border-cyan-500/20",
    red: "shadow-[0_0_30px_-5px_rgba(239,68,68,0.25)] border-red-500/20",
  };

  const glassClasses = glass
    ? "bg-slate-900/60 backdrop-blur-xl border border-white/[0.08]"
    : "bg-slate-900 border border-slate-800";

  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${glassClasses} ${glowClasses[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
