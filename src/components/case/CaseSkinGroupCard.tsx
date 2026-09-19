'use client';

import React from 'react';
import { SkinEntity } from '../../lib/types';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { RarityBadge } from '../ui/RarityBadge';
import { RARITY_CONFIG } from '../../data/skins';
import { ExternalLink } from 'lucide-react';
import { getSteamMarketListingUrl } from '../../lib/steam';

interface CaseSkinGroupCardProps {
  variants: SkinEntity[];
}

export const CaseSkinGroupCard: React.FC<CaseSkinGroupCardProps> = ({ variants }) => {
  const baseSkin = variants[0];
  const config = RARITY_CONFIG[baseSkin.rarity] || RARITY_CONFIG.milspec;

  // Clean skin name for drop list display (no pre-baked wear or ST in the listing)
  const cleanWeapon = baseSkin.weapon.replace(/^★\s*StatTrak™\s*/i, '★ ').replace(/^StatTrak™\s*/i, '').trim();
  const cleanSkinName = (baseSkin.skinName || baseSkin.name)
    .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '')
    .trim();

  return (
    <div
      className="rounded-2xl glass-card p-3 flex flex-col justify-between border hover:border-yellow-400/40 transition-all group relative overflow-hidden"
      style={{ borderBottomWidth: '3px', borderBottomColor: config.color }}
    >
      {/* Top Header: Rarity Badge Only (No wear or ST shown in drop list) */}
      <div className="flex items-center justify-end gap-1 z-10">
        <RarityBadge rarity={baseSkin.rarity} size="sm" />
      </div>

      {/* Central Skin Image with Smooth Zoom */}
      <div className="w-full h-28 flex items-center justify-center my-2 relative">
        <img
          src={baseSkin.image}
          alt={baseSkin.name}
          referrerPolicy="no-referrer"
          className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md"
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
            href={getSteamMarketListingUrl({ ...baseSkin, weapon: cleanWeapon, skinName: cleanSkinName })}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/30 hover:text-white transition-colors"
            title="Открыть лот в Steam"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
