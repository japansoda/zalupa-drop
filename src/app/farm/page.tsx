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
import { CHICKEN_BREEDS, ChickenBreedId } from '../../lib/farm';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';
import {
  Egg,
  Sparkles,
  Plus,
  Clock,
  Flame,
  Check,
  Wheat,
  RotateCcw,
  Zap,
  Info,
  ChevronRight,
  FastForward,
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
    feedAllChickens,
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

  const [now, setNow] = useState<number>(Date.now());
  const [isDraggingGrain, setIsDraggingGrain] = useState(false);

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

  const handleDropOnSlot = (slotIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGrain(false);
    const data = e.dataTransfer.getData('text/plain');
    if (data === 'grain_feed') {
      const slot = farmSlots[slotIndex];
      if (slot && slot.status === 'chicken' && slot.feedStatus === 'hungry') {
        feedChicken(slotIndex);
      }
    }
  };

  const handleDragOverSlot = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleHatch = (slotIndex: number) => {
    sound.playClick();
    hatchEgg(slotIndex);
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
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a] text-white">
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
                  <span className="text-lg">🐔</span>
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

              <div className="bg-[#0d0e14] px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                  <Egg className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/40 uppercase">
                    {locale === 'ru' ? 'Снесено яиц' : 'Eggs Laid'}
                  </span>
                  <span className="font-mono font-black text-lg text-yellow-400">
                    {totalEggsLaid}
                  </span>
                </div>
              </div>

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

        {/* Coop Roosts Section: 5 Chicken Slots */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
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

              return (
                <div
                  key={index}
                  onDrop={(e) => handleDropOnSlot(index, e)}
                  onDragOver={handleDragOverSlot}
                  className={`relative rounded-3xl p-4 flex flex-col justify-between border transition-all min-h-[380px] bg-[#0d0e14] ${
                    isDraggingGrain && slot.status === 'chicken' && slot.feedStatus === 'hungry'
                      ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_25px_rgba(251,191,36,0.35)] scale-[1.02]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Slot Number Badge */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[10px] font-mono font-bold text-white/40 uppercase">
                      {locale === 'ru' ? `Насест #${index + 1}` : `Roost #${index + 1}`}
                    </span>

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
                          <button
                            type="button"
                            onClick={() => placeEggToken(index)}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
                          >
                            <Egg className="w-3.5 h-3.5" />
                            <span>{locale === 'ru' ? 'Поставить яйцо' : 'Place Egg'}</span>
                          </button>
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
                        <div className="relative w-24 h-28 flex items-center justify-center my-2">
                          <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl animate-pulse" />
                          <svg viewBox="0 0 100 120" className="w-20 h-24 filter drop-shadow-lg">
                            <path
                              d="M 50 10 C 25 10 15 50 15 85 C 15 110 32 118 50 118 C 68 118 85 110 85 85 C 85 50 75 10 50 10 Z"
                              fill="#fde047"
                              stroke="#ca8a04"
                              strokeWidth="2.5"
                            />
                            <ellipse cx="40" cy="45" rx="8" ry="16" fill="#ffffff" opacity="0.4" />
                          </svg>
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

                        {/* Speedup Button for Testing / Dev */}
                        {!isIncubationDone && (
                          <button
                            type="button"
                            onClick={() => speedUpIncubation(index)}
                            className="mt-3 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-amber-300 border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Ускорить таймер для демонстрации"
                          >
                            <FastForward className="w-3 h-3" />
                            <span>{locale === 'ru' ? 'Ускорить (Тест)' : 'Speedup (Test)'}</span>
                          </button>
                        )}

                        {isIncubationDone && (
                          <button
                            type="button"
                            onClick={() => handleHatch(index)}
                            className="mt-3 w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-95 cursor-pointer animate-bounce"
                          >
                            🐣 {locale === 'ru' ? 'Вылупить курочку!' : 'Hatch Chicken!'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* CASE 3: READY TO HATCH */}
                    {slot.status === 'hatch_ready' && (
                      <div className="flex flex-col items-center text-center w-full">
                        <div className="relative w-24 h-28 flex items-center justify-center my-2">
                          <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-2xl animate-pulse" />
                          <svg viewBox="0 0 100 120" className="w-20 h-24 filter drop-shadow-xl animate-bounce">
                            <path
                              d="M 50 10 C 25 10 15 50 15 85 C 15 110 32 118 50 118 C 68 118 85 110 85 85 C 85 50 75 10 50 10 Z"
                              fill="#fde047"
                              stroke="#ca8a04"
                              strokeWidth="2.5"
                            />
                            <path d="M 50 30 L 45 60 L 55 80 L 48 100" stroke="#78350f" strokeWidth="2.5" fill="none" />
                          </svg>
                        </div>

                        <span className="text-xs font-black text-yellow-400 uppercase mt-2">
                          {locale === 'ru' ? 'Яйцо трескается!' : 'Egg is cracking!'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleHatch(index)}
                          className="mt-3 w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-95 cursor-pointer animate-pulse"
                        >
                          🐣 {locale === 'ru' ? 'Вылупить курочку!' : 'Hatch Chicken!'}
                        </button>
                      </div>
                    )}

                    {/* CASE 4: CHICKEN OCCUPIED */}
                    {slot.chicken && (slot.status === 'chicken' || slot.status === 'egg_ready') && (
                      <div className="flex flex-col items-center text-center w-full">
                        <AnimatedChicken
                          breedId={slot.chicken.breedId}
                          isHungry={slot.feedStatus === 'hungry' && !isEggReady}
                          isEating={isProducingEgg && !isEggReady}
                          isLaying={isEggReady}
                          size={135}
                        />

                        <span className="text-xs font-black text-white mt-1 truncate max-w-[150px]">
                          {locale === 'ru' ? breed?.name : breed?.nameEn}
                        </span>

                        <span className="text-[10px] text-white/40">
                          {locale === 'ru'
                            ? `Снесено: ${slot.chicken.eggsLaidCount || 0} яиц`
                            : `Laid: ${slot.chicken.eggsLaidCount || 0} eggs`}
                        </span>

                        {/* Status Controls */}
                        {isEggReady ? (
                          <button
                            type="button"
                            onClick={() => handleOpenCrackModal(index, slot.chicken!.breedId)}
                            className="mt-3 w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-95 cursor-pointer animate-bounce flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>{locale === 'ru' ? 'Разбить яйцо!' : 'Crack Egg!'}</span>
                          </button>
                        ) : isProducingEgg ? (
                          <div className="flex flex-col items-center mt-3 w-full">
                            <span className="text-[10px] text-white/60">
                              {locale === 'ru' ? 'Снесёт яйцо через:' : 'Lays egg in:'}
                            </span>
                            <span className="font-mono font-black text-xs text-yellow-400 mt-0.5">
                              {formatTimer(eggProductionMsLeft)}
                            </span>

                            <button
                              type="button"
                              onClick={() => speedUpEggProduction(index)}
                              className="mt-2 px-2.5 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-bold text-amber-300 border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Ускорить яйцекладку для демонстрации"
                            >
                              <FastForward className="w-2.5 h-2.5" />
                              <span>{locale === 'ru' ? 'Ускорить (Тест)' : 'Speedup (Test)'}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => feedChicken(index)}
                            className="mt-3 w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs uppercase tracking-wider active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Wheat className="w-3.5 h-3.5" />
                            <span>{locale === 'ru' ? 'Покормить' : 'Feed'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feeding Station Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="p-6 rounded-3xl bg-[#0d0e14] border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Draggable Grain Feed Bowl */}
              <div
                draggable
                onDragStart={handleDragStartGrain}
                onDragEnd={handleDragEndGrain}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-amber-700/30 border-2 border-amber-400/50 flex flex-col items-center justify-center text-amber-400 cursor-grab active:cursor-grabbing shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform"
                title={locale === 'ru' ? 'Перетащите зерно на курицу для кормления!' : 'Drag grain onto a chicken to feed!'}
              >
                <Wheat className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="text-[9px] font-black uppercase text-amber-300 mt-1">
                  {locale === 'ru' ? 'Тяни корм' : 'Drag Feed'}
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                    {locale === 'ru' ? 'Отборное зерно CS2' : 'CS2 Select Grain'}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {locale === 'ru' ? 'Бесплатно' : 'Free'}
                  </span>
                </div>
                <p className="text-xs text-white/50 max-w-md mt-1">
                  {locale === 'ru'
                    ? 'Кормите куриц бесплатным зерном: перетащите мешок на курицу или нажмите кнопку справа. Накормленная курица снесет яйцо с CS2 скином!'
                    : 'Feed your chickens free grain: drag the bowl onto a chicken or click Feed All. A fed chicken produces an authentic CS2 weapon egg!'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={feedAllChickens}
              disabled={hungryChickensCount === 0}
              className={`px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${
                hungryChickensCount > 0
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.35)] cursor-pointer active:scale-95'
                  : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
              }`}
            >
              <Wheat className="w-4 h-4" />
              <span>
                {locale === 'ru'
                  ? `Покормить всех куриц (${hungryChickensCount})`
                  : `Feed All Chickens (${hungryChickensCount})`}
              </span>
            </button>
          </div>
        </section>

        {/* Breeds Reference Guide */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-12">
          <div className="p-6 rounded-3xl bg-[#0d0e14] border border-white/10 shadow-lg">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>{locale === 'ru' ? 'Породы куриц и ценность дропа' : 'Chicken Breeds & Drop Odds'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.values(CHICKEN_BREEDS).map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-2xl border bg-black/40 flex flex-col justify-between"
                  style={{ borderColor: `${b.color}30` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white">{locale === 'ru' ? b.name : b.nameEn}</span>
                    <span
                      className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded"
                      style={{ color: b.color, backgroundColor: `${b.color}20` }}
                    >
                      {locale === 'ru' ? b.rarityName : b.rarityNameEn}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed mt-1">
                    {locale === 'ru' ? b.description : b.descriptionEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modals */}
        <DepositSkinsModal
          isOpen={depositModalOpen}
          onClose={() => setDepositModalOpen(false)}
          targetSlotIndex={targetSlotForDeposit}
        />

        <EggCrackingModal
          isOpen={crackModal.isOpen}
          slotIndex={crackModal.slotIndex}
          breedId={crackModal.breedId}
          onClose={() => setCrackModal((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>

      <Footer />
    </main>
  );
}
