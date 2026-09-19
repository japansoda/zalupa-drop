'use client';

import React, { useState } from 'react';
import { SkinEntity } from '../../lib/types';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { RarityBadge } from '../ui/RarityBadge';
import { WearBadge } from '../ui/WearBadge';
import { RARITY_CONFIG } from '../../data/skins';
import { ExternalLink } from 'lucide-react';
import { getSteamMarketListingUrl, isStatTrakableItem, isWearableItem } from '../../lib/steam';

interface CaseSkinGroupCardProps {
  variants: SkinEntity[];
}

const WEAR_ORDER: Record<string, number> = {
  FN: 1,
  MW: 2,
  FT: 3,
  WW: 4,
  BS: 5,
};

export const CaseSkinGroupCard: React.FC<CaseSkinGroupCardProps> = ({ variants }) => {
  // Deduplicate identical wear + statTrak within the same card
  const uniqueVariants = React.useMemo(() => {
    const seen = new Set<string>();
    const list: SkinEntity[] = [];
    for (const v of variants) {
      const key = `${v.wear || ''}_${v.statTrak ? 'st' : 'no'}_${v.priceDc}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(v);
      }
    }
    // Sort: non-statTrak first, then by wear order (FN -> BS), then by price
    return list.sort((a, b) => {
      if (a.statTrak !== b.statTrak) return a.statTrak ? 1 : -1;
      const orderA = WEAR_ORDER[(a.wear || '').toUpperCase()] || 99;
      const orderB = WEAR_ORDER[(b.wear || '').toUpperCase()] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return b.priceDc - a.priceDc;
    });
  }, [variants]);

  const [activeSkin, setActiveSkin] = useState<SkinEntity>(uniqueVariants[0] || variants[0]);
  const config = RARITY_CONFIG[activeSkin.rarity] || RARITY_CONFIG.milspec;

  return (
    <div
      className="rounded-2xl glass-card p-3 flex flex-col justify-between border hover:border-yellow-400/40 transition-all group relative overflow-hidden"
      style={{ borderBottomWidth: '3px', borderBottomColor: config.color }}
    >
      {/* Top Header: Wear / StatTrak + Rarity Badge */}
      <div className="flex items-center justify-between gap-1 z-10">
        <div className="flex items-center gap-1">
          <WearBadge skin={activeSkin} size="xs" />
          {activeSkin.statTrak && isStatTrakableItem(activeSkin) && (
            <span className="px-1 py-0.2 rounded text-[8.5px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 tracking-tight">
              ST™
            </span>
          )}
        </div>
        <RarityBadge rarity={activeSkin.rarity} size="sm" />
      </div>

      {/* Central Skin Image with Smooth Zoom */}
      <div className="w-full h-28 flex items-center justify-center my-2 relative">
        <img
          src={activeSkin.image}
          alt={activeSkin.name}
          referrerPolicy="no-referrer"
          className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md"
        />
      </div>

      {/* Weapon & Skin Title */}
      <div className="flex flex-col z-10">
        <span className="text-xs font-bold text-white truncate">{activeSkin.weapon}</span>
        <span className="text-[11px] font-semibold truncate mb-1.5" style={{ color: config.color }}>
          {activeSkin.skinName}
        </span>

        {/* Float / Wear Chips (If skin has multiple wears/variants in this case) */}
        {uniqueVariants.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 my-1.5">
            {uniqueVariants.map((v) => {
              const isSelected = activeSkin.id === v.id;
              const wearCode = (v.wear || (v.statTrak ? 'ST' : '—')).toUpperCase();
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveSkin(v)}
                  title={`${v.name} (${v.priceDc.toLocaleString('ru-RU')} DC)`}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-yellow-400 text-black border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.5)] scale-105'
                      : v.statTrak
                      ? 'bg-orange-950/40 text-orange-400 border-orange-700/40 hover:bg-orange-900/50'
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {v.statTrak && <span className="text-orange-400 mr-0.5">ST</span>}
                  {wearCode}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Row: Dynamic Price + Steam Link */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/5">
          <div className="flex items-center gap-1">
            <DropCoinIcon size={14} />
            <span className="font-mono text-xs font-bold text-yellow-400">
              {activeSkin.priceDc.toLocaleString('ru-RU')}
            </span>
          </div>

          <a
            href={getSteamMarketListingUrl(activeSkin)}
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
