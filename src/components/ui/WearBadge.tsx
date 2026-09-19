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
      xs: 'text-[9px] px-1.5 py-0.5',
      sm: 'text-[10px] px-2 py-0.5',
      md: 'text-xs px-2.5 py-1',
    }[size];

    return (
      <span
        className={`inline-flex items-center font-black rounded-md tracking-wider border shadow-sm ${sizeClasses}`}
        style={{
          color: eff.color,
          backgroundColor: eff.bg,
          borderColor: eff.border,
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

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold font-mono rounded-md tracking-wider border ${sizeClasses}`}
      style={{
        color: wearConfig.color,
        backgroundColor: wearConfig.bg,
        borderColor: wearConfig.border,
      }}
      title={label}
    >
      {showFullLabel ? label : wearConfig.short}
    </span>
  );
};
