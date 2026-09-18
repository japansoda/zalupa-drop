'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { LiveDropBar } from '../components/layout/LiveDropBar';
import { RefillModal } from '../components/layout/RefillModal';
import { DropCoinIcon } from '../components/ui/DropCoinIcon';
import { LogoSvg } from '../components/ui/LogoSvg';
import { CASES_DATABASE } from '../data/cases';
import { sound } from '../lib/sound';
import { ChevronRight, Search, SlidersHorizontal, ArrowUpDown, X, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'custom', label: 'Кастомные' },
  { id: 'official', label: 'Официальные CS2' },
  { id: 'knives', label: 'Ножи и Перчатки' },
  { id: 'budget', label: 'Бюджетные' },
  { id: 'highroller', label: 'Мажор' },
  { id: 'weapons', label: 'Оружие' },
  { id: 'stickers', label: 'Наклейки и Агенты' },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'asc' | 'desc' | 'alpha'>('popular');

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
    if (sortBy === 'asc') {
      list.sort((a, b) => a.priceDc - b.priceDc);
    } else if (sortBy === 'desc') {
      list.sort((a, b) => b.priceDc - a.priceDc);
    } else if (sortBy === 'alpha') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }

    return list;
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a]">
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
                  <span>КАТАЛОГ КЕЙСОВ CS2</span>
                </h2>
                <p className="text-xs text-white/50">
                  Официальные и авторские кейсы с 3D моделями и оригинальной физической рулеткой
                </p>
              </div>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus-within:border-yellow-400 transition-colors w-full sm:w-64">
                <Search className="w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Поиск по названию или скину..."
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
                  <option value="popular" className="bg-[#12131b]">По популярности</option>
                  <option value="asc" className="bg-[#12131b]">Цена: Дешевле ↑</option>
                  <option value="desc" className="bg-[#12131b]">Цена: Дороже ↓</option>
                  <option value="alpha" className="bg-[#12131b]">По алфавиту (А-Я)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.35)] scale-105'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {cat.label}
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
              <h3 className="text-lg font-bold text-white mb-1">Ничего не найдено</h3>
              <p className="text-xs text-white/50 mb-4">
                По запросу «{searchQuery}» кейсы не найдены
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold text-xs cursor-pointer hover:bg-yellow-300 transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            /* Cases Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  href={`/case/${caseItem.id}`}
                  onClick={() => sound.playClick()}
                  className="group relative rounded-3xl glass-card border border-white/10 p-5 flex flex-col justify-between hover:border-yellow-400/50 hover:shadow-[0_0_30px_rgba(250,204,21,0.2)] transition-all duration-200"
                >
                  {caseItem.badge && (
                    <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-yellow-400 text-black font-black text-[10px] uppercase tracking-wider shadow-md">
                      {caseItem.badge}
                    </div>
                  )}

                  <div className="relative w-full h-44 flex items-center justify-center my-2">
                    <img
                      src={caseItem.image}
                      alt={caseItem.name}
                      referrerPolicy="no-referrer"
                      className="w-36 h-36 object-contain group-hover:scale-105 transition-transform duration-200 filter drop-shadow-xl"
                    />
                  </div>

                  <div className="flex flex-col mb-4">
                    <h3 className="font-black text-lg text-white group-hover:text-yellow-400 transition-colors truncate">
                      {caseItem.name}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-1 mt-0.5">
                      {caseItem.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 py-2 border-t border-b border-white/5 mb-4 overflow-hidden">
                    {caseItem.skins.slice(0, 5).map((skin, i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 p-1 shrink-0 flex items-center justify-center relative"
                        title={skin.name}
                      >
                        <img 
                          src={skin.image} 
                          alt={skin.name} 
                          referrerPolicy="no-referrer" 
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DropCoinIcon size={20} />
                      <span className="font-mono font-black text-white text-lg group-hover:text-yellow-400 transition-colors">
                        {caseItem.priceDc.toLocaleString('ru-RU')} DC
                      </span>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-black transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
      <RefillModal />
    </main>
  );
}
