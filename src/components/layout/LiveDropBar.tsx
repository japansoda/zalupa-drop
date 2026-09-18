'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { SKINS_DATABASE, RARITY_CONFIG } from '../../data/skins';
import { LiveDrop } from '../../lib/types';
import { useLanguage } from '../../lib/i18n';

const BOT_AVATARS = [
  'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
  'https://avatars.steamstatic.com/7918a36c56db36d338f654b9d034ee8b1efad932_full.jpg',
  'https://avatars.steamstatic.com/c5c36395b2a0957279148d42d38515091763e003_full.jpg',
  'https://avatars.steamstatic.com/6c0be1b6c6984e8ecbf27163f9cfb4fc01977759_full.jpg',
  'https://avatars.steamstatic.com/ed9e2d755490bcab11c34a2c53a6db69f0b144bc_full.jpg',
];

const BOT_NAMES = ['S1mple', 'm0NESY', 'ZywOo', 'donk', 'b1t', 'NiKo', 'shroud'];
const BOT_CASES = ['Кейс «Революция»', 'Грёзы и кошмары', 'Мусорка Залупы', 'Кейс «Киловатт»', 'Олдскул Легенды'];

export const LiveDropBar: React.FC = () => {
  const { liveDrops, addLiveDrop } = useGameStore();
  const { t, locale } = useLanguage();

  useEffect(() => {
    const interval = setInterval(() => {
      const rand = Math.random();
      let skinPool = SKINS_DATABASE;
      if (rand > 0.95) {
        skinPool = SKINS_DATABASE.filter(s => s.rarity === 'gold' || s.rarity === 'covert');
      } else if (rand > 0.7) {
        skinPool = SKINS_DATABASE.filter(s => s.rarity === 'classified' || s.rarity === 'restricted');
      }

      const randomSkin = skinPool[Math.floor(Math.random() * skinPool.length)];
      const randomUser = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const randomAvatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)];
      const randomCase = BOT_CASES[Math.floor(Math.random() * BOT_CASES.length)];

      const newDrop: LiveDrop = {
        id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        user: randomUser,
        avatar: randomAvatar,
        skin: randomSkin,
        caseName: randomCase,
        timestamp: Date.now(),
      };

      addLiveDrop(newDrop);
    }, 8500);

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

        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          {liveDrops.map((drop) => {
            const config = RARITY_CONFIG[drop.skin.rarity] || RARITY_CONFIG.milspec;
            return (
              <div
                key={drop.id}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl glass-card shrink-0 hover:border-yellow-400/50 transition-all cursor-pointer group"
                style={{
                  borderLeftWidth: '3px',
                  borderLeftColor: config.color,
                }}
                title={`${drop.user} ${locale === 'ru' ? 'выбил' : 'won'} ${drop.skin.name} ${locale === 'ru' ? 'в' : 'in'} ${drop.caseName}`}
              >
                <div className="relative w-10 h-10 rounded-lg bg-black/60 overflow-hidden flex items-center justify-center p-0.5 border border-white/5">
                  <img
                    src={drop.skin.image}
                    alt={drop.skin.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="flex flex-col leading-none pr-1">
                  <div className="flex items-center gap-1">
                    <img src={drop.avatar} alt="user" referrerPolicy="no-referrer" className="w-3 h-3 rounded-full" />
                    <span className="text-[10px] font-semibold text-white/50 truncate max-w-[70px]">
                      {drop.user}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold truncate max-w-[120px] mt-1"
                    style={{ color: config.color }}
                  >
                    {drop.skin.weapon}
                  </span>
                  <span className="text-[10px] text-white/50 truncate max-w-[120px]">
                    {drop.skin.skinName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
