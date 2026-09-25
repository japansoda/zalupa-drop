'use client';

import React from 'react';
import { SkinEntity } from '../../lib/types';
import { RarityBadge } from '../ui/RarityBadge';
import { RARITY_CONFIG } from '../../data/skins';
import { ExternalLink } from 'lucide-react';
import { SkinImage } from '../ui/SkinImage';
import { getSteamMarketListingUrl } from '../../lib/steam';
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

  const steamUrl = React.useMemo(() => {
    return getSteamMarketListingUrl({ ...baseSkin, weapon: cleanWeapon, skinName: cleanSkinName });
  }, [baseSkin, cleanWeapon, cleanSkinName]);

  if (!baseSkin) return null;

  return (
    <div
      className="rounded-2xl glass-card p-2.5 sm:p-3 flex flex-col justify-between border hover:border-yellow-400/40 transition-all group relative overflow-hidden"
      style={{ borderBottomWidth: '3px', borderBottomColor: config.color, contain: 'content' }}
    >
      {/* Top Header: Only Rarity Badge + Steam external link */}
      <div className="flex items-center justify-between gap-1.5 z-10 min-h-[22px]">
        <div className="shrink min-w-0">
          <RarityBadge rarity={baseSkin.rarity} size="xs" />
        </div>
        <a
          href={steamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/20 hover:text-white/80 transition-colors p-0.5 ml-auto"
          title={locale === 'ru' ? 'Открыть лот в Steam' : 'View listing on Steam'}
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Central Skin Image with Smooth Zoom */}
      <div className="w-full h-20 sm:h-36 flex items-center justify-center my-1.5 sm:my-2 relative">
        <SkinImage
          src={baseSkin.image}
          alt={baseSkin.name}
          size={180}
          className="w-full h-[72px] sm:h-32 object-contain group-hover:scale-115 transition-transform duration-300 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
        />
      </div>

      {/* Weapon & Skin Title (No price, no wear/quality, no StatTrak) */}
      <div className="flex flex-col z-10 pt-1.5 border-t border-white/5">
        <span className="text-xs font-bold text-white truncate">{cleanWeapon}</span>
        <span className="text-[11px] font-semibold truncate" style={{ color: config.color }}>
          {cleanSkinName}
        </span>
      </div>
    </div>
  );
});
CaseSkinGroupCard.displayName = 'CaseSkinGroupCard';
