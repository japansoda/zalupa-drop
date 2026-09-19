'use client';

import React, { useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { SKINS_DATABASE, RARITY_CONFIG } from '../../data/skins';
import { LiveDrop } from '../../lib/types';
import { useLanguage } from '../../lib/i18n';

const BLEND_WINDOW_MS = 3 * 60 * 1000; // 3 minutes dynamic window

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
          {/* ONLY show tag for user's own drop (which is strictly >= 100k) */}
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

  // Clock tick to update 3-minute window expiration
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 10000); // Check expiration every 10s
    return () => clearInterval(timer);
  }, []);

  // Filter pool: strictly firearms & knives >= 100,000 DC (NO STICKERS, NO CHARMS, NO DUPLICATE GLOVES)
  const expensiveWeapons = useMemo(() => {
    return SKINS_DATABASE.filter((s) => {
      if (!s || !s.image || !s.weapon) return false;
      const w = s.weapon.toLowerCase();
      if (
        w.includes('sticker') ||
        w.includes('charm') ||
        w.includes('patch') ||
        w.includes('наклейка') ||
        w.includes('брелок') ||
        s.name.includes('Spruce DDPAT')
      ) {
        return false;
      }
      return s.priceDc >= 100000;
    });
  }, []);

  // Sync real drops from other tabs/users: ONLY if >= 100,000 coins and within 3-minute window
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
          Date.now() - (drop.timestamp || 0) < BLEND_WINDOW_MS
        ) {
          addLiveDrop({ ...drop, id: `net_${drop.id}` });
        }
      };
      return () => {
        channel.close();
      };
    } catch (_) {}
  }, [addLiveDrop]);

  // Real drops within the active 3-minute window
  const { recentRealDrops, fakeDrops } = useMemo(() => {
    const real: LiveDrop[] = [];
    const fake: LiveDrop[] = [];
    const now = Date.now();

    for (const d of liveDrops) {
      if (!d.skin || d.skin.priceDc < 100000) continue;

      if (isRealDrop(d)) {
        if (now - d.timestamp < BLEND_WINDOW_MS) {
          real.push(d);
        }
      } else {
        fake.push(d);
      }
    }
    return { recentRealDrops: real, fakeDrops: fake };
  }, [liveDrops, nowTick]);

  // Working fake drop generator:
  // Starts empty at page reload, then drops appear over time.
  // If 6 or more real drops occurred in the last 3 minutes, fake drops are completely disabled.
  useEffect(() => {
    if (recentRealDrops.length >= 6) return;
    if (expensiveWeapons.length === 0) return;

    // First fake drop appears fast (3.5s after load), then every 14-22s
    const delay = liveDrops.length === 0 ? 3500 : 14000 + Math.random() * 8000;

    const timeoutId = setTimeout(() => {
      const randomSkin = expensiveWeapons[Math.floor(Math.random() * expensiveWeapons.length)];
      const randomCase = SIMULATED_CASES[Math.floor(Math.random() * SIMULATED_CASES.length)];
      const timestamp = Date.now();

      const newDrop: LiveDrop = {
        id: `sim_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
        user: '',
        avatar: '',
        skin: randomSkin,
        caseName: randomCase,
        timestamp,
      };

      addLiveDrop(newDrop);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [liveDrops.length, recentRealDrops.length, expensiveWeapons, addLiveDrop]);

  // Dynamic 3-minute blend logic:
  // 1. If >= 6 real drops in last 3 min: ZERO fake drops shown, only real drops!
  // 2. If 0 real drops in last 3 min: show fake drops generated over time.
  // 3. If 1-5 real drops in last 3 min: real drops first, fill remaining slots up to 12 with fake drops.
  const visibleDrops = useMemo(() => {
    if (recentRealDrops.length >= 6) {
      return recentRealDrops.slice(0, 12);
    }
    if (recentRealDrops.length === 0) {
      return fakeDrops.slice(0, 12);
    }
    const remainingSlots = Math.max(0, 12 - recentRealDrops.length);
    return [...recentRealDrops, ...fakeDrops.slice(0, remainingSlots)];
  }, [recentRealDrops, fakeDrops]);

  return (
    <div className="w-full bg-[#0a0a0d] border-b border-white/5 py-2 overflow-hidden backdrop-blur-md max-w-full select-none">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-white/10">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-[11px] font-black text-white/60 tracking-wider uppercase">
            {t('live.drops')}
          </span>
        </div>

        {/* PC Version: strictly non-scrollable (md:overflow-x-hidden, no-wheel-scroll) */}
        {/* Mobile: touch swipeable (overflow-x-auto) */}
        <div
          data-no-wheel="true"
          className="flex items-center gap-2.5 overflow-x-auto md:overflow-x-hidden no-scrollbar no-wheel-scroll py-0.5 max-w-full min-h-[52px]"
        >
          {visibleDrops.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-white/30 font-medium italic animate-pulse py-1 pl-1">
              <span>{locale === 'ru' ? 'Ожидание дропов...' : 'Waiting for drops...'}</span>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};
