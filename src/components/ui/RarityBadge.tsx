import React from 'react';
import { SkinRarity } from '../../lib/types';
import { RARITY_CONFIG } from '../../data/skins';
import { useLanguage } from '../../lib/i18n';

interface RarityBadgeProps {
  rarity: SkinRarity;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  short?: boolean;
  className?: string;
}

const SHORT_LABELS_RU: Record<string, string> = {
  consumer: 'Ширп',
  industrial: 'Пром',
  milspec: 'Армейка',
  restricted: 'Запрещ.',
  classified: 'Засекреч.',
  covert: '★ Тайное',
  extraordinary: '★ Экстра',
  gold: '★ Особый',
  contraband: 'Контраб.',
};

const SHORT_LABELS_EN: Record<string, string> = {
  consumer: 'Consumer',
  industrial: 'Industrial',
  milspec: 'Mil-Spec',
  restricted: 'Restricted',
  classified: 'Classified',
  covert: '★ Covert',
  extraordinary: '★ Extra',
  gold: '★ Special',
  contraband: 'Contraband',
};

export const RarityBadge: React.FC<RarityBadgeProps> = ({
  rarity,
  size = 'sm',
  short = false,
  className = '',
}) => {
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.milspec;
  const { t, locale } = useLanguage();

  const sizeClasses = {
    xs: 'text-[8.5px] px-1.5 py-0.5 leading-none',
    sm: 'text-[9px] px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }[size];

  const fullLabel = t('rarity.' + rarity) || config.label;
  const shortMap = locale === 'ru' ? SHORT_LABELS_RU : SHORT_LABELS_EN;
  const label = short ? (shortMap[rarity] || fullLabel) : fullLabel;
  const isGold = rarity === 'gold' || rarity === 'contraband';

  return (
    <span
      className={`inline-flex items-center font-black rounded-full uppercase tracking-wider select-none truncate shrink min-w-0 shadow-sm ${
        isGold ? 'text-black' : 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'
      } ${sizeClasses} ${className}`}
      style={{
        backgroundColor: config.color,
        boxShadow: `0 0 8px ${config.color}40`,
      }}
      title={fullLabel}
    >
      {label}
    </span>
  );
};
