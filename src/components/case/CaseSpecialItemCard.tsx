'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, ChevronRight } from 'lucide-react';
import { SkinEntity } from '../../lib/types';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { WearBadge } from '../ui/WearBadge';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';

interface CaseSpecialItemCardProps {
  caseId: string;
  knifePool: SkinEntity[];
}

export const CaseSpecialItemCard: React.FC<CaseSpecialItemCardProps> = ({ caseId, knifePool }) => {
  const { t, locale } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Group pool by weapon + skinName for clean presentation in modal
  const groupedKnifeCards = useMemo(() => {
    const map = new Map<string, SkinEntity[]>();
    for (const skin of knifePool) {
      const key = `${skin.weapon || ''}___${skin.skinName || skin.name}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(skin);
    }
    return Array.from(map.values());
  }, [knifePool]);

  // Filter grouped cards by search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return groupedKnifeCards;
    const q = searchQuery.toLowerCase();
    return groupedKnifeCards.filter((variants) => {
      const sample = variants[0];
      return (
        sample.weapon.toLowerCase().includes(q) ||
        sample.skinName.toLowerCase().includes(q) ||
        sample.name.toLowerCase().includes(q)
      );
    });
  }, [groupedKnifeCards, searchQuery]);

  return (
    <>
      {/* Main Special Item Card on Case Page */}
      <div
        onClick={() => {
          sound.playClick();
          setIsModalOpen(true);
        }}
        className="rounded-2xl p-3 sm:p-4 flex flex-col justify-between border border-yellow-500/50 hover:border-yellow-300 transition-all group relative overflow-hidden bg-gradient-to-b from-yellow-950/25 via-[#14141d] to-[#0d0e14] shadow-[0_0_25px_rgba(234,179,8,0.15)] hover:shadow-[0_0_35px_rgba(234,179,8,0.3)] cursor-pointer"
        style={{ borderBottomWidth: '4px', borderBottomColor: '#facc15' }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-1 z-10">
          <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 uppercase tracking-wider">
            ★ SPECIAL
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-400/40 uppercase">
            ★ РЕДКИЙ ОСОБЫЙ
          </span>
        </div>

        {/* Central Laurel Wreath Question Mark */}
        <div className="w-full h-28 flex items-center justify-center my-2 relative">
          <div className="absolute inset-0 bg-radial from-yellow-500/20 to-transparent blur-xl pointer-events-none" />
          <img
            src="/images/special_item.png"
            alt="★ Редкий особый предмет"
            className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] z-10"
          />
        </div>

        {/* Title & Info */}
        <div className="flex flex-col z-10">
          <span className="text-xs font-black text-yellow-400 truncate">
            ★ Редкий особый предмет
          </span>
          <span className="text-[11px] font-semibold text-white/70 truncate mb-2">
            {locale === 'ru' ? 'Ножи и перчатки CS2' : 'CS2 Knives & Gloves'}
          </span>

          <button
            type="button"
            className="w-full py-1.5 px-2 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-300 text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all group-hover:border-yellow-400"
          >
            <span>{locale === 'ru' ? `Все ножи (${knifePool.length})` : `All knives (${knifePool.length})`}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal with Gallery of Possible Knives / Gloves */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[88vh] glass-panel rounded-3xl border border-yellow-400/40 p-5 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shrink-0">
                    <img src="/images/special_item.png" alt="★" className="w-7 h-7 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
                      <span>{locale === 'ru' ? '★ Возможные ножи и перчатки' : '★ Possible Special Items'}</span>
                      <span className="text-yellow-400 font-mono text-xs">({knifePool.length})</span>
                    </h3>
                    <p className="text-xs text-white/50">
                      {locale === 'ru'
                        ? 'Любой из этих предметов может выпасть при открытии кейса'
                        : 'Any of these items can drop when opening this case'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsModalOpen(false);
                  }}
                  className="text-white/40 hover:text-white w-8 h-8 rounded-xl glass-button flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'ru' ? 'Поиск ножа или скина...' : 'Search knife or skin...'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-yellow-400 text-white text-xs outline-none transition-colors"
                />
              </div>

              {/* Scrollable grid of possible knives */}
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredCards.map((variants, idx) => {
                  const first = variants[0];
                  return (
                    <div
                      key={first.id || idx}
                      className="rounded-2xl bg-black/50 border border-yellow-500/20 hover:border-yellow-400/50 p-3 flex flex-col justify-between transition-all group relative overflow-hidden"
                      style={{ borderBottomWidth: '3px', borderBottomColor: '#facc15' }}
                    >
                      <div className="flex items-center justify-between gap-1 z-10">
                        <span className="text-[9px] font-black text-yellow-400 uppercase tracking-tight">
                          ★ GOLD
                        </span>
                        <div className="flex items-center gap-1">
                          <WearBadge skin={first} size="xs" />
                          {first.statTrak && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              ST
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-20 flex items-center justify-center my-1">
                        <img
                          src={first.image}
                          alt={first.name}
                          className="w-18 h-18 object-contain group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
                        />
                      </div>

                      <div className="flex flex-col z-10">
                        <span className="text-[11px] font-bold text-white truncate">{first.weapon}</span>
                        <span className="text-[10px] font-semibold text-yellow-400 truncate mb-1">
                          {first.skinName}
                        </span>

                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <div className="flex items-center gap-1">
                            <DropCoinIcon size={12} />
                            <span className="font-mono font-bold text-[11px] text-yellow-400">
                              {first.priceDc.toLocaleString('ru-RU')}
                            </span>
                          </div>
                          <span className="text-[9px] text-white/40 font-mono">
                            {variants.length > 1 ? `${variants.length} вар.` : first.wear}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
