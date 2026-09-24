'use client';

import React, { useState, useMemo } from 'react';
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
import {
  Search,
  ShoppingBag,
  Store,
  Plus,
  Check,
  Filter,
  ArrowUpDown,
  Sparkles,
  Sword,
  Hand,
  Crosshair,
  LayoutGrid,
  Zap,
} from 'lucide-react';

export const ITEM_CATEGORIES = [
  { id: 'all', labelRu: 'Все', labelEn: 'All', icon: LayoutGrid },
  { id: 'knives', labelRu: 'Ножи', labelEn: 'Knives', icon: Sword },
  { id: 'gloves', labelRu: 'Перчатки', labelEn: 'Gloves', icon: Hand },
  { id: 'rifles', labelRu: 'Винтовки', labelEn: 'Rifles', icon: Crosshair },
  { id: 'pistols', labelRu: 'Пистолеты', labelEn: 'Pistols', icon: Zap },
  { id: 'smgs', labelRu: 'ПП', labelEn: 'SMGs', icon: Crosshair },
];

export default function MarketplacePage() {
  const { balance, deductBalance, addToInventory, setRefillOpen } = useGameStore();
  const { locale, t } = useLanguage();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortOption, setSortOption] = useState<'price_asc' | 'price_desc' | 'name_asc'>('price_asc');
  const [statTrakOnly, setStatTrakOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'under1k' | '1k_10k' | 'over10k'>('all');

  const [purchasedSkinName, setPurchasedSkinName] = useState<string | null>(null);

  const filteredSkins = useMemo(() => {
    let list = SKINS_DATABASE;

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((skin) => {
        const w = (skin.weapon || '').toLowerCase();
        const n = (skin.name || '').toLowerCase();
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
        if (selectedCategory === 'rifles') {
          return ['ak-47', 'm4a4', 'm4a1-s', 'awp', 'galil', 'famas', 'sg 553', 'aug', 'ssg 08', 'g3sg1', 'scar-20'].some(
            (r) => w.includes(r)
          );
        }
        if (selectedCategory === 'pistols') {
          return ['usps', 'usp-s', 'glock', 'desert eagle', 'deagle', 'five-seven', 'p250', 'tec-9', 'dual berettas', 'cz75', 'r8'].some(
            (p) => w.includes(p)
          );
        }
        if (selectedCategory === 'smgs') {
          return ['mp9', 'mac-10', 'mp7', 'mp5', 'ump-45', 'p90', 'bizon'].some((s) => w.includes(s));
        }
        return true;
      });
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
    if (search.trim()) {
      const q = search.toLowerCase().trim();
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
  }, [selectedCategory, selectedRarity, statTrakOnly, priceRange, search, sortOption]);

  const handleBuy = (skin: SkinEntity) => {
    sound.playClick();
    if (balance < skin.priceDc) {
      sound.playError();
      setRefillOpen(true);
      return;
    }

    const success = deductBalance(skin.priceDc);
    if (!success) return;

    sound.playBuy();
    addToInventory([skin]);

    setPurchasedSkinName(skin.skinName || skin.name);
    setTimeout(() => {
      setPurchasedSkinName(null);
    }, 2800);
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a] text-white">
      <div>
        <Header />
        <LiveDropBar />
        <RefillModal />

        {/* Hero Banner */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#10121a] to-[#08080a] py-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-black uppercase tracking-wider mb-3">
                <Store className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Официальный Маркет' : 'Official Market'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
                {locale === 'ru' ? 'МАРКЕТПЛЕЙС' : 'MARKETPLACE'}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500">
                  CS2
                </span>
              </h1>
              <p className="text-sm sm:text-base text-white/60 max-w-xl mt-2 font-medium">
                {locale === 'ru'
                  ? 'Покупайте любые скины из полного каталога CS2 за DropCoins в один клик прямо в инвентарь!'
                  : 'Buy any CS2 skin from the complete catalog for DropCoins in 1-click directly into your inventory!'}
              </p>
            </div>

            {/* Quick Balance Card */}
            <div className="flex items-center gap-4 bg-[#0d0e14] p-4 rounded-3xl border border-white/10 shadow-xl">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white/40 uppercase">
                  {locale === 'ru' ? 'Ваш баланс' : 'Your Balance'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <DropCoinIcon className="w-6 h-6" />
                  <span className="font-mono font-black text-2xl text-yellow-400">
                    {balance.toLocaleString('ru-RU')} DC
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setRefillOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{locale === 'ru' ? 'Пополнить' : 'Top Up'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Filter Toolbar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
          <div className="bg-[#0d0e14] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col gap-4">
            {/* Top Filter Row: Search & Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder={locale === 'ru' ? 'Поиск по названию или оружию...' : 'Search by skin or weapon...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-white/40 outline-none focus:border-yellow-400/50 transition-colors"
                />
              </div>

              {/* Rarity Dropdown */}
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white outline-none cursor-pointer focus:border-yellow-400/50"
              >
                <option value="all">{locale === 'ru' ? 'Все редкости' : 'All Rarities'}</option>
                <option value="extraordinary">★ {locale === 'ru' ? 'Экстраординарное' : 'Extraordinary'}</option>
                <option value="gold">★ {locale === 'ru' ? 'Редкий особый' : 'Rare Special'}</option>
                <option value="covert">{locale === 'ru' ? 'Тайное' : 'Covert'}</option>
                <option value="classified">{locale === 'ru' ? 'Засекреченное' : 'Classified'}</option>
                <option value="restricted">{locale === 'ru' ? 'Запрещенное' : 'Restricted'}</option>
                <option value="milspec">{locale === 'ru' ? 'Армейское' : 'Mil-Spec'}</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white outline-none cursor-pointer focus:border-yellow-400/50"
              >
                <option value="price_asc">{locale === 'ru' ? 'Сначала дешевые ↑' : 'Price: Low to High'}</option>
                <option value="price_desc">{locale === 'ru' ? 'Сначала дорогие ↓' : 'Price: High to Low'}</option>
                <option value="name_asc">{locale === 'ru' ? 'По названию (А-Я)' : 'Name (A-Z)'}</option>
              </select>

              {/* Price Range Filter */}
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white outline-none cursor-pointer focus:border-yellow-400/50"
              >
                <option value="all">{locale === 'ru' ? 'Любая цена' : 'Any Price'}</option>
                <option value="under1k">{locale === 'ru' ? 'До 1 000 DC' : 'Under 1 000 DC'}</option>
                <option value="1k_10k">{locale === 'ru' ? '1 000 – 10 000 DC' : '1 000 – 10 000 DC'}</option>
                <option value="over10k">{locale === 'ru' ? 'От 10 000 DC' : 'Over 10 000 DC'}</option>
              </select>
            </div>

            {/* Bottom Row: Category Pills & StatTrak toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-1.5">
                {ITEM_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isAct = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedCategory(cat.id);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isAct
                          ? 'bg-yellow-400 text-black border-yellow-300 font-black shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{locale === 'ru' ? cat.labelRu : cat.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* StatTrak Only Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-white/70 hover:text-white">
                <input
                  type="checkbox"
                  checked={statTrakOnly}
                  onChange={(e) => setStatTrakOnly(e.target.checked)}
                  className="rounded bg-black/60 border-white/20 text-yellow-400 focus:ring-0 cursor-pointer"
                />
                <span>{locale === 'ru' ? 'Только StatTrak™' : 'StatTrak™ Only'}</span>
              </label>
            </div>
          </div>
        </section>

        {/* Skins Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-white/40 uppercase">
              {locale === 'ru' ? 'Найдено скинов:' : 'Found skins:'} {filteredSkins.length}
            </span>
          </div>

          {filteredSkins.length === 0 ? (
            <div className="text-center py-24 bg-[#0d0e14] rounded-3xl border border-white/10">
              <Store className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">
                {locale === 'ru' ? 'Скины не найдены' : 'No skins found'}
              </h3>
              <p className="text-xs text-white/40 mb-4">
                {locale === 'ru' ? 'Попробуйте изменить параметры фильтра' : 'Try adjusting your filters'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredSkins.slice(0, 180).map((skin) => {
                const canAfford = balance >= skin.priceDc;
                const rarityCfg = RARITY_CONFIG[skin.rarity] || RARITY_CONFIG.milspec;

                return (
                  <div
                    key={skin.id}
                    className="relative rounded-3xl p-3 flex flex-col justify-between border bg-[#0d0e14] transition-all hover:-translate-y-1 hover:shadow-xl group"
                    style={{
                      borderColor: rarityCfg.border,
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
                        className="w-full h-24 sm:h-28 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] group-hover:scale-108 transition-transform duration-200"
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
                        onClick={() => handleBuy(skin)}
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
              })}
            </div>
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
