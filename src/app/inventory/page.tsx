'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { LiveDropBar } from '../../components/layout/LiveDropBar';
import { RefillModal } from '../../components/layout/RefillModal';
import { RarityBadge } from '../../components/ui/RarityBadge';
import { WearBadge } from '../../components/ui/WearBadge';
import { DropCoinIcon } from '../../components/ui/DropCoinIcon';
import { useGameStore } from '../../store/useGameStore';
import { RARITY_CONFIG } from '../../data/skins';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';
import { Briefcase, ExternalLink, ShoppingBag, Box, Trash2 } from 'lucide-react';

export default function InventoryPage() {
  const { inventory, sellSkin, sellAllSkins } = useGameStore();
  const { t } = useLanguage();
  const [filterRarity, setFilterRarity] = useState<string>('all');

  const totalValueDc = inventory.reduce((acc, item) => acc + item.priceDc, 0);

  const filteredInventory = inventory.filter((item) => {
    if (filterRarity === 'all') return true;
    if (filterRarity === 'gold') {
      return (
        item.rarity === 'gold' ||
        item.rarity === 'extraordinary' ||
        item.weapon.includes('Knife') ||
        item.weapon.includes('Bayonet') ||
        item.weapon.includes('Karambit') ||
        item.weapon.includes('Daggers') ||
        item.weapon.includes('Gloves') ||
        item.weapon.includes('Wraps')
      );
    }
    if (filterRarity === 'covert') {
      return (item.rarity === 'covert' || item.rarity === 'contraband') &&
        !item.weapon.includes('Knife') &&
        !item.weapon.includes('Bayonet') &&
        !item.weapon.includes('Karambit') &&
        !item.weapon.includes('Daggers');
    }
    return item.rarity === filterRarity;
  });

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a]">
      <div>
        <Header />
        <LiveDropBar />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {t('inv.title')} ({inventory.length} {t('home.items')})
                </h1>
                <p className="text-xs text-white/50 mt-0.5">
                  {t('inv.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-panel border border-white/10">
                <span className="text-xs text-white/60 font-bold">{t('inv.totalValue')}</span>
                <div className="flex items-center gap-1.5">
                  <DropCoinIcon size={20} />
                  <span className="font-mono font-black text-lg text-yellow-400">
                    {totalValueDc.toLocaleString('ru-RU')} DC
                  </span>
                </div>
              </div>

              {inventory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    sellAllSkins();
                  }}
                  className="px-5 py-2.5 rounded-xl btn-yellow text-black font-black text-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('inv.sellAll')} ({totalValueDc.toLocaleString('ru-RU')} DC)</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar">
            {[
              { id: 'all', label: t('inv.tab.all') },
              { id: 'gold', label: t('inv.tab.gold') },
              { id: 'covert', label: t('inv.tab.covert') },
              { id: 'classified', label: t('inv.tab.classified') },
              { id: 'restricted', label: t('inv.tab.restricted') },
              { id: 'milspec', label: t('inv.tab.milspec') },
            ].map((tab) => {
              const isActive = filterRarity === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setFilterRarity(tab.id);
                  }}
                  className={`relative px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer z-10 ${
                    isActive ? 'text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeInventoryTab"
                      className="absolute inset-0 rounded-xl bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.35)] -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl glass-button -z-20" />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {filteredInventory.length === 0 ? (
            <div className="w-full max-w-md mx-auto py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl glass-panel border border-white/10 flex items-center justify-center mb-4">
                <Box className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-2">
                {t('inv.empty')}
              </h3>
              <p className="text-xs text-white/40 mb-6 max-w-xs">
                {inventory.length === 0
                  ? t('inv.emptyHint')
                  : t('inv.emptyFilter')}
              </p>
              <Link
                href="/"
                onClick={() => sound.playClick()}
                className="px-8 py-3.5 rounded-2xl btn-yellow text-black font-black text-sm uppercase tracking-wider transition-all"
              >
                {t('inv.openCases')}
              </Link>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={filterRarity}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              >
                {filteredInventory.map((item) => {
                  const config = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.milspec;
                  return (
                    <div
                      key={item.instanceId}
                      className="rounded-2xl glass-card p-3 flex flex-col justify-between border hover:border-yellow-400/40 transition-all group"
                      style={{ borderBottomWidth: '3px', borderBottomColor: config.color }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {item.statTrak && (
                            <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/40">
                              ST
                            </span>
                          )}
                          <WearBadge skin={item} size="xs" />
                        </div>
                        <RarityBadge rarity={item.rarity} size="sm" />
                      </div>

                      <div className="w-full h-28 flex items-center justify-center my-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 object-contain group-hover:scale-110 transition-transform filter drop-shadow-md"
                        />
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white truncate">{item.weapon}</span>
                        <span className="text-[11px] truncate mb-2" style={{ color: config.color }}>
                          {item.skinName}
                        </span>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 mb-2">
                          <div className="flex items-center gap-1">
                            <DropCoinIcon size={14} />
                            <span className="font-mono text-xs font-bold text-yellow-400">
                              {item.priceDc.toLocaleString('ru-RU')}
                            </span>
                          </div>

                          <a
                            href={item.steamMarketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-white transition-colors"
                            title="Открыть в Steam"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => sellSkin(item.instanceId)}
                          className="w-full py-1.5 rounded-lg glass-button text-[11px] font-bold text-yellow-400 hover:bg-yellow-400 hover:text-black flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>{t('inv.sell')} {item.priceDc} DC</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </section>
      </div>

      <Footer />
      <RefillModal />
    </main>
  );
}
