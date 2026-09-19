'use client';

import React from 'react';
import { useLanguage } from '../../lib/i18n';

interface CaseSpecialItemCardProps {
  caseId: string;
}

export const CaseSpecialItemCard: React.FC<CaseSpecialItemCardProps> = () => {
  const { locale } = useLanguage();

  return (
    <div
      className="rounded-2xl glass-card p-3 flex flex-col justify-between border border-yellow-500/40 hover:border-yellow-400/60 transition-all group relative overflow-hidden bg-gradient-to-b from-yellow-950/20 via-[#12131a] to-[#0a0a0f] shadow-[0_0_20px_rgba(250,204,21,0.12)]"
      style={{ borderBottomWidth: '3px', borderBottomColor: '#facc15' }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-1 z-10">
        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 uppercase tracking-wider">
          ★ SPECIAL
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-yellow-400 bg-yellow-400/15 border border-yellow-400/40">
          ★ РЕДКИЙ ОСОБЫЙ
        </span>
      </div>

      {/* Central Special Item Image */}
      <div className="w-full h-28 flex items-center justify-center my-2 relative">
        <div className="absolute inset-0 bg-radial from-yellow-500/15 to-transparent blur-xl pointer-events-none" />
        <img
          src="/images/special_item.png"
          alt="★ Редкий особый предмет"
          className="w-32 h-20 sm:w-34 sm:h-22 object-contain group-hover:scale-108 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.45)] z-10"
        />
      </div>

      {/* Weapon & Skin Title */}
      <div className="flex flex-col z-10">
        <span className="text-xs font-bold text-white truncate">★ CS2</span>
        <span className="text-[11px] font-semibold text-yellow-400 truncate mb-1">
          {locale === 'ru' ? 'Редкий особый предмет' : 'Rare Special Item'}
        </span>

        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[10px] font-mono text-yellow-300/90 font-black">
            {locale === 'ru' ? '★ СЕКРЕТНЫЙ ДРОП' : '★ SECRET DROP'}
          </span>
          <span className="text-[9px] text-white/40 font-mono uppercase">
            {locale === 'ru' ? 'НОЖ / ПЕРЧАТКИ' : 'KNIFE / GLOVES'}
          </span>
        </div>
      </div>
    </div>
  );
};
