"use client";

import React from "react";
import { RarityTier, RARITY_MAP, WearCondition, WEAR_NAMES } from "@/lib/types";

interface RarityBadgeProps {
  rarity: RarityTier;
  wear?: WearCondition;
  className?: string;
  size?: "sm" | "md";
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({
  rarity,
  wear,
  className = "",
  size = "sm",
}) => {
  const config = RARITY_MAP[rarity] || RARITY_MAP.consumer;
  const sizeClasses = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <div className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.borderClass} ${config.bgClass} ${config.textClass} ${sizeClasses} ${className}`}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color, boxShadow: `0 0 6px ${config.color}` }}
      />
      <span>{config.nameRu}</span>
      {wear && (
        <span className="opacity-60 text-[0.85em] border-l border-white/20 pl-1">
          {wear}
        </span>
      )}
    </div>
  );
};
