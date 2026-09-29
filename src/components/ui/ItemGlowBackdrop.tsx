'use client';

import React from 'react';
import { RARITY_CONFIG } from '../../data/skins';
import { SkinRarity } from '../../lib/types';

interface ItemGlowBackdropProps {
  rarity?: SkinRarity | string;
  isLegendary?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  customColor?: string;
}

export const ItemGlowBackdrop: React.FC<ItemGlowBackdropProps> = ({
  rarity = 'milspec',
  isLegendary = false,
  size = 'md',
  className = '',
  customColor,
}) => {
  const rarityCfg = (RARITY_CONFIG as Record<string, { color: string }>)[rarity] || RARITY_CONFIG.milspec;
  const glowColor = customColor || (isLegendary ? '#facc15' : rarityCfg.color || '#3b82f6');

  const sizeStyles = {
    sm: { aura: 'w-32 h-32', sunburst: 'w-44 h-44' },
    md: { aura: 'w-56 h-56', sunburst: 'w-72 h-72' },
    lg: { aura: 'w-72 h-72', sunburst: 'w-96 h-96' },
    xl: { aura: 'w-96 h-96', sunburst: 'w-[450px] h-[450px]' },
  }[size];

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* Soft diffuse ambient glow aura */}
      <div
        className={`absolute rounded-full transition-all duration-500 blur-2xl ${sizeStyles.aura}`}
        style={{
          background: `radial-gradient(circle at center, ${glowColor}55 0%, ${glowColor}25 40%, transparent 75%)`,
        }}
      />

      {/* Sunburst rotating rays with soft radial fadeout (identical to farm drop reveal) */}
      <div
        className={`animate-sunburst shrink-0 pointer-events-none transition-opacity duration-500 ${sizeStyles.sunburst}`}
        style={{
          opacity: isLegendary ? 0.55 : 0.4,
          background: `conic-gradient(from 0deg, transparent 0deg 18deg, ${glowColor} 18deg 36deg, transparent 36deg 54deg, ${glowColor} 54deg 72deg, transparent 72deg 90deg, ${glowColor} 90deg 108deg, transparent 108deg 126deg, ${glowColor} 126deg 144deg, transparent 144deg 162deg, ${glowColor} 162deg 180deg, transparent 180deg 198deg, ${glowColor} 198deg 216deg, transparent 216deg 234deg, ${glowColor} 234deg 252deg, transparent 252deg 270deg, ${glowColor} 270deg 288deg, transparent 288deg 306deg, ${glowColor} 306deg 324deg, transparent 324deg 342deg, ${glowColor} 342deg 360deg)`,
          maskImage:
            'radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.18) 52%, rgba(0,0,0,0) 72%)',
          WebkitMaskImage:
            'radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.18) 52%, rgba(0,0,0,0) 72%)',
        }}
      />
    </div>
  );
};
