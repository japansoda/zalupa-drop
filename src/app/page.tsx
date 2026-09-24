'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { LiveDropBar } from '../components/layout/LiveDropBar';
import { RefillModal } from '../components/layout/RefillModal';
import { DropCoinIcon } from '../components/ui/DropCoinIcon';
import { SkinImage } from '../components/ui/SkinImage';
import { CASES_DATABASE } from '../data/cases';
import { sound } from '../lib/sound';
import { useLanguage, getCaseName, getCaseBadge, Locale } from '../lib/i18n';
import { useGameStore } from '../store/useGameStore';
import { ChevronRight, Search, ArrowUpDown, X } from 'lucide-react';
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

import { CaseItem } from '../lib/types';
import { getCaseThemeGlow, getOptimizedCaseImageUrl } from '../lib/caseTheme';

interface CaseGridCardProps {
  caseItem: CaseItem;
  idx: number;
  locale: Locale;
}

const CaseGridCard = React.memo<CaseGridCardProps>(({ caseItem, idx, locale }) => {
  const isHighroller = caseItem.priceDc >= 25000;
  const isUltra = caseItem.priceDc >= 60000;
  const glow = getCaseThemeGlow(caseItem);
  const caseName = getCaseName(caseItem, locale);
  const optimizedImg = getOptimizedCaseImageUrl(caseItem.image);

  return (
    <Link
      href={`/case/${caseItem.id}`}
      onClick={() => sound.playClick()}
      style={{
        boxShadow: `0 0 16px rgba(${glow.rgb}, 0.1)`,
        contain: 'content',
      }}
      className={`group relative rounded-2xl glass-card p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-200 overflow-hidden ${
        isUltra
          ? 'border border-amber-400/50 bg-gradient-to-b from-amber-500/10 via-black/50 to-black/70 hover:border-amber-300 hover:shadow-[0_0_35px_rgba(251,191,36,0.4)]'
          : isHighroller
          ? 'border border-yellow-500/35 bg-gradient-to-b from-yellow-500/5 via-black/40 to-black/60 hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.35)]'
          : 'border border-white/10 hover:border-[rgba(var(--card-glow),0.55)]'
      }`}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `rgba(${glow.rgb}, 0.55)`;
        e.currentTarget.style.boxShadow = `0 0 28px rgba(${glow.rgb}, 0.3)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = `0 0 16px rgba(${glow.rgb}, 0.1)`;
      }}
    >
      {/* Luxury Sheen sweep for highroller cases */}
      {isHighroller && (
        <div className="luxury-sheen opacity-40 group-hover:opacity-85 transition-opacity" />
      )}

      {caseItem.badge && (
        <div className={`absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full font-black text-[8.5px] uppercase tracking-wider shadow ${
          isUltra
            ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]'
            : isHighroller
            ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black shadow-[0_0_8px_rgba(234,179,8,0.35)]'
            : 'bg-yellow-400 text-black'
        }`}>
          {getCaseBadge(caseItem.badge, caseItem.badgeEn, locale)}
        </div>
      )}

      {/* Case Visual Showcase with Compact Volumetric Glow */}
      <div className="relative w-full h-32 sm:h-36 flex items-center justify-center my-0.5 overflow-visible">
        {/* Core Volumetric Glow */}
        <div
          className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full blur-xl z-0 transition-all duration-300 group-hover:scale-115 group-hover:opacity-100 opacity-80 pointer-events-none"
          style={{
            background: `radial-gradient(circle, rgba(${glow.rgb}, 0.75) 0%, rgba(${glow.rgb}, 0.25) 50%, transparent 72%)`
          }}
        />

        <img
          src={optimizedImg}
          alt={caseName}
          loading={idx < 12 ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            if (e.currentTarget.src !== caseItem.image) {
              e.currentTarget.src = caseItem.image;
            }
          }}
          style={{
            filter: `drop-shadow(0 0 14px rgba(${glow.rgb}, 0.65)) drop-shadow(0 8px 16px rgba(0,0,0,0.85))`
          }}
          className="relative z-10 w-32 h-28 sm:w-36 sm:h-32 max-h-32 object-contain group-hover:scale-108 transition-transform duration-200 select-none"
        />
      </div>

      {/* Case Name */}
      <div className="flex flex-col mb-1.5 z-10">
        <h3 className={`font-black text-xs sm:text-sm transition-colors truncate ${
          isHighroller ? 'text-white group-hover:text-amber-300' : 'text-white group-hover:text-yellow-400'
        }`}>
          {caseName}
        </h3>
      </div>

      {/* Skin Previews (4 mini items) */}
      <div className="flex items-center gap-1 py-1.5 border-t border-b border-white/5 mb-2.5 overflow-hidden z-10">
        {caseItem.skins.slice(0, 4).map((skin, i) => (
          <div
            key={i}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-black/60 border border-white/10 p-0.5 shrink-0 flex items-center justify-center relative"
            title={skin.name}
          >
            <SkinImage
              src={skin.image}
              alt={skin.name}
              size={48}
              thumb
              className="w-full h-full object-contain"
            />
            {skin.statTrak && (
              <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_3px_#f59e0b]" />
            )}
          </div>
        ))}
        {caseItem.skins.length > 4 && (
          <span className="text-[9px] text-white/50 font-bold ml-0.5">
            +{caseItem.skins.length - 4}
          </span>
        )}
      </div>

      {/* Price & Action */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1">
          <DropCoinIcon size={15} />
          <span className={`font-mono font-black text-xs sm:text-sm transition-colors ${
            isHighroller
              ? 'text-amber-300 group-hover:text-yellow-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.35)]'
              : 'text-white group-hover:text-yellow-400'
          }`}>
            {caseItem.priceDc.toLocaleString('ru-RU')} DC
          </span>
        </div>

        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
          isHighroller
            ? 'bg-amber-400/10 border-amber-400/30 text-amber-300 group-hover:bg-amber-400 group-hover:text-black'
            : 'bg-white/5 border-white/10 text-white group-hover:bg-yellow-400 group-hover:text-black'
        }`}>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
});
CaseGridCard.displayName = 'CaseGridCard';

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
          (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
          c.subtitle.toLowerCase().includes(q) ||
          (c.subtitleEn && c.subtitleEn.toLowerCase().includes(q)) ||
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
      list.sort((a, b) => getCaseName(a, locale).localeCompare(getCaseName(b, locale), locale === 'ru' ? 'ru' : 'en'));
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

        {/* Cases Catalog Section */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
          {/* Header & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-6 rounded-full bg-yellow-400" />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                  <span>{t('home.title')}</span>
                </h2>
              </div>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 focus-within:border-yellow-400 transition-colors w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-white/40" />
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
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10">
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
          <div onWheel={handleHorizontalWheel} className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3.5 no-scrollbar">
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
                  className={`relative px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'text-black font-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryTab"
                      className="absolute inset-0 rounded-lg bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.35)]"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-lg border border-white/10 bg-white/5" />
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
                {filteredCases.slice(0, displayLimit).map((caseItem, idx) => (
                  <CaseGridCard
                    key={caseItem.id}
                    caseItem={caseItem}
                    idx={idx}
                    locale={locale}
                  />
                ))}
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

