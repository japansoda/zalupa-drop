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
      xs: 'text-[8.5px] px-1.5 py-0.2',
      sm: 'text-[9.5px] px-2 py-0.5',
      md: 'text-xs px-2.5 py-1',
    }[size];

    return (
      <span
        className={`inline-flex items-center font-mono font-black rounded tracking-wider border shadow-sm select-none shrink-0 ${sizeClasses}`}
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

  if (showFullLabel) {
    return (
      <span
        className="inline-flex items-center font-mono font-medium text-[10.5px] px-2 py-0.5 rounded-md bg-zinc-900/90 border border-white/10 text-zinc-300 shadow-sm tracking-tight select-none shrink-0"
        title={label}
      >
        {label}
      </span>
    );
  }

  const sizeClasses = {
    xs: 'text-[8.5px] px-1.5 py-0.2',
    sm: 'text-[9.5px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono font-bold rounded bg-zinc-950/80 border border-white/10 text-zinc-300 select-none shrink-0 ${sizeClasses}`}
      title={label}
    >
      {wearConfig.short}
    </span>
  );
};
