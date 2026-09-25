'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { LiveDropBar } from '../../components/layout/LiveDropBar';
import { RefillModal } from '../../components/layout/RefillModal';
import { DropCoinIcon } from '../../components/ui/DropCoinIcon';
import { AnimatedChicken } from '../../components/farm/AnimatedChicken';
import { DepositSkinsModal } from '../../components/farm/DepositSkinsModal';
import { EggCrackingModal } from '../../components/farm/EggCrackingModal';
import { ChickenHatchModal } from '../../components/farm/ChickenHatchModal';
import { ChickenDetailsModal } from '../../components/farm/ChickenDetailsModal';
import { BreedEgg } from '../../components/farm/BreedEgg';
import { CHICKEN_BREEDS, ChickenBreedId, CHICKEN_FEED_COST_DC } from '../../lib/farm';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';
import {
  Egg,
  Sparkles,
  Plus,
  Clock,
  Wheat,
  Zap,
  Check,
  Info,
  Bird,
  Clover,
} from 'lucide-react';

function formatTimer(msRemaining: number): string {
  if (msRemaining <= 0) return '00:00';
  const totalSec = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function ChickenFarmPage() {
  const {
    farmSlots,
    farmEggTokens,
    placeEggToken,
    hatchEgg,
    feedChicken,
    speedUpIncubation,
    speedUpEggProduction,
    balance,
  } = useGameStore();
  const { locale } = useLanguage();

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [targetSlotForDeposit, setTargetSlotForDeposit] = useState<number | undefined>(undefined);

  const [crackModal, setCrackModal] = useState<{
    isOpen: boolean;
    slotIndex: number;
    breedId: ChickenBreedId;
  }>({
    isOpen: false,
    slotIndex: 0,
    breedId: 'white_inferno',
  });

  const [chickenModal, setChickenModal] = useState<{
    isOpen: boolean;
    slotIndex: number;
  }>({
    isOpen: false,
    slotIndex: 0,
  });

  const handleOpenChickenModal = (slotIndex: number) => {
    sound.playClick();
    setChickenModal({
      isOpen: true,
      slotIndex,
    });
  };

  const [hatchSlot, setHatchSlot] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [isDraggingGrain, setIsDraggingGrain] = useState(false);
  const [isFeedModeActive, setIsFeedModeActive] = useState(false);

  // Live timer tick every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalChickensCount = farmSlots.filter((s) => s.status === 'chicken' || s.status === 'egg_ready').length;
  const hungryChickensCount = farmSlots.filter((s) => s.status === 'chicken' && s.feedStatus === 'hungry').length;
  const totalEggsLaid = farmSlots.reduce((sum, s) => sum + (s.chicken?.eggsLaidCount || 0), 0);

  const handleOpenDepositModal = (slotIndex?: number) => {
    sound.playClick();
    setTargetSlotForDeposit(slotIndex);
    setDepositModalOpen(true);
  };

  const handleDragStartGrain = (e: React.DragEvent) => {
    setIsDraggingGrain(true);
    e.dataTransfer.setData('text/plain', 'grain_feed');
  };

  const handleDragEndGrain = () => {
    setIsDraggingGrain(false);
  };

  const handleToggleFeedMode = () => {
    sound.playClick();
    setIsFeedModeActive((prev) => !prev);
  };

  const handleDropOnSlot = (slotIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGrain(false);
    const data = e.dataTransfer.getData('text/plain');
    if (data === 'grain_feed') {
      const slot = farmSlots[slotIndex];
      if (slot && slot.status === 'chicken' && slot.feedStatus === 'hungry') {
        if (balance < CHICKEN_FEED_COST_DC) {
          sound.playError();
          useGameStore.getState().setRefillOpen(true);
          return;
        }
        feedChicken(slotIndex);
      }
    }
  };

  const handleDragOverSlot = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleHatch = (slotIndex: number) => {
    sound.playClick();
    setHatchSlot(slotIndex);
  };

  const handleOpenCrackModal = (slotIndex: number, breedId: ChickenBreedId) => {
    sound.playClick();
    setCrackModal({
      isOpen: true,
      slotIndex,
      breedId,
    });
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a] text-white pb-20 md:pb-8">
      <div>
        <Header />
        <LiveDropBar />
        <RefillModal />

        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#181108] via-[#0f0c08] to-[#08080a] py-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-3">
                <Egg className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Куриный курятник CS2' : 'CS2 Chicken Coop'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
                {locale === 'ru' ? 'ФЕРМА' : 'CHICKEN'}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500">
                  {locale === 'ru' ? 'КУРИЦ' : 'FARM'}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-white/60 max-w-xl mt-2 font-medium">
                {locale === 'ru'
                  ? 'Вынашивайте редких боевых курочек, кормите их зерном и собирайте оружейные яйца с ценным дропом скинов!'
                  : 'Incubate rare combat chickens, feed them grain and crack open weapon eggs with high-tier CS2 drops!'}
              </p>
            </div>

            {/* Farm Stats & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#0d0e14] px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Bird className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/40 uppercase">
                    {locale === 'ru' ? 'Курицы' : 'Chickens'}
                  </span>
                  <span className="font-mono font-black text-lg text-white">
                    {totalChickensCount} / 5
                  </span>
                </div>
              </div>

              {farmEggTokens > 0 && (
                <div className="bg-[#0d0e14] px-4 py-3 rounded-2xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                    <Egg className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-amber-400/80 uppercase">
                      {locale === 'ru' ? 'В корзине (запас)' : 'In Basket (Reserve)'}
                    </span>
                    <span className="font-mono font-black text-lg text-amber-300">
                      {farmEggTokens}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleOpenDepositModal()}
                className="px-5 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(250,204,21,0.35)] active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{locale === 'ru' ? 'Получить яйцо (10 скинов)' : 'Acquire Egg (10 skins)'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Prominent Grain Feeding Station Bar (Right Above Roosts) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0d0e14] border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Draggable Grain Feed Bowl with Tap-to-Feed toggle */}
              <div
                draggable
                onDragStart={handleDragStartGrain}
                onDragEnd={handleDragEndGrain}
                onClick={handleToggleFeedMode}
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all select-none ${
                  isFeedModeActive || isDraggingGrain
                    ? 'bg-amber-500 text-black border-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.6)] scale-105'
                    : 'bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-amber-700/30 border-amber-400/50 text-amber-400 hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                }`}
                title={locale === 'ru' ? 'Перетащите зерно на курицу или кликните!' : 'Drag grain onto a chicken or click!'}
              >
                <Wheat className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="text-[8px] font-black uppercase tracking-tight mt-0.5">
                  {isFeedModeActive
                    ? (locale === 'ru' ? 'Кормим...' : 'Feeding...')
                    : (locale === 'ru' ? 'Тяни корм' : 'Drag Grain')}
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                    {locale === 'ru' ? 'Кормушка: Отборное зерно CS2' : 'Feeding Station: CS2 Select Grain'}
                  </h3>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-mono font-black">
                    <DropCoinIcon className="w-3.5 h-3.5" />
                    <span>7 500 DC</span>
                  </div>
                  {hungryChickensCount > 0 && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      {locale === 'ru' ? `Голодных: ${hungryChickensCount}` : `Hungry: ${hungryChickensCount}`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50 max-w-xl mt-0.5">
                  {locale === 'ru'
                    ? 'Стоимость порции: 7 500 DC. Перетащите мешок с зерном на голодную курочку (или кликните по мешку, а затем по курице), чтобы начать вынашивание яйца с оружием CS2!'
                    : 'Cost per feed: 7,500 DC. Drag grain sack onto a hungry chicken (or tap sack then tap chicken) to start weapon egg laying!'}
                </p>
              </div>
            </div>

            {hungryChickensCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (balance < CHICKEN_FEED_COST_DC) {
                    sound.playError();
                    useGameStore.getState().setRefillOpen(true);
                    return;
                  }
                  useGameStore.getState().feedAllChickens();
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Wheat className="w-3.5 h-3.5" />
                <span>
                  {locale === 'ru'
                    ? `Покормить всех (${(hungryChickensCount * CHICKEN_FEED_COST_DC).toLocaleString('ru-RU')} DC)`
                    : `Feed all (${(hungryChickensCount * CHICKEN_FEED_COST_DC).toLocaleString('ru-RU')} DC)`}
                </span>
              </button>
            )}
          </div>
        </section>

        {/* Coop Roosts Section: 5 Chicken Slots */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                {locale === 'ru' ? 'Насесты курятника (5 слотов)' : 'Coop Roosts (5 slots)'}
              </h2>
            </div>

            {farmEggTokens > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black animate-pulse">
                <Egg className="w-4 h-4" />
                <span>
                  {locale === 'ru'
                    ? `В запасе яиц с кейсов: ${farmEggTokens}`
                    : `Bonus eggs from cases: ${farmEggTokens}`}
                </span>
              </div>
            )}
          </div>

          {/* 5 Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {farmSlots.map((slot, index) => {
              const breed = slot.chicken ? CHICKEN_BREEDS[slot.chicken.breedId] : null;

              // Check incubation countdown
              const isIncubating = slot.status === 'incubating';
              const incubatingMsLeft = (slot.incubatingUntil || 0) - now;
              const isIncubationDone = isIncubating && incubatingMsLeft <= 0;

              // Check egg production countdown
              const isProducingEgg = slot.status === 'chicken' && slot.feedStatus === 'producing';
              const eggProductionMsLeft = (slot.eggReadyUntil || 0) - now;
              const isEggReady = slot.status === 'egg_ready' || (isProducingEgg && eggProductionMsLeft <= 0);

              const isHungryChicken = slot.status === 'chicken' && slot.feedStatus === 'hungry' && !isEggReady;

              return (
                <div
                  key={index}
                  onDrop={(e) => handleDropOnSlot(index, e)}
                  onDragOver={handleDragOverSlot}
                  className={`relative rounded-3xl p-4 flex flex-col justify-between border transition-all min-h-[400px] bg-[#0d0e14] ${
                    (isDraggingGrain || isFeedModeActive) && isHungryChicken
                      ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_25px_rgba(251,191,36,0.35)] scale-[1.02]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Slot Header */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[10px] font-mono font-bold text-white/40 uppercase">
                      {locale === 'ru' ? `Насест #${index + 1}` : `Roost #${index + 1}`}
                    </span>

                    <div className="flex items-center gap-1">
                      {slot.hasLuckPotion && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-0.5"
                          title={locale === 'ru' ? 'Зелье удачи активно' : 'Luck potion active'}
                        >
                          <Clover className="w-3 h-3 text-emerald-300 fill-emerald-300/30" />
                        </span>
                      )}

                      {slot.chicken?.isStatTrak && (
                        <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          ST™
                        </span>
                      )}

                      {breed && (
                        <span
                          className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border"
                          style={{
                            borderColor: `${breed.color}40`,
                            backgroundColor: `${breed.color}15`,
                            color: breed.color,
                          }}
                        >
                          {locale === 'ru' ? breed.rarityName : breed.rarityNameEn}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Slot Body Content */}
                  <div className="flex-1 flex flex-col items-center justify-center my-auto">
                    {/* CASE 1: EMPTY SLOT */}
                    {slot.status === 'empty' && (
                      <div className="flex flex-col items-center text-center p-4">
                        <div className="w-18 h-18 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 mb-3 bg-white/[0.02]">
                          <Egg className="w-8 h-8 opacity-40" />
                        </div>
                        <span className="text-xs font-bold text-white/60 mb-1">
                          {locale === 'ru' ? 'Пустой насест' : 'Empty Roost'}
                        </span>
                        <p className="text-[10px] text-white/40 max-w-[140px] mb-4">
                          {locale === 'ru'
                            ? 'Заложите 10 скинов от 1к DC или яйцо с кейса'
                            : 'Sacrifice 10 skins >= 1k DC or use a case egg'}
                        </p>

                        {farmEggTokens > 0 ? (
                          <div className="flex flex-col items-center gap-2">
                            <button
                              type="button"
                              onClick={() => placeEggToken(index)}
                              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-1.5"
                            >
                              <Egg className="w-3.5 h-3.5" />
                              <span>{locale === 'ru' ? 'Поставить яйцо' : 'Place Egg'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDepositModal(index)}
                              className="text-[10px] text-white/40 hover:text-yellow-400 underline transition-colors"
                            >
                              {locale === 'ru' ? 'Или внести 10 скинов' : 'Or deposit 10 skins'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenDepositModal(index)}
                            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-yellow-400 font-bold text-xs uppercase tracking-wider border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{locale === 'ru' ? 'Внести 10 скинов' : 'Deposit 10'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* CASE 2: INCUBATING EGG */}
                    {isIncubating && (
                      <div className="flex flex-col items-center text-center w-full">
                        <div className="relative my-2">
                          <BreedEgg breedId="white_inferno" size={70} glowing={true} />
                        </div>

                        <span className="text-xs font-black text-white uppercase mt-2">
                          {isIncubationDone
                            ? locale === 'ru'
                              ? 'Готово к вылуплению!'
                              : 'Ready to hatch!'
                            : locale === 'ru'
                            ? 'Инкубация яйца'
                            : 'Incubating Egg'}
                        </span>

                        <div className="flex items-center gap-1.5 font-mono font-black text-sm text-yellow-400 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{isIncubationDone ? '00:00:00' : formatTimer(incubatingMsLeft)}</span>
                        </div>

                        {/* Speedup Button for 100,000 DC */}
                        {!isIncubationDone && (
                          <button
                            type="button"
                            onClick={() => {
                              if (balance < 100000) {
                                sound.playError();
                                return;
                              }
                              speedUpIncubation(index);
                            }}
                            disabled={balance < 100000}
                            className={`mt-3 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                              balance >= 100000
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95'
                                : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                            }`}
                            title={balance < 100000 ? (locale === 'ru' ? 'Нужно 100 000 DC' : '100,000 DC required') : ''}
                          >
                            <Zap className="w-3.5 h-3.5 text-yellow-400" />
                            <span>{locale === 'ru' ? 'Ускорить (100 000 DC)' : 'Speed up (100k DC)'}</span>
                          </button>
                        )}

                        {isIncubationDone && (
                          <button
                            type="button"
                            onClick={() => handleHatch(index)}
                            className="mt-3 w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-95 cursor-pointer animate-bounce flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>{locale === 'ru' ? 'Вылупить курочку!' : 'Hatch Chicken!'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* CASE 3: READY TO HATCH */}
                    {slot.status === 'hatch_ready' && (
                      <div className="flex flex-col items-center text-center w-full">
                        <div className="relative my-2">
                          <BreedEgg breedId="golden_nugget" size={70} crackStage={2} glowing={true} />
                        </div>

                        <span className="text-xs font-black text-yellow-400 uppercase mt-2">
                          {locale === 'ru' ? 'Яйцо трескается!' : 'Egg is cracking!'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleHatch(index)}
                          className="mt-3 w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-95 cursor-pointer animate-pulse flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{locale === 'ru' ? 'Вылупить курочку!' : 'Hatch Chicken!'}</span>
                        </button>
                      </div>
                    )}

                    {/* CASE 4: CHICKEN OCCUPIED */}
                    {slot.chicken && (slot.status === 'chicken' || slot.status === 'egg_ready') && (
                      <div className="flex flex-col items-center text-center w-full">
                        {/* Clickable Chicken Preview for Stats & Selling */}
                        <div
                          onClick={() => handleOpenChickenModal(index)}
                          className="cursor-pointer group relative flex flex-col items-center hover:scale-105 transition-transform"
                          title={locale === 'ru' ? 'Кликните для статистики и продажи курочки' : 'Click for chicken stats & selling'}
                        >
                          <AnimatedChicken
                            breedId={slot.chicken.breedId}
                            isHungry={isHungryChicken}
                            isEating={false}
                            isLaying={isProducingEgg || isEggReady}
                            isStatTrak={slot.chicken.isStatTrak}
                            hasLuckPotion={Boolean(slot.hasLuckPotion)}
                            eggsLaidCount={slot.chicken.eggsLaidCount}
                            size={135}
                          />

                          <div className="flex items-center gap-1 mt-2.5 mb-1 max-w-[150px]">
                            <span className="text-xs font-black text-white truncate group-hover:text-yellow-400 transition-colors">
                              {locale === 'ru' ? breed?.name : breed?.nameEn}
                            </span>
                            <Info className="w-3.5 h-3.5 text-white/40 group-hover:text-yellow-400 transition-colors shrink-0" />
                          </div>
                        </div>

                        {/* Status Controls */}
                        {isEggReady ? (
                          <div className="flex flex-col items-center w-full mt-3">
                            <div className="relative mb-2">
                              {slot.hasLuckPotion && (
                                <div className="absolute -top-2 -right-2 z-20 animate-bounce pointer-events-none">
                                  <Clover className="w-4 h-4 text-emerald-400 fill-emerald-400/40" />
                                </div>
                              )}
                              <BreedEgg
                                breedId={slot.readyEggBreed || slot.chicken.breedId}
                                size={55}
                                glowing={true}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenCrackModal(index, slot.readyEggBreed || slot.chicken!.breedId)}
                              className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-95 cursor-pointer animate-bounce flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>{locale === 'ru' ? 'Разбить яйцо!' : 'Crack Egg!'}</span>
                            </button>
                          </div>
                        ) : isProducingEgg ? (
                          <div className="flex flex-col items-center mt-3 w-full">
                            <span className="text-[10px] text-white/60">
                              {locale === 'ru' ? 'Снесёт яйцо через:' : 'Lays egg in:'}
                            </span>
                            <span className="font-mono font-black text-xs text-yellow-400 mt-0.5">
                              {formatTimer(eggProductionMsLeft)}
                            </span>

                            {/* Speedup Egg Production for 10,000 DC */}
                            <button
                              type="button"
                              onClick={() => {
                                if (balance < 10000) {
                                  sound.playError();
                                  return;
                                }
                                speedUpEggProduction(index);
                              }}
                              disabled={balance < 10000}
                              className={`mt-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                                balance >= 10000
                                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95'
                                  : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                              }`}
                              title={balance < 10000 ? (locale === 'ru' ? 'Нужно 10 000 DC' : '10,000 DC required') : ''}
                            >
                              <Zap className="w-3.5 h-3.5 text-yellow-400" />
                              <span>{locale === 'ru' ? 'Ускорить (10 000 DC)' : 'Speed up (10k DC)'}</span>
                            </button>
                          </div>
                        ) : (
                          /* Hungry State: No direct feed button, drag grain or tap */
                          <div
                            onClick={() => {
                              if (isFeedModeActive) {
                                if (balance < CHICKEN_FEED_COST_DC) {
                                  sound.playError();
                                  useGameStore.getState().setRefillOpen(true);
                                  return;
                                }
                                feedChicken(index);
                                setIsFeedModeActive(false);
                              }
                            }}
                            className={`mt-3 w-full py-2.5 px-2 rounded-xl text-center text-xs font-black uppercase tracking-wider border transition-all ${
                              isDraggingGrain || isFeedModeActive
                                ? 'bg-amber-500/30 text-amber-300 border-amber-400 animate-pulse cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-white/5 text-white/40 border-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <Wheat className="w-3.5 h-3.5 text-amber-400" />
                              <span>
                                {isDraggingGrain || isFeedModeActive
                                  ? (locale === 'ru' ? 'Сбросьте зерно (7 500 DC)' : 'Drop Grain (7,500 DC)')
                                  : (locale === 'ru' ? 'Голодна • Корм 7 500 DC' : 'Hungry • Grain 7,500 DC')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Breeds Reference Guide (All 12 CS2 Breeds with Egg Textures) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-16">
          <div className="p-6 rounded-3xl bg-[#0d0e14] border border-white/10 shadow-lg">
            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>{locale === 'ru' ? 'Породы боевых курочек и текстуры яиц (12 видов)' : 'Combat Chicken Breeds & Egg Textures (12 types)'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {Object.values(CHICKEN_BREEDS).map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl border bg-black/40 flex flex-col justify-between"
                  style={{ borderColor: `${b.color}35` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white">{locale === 'ru' ? b.name : b.nameEn}</span>
                      <span className="text-[10px] text-white/50">{locale === 'ru' ? b.eggNameRu : b.eggNameEn}</span>
                    </div>
                    <span
                      className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded"
                      style={{ color: b.color, backgroundColor: `${b.color}20` }}
                    >
                      {locale === 'ru' ? b.rarityName : b.rarityNameEn}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 my-2">
                    <BreedEgg breedId={b.id} size={36} glowing={false} />
                    <p className="text-[11px] text-white/60 leading-tight">
                      {locale === 'ru' ? b.description : b.descriptionEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sacrifice Deposit Modal */}
        <DepositSkinsModal
          isOpen={depositModalOpen}
          targetSlotIndex={targetSlotForDeposit}
          onClose={() => setDepositModalOpen(false)}
        />

        {/* Egg Cracking Modal */}
        <EggCrackingModal
          isOpen={crackModal.isOpen}
          slotIndex={crackModal.slotIndex}
          breedId={crackModal.breedId}
          onClose={() =>
            setCrackModal((prev) => ({
              ...prev,
              isOpen: false,
            }))
          }
        />

        {/* Chicken Hatching Modal */}
        <ChickenHatchModal
          isOpen={hatchSlot !== null}
          slotIndex={hatchSlot ?? 0}
          onClose={() => setHatchSlot(null)}
        />

        {/* Chicken Details & Selling Modal */}
        <ChickenDetailsModal
          isOpen={chickenModal.isOpen}
          slotIndex={chickenModal.slotIndex}
          onClose={() =>
            setChickenModal((prev) => ({
              ...prev,
              isOpen: false,
            }))
          }
        />
      </div>

      <Footer />
    </main>
  );
}
