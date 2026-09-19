'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { SKINS_DATABASE, RARITY_CONFIG } from '../../data/skins';
import { LiveDrop } from '../../lib/types';
import { useLanguage } from '../../lib/i18n';
import { handleHorizontalWheel } from './HorizontalScrollManager';
import { DropCoinIcon } from '../ui/DropCoinIcon';

const SIMULATED_CASES = [
  'Кейс «Революция»',
  'Грёзы и кошмары',
  'Kilowatt Case',
  'CS:GO Weapon Case',
  'Кейс «Разлом»',
  'Кейс «Призма»',
  'Кейс «Змеиный укус»',
  'Кейс «Решающий момент»',
  'Кейс «Звездный дракон»',
  'Кейс «Киберпанк»',
];

export const LiveDropBar: React.FC = () => {
  const { liveDrops, addLiveDrop } = useGameStore();
  const { t, locale } = useLanguage();

  useEffect(() => {
    // Generate background simulated drops to keep ticker lively alongside real player drops
    const interval = setInterval(() => {
      const rand = Math.random();
      let skinPool = SKINS_DATABASE;
      if (rand > 0.95) {
        skinPool = SKINS_DATABASE.filter(s => s.rarity === 'gold' || s.rarity === 'covert');
      } else if (rand > 0.7) {
        skinPool = SKINS_DATABASE.filter(s => s.rarity === 'classified' || s.rarity === 'restricted');
      }

      const randomSkin = skinPool[Math.floor(Math.random() * skinPool.length)];
      const randomCase = SIMULATED_CASES[Math.floor(Math.random() * SIMULATED_CASES.length)];

      const newDrop: LiveDrop = {
        id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        user: '',
        avatar: '',
        skin: randomSkin,
        caseName: randomCase,
        timestamp: Date.now(),
      };

      addLiveDrop(newDrop);
    }, 9000);

    return () => clearInterval(interval);
  }, [addLiveDrop]);

  return (
    <div className="w-full bg-[#0a0a0d] border-b border-white/5 py-2 overflow-hidden backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-white/10">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-[11px] font-black text-white/60 tracking-wider uppercase">
            {t('live.drops')}
          </span>
        </div>

        <div
          onWheel={handleHorizontalWheel}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
        >
          {liveDrops.map((drop) => {
            const config = RARITY_CONFIG[drop.skin.rarity] || RARITY_CONFIG.milspec;
            const isRealDrop = drop.id.startsWith('real_') || drop.id.startsWith('contract_') || drop.id.startsWith('upgrade_');

            return (
              <div
                key={drop.id}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl glass-card shrink-0 transition-all cursor-pointer group border ${
                  isRealDrop
                    ? 'border-yellow-400/40 bg-yellow-400/5 shadow-[0_0_12px_rgba(250,204,21,0.15)]'
                    : 'border-white/5 hover:border-white/20'
                }`}
                style={{
                  borderLeftWidth: '3px',
                  borderLeftColor: config.color,
                }}
                title={`${drop.skin.name} — ${drop.caseName}`}
              >
                {/* Skin Icon */}
                <div className="relative w-10 h-10 rounded-lg bg-black/60 overflow-hidden flex items-center justify-center p-0.5 border border-white/5 shrink-0">
                  <img
                    src={drop.skin.image}
                    alt={drop.skin.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-200"
                  />
                </div>

                {/* Skin Details (No Avatar, No Nickname) */}
                <div className="flex flex-col leading-tight pr-1 min-w-[90px] max-w-[140px]">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className="text-[11px] font-black truncate"
                      style={{ color: config.color }}
                    >
                      {drop.skin.weapon}
                    </span>
                    {isRealDrop && (
                      <span className="text-[8px] font-black uppercase px-1 rounded bg-yellow-400 text-black shrink-0 tracking-tighter">
                        LIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-white/80 truncate">
                    {drop.skin.skinName}
                  </span>
                  <div className="flex items-center justify-between gap-1 text-[9px] text-white/40 mt-0.5">
                    <span className="truncate max-w-[80px]">{drop.caseName}</span>
                    <span className="font-mono text-yellow-400/80 font-bold shrink-0">
                      {drop.skin.priceDc.toLocaleString('ru-RU')} DC
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
