'use client';

import React from 'react';
import { SkinEntity } from '../../lib/types';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { RarityBadge } from '../ui/RarityBadge';
import { WearBadge } from '../ui/WearBadge';
import { StatTrakBadge } from '../ui/StatTrakBadge';
import { RARITY_CONFIG } from '../../data/skins';
import { ExternalLink } from 'lucide-react';
import { SkinImage } from '../ui/SkinImage';
import { getSteamMarketListingUrl, isStatTrakableItem, isWearableItem } from '../../lib/steam';
import { useLanguage } from '../../lib/i18n';

interface CaseSkinGroupCardProps {
  variants: SkinEntity[];
}

export const CaseSkinGroupCard = React.memo<CaseSkinGroupCardProps>(({ variants }) => {
  const { locale } = useLanguage();
  const baseSkin = variants[0];
  const config = RARITY_CONFIG[baseSkin?.rarity] || RARITY_CONFIG.milspec;

  // Clean skin name for drop list display (no pre-baked wear or ST in the listing)
  const cleanWeapon = React.useMemo(() => {
    return (baseSkin?.weapon || '').replace(/^★\s*StatTrak™\s*/i, '★ ').replace(/^StatTrak™\s*/i, '').trim();
  }, [baseSkin?.weapon]);

  const cleanSkinName = React.useMemo(() => {
    return ((baseSkin?.skinName || baseSkin?.name) || '')
      .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '')
      .trim();
  }, [baseSkin?.skinName, baseSkin?.name]);

  const hasStatTrak = React.useMemo(() => variants.some((v) => v.statTrak) || isStatTrakableItem(baseSkin), [variants, baseSkin]);
  const isWearable = isWearableItem(baseSkin);
  const detectedWear = baseSkin?.wear || variants.find((v) => v.wear)?.wear || (isWearable ? 'FN' : '');

  const steamUrl = React.useMemo(() => {
    return getSteamMarketListingUrl({ ...baseSkin, weapon: cleanWeapon, skinName: cleanSkinName });
  }, [baseSkin, cleanWeapon, cleanSkinName]);

  if (!baseSkin) return null;

  return (
    <div
      className="rounded-2xl glass-card p-2 sm:p-3 flex flex-col justify-between border hover:border-yellow-400/40 transition-all group relative overflow-hidden"
      style={{ borderBottomWidth: '3px', borderBottomColor: config.color, contain: 'content' }}
    >
      {/* Top Header: Quality & StatTrak on Left, Rarity on Right */}
      <div className="flex items-center justify-between gap-1.5 z-10 min-h-[22px] overflow-hidden">
        <div className="flex items-center gap-1 shrink-0 min-w-0">
          {hasStatTrak && <StatTrakBadge size="xs" />}
          {isWearable && detectedWear && <WearBadge wear={detectedWear} size="xs" />}
        </div>
        <div className="shrink min-w-0 flex justify-end">
          <RarityBadge rarity={baseSkin.rarity} size="xs" short className="max-w-[85px]" />
        </div>
      </div>

      {/* Central Skin Image with Smooth Zoom */}
      <div className="w-full h-20 sm:h-40 flex items-center justify-center my-1 sm:my-2 relative">
        <SkinImage
          src={baseSkin.image}
          alt={baseSkin.name}
          size={180}
          className="w-full h-[72px] sm:h-36 object-contain group-hover:scale-115 transition-transform duration-300 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
        />
      </div>

      {/* Weapon & Skin Title */}
      <div className="flex flex-col z-10">
        <span className="text-xs font-bold text-white truncate">{cleanWeapon}</span>
        <span className="text-[11px] font-semibold truncate mb-1.5" style={{ color: config.color }}>
          {cleanSkinName}
        </span>

        {/* Bottom Row: Base Price + Steam Link */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/5">
          <div className="flex items-center gap-1">
            <DropCoinIcon size={14} />
            <span className="font-mono text-xs font-bold text-yellow-400">
              {baseSkin.priceDc.toLocaleString('ru-RU')}
            </span>
          </div>

          <a
            href={steamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/30 hover:text-white transition-colors"
            title={locale === 'ru' ? 'Открыть лот в Steam' : 'View listing on Steam'}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
});
CaseSkinGroupCard.displayName = 'CaseSkinGroupCard';
