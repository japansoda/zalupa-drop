"use client";

import React from "react";

interface CurrencyBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showPlus?: boolean;
}

export const CurrencyBadge: React.FC<CurrencyBadgeProps> = ({
  amount,
  size = "md",
  className = "",
  showPlus = false,
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3.5 py-1.5 gap-2",
    xl: "text-xl px-5 py-2.5 gap-2.5 font-bold",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5 text-[10px]",
    md: "w-4 h-4 text-xs",
    lg: "w-5 h-5 text-sm",
    xl: "w-6 h-6 text-base",
  };

  const formatted = new Intl.NumberFormat("ru-RU").format(Math.round(amount));

  return (
    <div
      className={`inline-flex items-center font-semibold rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-yellow-500/30 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.2)] backdrop-blur-md transition-all duration-300 hover:border-yellow-400/50 ${sizeClasses[size]} ${className}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 text-slate-950 font-black shadow-inner ${iconSizes[size]}`}
      >
        DC
      </div>
      <span>
        {showPlus && amount > 0 ? "+" : ""}
        {formatted} <span className="opacity-75 text-[0.85em]">DC</span>
      </span>
    </div>
  );
};
