import React from 'react';
import { SkinRarity } from '../../lib/types';
import { RARITY_CONFIG } from '../../data/skins';

interface RarityBadgeProps {
  rarity: SkinRarity;
  size?: 'sm' | 'md' | 'lg';
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity, size = 'sm' }) => {
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.milspec;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full uppercase tracking-wider backdrop-blur-md border ${sizeClasses}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.color,
        boxShadow: `0 0 10px ${config.color}33`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
};
