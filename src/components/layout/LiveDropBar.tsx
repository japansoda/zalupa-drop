'use client';

import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  'Кейс «Легенда Howl»',
  'Кейс «Градиентный Раш»',
  'Кейс «Галактика Допплер»',
  'Кейс «Дикий Лотос»',
  'Кейс «Хранилище Перчаток»',
];

const isRealDrop = (drop: LiveDrop): boolean => {
  return (
    drop.id.startsWith('real_') ||
    drop.id.startsWith('contract_') ||
    drop.id.startsWith('upgrade_') ||
    drop.id.startsWith('net_') ||
    drop.user === 'Вы'
  );
};

// Memoized single card to eliminate rendering lag on ticker updates
interface CardProps {
  drop: LiveDrop;
  isUser: boolean;
  locale: string;
}

const LiveDropCard = memo(({ drop, isUser, locale }: CardProps) => {
  const config = RARITY_CONFIG[drop.skin.rarity] || RARITY_CONFIG.milspec;

  return (
    <div
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl glass-card shrink-0 transition-transform group border ${
        isUser
          ? 'border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_12px_rgba(250,204,21,0.2)]'
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
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-150"
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
          {/* ONLY show tag for user's own drop, NO OTHER TAGS allowed */}
          {isUser && (
            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-400 text-black shrink-0 tracking-tighter">
              {locale === 'ru' ? 'ВЫ' : 'YOU'}
            </span>
          )}
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
});

LiveDropCard.displayName = 'LiveDropCard';

export const LiveDropBar: React.FC = () => {
  const { liveDrops, addLiveDrop } = useGameStore();
  const { t, locale } = useLanguage();

  // Timestamp of the latest real player drop
  const lastRealDropRef = useRef<number>(Date.now());

  // Filter pool: strictly firearms & knives >= 100,000 DC (NO STICKERS, NO CHARMS, NO DUPLICATE GLOVES)
  const expensiveWeapons = useMemo(() => {
    return SKINS_DATABASE.filter((s) => {
      const w = (s.weapon || '').toLowerCase();
      if (w === 'sticker' || w === 'charm' || w === 'patch' || w.includes('наклейка') || w.includes('брелок')) return false;
      // Filter out low tier/placeholder items
      if (s.name.includes('Spruce DDPAT')) return false;
      return s.priceDc >= 100000 || s.rarity === 'gold' || s.rarity === 'covert';
    });
  }, []);

  // Sync real drops from other tabs/users: ONLY if >= 100,000 coins and within current time (<60s ago)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      const channel = new BroadcastChannel('zalupa_live_drops');
      channel.onmessage = (event) => {
        const drop = event.data;
        if (
          drop &&
          drop.skin &&
          drop.skin.priceDc >= 100000 &&
          Math.abs(Date.now() - (drop.timestamp || 0)) < 60000
        ) {
          lastRealDropRef.current = Date.now();
          addLiveDrop({ ...drop, id: `net_${drop.id}` });
        }
      };
      return () => {
        channel.close();
      };
    } catch (_) {}
  }, [addLiveDrop]);

  // Track real drops vs fake drops
  const { realDrops, fakeDrops } = useMemo(() => {
    const real: LiveDrop[] = [];
    const fake: LiveDrop[] = [];
    for (const d of liveDrops) {
      if (isRealDrop(d)) {
        real.push(d);
      } else {
        fake.push(d);
      }
    }
    return { realDrops: real, fakeDrops: fake };
  }, [liveDrops]);

  // Track user's own real drops to reset inactivity timer
  useEffect(() => {
    if (realDrops.length > 0) {
      lastRealDropRef.current = Date.now();
    }
  }, [realDrops.length]);

  // Dynamic slow mode:
  // If there are many real drops (>= 6), fake drops are 100% disabled.
  // Slow simulated drops ONLY fire if real drops count < 6 AND no real drop happened for > 60s.
  useEffect(() => {
    if (realDrops.length >= 6) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceReal = now - lastRealDropRef.current;

      // If less than 1 minute since last real drop, do nothing
      if (timeSinceReal < 60000) return;

      if (expensiveWeapons.length === 0) return;
      const randomSkin = expensiveWeapons[Math.floor(Math.random() * expensiveWeapons.length)];
      const randomCase = SIMULATED_CASES[Math.floor(Math.random() * SIMULATED_CASES.length)];

      const newDrop: LiveDrop = {
        id: `slow_sim_${now}_${Math.random().toString(36).substr(2, 5)}`,
        user: '', // No tag
        avatar: '',
        skin: randomSkin,
        caseName: randomCase,
        timestamp: now,
      };

      addLiveDrop(newDrop);
    }, 55000); // Slow mode: 55 seconds interval

    return () => clearInterval(interval);
  }, [addLiveDrop, expensiveWeapons, realDrops.length]);

  // Dynamic blend logic:
  // 1. If realDrops >= 6: ZERO fake drops shown, only real drops!
  // 2. If realDrops === 0: show initial fake drops.
  // 3. If 0 < realDrops < 6: blend real drops (at front) and fill remaining slots up to 12 with fake drops.
  const visibleDrops = useMemo(() => {
    if (realDrops.length >= 6) {
      return realDrops.slice(0, 12);
    }
    if (realDrops.length === 0) {
      return fakeDrops.slice(0, 12);
    }
    // Blend real drops with fake drops
    const remainingSlots = Math.max(0, 12 - realDrops.length);
    return [...realDrops, ...fakeDrops.slice(0, remainingSlots)];
  }, [realDrops, fakeDrops]);

  return (
    <div className="w-full bg-[#0a0a0d] border-b border-white/5 py-2 overflow-hidden backdrop-blur-md max-w-full">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-white/10">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-[11px] font-black text-white/60 tracking-wider uppercase">
            {t('live.drops')}
          </span>
        </div>

        <div
          onWheel={handleHorizontalWheel}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 will-change-scroll max-w-full"
        >
          <AnimatePresence initial={false}>
            {visibleDrops.map((drop) => {
              const isUser = isRealDrop(drop);
              return (
                <motion.div
                  key={drop.id}
                  layout
                  initial={{ opacity: 0, x: -28, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="shrink-0"
                >
                  <LiveDropCard
                    drop={drop}
                    isUser={isUser}
                    locale={locale}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
