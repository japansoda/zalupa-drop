import React from 'react';
import { SkinRarity } from '../../lib/types';
import { RARITY_CONFIG } from '../../data/skins';
import { useLanguage } from '../../lib/i18n';

interface RarityBadgeProps {
  rarity: SkinRarity;
  size?: 'sm' | 'md' | 'lg';
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity, size = 'sm' }) => {
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.milspec;
  const { t } = useLanguage();

  const sizeClasses = {
    sm: 'text-[9.5px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }[size];

  const label = t('rarity.' + rarity) || config.label;
  const isGold = rarity === 'gold' || rarity === 'contraband';

  return (
    <span
      className={`inline-flex items-center font-black rounded-full uppercase tracking-wider select-none shrink-0 shadow-sm ${
        isGold ? 'text-black' : 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'
      } ${sizeClasses}`}
      style={{
        backgroundColor: config.color,
        boxShadow: `0 0 10px ${config.color}40`,
      }}
    >
      {label}
    </span>
  );
};
