import React from 'react';
import { WEAR_CONFIG, STICKER_EFFECT_CONFIG } from '../../data/skins';
import { SkinEntity } from '../../lib/types';
import { useLanguage } from '../../lib/i18n';
import { isWearableItem } from '../../lib/steam';

interface WearBadgeProps {
  skin?: Partial<SkinEntity>;
  wear?: string;
  effect?: 'Holo' | 'Foil' | 'Gold' | 'Glitter' | 'Lenticular';
  size?: 'xs' | 'sm' | 'md';
  showFullLabel?: boolean;
}

export const WearBadge: React.FC<WearBadgeProps> = ({
  skin,
  wear: wearProp,
  effect: effectProp,
  size = 'xs',
  showFullLabel = false,
}) => {
  const wearCode = (wearProp || skin?.wear || '').toUpperCase();
  const effect = effectProp || skin?.effect;

  // If item is a sticker or has an effect, show the effect badge!
  if (effect && STICKER_EFFECT_CONFIG[effect]) {
    const eff = STICKER_EFFECT_CONFIG[effect];
    const sizeClasses = {
      xs: 'text-[9px] px-2 py-0.5',
      sm: 'text-[10px] px-2.5 py-0.5',
      md: 'text-xs px-3 py-1',
    }[size];

    return (
      <span
        className={`inline-flex items-center font-mono font-black rounded-full uppercase tracking-wider text-white shadow-sm select-none shrink-0 ${sizeClasses}`}
        style={{
          backgroundColor: eff.color,
          boxShadow: `0 0 8px ${eff.color}40`,
        }}
      >
        {eff.label}
      </span>
    );
  }

  // Non-wearable items (Charms, Agents, Stickers) NEVER have wear qualities
  if (skin && !isWearableItem(skin)) {
    return null;
  }

  const { t } = useLanguage();

  // If item is a weapon/knife/glove with wear
  const wearConfig = WEAR_CONFIG[wearCode];
  if (!wearConfig) {
    return null;
  }

  const label = t('wear.' + wearCode) || wearConfig.label;

  if (showFullLabel) {
    return (
      <span
        className="inline-flex items-center font-mono font-black text-[10px] px-2.5 py-0.5 rounded-full text-white uppercase tracking-wider shadow-sm select-none shrink-0"
        style={{
          backgroundColor: wearConfig.color,
          boxShadow: `0 0 10px ${wearConfig.color}40`,
        }}
        title={label}
      >
        {label}
      </span>
    );
  }

  const sizeClasses = {
    xs: 'text-[9px] px-2 py-0.5',
    sm: 'text-[10px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono font-black rounded-full text-white uppercase tracking-wider select-none shrink-0 shadow-sm ${sizeClasses}`}
      style={{
        backgroundColor: wearConfig.color,
        boxShadow: `0 0 8px ${wearConfig.color}40`,
      }}
      title={label}
    >
      {wearConfig.short}
    </span>
  );
};
