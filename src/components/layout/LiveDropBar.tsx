'use client';

import React, { useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../store/useGameStore';
import { SKINS_DATABASE, RARITY_CONFIG } from '../../data/skins';
import { CASES_DATABASE } from '../../data/cases';
import { LiveDrop } from '../../lib/types';
import { useLanguage } from '../../lib/i18n';
import { CASE_NAME_EN_MAP } from '../../lib/caseNamesMap';

const BLEND_WINDOW_MS = 3 * 60 * 1000; // 3 minutes dynamic window

const CASE_EN_MAP: Record<string, string> = {
  'Контракт обмена': 'Trade-Up',
  'Апгрейдер': 'Upgrader',
  'Ферма': 'Farm',
  'Кейс «Галерея»': 'The Gallery Case',
  'Fever Case': 'Fever Case',
  'Sealed Genesis Terminal': 'Sealed Genesis Terminal',
  'Sealed Dead Hand Terminal': 'Sealed Dead Hand Terminal',
  'Коллекция «Overpass 2024»': 'Overpass 2024 Collection',
  'Коллекция «Спорт и отдых»': 'Sport & Field Collection',
  'Коллекция «Графика»': 'The Graphic Collection',
  'Коллекция «Шпионские технологии»': 'The Spy Tech Collection',
  'Коллекция «Арабеска»': 'The Arabesque Collection',
  'Кейс «Термообработка»': 'Heat Treated Case',
  ...CASE_NAME_EN_MAP,
};

const getDropDestination = (drop: LiveDrop): string => {
  if (drop.destination) return drop.destination;
  if (drop.caseId) return `/case/${drop.caseId}`;

  const caseName = (drop.caseName || '').toLowerCase().trim();
  const id = (drop.id || '').toLowerCase();

  if (caseName.includes('апгрейдер') || caseName.includes('upgrader') || id.includes('upgrade')) {
    return '/upgrader';
  }
  if (caseName.includes('контракт') || caseName.includes('trade-up') || caseName.includes('contract') || id.includes('contract')) {
    return '/contract';
  }
  if (caseName.includes('ферма') || caseName.includes('farm') || id.includes('chickendrop') || id.includes('farm')) {
    return '/farm';
  }
  if (caseName.includes('краш') || caseName.includes('crash') || id.includes('crash')) {
    return '/crash';
  }

  // Look up in CASES_DATABASE
  const match = CASES_DATABASE.find(
    (c) =>
      c.id.toLowerCase() === caseName ||
      c.name.toLowerCase() === caseName ||
      (c.nameEn && c.nameEn.toLowerCase() === caseName) ||
      caseName.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(caseName)
  );

  if (match) {
    return `/case/${match.id}`;
  }

  // Fallback: look up by skin
  if (drop.skin?.id || drop.skin?.name) {
    const skinCase = CASES_DATABASE.find((c) =>
      c.skins?.some((s) => s.id === drop.skin.id || s.name === drop.skin.name)
    );
    if (skinCase) {
      return `/case/${skinCase.id}`;
    }
  }

  return '/';
};

const isOwnDrop = (drop: LiveDrop): boolean => {
  return drop.user === 'Вы' || drop.user === 'YOU';
};

const isRealDrop = (drop: LiveDrop): boolean => {
  return (
    drop.id.startsWith('real_') ||
    drop.id.startsWith('contract_') ||
    drop.id.startsWith('upgrade_') ||
    drop.id.startsWith('chickendrop_') ||
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
  const router = useRouter();
  const config = RARITY_CONFIG[drop.skin.rarity] || RARITY_CONFIG.milspec;
  const rawImg = drop.skin?.image || '';
  const isDangerousPath = !rawImg || rawImg.startsWith('file:') || rawImg.includes('file://') || rawImg.includes('C:/') || rawImg.includes('C:\\');
  const safeImg = isDangerousPath ? '/logo.png' : rawImg;
  const dest = getDropDestination(drop);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(dest)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(dest);
        }
      }}
      className={`flex items-center gap-2 px-2 py-1 rounded-lg glass-card shrink-0 transition-all group border cursor-pointer select-none hover:scale-[1.03] active:scale-95 ${
        isUser
          ? 'border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_10px_rgba(250,204,21,0.2)] hover:border-yellow-400'
          : 'border-white/5 hover:border-white/30 hover:bg-white/5'
      }`}
      style={{
        borderLeftWidth: '2.5px',
        borderLeftColor: config.color,
      }}
      title={
        locale === 'ru'
          ? `${drop.skin.name} — ${drop.caseName}${drop.chance != null ? ` (${drop.chance}%)` : ''} (Нажмите, чтобы перейти)`
          : `${drop.skin.name} — ${drop.caseName}${drop.chance != null ? ` (${drop.chance}%)` : ''} (Click to view)`
      }
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
      <div className="flex flex-col leading-tight pr-1 min-w-[90px] max-w-[140px]">
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
        <div className="flex items-center justify-between gap-1.5 text-[8px] text-white/40 mt-0.5">
          <div className="flex items-center gap-1 min-w-0 max-w-[80px]">
            <span className="truncate" title={drop.caseName}>
              {locale === 'en' ? (CASE_EN_MAP[drop.caseName] || drop.caseName) : drop.caseName}
            </span>
            {drop.chance != null && (
              <span className="font-mono text-sky-400 font-bold shrink-0 bg-sky-400/10 px-1 py-0.2 rounded border border-sky-400/20">
                {drop.chance}%
              </span>
            )}
          </div>
          <span className="font-mono text-yellow-400/90 font-bold shrink-0 ml-auto">
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

  // Categorized pools for diverse drop generation (exact cases, upgrader, farm, trade-up contracts)
  const { eliteGuns, eliteGloves, eliteKnives, contractGuns, farmSkins, caseDropPools } = useMemo(() => {
    const guns: typeof SKINS_DATABASE = [];
    const gloves: typeof SKINS_DATABASE = [];
    const knives: typeof SKINS_DATABASE = [];
    const contr: typeof SKINS_DATABASE = [];
    const farm: typeof SKINS_DATABASE = [];

    for (const s of SKINS_DATABASE) {
      if (!s || !s.image || !s.weapon) continue;
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

      if (s.priceDc >= 25000) {
        if (w.includes('knife') || w.includes('bayonet') || w.includes('karambit') || w.includes('daggers')) {
          knives.push(s);
        } else if (w.includes('gloves') || w.includes('wraps')) {
          gloves.push(s);
        } else {
          guns.push(s);
        }
      }

      // Trade-up contract drops: guns of classified, covert, or contraband rarity
      if (
        (s.rarity === 'classified' || s.rarity === 'covert' || s.rarity === 'contraband') &&
        !w.includes('knife') && !w.includes('bayonet') && !w.includes('karambit') && !w.includes('daggers') &&
        !w.includes('gloves') && !w.includes('wraps') &&
        s.priceDc >= 3000
      ) {
        contr.push(s);
      }

      // Farm egg rewards: valuable drops
      if (s.priceDc >= 4000) {
        farm.push(s);
      }
    }

    // Precompute authentic top skins per case so that case drops STRICTLY come from that case's skins
    const validCases = (CASES_DATABASE || []).filter((c) => c && c.id && c.name && c.skins && c.skins.length > 0);
    const pools = validCases.map((c) => {
      // Top-tier skins from this exact case
      let topSkins = c.skins.filter(
        (s) =>
          s &&
          s.image &&
          (s.rarity === 'gold' ||
            s.rarity === 'covert' ||
            s.rarity === 'extraordinary' ||
            s.rarity === 'contraband' ||
            s.rarity === 'classified' ||
            s.priceDc >= 15000)
      );
      if (topSkins.length === 0) {
        topSkins = [...c.skins].sort((a, b) => b.priceDc - a.priceDc).slice(0, 3);
      }
      return {
        caseItem: c,
        topSkins,
      };
    }).filter((entry) => entry.topSkins.length > 0);

    return {
      eliteGuns: guns.length > 0 ? guns : SKINS_DATABASE.slice(0, 20),
      eliteGloves: gloves.length > 0 ? gloves : SKINS_DATABASE.slice(0, 10),
      eliteKnives: knives.length > 0 ? knives : SKINS_DATABASE.slice(0, 10),
      contractGuns: contr.length > 0 ? contr : guns,
      farmSkins: farm.length > 0 ? farm : guns,
      caseDropPools: pools,
    };
  }, []);

  // Real-time synchronization for new drops (ntfy.sh SSE + local BroadcastChannel)
  // No preloading of old historical drops: fresh start on reload
  useEffect(() => {
    // Sync fake drops configuration from server (global for all users forever)
    fetch('/api/live-drops', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.fakeDropsEnabled === 'boolean') {
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

      const roll = Math.random();
      const timestamp = Date.now();
      let newDrop: LiveDrop | null = null;

      if (roll < 0.60 && caseDropPools.length > 0) {
        // 1. CASE DROP: 100% matched to case skins & exact case page link
        const entry = caseDropPools[Math.floor(Math.random() * caseDropPools.length)];
        const randomSkin = entry.topSkins[Math.floor(Math.random() * entry.topSkins.length)];
        newDrop = {
          id: `sim_case_${entry.caseItem.id}_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
          user: '',
          avatar: '',
          skin: randomSkin,
          caseName: entry.caseItem.name,
          caseId: entry.caseItem.id,
          destination: `/case/${entry.caseItem.id}`,
          timestamp,
        };
      } else if (roll < 0.80) {
        // 2. UPGRADER DROP: With realistic chance %, links directly to /upgrader
        const pool = Math.random() < 0.5 ? eliteGuns : (Math.random() < 0.5 ? eliteKnives : eliteGloves);
        const randomSkin = pool[Math.floor(Math.random() * pool.length)];
        const realisticChances = [1.5, 3.2, 5.0, 7.5, 9.8, 12.0, 15.4, 21.0, 26.5, 33.3, 45.0, 52.5];
        const chance = realisticChances[Math.floor(Math.random() * realisticChances.length)];
        newDrop = {
          id: `sim_upgrade_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
          user: '',
          avatar: '',
          skin: randomSkin,
          caseName: 'Апгрейдер',
          chance,
          destination: '/upgrader',
          timestamp,
        };
      } else if (roll < 0.90 && farmSkins.length > 0) {
        // 3. FARM DROP: Links directly to /farm
        const randomSkin = farmSkins[Math.floor(Math.random() * farmSkins.length)];
        newDrop = {
          id: `sim_farm_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
          user: '',
          avatar: '',
          skin: randomSkin,
          caseName: 'Ферма',
          destination: '/farm',
          timestamp,
        };
      } else {
        // 4. TRADE-UP CONTRACT DROP: Links directly to /contract
        const pool = contractGuns.length > 0 ? contractGuns : eliteGuns;
        const randomSkin = pool[Math.floor(Math.random() * pool.length)];
        newDrop = {
          id: `sim_contract_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
          user: '',
          avatar: '',
          skin: randomSkin,
          caseName: 'Контракт обмена',
          destination: '/contract',
          timestamp,
        };
      }

      if (newDrop) {
        state.addLiveDrop(newDrop);
      }

      // Smooth continuous ticker: 4.5s to 7.5s, keeps live drops always active for all users
      const nextDelay = 4500 + Math.random() * 3000;

      timerId = setTimeout(tick, nextDelay);
    };

    // If fewer than 15 drops exist, populate initial authentic drops so the bar stretches edge-to-edge immediately on PC
    const st = useGameStore.getState();
    if (st.liveDrops.length < 15 && caseDropPools.length > 0) {
      const needed = 15 - st.liveDrops.length;
      for (let i = 0; i < needed; i++) {
        const poolEntry = caseDropPools[Math.floor(Math.random() * caseDropPools.length)];
        const skin = poolEntry.topSkins[Math.floor(Math.random() * poolEntry.topSkins.length)];
        const ts = Date.now() - (needed - i) * 12000;
        st.addLiveDrop({
          id: `sim_init_${poolEntry.caseItem.id}_${ts}_${i}`,
          user: '',
          avatar: '',
          skin,
          caseName: poolEntry.caseItem.name,
          caseId: poolEntry.caseItem.id,
          destination: `/case/${poolEntry.caseItem.id}`,
          timestamp: ts,
        });
      }
    }

    // First fake drop appears in 1.5s if empty, or in 4s
    const initialDelay = useGameStore.getState().liveDrops.length === 0 ? 1500 : 4000;
    timerId = setTimeout(tick, initialDelay);

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [eliteGuns, eliteGloves, eliteKnives, contractGuns, farmSkins, caseDropPools]);

  // Strict chronological left-to-right flow:
  // Newest drop always enters on the left, pushing older drops smoothly to the right!
  // Visible slice is 32 to guarantee full edge-to-edge coverage on all PC and ultrawide resolutions
  const visibleDrops = useMemo(() => {
    return liveDrops.slice(0, 32);
  }, [liveDrops]);

  return (
    <div className="w-full bg-[#0a0a0d] border-b border-white/5 py-1 overflow-hidden backdrop-blur-md max-w-full select-none">
      <div className="w-full px-2 sm:px-4 flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 shrink-0 pr-2.5 border-r border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-[10px] font-black text-white/60 tracking-wider uppercase">
            {t('live.drops')}
          </span>
        </div>

        {/* PC Version: strictly non-scrollable (md:overflow-x-hidden, no-wheel-scroll), spans edge-to-edge */}
        {/* Mobile: touch swipeable (overflow-x-auto) */}
        <div
          data-no-wheel="true"
          className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto md:overflow-x-hidden no-scrollbar no-wheel-scroll py-0.5 min-h-[42px]"
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
                    layout="position"
                    initial={{ opacity: 0, x: -22, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    style={{ willChange: 'transform, opacity' }}
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
