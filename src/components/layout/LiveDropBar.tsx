'use client';

import React, { useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { SKINS_DATABASE, RARITY_CONFIG } from '../../data/skins';
import { LiveDrop } from '../../lib/types';
import { useLanguage } from '../../lib/i18n';
import allCasesData from '../../data/all_cases.json';

const BLEND_WINDOW_MS = 3 * 60 * 1000; // 3 minutes dynamic window

const CASE_EN_MAP: Record<string, string> = {
  'Контракт обмена': 'Trade-Up',
  'Апгрейдер': 'Upgrader',
  'Кейс «Революция»': 'Revolution Case',
  'Грёзы и кошмары': 'Dreams & Nightmares',
  'Кейс «Разлом»': 'Fracture Case',
  'Кейс «Легенда Howl»': 'Howl Legend Case',
  'Кейс «Градиентный Раш»': 'Fade Rush Case',
  'Кейс «Галактика Допплер»': 'Doppler Galaxy Case',
  'Кейс «Дикий Лотос»': 'Wild Lotus Case',
  'Кейс «Хранилище Перчаток»': 'Glove Vault Case',
};

(allCasesData as any[]).forEach((c) => {
  if (c.name && c.nameEn) {
    CASE_EN_MAP[c.name] = c.nameEn;
  }
});

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

const isOwnDrop = (drop: LiveDrop): boolean => {
  return drop.user === 'Вы' || drop.user === 'YOU';
};

const isRealDrop = (drop: LiveDrop): boolean => {
  return (
    drop.id.startsWith('real_') ||
    drop.id.startsWith('contract_') ||
    drop.id.startsWith('upgrade_') ||
    drop.id.startsWith('net_') ||
    isOwnDrop(drop)
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
  const rawImg = drop.skin?.image || '';
  const isDangerousPath = !rawImg || rawImg.startsWith('file:') || rawImg.includes('file://') || rawImg.includes('C:/') || rawImg.includes('C:\\');
  const safeImg = isDangerousPath ? '/logo.png' : rawImg;

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded-lg glass-card shrink-0 transition-transform group border ${
        isUser
          ? 'border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_10px_rgba(250,204,21,0.2)]'
          : 'border-white/5 hover:border-white/20'
      }`}
      style={{
        borderLeftWidth: '2.5px',
        borderLeftColor: config.color,
      }}
      title={`${drop.skin.name} — ${drop.caseName}`}
    >
      {/* Skin Icon */}
      <div className="relative w-8 h-8 rounded-md bg-black/60 overflow-hidden flex items-center justify-center p-0.5 border border-white/5 shrink-0">
        <img
          src={safeImg}
          alt={drop.skin.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-150"
        />
      </div>

      {/* Skin Details */}
      <div className="flex flex-col leading-tight pr-1 min-w-[85px] max-w-[130px]">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span
            className="text-[10px] font-black truncate"
            style={{ color: config.color }}
          >
            {drop.skin.weapon}
          </span>
          {/* ONLY show tag for user's own drop */}
          {isUser && (
            <span className="text-[7px] font-black uppercase px-1 py-0.2 rounded bg-yellow-400 text-black shrink-0 tracking-tighter">
              {locale === 'ru' ? 'ВЫ' : 'YOU'}
            </span>
          )}
        </div>
        <span className="text-[9px] font-semibold text-white/80 truncate">
          {drop.skin.skinName}
        </span>
        <div className="flex items-center justify-between gap-1 text-[8px] text-white/40 mt-0.5">
          <span className="truncate max-w-[70px]">
            {locale === 'en' ? (CASE_EN_MAP[drop.caseName] || drop.caseName) : drop.caseName}
            {drop.chance != null && (
              <span className="font-mono text-sky-400/90"> · {drop.chance}%</span>
            )}
          </span>
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

  // Categorized pools for diverse drop generation (50% guns, 25% gloves, 25% knives, strictly >= 25,000 DC)
  const { eliteGuns, eliteGloves, eliteKnives } = useMemo(() => {
    const guns: typeof SKINS_DATABASE = [];
    const gloves: typeof SKINS_DATABASE = [];
    const knives: typeof SKINS_DATABASE = [];

    for (const s of SKINS_DATABASE) {
      if (!s || !s.image || !s.weapon || s.priceDc < 25000) continue;
      const w = s.weapon.toLowerCase();
      if (
        w.includes('sticker') ||
        w.includes('charm') ||
        w.includes('patch') ||
        w.includes('наклейка') ||
        w.includes('брелок') ||
        s.name.includes('Spruce DDPAT')
      ) {
        continue;
      }

      if (w.includes('knife') || w.includes('bayonet') || w.includes('karambit') || w.includes('daggers')) {
        knives.push(s);
      } else if (w.includes('gloves') || w.includes('wraps')) {
        gloves.push(s);
      } else {
        guns.push(s);
      }
    }

    return { eliteGuns: guns, eliteGloves: gloves, eliteKnives: knives };
  }, []);

  // Real-time synchronization for new drops (ntfy.sh SSE + local BroadcastChannel)
  // No preloading of old historical drops: fresh start on reload
  useEffect(() => {
    // Sync fake drops configuration from server, respecting local override
    fetch('/api/live-drops', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const localSaved = typeof window !== 'undefined' ? localStorage.getItem('zalupa_fake_drops_enabled') : null;
        if (localSaved === 'false') {
          // If locally explicitly turned off, ensure store is off and sync server if server restarted with true
          useGameStore.getState().setFakeDropsEnabled(false);
          if (data?.fakeDropsEnabled === true) {
            fetch('/api/live-drops', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'setFakeDrops', enabled: false }),
            }).catch(() => {});
          }
        } else if (typeof data?.fakeDropsEnabled === 'boolean') {
          useGameStore.getState().setFakeDropsEnabled(data.fakeDropsEnabled);
        }
      })
      .catch(() => {});

    let eventSource: EventSource | null = null;
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        eventSource = new EventSource('https://ntfy.sh/zalupa_live_drops_v3/sse');
        eventSource.onmessage = (event) => {
          try {
            const envelope = JSON.parse(event.data);
            if (envelope.event === 'message' && envelope.message) {
              const msg = JSON.parse(envelope.message);

              // Server config broadcast
              if (msg?.type === 'CONFIG' && typeof msg.fakeDropsEnabled === 'boolean') {
                useGameStore.getState().setFakeDropsEnabled(msg.fakeDropsEnabled);
                return;
              }

              const drop = msg;
              if (
                drop &&
                drop.skin &&
                drop.skin.image &&
                drop.skin.name &&
                (drop.skin.priceDc || 0) >= 25000
              ) {
                addLiveDrop({
                  ...drop,
                  id: drop.id.startsWith('net_') ? drop.id : `net_${drop.id}`,
                  user: '', // other player
                });
              }
            }
          } catch (_) {}
        };
      }
    } catch (_) {}

    // Local BroadcastChannel for instant same-browser tab sync
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('zalupa_live_drops_v3');
        channel.onmessage = (event) => {
          const drop = event.data;
          if (
            drop &&
            drop.skin &&
            drop.skin.image &&
            drop.skin.name &&
            drop.skin.priceDc >= 25000
          ) {
            addLiveDrop({ ...drop, id: `net_${drop.id}` });
          }
        };
      } catch (_) {}
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (channel) {
        channel.close();
      }
    };
  }, [addLiveDrop]);

  // Bulletproof self-scheduling fake drop generator:
  // Starts empty on reload. First drop in 1.5s, then every 5-9s (or 7-11s when 1-5 real drops present).
  // Only shuts off if 6 or more real drops occurred in the last 3 minutes OR if disabled globally in Admin!
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const tick = () => {
      if (isCancelled) return;

      const state = useGameStore.getState();

      // Check if admin globally disabled fake drops
      if (!state.fakeDropsEnabled) {
        timerId = setTimeout(tick, 4000);
        return;
      }

      const currentDrops = state.liveDrops;
      const now = Date.now();
      const realCount = currentDrops.filter(
        (d) => isRealDrop(d) && now - (d.timestamp || 0) < BLEND_WINDOW_MS
      ).length;

      // Only shut off fake drops if >= 6 real drops in the last 3 minutes!
      if (realCount >= 6) {
        timerId = setTimeout(tick, 4000);
        return;
      }

      // Pick balanced skin: 50% guns, 25% gloves, 25% knives
      const roll = Math.random();
      let pool = eliteGuns;
      if (roll < 0.50 && eliteGuns.length > 0) {
        pool = eliteGuns;
      } else if (roll < 0.75 && eliteGloves.length > 0) {
        pool = eliteGloves;
      } else if (eliteKnives.length > 0) {
        pool = eliteKnives;
      } else if (eliteGuns.length > 0) {
        pool = eliteGuns;
      }

      if (pool.length > 0) {
        const randomSkin = pool[Math.floor(Math.random() * pool.length)];
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

        state.addLiveDrop(newDrop);
      }

      // Dynamic blend:
      // If 1-5 real drops: 7-11 seconds (smoothly blended with real drops!)
      // If 0 real drops: 5-9 seconds
      const nextDelay = realCount > 0
        ? 7000 + Math.random() * 4000
        : 5000 + Math.random() * 4000;

      timerId = setTimeout(tick, nextDelay);
    };

    // First fake drop appears in 1.5s if empty, or in 4s
    const initialDelay = useGameStore.getState().liveDrops.length === 0 ? 1500 : 4000;
    timerId = setTimeout(tick, initialDelay);

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [eliteGuns, eliteGloves, eliteKnives]);

  // Strict chronological left-to-right flow:
  // Newest drop always enters on the left, pushing older drops smoothly to the right!
  const visibleDrops = useMemo(() => {
    return liveDrops.slice(0, 12);
  }, [liveDrops]);

  return (
    <div className="w-full bg-[#0a0a0d] border-b border-white/5 py-1 overflow-hidden backdrop-blur-md max-w-full select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 shrink-0 pr-2.5 border-r border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-[10px] font-black text-white/60 tracking-wider uppercase">
            {t('live.drops')}
          </span>
        </div>

        {/* PC Version: strictly non-scrollable (md:overflow-x-hidden, no-wheel-scroll) */}
        {/* Mobile: touch swipeable (overflow-x-auto) */}
        <div
          data-no-wheel="true"
          className="flex items-center gap-2 overflow-x-auto md:overflow-x-hidden no-scrollbar no-wheel-scroll py-0.5 max-w-full min-h-[42px]"
        >
          {visibleDrops.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-white/30 font-medium italic animate-pulse py-1 pl-1">
              <span>{locale === 'ru' ? 'Ожидание дропов...' : 'Waiting for drops...'}</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {visibleDrops.map((drop) => {
                const isUser = isOwnDrop(drop);
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
