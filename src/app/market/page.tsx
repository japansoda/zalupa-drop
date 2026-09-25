'use client';

import React, { useState, useMemo, useCallback, useDeferredValue } from 'react';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { LiveDropBar } from '../../components/layout/LiveDropBar';
import { RefillModal } from '../../components/layout/RefillModal';
import { DropCoinIcon } from '../../components/ui/DropCoinIcon';
import { SkinImage } from '../../components/ui/SkinImage';
import { WearBadge } from '../../components/ui/WearBadge';
import { StatTrakBadge } from '../../components/ui/StatTrakBadge';
import { RarityBadge } from '../../components/ui/RarityBadge';
import { SKINS_DATABASE, RARITY_CONFIG } from '../../data/skins';
import { SkinEntity, SkinRarity } from '../../lib/types';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';
import { isStatTrakableItem } from '../../lib/steam';
import { isActualWeaponOrKnifeGlove } from '../../lib/farm';
import {
  Search,
  ShoppingBag,
  Store,
  Check,
  Sword,
  Hand,
  Crosshair,
  LayoutGrid,
  Zap,
  Shield,
  Layers,
} from 'lucide-react';

export const ITEM_CATEGORIES = [
  { id: 'all', labelRu: 'Все оружие', labelEn: 'All Weapons', icon: LayoutGrid },
  { id: 'knives', labelRu: 'Ножи', labelEn: 'Knives', icon: Sword },
  { id: 'gloves', labelRu: 'Перчатки', labelEn: 'Gloves', icon: Hand },
  { id: 'snipers', labelRu: 'Снайперки', labelEn: 'Snipers', icon: Crosshair },
  { id: 'rifles', labelRu: 'Винтовки', labelEn: 'Rifles', icon: Crosshair },
  { id: 'pistols', labelRu: 'Пистолеты', labelEn: 'Pistols', icon: Zap },
  { id: 'smgs', labelRu: 'ПП', labelEn: 'SMGs', icon: Layers },
  { id: 'heavy', labelRu: 'Дробовики & Пулеметы', labelEn: 'Heavy & Shotguns', icon: Shield },
];

const SNIPER_MODELS = ['awp', 'ssg 08', 'scar-20', 'g3sg1'];
const RIFLE_MODELS = ['ak-47', 'm4a4', 'm4a1-s', 'galil ar', 'famas', 'aug', 'sg 553'];
const PISTOL_MODELS = ['desert eagle', 'usp-s', 'glock-18', 'five-seven', 'p250', 'tec-9', 'dual berettas', 'cz75-auto', 'r8 revolver'];
const SMG_MODELS = ['mp9', 'mac-10', 'mp7', 'mp5-sd', 'ump-45', 'p90', 'pp-bizon'];
const HEAVY_MODELS = ['nova', 'xm1014', 'mag-7', 'sawed-off', 'm249', 'negev'];

// Memoized Card Component for smooth, fast scrolling with contentVisibility and GPU isolation
const MarketSkinCard = React.memo<{
  skin: SkinEntity;
  canAfford: boolean;
  onBuy: (skin: SkinEntity) => void;
  locale: string;
}>(({ skin, canAfford, onBuy, locale }) => {
  const rarityCfg = RARITY_CONFIG[skin.rarity] || RARITY_CONFIG.milspec;

  return (
    <div
      className="relative rounded-3xl p-3 flex flex-col justify-between border bg-[#0d0e14] transition-[border-color,transform] duration-150 hover:-translate-y-1 hover:shadow-xl group"
      style={{
        borderColor: rarityCfg.border,
        contentVisibility: 'auto',
        containIntrinsicSize: '270px',
        contain: 'content',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      {/* Top Badges */}
      <div className="w-full flex items-center justify-between z-10 min-h-[20px] mb-1">
        <div className="flex items-center gap-1">
          {skin.statTrak && isStatTrakableItem(skin) && <StatTrakBadge size="xs" />}
          <WearBadge skin={skin} size="xs" />
        </div>
        <RarityBadge rarity={skin.rarity} size="xs" />
      </div>

      {/* Skin Image */}
      <div className="w-full h-28 sm:h-32 flex items-center justify-center my-2">
        <SkinImage
          src={skin.image}
          alt={skin.name}
          size={150}
          className="w-full h-24 sm:h-28 object-contain group-hover:scale-105 transition-transform duration-150"
        />
      </div>

      {/* Info & Buy Button */}
      <div className="w-full flex flex-col pt-2 border-t border-white/5">
        <span className="text-xs font-black text-white truncate" title={skin.skinName || skin.name}>
          {skin.skinName || skin.name}
        </span>
        <span className="text-[10px] text-white/40 truncate">{skin.weapon}</span>

        <div className="flex items-center gap-1.5 mt-1.5 mb-2">
          <DropCoinIcon className="w-3.5 h-3.5" />
          <span className="font-mono font-black text-xs text-yellow-400">
            {skin.priceDc.toLocaleString('ru-RU')} DC
          </span>
        </div>

        <button
          type="button"
          onClick={() => onBuy(skin)}
          className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            canAfford
              ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_15px_rgba(250,204,21,0.25)] active:scale-95'
              : 'bg-white/5 hover:bg-white/10 text-white/40 border border-white/5'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{locale === 'ru' ? 'Купить' : 'Buy'}</span>
        </button>
      </div>
    </div>
  );
});
MarketSkinCard.displayName = 'MarketSkinCard';

export default function MarketplacePage() {
  const balance = useGameStore((s) => s.balance);
  const deductBalance = useGameStore((s) => s.deductBalance);
  const addToInventory = useGameStore((s) => s.addToInventory);
  const setRefillOpen = useGameStore((s) => s.setRefillOpen);
  const { locale } = useLanguage();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubWeapon, setSelectedSubWeapon] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortOption, setSortOption] = useState<'price_asc' | 'price_desc' | 'name_asc'>('price_asc');
  const [statTrakOnly, setStatTrakOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'under1k' | '1k_10k' | 'over10k'>('all');
  const [visibleCount, setVisibleCount] = useState(48);

  const [purchasedSkinName, setPurchasedSkinName] = useState<string | null>(null);

  // BASE POOL: Strictly weapons, knives, and gloves by default!
  const basePool = useMemo(() => {
    return SKINS_DATABASE.filter(isActualWeaponOrKnifeGlove);
  }, []);

  // Filtered skins
  const filteredSkins = useMemo(() => {
    let list = basePool;

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((skin) => {
        const w = (skin.weapon || '').toLowerCase();
        const isGlove = w.includes('gloves') || w.includes('wraps') || w.includes('перчатки');
        const isKnife =
          (skin.name.startsWith('★') && !isGlove) ||
          w.includes('knife') ||
          w.includes('нож') ||
          w.includes('bayonet') ||
          w.includes('karambit') ||
          w.includes('daggers') ||
          w.includes('stiletto') ||
          w.includes('kukri') ||
          w.includes('talon') ||
          w.includes('ursus');

        if (selectedCategory === 'knives') return isKnife;
        if (selectedCategory === 'gloves') return isGlove;
        if (selectedCategory === 'snipers') return SNIPER_MODELS.some((m) => w.includes(m));
        if (selectedCategory === 'rifles') return RIFLE_MODELS.some((m) => w.includes(m));
        if (selectedCategory === 'pistols') return PISTOL_MODELS.some((m) => w.includes(m));
        if (selectedCategory === 'smgs') return SMG_MODELS.some((m) => w.includes(m));
        if (selectedCategory === 'heavy') return HEAVY_MODELS.some((m) => w.includes(m));
        return true;
      });
    }

    // Sub-weapon model filter
    if (selectedSubWeapon !== 'all') {
      const q = selectedSubWeapon.toLowerCase();
      list = list.filter((skin) => (skin.weapon || '').toLowerCase().includes(q));
    }

    // Rarity filter
    if (selectedRarity !== 'all') {
      list = list.filter((skin) => skin.rarity === selectedRarity);
    }

    // StatTrak filter
    if (statTrakOnly) {
      list = list.filter((skin) => skin.statTrak);
    }

    // Price range filter
    if (priceRange === 'under1k') {
      list = list.filter((s) => s.priceDc < 1000);
    } else if (priceRange === '1k_10k') {
      list = list.filter((s) => s.priceDc >= 1000 && s.priceDc <= 10000);
    } else if (priceRange === 'over10k') {
      list = list.filter((s) => s.priceDc > 10000);
    }

    // Text search
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.skinName || '').toLowerCase().includes(q) ||
          (s.weapon || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    const sorted = [...list].sort((a, b) => {
      if (sortOption === 'price_asc') return a.priceDc - b.priceDc;
      if (sortOption === 'price_desc') return b.priceDc - a.priceDc;
      if (sortOption === 'name_asc') return (a.skinName || a.name).localeCompare(b.skinName || b.name);
      return 0;
    });

    return sorted;
  }, [basePool, selectedCategory, selectedSubWeapon, selectedRarity, statTrakOnly, priceRange, deferredSearch, sortOption]);

  // Sub-weapons available in current category
  const availableSubWeapons = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const counts: Record<string, number> = {};
    for (const s of basePool) {
      const w = s.weapon || '';
      if (!w) continue;
      const lw = w.toLowerCase();
      const isGlove = lw.includes('gloves') || lw.includes('wraps') || lw.includes('перчатки');
      const isKnife =
        (s.name.startsWith('★') && !isGlove) ||
        lw.includes('knife') ||
        lw.includes('нож') ||
        lw.includes('bayonet') ||
        lw.includes('karambit') ||
        lw.includes('daggers') ||
        lw.includes('stiletto') ||
        lw.includes('kukri') ||
        lw.includes('talon') ||
        lw.includes('ursus');

      let matches = false;
      if (selectedCategory === 'knives' && isKnife) matches = true;
      if (selectedCategory === 'gloves' && isGlove) matches = true;
      if (selectedCategory === 'snipers' && SNIPER_MODELS.some((m) => lw.includes(m))) matches = true;
      if (selectedCategory === 'rifles' && RIFLE_MODELS.some((m) => lw.includes(m))) matches = true;
      if (selectedCategory === 'pistols' && PISTOL_MODELS.some((m) => lw.includes(m))) matches = true;
      if (selectedCategory === 'smgs' && SMG_MODELS.some((m) => lw.includes(m))) matches = true;
      if (selectedCategory === 'heavy' && HEAVY_MODELS.some((m) => lw.includes(m))) matches = true;

      if (matches) {
        counts[w] = (counts[w] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [basePool, selectedCategory]);

  const handleBuy = useCallback((skin: SkinEntity) => {
    if (balance < skin.priceDc) {
      sound.playError();
      setRefillOpen(true);
      return;
    }

    deductBalance(skin.priceDc);
    addToInventory([skin]);
    sound.playBuy();

    setPurchasedSkinName(skin.skinName || skin.name);
    setTimeout(() => {
      setPurchasedSkinName(null);
    }, 2800);
  }, [balance, deductBalance, addToInventory, setRefillOpen]);

  const handleLoadMore = () => {
    sound.playClick();
    setVisibleCount((prev) => prev + 36);
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a] text-white pb-24 sm:pb-16 max-w-full overflow-x-hidden">
      <div>
        <Header />
        <LiveDropBar />
        <RefillModal />

        {/* Hero Banner */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#13141f] via-[#0c0d14] to-[#08080a] py-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider mb-3">
                <Store className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Каталог оружия CS2' : 'CS2 Armory Catalog'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                {locale === 'ru' ? 'МАРКЕТПЛЕЙС' : 'MARKETPLACE'}{' '}
                <span className="text-yellow-400">CS2</span>
              </h1>
              <p className="text-sm text-white/50 max-w-xl mt-1">
                {locale === 'ru'
                  ? 'Покупайте любые ножи, перчатки и оружие CS2 напрямую за DropCoins (DC) без наценок и комиссий.'
                  : 'Buy any CS2 knife, gloves, and weapons directly using DropCoins (DC) with zero fees.'}
              </p>
            </div>

            {/* Balance Badge */}
            <div className="flex items-center gap-3">
              <div className="bg-[#0d0e14] px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
                <DropCoinIcon className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/40 uppercase">
                    {locale === 'ru' ? 'Ваш баланс' : 'Your Balance'}
                  </span>
                  <span className="font-mono font-black text-lg text-yellow-400">
                    {balance.toLocaleString('ru-RU')} DC
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {ITEM_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedCategory(cat.id);
                    setSelectedSubWeapon('all');
                    setVisibleCount(48);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-yellow-400 text-black border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.3)] font-black scale-[1.02]'
                      : 'bg-[#0d0e14] text-white/70 hover:text-white border-white/10 hover:border-white/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{locale === 'ru' ? cat.labelRu : cat.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Weapon Model Chips */}
          {availableSubWeapons.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 p-2 rounded-2xl bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSelectedSubWeapon('all');
                  setVisibleCount(48);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedSubWeapon === 'all'
                    ? 'bg-yellow-400 text-black border-yellow-300 font-black'
                    : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                }`}
              >
                {locale === 'ru' ? 'Все модели' : 'All Models'}
              </button>

              {availableSubWeapons.slice(0, 12).map((w) => {
                const isAct = selectedSubWeapon.toLowerCase() === w.name.toLowerCase();
                return (
                  <button
                    key={w.name}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedSubWeapon(isAct ? 'all' : w.name);
                      setVisibleCount(48);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isAct
                        ? 'bg-yellow-400 text-black border-yellow-300 font-black'
                        : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                    }`}
                  >
                    {w.name} <span className="text-[10px] opacity-60">({w.count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Filter Controls Row */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
          <div className="p-4 rounded-3xl bg-[#0d0e14] border border-white/10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 w-full md:w-80">
              <Search className="w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder={locale === 'ru' ? 'Поиск оружия или скина...' : 'Search skin or weapon...'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(48);
                }}
                className="w-full bg-transparent text-xs text-white outline-none"
              />
            </div>

            {/* Dropdown Filters & Toggles */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Rarity */}
              <select
                value={selectedRarity}
                onChange={(e) => {
                  setSelectedRarity(e.target.value);
                  setVisibleCount(48);
                }}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">{locale === 'ru' ? 'Все редкости' : 'All rarities'}</option>
                <option value="extraordinary">★ {locale === 'ru' ? 'Экстраординарное' : 'Extraordinary'}</option>
                <option value="covert">★ {locale === 'ru' ? 'Тайное' : 'Covert'}</option>
                <option value="classified">{locale === 'ru' ? 'Засекреченное' : 'Classified'}</option>
                <option value="restricted">{locale === 'ru' ? 'Запрещенное' : 'Restricted'}</option>
                <option value="milspec">{locale === 'ru' ? 'Армейское' : 'Mil-Spec'}</option>
                <option value="gold">★ {locale === 'ru' ? 'Редкий особый' : 'Rare Special'}</option>
              </select>

              {/* Price Range */}
              <select
                value={priceRange}
                onChange={(e) => {
                  setPriceRange(e.target.value as any);
                  setVisibleCount(48);
                }}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">{locale === 'ru' ? 'Все цены' : 'All prices'}</option>
                <option value="under1k">{locale === 'ru' ? 'До 1 000 DC' : 'Under 1k DC'}</option>
                <option value="1k_10k">{locale === 'ru' ? '1 000 – 10 000 DC' : '1k – 10k DC'}</option>
                <option value="over10k">{locale === 'ru' ? 'От 10 000 DC' : 'Above 10k DC'}</option>
              </select>

              {/* StatTrak Toggle */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setStatTrakOnly((prev) => !prev);
                  setVisibleCount(48);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  statTrakOnly
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm font-black'
                    : 'bg-black/60 text-white/60 border-white/10 hover:text-white'
                }`}
              >
                StatTrak™
              </button>

              {/* Sort */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="price_asc">{locale === 'ru' ? 'Сначала дешевле' : 'Price: Low to High'}</option>
                <option value="price_desc">{locale === 'ru' ? 'Сначала дороже' : 'Price: High to Low'}</option>
                <option value="name_asc">{locale === 'ru' ? 'По названию' : 'By Name'}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Skins Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-white/50">
              {locale === 'ru' ? 'Найдено скинов:' : 'Items found:'}{' '}
              <span className="text-yellow-400 font-black">{filteredSkins.length}</span>
            </span>
          </div>

          {filteredSkins.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <Store className="w-12 h-12 text-white/20 mb-3" />
              <span className="text-sm font-bold text-white/50 mb-4">
                {locale === 'ru' ? 'Скины не найдены по заданным критериям' : 'No skins match your filters'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedSubWeapon('all');
                  setSelectedRarity('all');
                  setPriceRange('all');
                  setStatTrakOnly(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
              >
                {locale === 'ru' ? 'Сбросить фильтры' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
                style={{ contain: 'layout' }}
              >
                {filteredSkins.slice(0, visibleCount).map((skin) => (
                  <MarketSkinCard
                    key={skin.id}
                    skin={skin}
                    canAfford={balance >= skin.priceDc}
                    onBuy={handleBuy}
                    locale={locale}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {visibleCount < filteredSkins.length && (
                <div className="flex justify-center mt-8">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="px-8 py-3.5 rounded-2xl bg-[#0d0e14] hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider border border-white/10 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    {locale === 'ru'
                      ? `Показать еще (+36 из ${filteredSkins.length - visibleCount})`
                      : `Load More (+36 of ${filteredSkins.length - visibleCount})`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Purchase Notification Toast */}
        {purchasedSkinName && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0d0e14] border border-yellow-400 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-yellow-400 uppercase">
                {locale === 'ru' ? 'Успешно куплено!' : 'Purchased!'}
              </span>
              <span className="text-sm font-black text-white">{purchasedSkinName}</span>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
