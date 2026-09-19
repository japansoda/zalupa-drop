'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { LiveDropBar } from '../components/layout/LiveDropBar';
import { RefillModal } from '../components/layout/RefillModal';
import { DropCoinIcon } from '../components/ui/DropCoinIcon';
import { LogoSvg } from '../components/ui/LogoSvg';
import { SkinImage } from '../components/ui/SkinImage';
import { CASES_DATABASE } from '../data/cases';
import { sound } from '../lib/sound';
import { useLanguage } from '../lib/i18n';
import { useGameStore } from '../store/useGameStore';
import { ChevronRight, Search, ArrowUpDown, X, Flame } from 'lucide-react';
import { handleHorizontalWheel } from '../components/layout/HorizontalScrollManager';

const CATEGORIES = [
  { id: 'all' },
  { id: 'custom' },
  { id: 'official' },
  { id: 'knives' },
  { id: 'budget' },
  { id: 'highroller' },
  { id: 'weapons' },
  { id: 'stickers' },
];

const CASE_BASE_POPULARITY: Record<string, number> = {
  revolution_case: 9500,
  dreams_and_nightmares: 9200,
  kilowatt_case: 8900,
  clutch_case: 8600,
  fracture_case: 8100,
  snakebite_case: 7900,
  recoil_case: 7700,
  case_50_knife: 9800,
  case_all_gloves: 9400,
  case_agents_cs2: 8500,
  csgo_weapon_case: 8300,
  glove_case: 8000,
  gamma_case: 7500,
  chroma_case: 7300,
};

function getCaseThemeGlow(c: { id: string; name: string; category?: string; priceDc: number }): { rgb: string; hex: string } {
  const t = (c.id + ' ' + c.name + ' ' + (c.category || '')).toLowerCase();
  if (t.includes('gold') || t.includes('sheikh') || t.includes('millionaire') || t.includes('oligarch') || t.includes('souvenir') || t.includes('diamond') || c.priceDc >= 25000) {
    return { rgb: '245, 158, 11', hex: '#f59e0b' }; // Gold
  }
  if (t.includes('crimson') || t.includes('redline') || t.includes('bloodsport') || t.includes('red') || t.includes('clash')) {
    return { rgb: '239, 68, 68', hex: '#ef4444' }; // Crimson Red
  }
  if (t.includes('fire') || t.includes('inferno') || t.includes('vulcan') || t.includes('phoenix') || t.includes('heat') || t.includes('breath')) {
    return { rgb: '249, 115, 22', hex: '#f97316' }; // Flame Orange
  }
  if (t.includes('ice') || t.includes('frost') || t.includes('blizzard') || t.includes('arctic') || t.includes('water')) {
    return { rgb: '6, 182, 212', hex: '#06b6d4' }; // Frost Cyan
  }
  if (t.includes('toxic') || t.includes('hazard') || t.includes('atomic') || t.includes('gamma') || t.includes('emerald') || t.includes('green') || t.includes('zalupa')) {
    return { rgb: '34, 197, 94', hex: '#22c55e' }; // Toxic Green
  }
  if (t.includes('anime') || t.includes('waifu') || t.includes('bubblegum') || t.includes('candy')) {
    return { rgb: '244, 63, 94', hex: '#f43f5e' }; // Neon Waifu Pink
  }
  if (t.includes('doppler') || t.includes('galaxy') || t.includes('space') || t.includes('purple') || t.includes('fantasy') || t.includes('odyssey')) {
    return { rgb: '168, 85, 247', hex: '#a855f7' }; // Cosmic Purple
  }
  if (t.includes('cyber') || t.includes('neon') || t.includes('tokyo') || t.includes('matrix') || t.includes('glitch') || t.includes('samurai') || t.includes('ninja') || t.includes('synth') || t.includes('retro')) {
    return { rgb: '217, 70, 239', hex: '#d946ef' }; // Cyber Magenta
  }
  if (t.includes('fade') || t.includes('spectrum') || t.includes('prisma') || t.includes('marble')) {
    return { rgb: '192, 132, 252', hex: '#c084fc' }; // Rainbow Chroma
  }
  if (t.includes('asiimov') || t.includes('mecha') || t.includes('printstream') || t.includes('velocity')) {
    return { rgb: '249, 115, 22', hex: '#f97316' }; // Asiimov Orange
  }
  if (t.includes('glove') || t.includes('specialist') || t.includes('driver')) {
    return { rgb: '245, 158, 11', hex: '#f59e0b' }; // Glove Amber
  }
  if (c.category === 'knives' || t.includes('knife') || t.includes('bayonet') || t.includes('karambit') || t.includes('butterfly')) {
    return { rgb: '147, 51, 234', hex: '#9333ea' }; // Knives Purple
  }
  return { rgb: '56, 189, 248', hex: '#38bdf8' }; // Tactical Sky Blue
}

export default function HomePage() {
  const { t, locale } = useLanguage();
  const caseOpenCounts = useGameStore((state) => state.caseOpenCounts);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'asc' | 'desc' | 'alpha'>('popular');

  // Progressive rendering limit for ultra-fast initial page paint
  const [displayLimit, setDisplayLimit] = useState<number>(36);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const filteredCases = useMemo(() => {
    let list = [...CASES_DATABASE];

    // Filter by Category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'budget') {
        list = list.filter((c) => c.category === 'budget' || c.priceDc < 1000);
      } else if (selectedCategory === 'highroller') {
        list = list.filter((c) => c.category === 'highroller' || c.priceDc >= 10000);
      } else {
        list = list.filter((c) => c.category === selectedCategory);
      }
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          (c.skins && c.skins.some((s) => s.name.toLowerCase().includes(q) || s.skinName.toLowerCase().includes(q)))
      );
    }

    // Sort
    if (sortBy === 'popular') {
      list.sort((a, b) => {
        const popA = (caseOpenCounts[a.id] || 0) * 100 + (CASE_BASE_POPULARITY[a.id] || (a.category === 'custom' ? 5000 : 3500) + (a.priceDc < 2000 ? 1000 : 0));
        const popB = (caseOpenCounts[b.id] || 0) * 100 + (CASE_BASE_POPULARITY[b.id] || (b.category === 'custom' ? 5000 : 3500) + (b.priceDc < 2000 ? 1000 : 0));
        return popB - popA;
      });
    } else if (sortBy === 'asc') {
      list.sort((a, b) => a.priceDc - b.priceDc);
    } else if (sortBy === 'desc') {
      list.sort((a, b) => b.priceDc - a.priceDc);
    } else if (sortBy === 'alpha') {
      list.sort((a, b) => a.name.localeCompare(b.name, locale === 'ru' ? 'ru' : 'en'));
    }

    return list;
  }, [selectedCategory, searchQuery, sortBy, locale, caseOpenCounts]);

  // Reset limit on filter changes
  useEffect(() => {
    setDisplayLimit(36);
  }, [selectedCategory, searchQuery, sortBy]);

  // Infinite scroll observer
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayLimit((prev) => prev + 36);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredCases.length]);

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a] max-w-full overflow-x-hidden">
      <div>
        <Header />
        <LiveDropBar />

        {/* Hero Section with Big Logo */}
        <section className="relative overflow-hidden py-6 sm:py-10 px-4">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
            <div className="py-2">
              <LogoSvg size="xl" className="w-80 sm:w-[480px] md:w-[600px] h-auto drop-shadow-[0_0_40px_rgba(250,204,21,0.3)] hover:scale-105 transition-transform duration-300" />
            </div>
          </div>
        </section>

        {/* Cases Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Header & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 rounded-full bg-yellow-400" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <span>{t('home.title')}</span>
                </h2>
              </div>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus-within:border-yellow-400 transition-colors w-full sm:w-64">
                <Search className="w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder={t('home.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 border border-white/10">
                <ArrowUpDown className="w-3.5 h-3.5 text-yellow-400" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    sound.playClick();
                    setSortBy(e.target.value as any);
                  }}
                  className="bg-transparent text-xs text-white outline-none cursor-pointer"
                >
                  <option value="popular" className="bg-[#12131b]">{t('home.sort.popular')}</option>
                  <option value="asc" className="bg-[#12131b]">{t('home.sort.priceAsc')}</option>
                  <option value="desc" className="bg-[#12131b]">{t('home.sort.priceDesc')}</option>
                  <option value="alpha" className="bg-[#12131b]">{t('home.sort.alpha')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div onWheel={handleHorizontalWheel} className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const label = t('home.cat.' + cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`relative px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'text-black font-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryTab"
                      className="absolute inset-0 rounded-xl bg-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.4)]"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl border border-white/10 bg-white/5" />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Empty state if nothing matches */}
          {filteredCases.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/30">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{t('home.empty')}</h3>
              <p className="text-xs text-white/50 mb-4">
                {t('home.emptyDesc')}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold text-xs cursor-pointer hover:bg-yellow-300 transition-colors"
              >
                {t('home.reset')}
              </button>
            </div>
          ) : (
            <>
              {/* Cases Grid with progressive loading and animated tab transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCategory + '_' + sortBy}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCases.slice(0, displayLimit).map((caseItem) => {
                  const isHighroller = caseItem.priceDc >= 25000;
                  const isUltra = caseItem.priceDc >= 60000;

                  return (
                    <Link
                      key={caseItem.id}
                      href={`/case/${caseItem.id}`}
                      onClick={() => sound.playClick()}
                      className={`group relative rounded-3xl glass-card p-5 flex flex-col justify-between transition-all duration-300 overflow-hidden ${
                        isUltra
                          ? 'border border-amber-400/50 bg-gradient-to-b from-amber-500/10 via-black/50 to-black/70 shadow-[0_0_35px_rgba(251,191,36,0.25)] hover:border-amber-300 hover:shadow-[0_0_50px_rgba(251,191,36,0.45)]'
                          : isHighroller
                          ? 'border border-yellow-500/35 bg-gradient-to-b from-yellow-500/5 via-black/40 to-black/60 shadow-[0_0_25px_rgba(234,179,8,0.18)] hover:border-yellow-400 hover:shadow-[0_0_40px_rgba(234,179,8,0.35)]'
                          : 'border border-white/10 hover:border-yellow-400/50 hover:shadow-[0_0_30px_rgba(250,204,21,0.2)]'
                      }`}
                    >
                      {/* Luxury Sheen sweep for highroller cases */}
                      {isHighroller && (
                        <div className="luxury-sheen opacity-40 group-hover:opacity-85 transition-opacity" />
                      )}

                      {caseOpenCounts[caseItem.id] && caseOpenCounts[caseItem.id] > 0 && (
                        <div className="absolute top-4 left-4 z-10 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider bg-black/70 border border-yellow-400/40 text-yellow-400 flex items-center gap-1 shadow-md">
                          <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                          <span>{caseOpenCounts[caseItem.id]} {locale === 'ru' ? 'открытий' : 'opens'}</span>
                        </div>
                      )}

                      {caseItem.badge && (
                        <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider shadow-md ${
                          isUltra
                            ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-black shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse'
                            : isHighroller
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                            : 'bg-yellow-400 text-black'
                        }`}>
                          {caseItem.badge}
                        </div>
                      )}

                      {(() => {
                        const glow = getCaseThemeGlow(caseItem);
                        return (
                          <div className="relative w-full h-44 flex items-center justify-center my-1 overflow-visible">
                            {/* Rich Volumetric Ambient Glow for EVERY case */}
                            <div
                              className="absolute w-36 h-36 rounded-full blur-2xl -z-10 transition-all duration-300 group-hover:scale-135 group-hover:opacity-100 opacity-75 pointer-events-none"
                              style={{
                                background: `radial-gradient(circle, rgba(${glow.rgb}, 0.55) 0%, rgba(${glow.rgb}, 0.2) 50%, transparent 75%)`
                              }}
                            />

                            <img
                              src={caseItem.image}
                              alt={caseItem.name}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              style={{
                                filter: `drop-shadow(0 0 16px rgba(${glow.rgb}, 0.6)) drop-shadow(0 8px 18px rgba(0,0,0,0.8))`
                              }}
                              className="w-44 h-44 sm:w-48 sm:h-48 max-w-[96%] max-h-42 object-contain group-hover:scale-110 transition-transform duration-200 z-0 select-none"
                            />
                          </div>
                        );
                      })()}

                      <div className="flex flex-col mb-3 z-10">
                        <h3 className={`font-black text-base sm:text-lg transition-colors truncate ${
                          isHighroller ? 'text-white group-hover:text-amber-300' : 'text-white group-hover:text-yellow-400'
                        }`}>
                          {caseItem.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 py-2 border-t border-b border-white/5 mb-4 overflow-hidden z-10">
                        {caseItem.skins.slice(0, 5).map((skin, i) => (
                          <div
                            key={i}
                            className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 p-1 shrink-0 flex items-center justify-center relative"
                            title={skin.name}
                          >
                            <SkinImage 
                              src={skin.image} 
                              alt={skin.name} 
                              size={64}
                              className="w-full h-full object-contain" 
                            />
                            {skin.statTrak && (
                              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_#f59e0b]" />
                            )}
                          </div>
                        ))}
                        {caseItem.skins.length > 5 && (
                          <span className="text-[10px] text-white/50 font-bold ml-1">
                            +{caseItem.skins.length - 5}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-1.5">
                          <DropCoinIcon size={20} />
                          <span className={`font-mono font-black text-lg transition-colors ${
                            isHighroller
                              ? 'text-amber-300 group-hover:text-yellow-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                              : 'text-white group-hover:text-yellow-400'
                          }`}>
                            {caseItem.priceDc.toLocaleString('ru-RU')} DC
                          </span>
                        </div>

                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                          isHighroller
                            ? 'bg-amber-400/10 border-amber-400/30 text-amber-300 group-hover:bg-amber-400 group-hover:text-black'
                            : 'bg-white/5 border-white/10 text-white group-hover:bg-yellow-400 group-hover:text-black'
                        }`}>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Infinite Scroll Sentinel / Status */}
            {displayLimit < filteredCases.length && (
              <div
                ref={loadMoreRef}
                className="py-8 flex flex-col items-center justify-center text-center gap-2"
              >
                <span className="text-xs text-white/40 font-mono">
                  {t('home.showing')} {Math.min(displayLimit, filteredCases.length)} {t('home.of')} {filteredCases.length} {t('home.items')}
                </span>
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 36)}
                  className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  {t('home.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
        </section>
      </div>

      <Footer />
      <RefillModal />
    </main>
  );
}

