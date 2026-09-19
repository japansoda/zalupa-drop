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

  // Listen to real drops from other tabs / sessions
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      const channel = new BroadcastChannel('zalupa_live_drops');
      channel.onmessage = (event) => {
        if (event.data && event.data.skin) {
          addLiveDrop({ ...event.data, id: `net_${event.data.id}` });
        }
      };
      return () => {
        channel.close();
      };
    } catch (_) {}
  }, [addLiveDrop]);

  // Background feed: strictly expensive items & simulated other active players
  useEffect(() => {
    const expensiveSkins = SKINS_DATABASE.filter(
      (s) => s.priceDc >= 850 || s.rarity === 'gold' || s.rarity === 'covert' || s.rarity === 'extraordinary'
    );

    const interval = setInterval(() => {
      if (expensiveSkins.length === 0) return;
      const randomSkin = expensiveSkins[Math.floor(Math.random() * expensiveSkins.length)];
      const randomCase = SIMULATED_CASES[Math.floor(Math.random() * SIMULATED_CASES.length)];

      const isOtherPlayer = Math.random() < 0.65; // 65% are simulated active player unboxings
      const newDrop: LiveDrop = {
        id: isOtherPlayer
          ? `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          : `sim_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        user: isOtherPlayer ? (locale === 'ru' ? 'Игрок' : 'Player') : '',
        avatar: '',
        skin: randomSkin,
        caseName: randomCase,
        timestamp: Date.now(),
      };

      addLiveDrop(newDrop);
    }, 8500);

    return () => clearInterval(interval);
  }, [addLiveDrop, locale]);

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
            const isUserDrop = drop.id.startsWith('real_') || drop.user === 'Вы';
            const isOtherPlayerDrop =
              drop.id.startsWith('player_') ||
              drop.id.startsWith('net_') ||
              drop.id.startsWith('contract_') ||
              drop.id.startsWith('upgrade_');

            return (
              <div
                key={drop.id}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl glass-card shrink-0 transition-all cursor-pointer group border ${
                  isUserDrop
                    ? 'border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                    : isOtherPlayerDrop
                    ? 'border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
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

                {/* Skin Details */}
                <div className="flex flex-col leading-tight pr-1 min-w-[95px] max-w-[145px]">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className="text-[11px] font-black truncate"
                      style={{ color: config.color }}
                    >
                      {drop.skin.weapon}
                    </span>
                    {isUserDrop ? (
                      <span className="text-[8px] font-black uppercase px-1 rounded bg-yellow-400 text-black shrink-0 tracking-tighter">
                        {locale === 'ru' ? 'ВЫ' : 'YOU'}
                      </span>
                    ) : isOtherPlayerDrop ? (
                      <span className="text-[8px] font-black uppercase px-1 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shrink-0 tracking-tighter flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] font-semibold text-white/80 truncate">
                    {drop.skin.skinName}
                  </span>
                  <div className="flex items-center justify-between gap-1 text-[9px] text-white/40 mt-0.5">
                    <span className="truncate max-w-[80px]">{drop.caseName}</span>
                    <span className="font-mono text-yellow-400/90 font-bold shrink-0">
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
