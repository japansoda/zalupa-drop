'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { InventoryItem, SkinEntity } from '../../lib/types';
import { SKINS_DATABASE, RARITY_CONFIG } from '../../data/skins';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { RarityBadge } from '../ui/RarityBadge';
import { WearBadge } from '../ui/WearBadge';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';
import { 
  FileText, 
  Sparkles, 
  Plus, 
  X, 
  Trash2, 
  ArrowUpDown, 
  Search, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

const MAX_SLOTS = 10;
const MIN_ITEMS = 3;

export const TradeUpContract: React.FC = () => {
  const { inventory, removeFromInventory, addToInventory, sellSkin, addLiveDrop } = useGameStore();
  const { t, locale } = useLanguage();

  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);
  const [isSigning, setIsSigning] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [wonSkin, setWonSkin] = useState<SkinEntity | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);

  // Inventory filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc');

  // Selected items objects
  const selectedItems = useMemo(() => {
    return selectedInstanceIds
      .map((id) => inventory.find((item) => item.instanceId === id))
      .filter((item): item is InventoryItem => Boolean(item));
  }, [selectedInstanceIds, inventory]);

  // Total value of items placed into the contract
  const totalInputDc = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.priceDc, 0);
  }, [selectedItems]);

  // Expected 98% RTP return
  const expectedReturnDc = Math.round(totalInputDc * 0.98);

  // Filtered available inventory
  const filteredInventory = useMemo(() => {
    return inventory
      .filter((item) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = (item.name || '').toLowerCase().includes(q);
          const matchWeapon = (item.weapon || '').toLowerCase().includes(q);
          if (!matchName && !matchWeapon) return false;
        }
        if (rarityFilter !== 'all' && item.rarity !== rarityFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'asc') return a.priceDc - b.priceDc;
        return b.priceDc - a.priceDc;
      });
  }, [inventory, searchQuery, rarityFilter, sortBy]);

  // Toggle item in contract
  const toggleItem = (instanceId: string) => {
    sound.playClick();
    if (selectedInstanceIds.includes(instanceId)) {
      setSelectedInstanceIds(selectedInstanceIds.filter((id) => id !== instanceId));
    } else {
      if (selectedInstanceIds.length >= MAX_SLOTS) return;
      setSelectedInstanceIds([...selectedInstanceIds, instanceId]);
    }
  };

  // Quick fill up to 10 cheapest available items
  const handleQuickFill = () => {
    sound.playClick();
    const currentSet = new Set(selectedInstanceIds);
    const sortedAvailable = [...inventory]
      .filter((item) => !currentSet.has(item.instanceId))
      .sort((a, b) => a.priceDc - b.priceDc);

    const needed = MAX_SLOTS - selectedInstanceIds.length;
    const toAdd = sortedAvailable.slice(0, needed).map((i) => i.instanceId);
    setSelectedInstanceIds([...selectedInstanceIds, ...toAdd]);
  };

  // Clear all selected slots
  const handleClear = () => {
    sound.playClick();
    setSelectedInstanceIds([]);
  };

  // Sign contract logic with calibrated 98% RTP
  const handleSignContract = async () => {
    if (selectedItems.length < MIN_ITEMS || isSigning || totalInputDc <= 0) return;

    setIsSigning(true);
    sound.playClick();

    // 1. Trigger Stamp Animation after 600ms
    setTimeout(() => {
      setStamped(true);
      sound.playCashout();
    }, 600);

    // 2. Select winning skin with exact 98% RTP
    const targetEV = Math.max(10, totalInputDc * 0.98);

    // Filter candidate reward pool: exclude stickers/agents, prefer weapons & knives
    const minCandidatePrice = Math.max(5, Math.round(totalInputDc * 0.25));
    const maxCandidatePrice = Math.max(100, Math.round(totalInputDc * 4.5));

    let candidates = SKINS_DATABASE.filter(
      (s) =>
        s.weapon !== 'Sticker' &&
        s.weapon !== 'Agent' &&
        s.priceDc >= minCandidatePrice &&
        s.priceDc <= maxCandidatePrice
    );

    if (candidates.length < 20) {
      candidates = SKINS_DATABASE.filter(
        (s) =>
          s.weapon !== 'Sticker' &&
          s.priceDc >= Math.max(1, Math.round(totalInputDc * 0.1)) &&
          s.priceDc <= Math.round(totalInputDc * 8.0)
      );
    }
    if (candidates.length < 5) {
      candidates = SKINS_DATABASE.slice(0, 30);
    }

    // Solve weights for 98% RTP via binary search
    const prices = candidates.map((s) => Math.max(1, s.priceDc));
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);

    let weights: number[];
    if (targetEV <= minP) {
      weights = candidates.map(() => 1);
    } else if (targetEV >= maxP) {
      weights = prices.map((p) => Math.pow(p / maxP, 2));
    } else {
      let low = 0.01;
      let high = 4.0;
      let bestW = prices.map(() => 1);

      for (let iter = 0; iter < 24; iter++) {
        const mid = (low + high) / 2;
        const w = prices.map((p) => Math.pow(1 / p, mid));
        const sumW = w.reduce((a, b) => a + b, 0);
        const ev = prices.reduce((acc, p, idx) => acc + (w[idx] / sumW) * p, 0);

        bestW = w;
        if (ev > targetEV) {
          low = mid;
        } else {
          high = mid;
        }
      }
      weights = bestW;
    }

    const totalW = weights.reduce((a, b) => a + b, 0);
    let rnd = Math.random() * totalW;
    let pickedSkin = candidates[0];
    for (let i = 0; i < candidates.length; i++) {
      if (rnd <= weights[i]) {
        pickedSkin = candidates[i];
        break;
      }
      rnd -= weights[i];
    }

    // 3. Complete signing after 1.6s
    setTimeout(() => {
      // Remove input items
      removeFromInventory(selectedInstanceIds);

      // Add won item
      addToInventory([pickedSkin]);

      // Add to live drop feed
      addLiveDrop({
        id: `contract_${Date.now()}`,
        user: 'Вы (Контракт)',
        avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        skin: pickedSkin,
        caseName: 'Контракт обмена CS2',
        timestamp: Date.now(),
      });

      setWonSkin(pickedSkin);
      setShowWinModal(true);
      setIsSigning(false);
      setStamped(false);
      setSelectedInstanceIds([]);
      sound.playReward();
    }, 1800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
      {/* 1. CONTRACT DOSSIER BOARD */}
      <div className="relative rounded-3xl glass-panel border border-yellow-400/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-yellow-400/10 blur-3xl pointer-events-none -z-10" />

        {/* Dossier Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shadow-lg text-yellow-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {t('contract.title')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-yellow-400 text-black shadow-sm uppercase tracking-wider">
                  RTP 98%
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {t('contract.subtitle')}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={handleQuickFill}
              disabled={selectedInstanceIds.length >= MAX_SLOTS || inventory.length === 0 || isSigning}
              className="px-3.5 py-2 rounded-xl text-xs font-bold glass-button flex items-center gap-1.5 text-white/80 hover:text-yellow-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>{t('contract.fillCheapest')}</span>
            </button>

            {selectedInstanceIds.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isSigning}
                className="px-3 py-2 rounded-xl text-xs font-bold glass-button text-white/50 hover:text-red-400 cursor-pointer transition-all flex items-center gap-1"
                title={t('contract.clear')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 10 CONTRACT SLOTS (2 rows of 5) */}
        <div className="py-8 relative">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: MAX_SLOTS }).map((_, index) => {
              const item = selectedItems[index];
              const config = item ? RARITY_CONFIG[item.rarity] || RARITY_CONFIG.milspec : null;

              return (
                <div
                  key={index}
                  className={`relative rounded-2xl p-3 flex flex-col justify-between items-center transition-all min-h-[140px] sm:min-h-[155px] ${
                    item
                      ? 'glass-card border shadow-lg group hover:border-yellow-400/60'
                      : 'border-2 border-dashed border-white/10 bg-black/30 hover:border-white/20'
                  }`}
                  style={item && config ? { borderColor: config.color, borderBottomWidth: '3px' } : undefined}
                >
                  {/* Slot Number Badge */}
                  <div className="w-full flex items-center justify-between text-[10px] text-white/40 font-mono">
                    <span>#{index + 1}</span>
                    {item && (
                      <button
                        type="button"
                        onClick={() => toggleItem(item.instanceId)}
                        disabled={isSigning}
                        className="w-5 h-5 rounded-full bg-black/60 hover:bg-red-500/30 text-white/50 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                        title="Убрать из слота"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {item ? (
                    <>
                      {/* Skin Image */}
                      <div className="w-full h-16 sm:h-20 flex items-center justify-center my-1">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Title & Price */}
                      <div className="w-full flex flex-col text-center">
                        <span className="text-[11px] font-bold text-white truncate">{item.weapon}</span>
                        <span
                          className="text-[10px] truncate font-semibold"
                          style={{ color: config?.color }}
                        >
                          {item.skinName}
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-1 text-yellow-400 font-mono text-xs font-black">
                          <DropCoinIcon size={12} />
                          <span>{item.priceDc.toLocaleString('ru-RU')}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center my-auto text-white/20">
                      <Plus className="w-6 h-6 stroke-[1.5]" />
                      <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">
                        {t('contract.emptySlot')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AUTHENTIC CS2 SIGNED STAMP OVERLAY */}
          <AnimatePresence>
            {stamped && (
              <motion.div
                initial={{ scale: 2.5, opacity: 0, rotate: -25 }}
                animate={{ scale: 1, opacity: 1, rotate: -15 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                className="absolute inset-0 m-auto w-72 h-32 border-4 border-red-500/80 rounded-2xl flex flex-col items-center justify-center bg-red-950/60 backdrop-blur-sm pointer-events-none shadow-[0_0_40px_rgba(239,68,68,0.5)] z-30"
              >
                <span className="text-3xl font-black text-red-500 uppercase tracking-widest border-b-2 border-red-500/60 pb-1">
                  ПОДПИСАНО
                </span>
                <span className="text-xs font-mono text-red-300/80 mt-1 uppercase tracking-wider">
                  APPROVED BY CS2 PROTOCOL
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 bg-black/40 -mx-6 -mb-6 p-6 sm:-mx-8 sm:-mb-8 sm:p-8 rounded-b-3xl">
          {/* Values breakdown */}
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex flex-col">
              <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                {t('contract.totalValue')}
              </span>
              <div className="flex items-center gap-1.5">
                <DropCoinIcon size={20} />
                <span className="font-mono font-black text-xl text-yellow-400">
                  {totalInputDc.toLocaleString('ru-RU')} DC
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block" />

            <div className="flex flex-col">
              <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                {t('contract.expectedRtp')}
              </span>
              <span className="font-mono font-black text-sm text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ~{expectedReturnDc.toLocaleString('ru-RU')} DC (98%)
              </span>
            </div>
          </div>

          {/* Main Action Button */}
          <button
            type="button"
            onClick={handleSignContract}
            disabled={selectedItems.length < MIN_ITEMS || isSigning}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
              selectedItems.length >= MIN_ITEMS && !isSigning
                ? 'btn-yellow text-black hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(250,204,21,0.4)]'
                : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>
              {isSigning
                ? t('contract.signing')
                : selectedItems.length < MIN_ITEMS
                ? `${t('contract.needMin')} (${selectedItems.length}/${MIN_ITEMS})`
                : `${t('contract.sign')} (${selectedItems.length}/10)`}
            </span>
          </button>
        </div>
      </div>

      {/* 2. INVENTORY SELECTION GRID */}
      <div className="flex flex-col gap-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              {locale === 'ru' ? 'Ваш инвентарь для контракта' : 'Your Inventory for Contract'}
            </h2>
            <span className="text-xs text-white/40 font-mono">
              ({inventory.length} {t('home.items')})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 focus-within:border-yellow-400 transition-colors w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder={t('home.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/30"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Order */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setSortBy(sortBy === 'asc' ? 'desc' : 'asc');
              }}
              className="px-3 py-1.5 rounded-xl glass-button text-xs font-bold text-white/80 hover:text-yellow-400 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-yellow-400" />
              <span>{sortBy === 'asc' ? 'Сначала дешевые ↑' : 'Сначала дорогие ↓'}</span>
            </button>
          </div>
        </div>

        {/* Inventory Cards */}
        {filteredInventory.length === 0 ? (
          <div className="py-16 text-center rounded-3xl glass-panel border border-white/5 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/30">
              <FileText className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-white/60">
              {t('contract.noItems')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredInventory.map((item) => {
              const isSelected = selectedInstanceIds.includes(item.instanceId);
              const config = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.milspec;

              return (
                <div
                  key={item.instanceId}
                  onClick={() => toggleItem(item.instanceId)}
                  className={`rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden group select-none ${
                    isSelected
                      ? 'bg-yellow-400/10 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-[1.02]'
                      : 'glass-card border border-white/10 hover:border-yellow-400/40 hover:-translate-y-1'
                  }`}
                  style={{ borderBottomWidth: '3px', borderBottomColor: config.color }}
                >
                  {/* Selected Overlay Checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black shadow-md">
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  <div className="flex items-center justify-between z-10">
                    <WearBadge skin={item} size="xs" />
                    <RarityBadge rarity={item.rarity} size="sm" />
                  </div>

                  <div className="w-full h-24 flex items-center justify-center my-1.5">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-contain group-hover:scale-110 transition-transform drop-shadow-md"
                    />
                  </div>

                  <div className="flex flex-col z-10">
                    <span className="text-xs font-bold text-white truncate">{item.weapon}</span>
                    <span
                      className="text-[11px] font-semibold truncate mb-2"
                      style={{ color: config.color }}
                    >
                      {item.skinName}
                    </span>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                      <div className="flex items-center gap-1">
                        <DropCoinIcon size={14} />
                        <span className="font-mono text-xs font-bold text-yellow-400">
                          {item.priceDc.toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">DC</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. CONTRACT WIN MODAL */}
      <AnimatePresence>
        {showWinModal && wonSkin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl glass-panel border border-yellow-400/40 p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_0_60px_rgba(250,204,21,0.4)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Confetti Glow Background */}
              <div className="absolute inset-0 bg-radial from-yellow-400/20 via-transparent to-transparent pointer-events-none -z-10" />

              <div className="w-16 h-16 rounded-3xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 mb-4 shadow-lg">
                <Sparkles className="w-8 h-8" />
              </div>

              <span className="text-xs font-black uppercase text-yellow-400 tracking-widest mb-1">
                {t('contract.won')}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {wonSkin.name}
              </h3>

              <div className="w-48 h-48 flex items-center justify-center my-4 relative">
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-40"
                  style={{
                    backgroundColor:
                      (RARITY_CONFIG[wonSkin.rarity] || RARITY_CONFIG.milspec).color,
                  }}
                />
                <img
                  src={wonSkin.image}
                  alt={wonSkin.name}
                  className="w-40 h-40 object-contain drop-shadow-2xl z-10 animate-bounce"
                  style={{ animationDuration: '3s' }}
                />
              </div>

              <div className="flex items-center gap-2 mb-6">
                <WearBadge skin={wonSkin} size="sm" showFullLabel />
                <RarityBadge rarity={wonSkin.rarity} size="sm" />
              </div>

              <div className="p-3 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-2 mb-6">
                <span className="text-xs text-white/50 uppercase font-semibold">
                  Стоимость:
                </span>
                <DropCoinIcon size={20} />
                <span className="font-mono font-black text-lg text-yellow-400">
                  {wonSkin.priceDc.toLocaleString('ru-RU')} DC
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowWinModal(false);
                    setWonSkin(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl btn-yellow text-black font-black text-sm cursor-pointer shadow-lg hover:scale-105 transition-all"
                >
                  {t('contract.toInventory')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const addedItem = inventory[0];
                    if (addedItem) sellSkin(addedItem.instanceId);
                    setShowWinModal(false);
                    setWonSkin(null);
                  }}
                  className="py-3 px-4 rounded-xl glass-button text-white/70 hover:text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <span>{t('contract.sell')}</span>
                  <span className="text-yellow-400 font-mono font-bold">
                    {wonSkin.priceDc.toLocaleString('ru-RU')} DC
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
