'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Check, Flame, Trophy } from 'lucide-react';
import { SkinEntity } from '../../lib/types';
import { ChickenBreedId, CHICKEN_BREEDS } from '../../lib/farm';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { SkinImage } from '../ui/SkinImage';
import { WearBadge } from '../ui/WearBadge';
import { StatTrakBadge } from '../ui/StatTrakBadge';
import { RarityBadge } from '../ui/RarityBadge';
import { RARITY_CONFIG } from '../../data/skins';
import { isStatTrakableItem } from '../../lib/steam';
import { BreedEgg } from './BreedEgg';

interface EggCrackingModalProps {
  isOpen: boolean;
  slotIndex: number;
  breedId: ChickenBreedId;
  onClose: () => void;
}

export const EggCrackingModal: React.FC<EggCrackingModalProps> = ({
  isOpen,
  slotIndex,
  breedId,
  onClose,
}) => {
  const { claimEggDrop, sellSkin } = useGameStore();
  const { locale } = useLanguage();

  const [phase, setPhase] = useState<'ready' | 'cracking' | 'revealed'>('ready');
  const [crackStage, setCrackStage] = useState<0 | 1 | 2 | 3>(0);
  const [droppedSkin, setDroppedSkin] = useState<SkinEntity | null>(null);

  const breed = CHICKEN_BREEDS[breedId] || CHICKEN_BREEDS.white_inferno;

  useEffect(() => {
    if (isOpen) {
      setPhase('ready');
      setCrackStage(0);
      setDroppedSkin(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartCrack = () => {
    sound.playClick();
    setPhase('cracking');
    setCrackStage(1);
    sound.playEggCrack();

    // Stage 2
    setTimeout(() => {
      setCrackStage(2);
      sound.playEggCrack();
    }, 550);

    // Stage 3 (Crack open & reveal)
    setTimeout(() => {
      setCrackStage(3);
      sound.playEggCrack();

      const skin = claimEggDrop(slotIndex);
      if (skin) {
        setDroppedSkin(skin);
        setPhase('revealed');
        sound.playWin(skin.rarity);

        const isHighTier = skin.priceDc >= 10000 || skin.name.startsWith('★') || skin.rarity === 'gold' || skin.rarity === 'extraordinary';
        const isMidTier = skin.priceDc >= 1000;

        if (isHighTier) {
          confetti({
            particleCount: 240,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#ffd700', '#f59e0b', '#ef4444', '#38bdf8', '#ffffff'],
          });
        } else if (isMidTier) {
          confetti({
            particleCount: 140,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#facc15', '#ffffff', '#38bdf8', '#eab308', '#ec4899'],
          });
        } else {
          confetti({
            particleCount: 70,
            spread: 55,
            origin: { y: 0.6 },
            colors: ['#38bdf8', '#ffffff', '#facc15'],
          });
        }
      } else {
        onClose();
      }
    }, 1150);
  };

  const handleSell = () => {
    if (!droppedSkin) return;
    const inv = useGameStore.getState().inventory;
    const item = inv.find((i) => i.id === droppedSkin.id);
    if (item?.instanceId) {
      sellSkin(item.instanceId);
    }
    onClose();
  };

  const rarityCfg = droppedSkin ? (RARITY_CONFIG[droppedSkin.rarity] || RARITY_CONFIG.milspec) : RARITY_CONFIG.milspec;
  const isLegendaryDrop = droppedSkin && (droppedSkin.priceDc >= 10000 || droppedSkin.name.startsWith('★') || droppedSkin.rarity === 'gold');
  const isRareDrop = droppedSkin && !isLegendaryDrop && droppedSkin.priceDc >= 1000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <style jsx>{`
        @keyframes eggWobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg) scale(1.03); }
          75% { transform: rotate(5deg) scale(1.03); }
        }
        @keyframes sunburstSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-egg-wobble {
          animation: eggWobble 0.22s infinite;
        }
        .animate-sunburst {
          animation: sunburstSpin 20s linear infinite;
        }
      `}</style>

      <div className="relative w-full max-w-lg rounded-3xl bg-[#0d0e14] border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center text-center p-6 sm:p-8">
        {/* Close Button */}
        {phase === 'revealed' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Breed Attribution Pill */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border"
          style={{
            borderColor: `${breed.color}40`,
            backgroundColor: `${breed.color}15`,
            color: breed.color,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{locale === 'ru' ? (breed.eggNameRu || breed.name) : (breed.eggNameEn || breed.nameEn)}</span>
        </div>

        {/* Phase: Ready or Cracking */}
        {phase !== 'revealed' && (
          <div className="flex flex-col items-center my-4 sm:my-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-2">
              {phase === 'cracking'
                ? locale === 'ru'
                  ? 'Яйцо раскалывается...'
                  : 'Egg is cracking...'
                : locale === 'ru'
                ? 'Дроп-яйцо готово!'
                : 'Drop Egg is ready!'}
            </h2>
            <p className="text-xs sm:text-sm text-white/50 max-w-sm mb-6">
              {locale === 'ru'
                ? 'Внутри находится подлинное оружие, нож или перчатки CS2'
                : 'Inside lies an authentic CS2 weapon, knife, or gloves skin'}
            </p>

            {/* Unique Breed Egg with Live Cracking Animation */}
            <div
              className={`relative cursor-pointer transition-transform ${
                phase === 'cracking'
                  ? crackStage === 1
                    ? 'animate-egg-wobble'
                    : crackStage === 2
                    ? 'scale-105 animate-egg-wobble'
                    : 'scale-110'
                  : 'hover:scale-105 active:scale-95'
              }`}
              onClick={phase === 'ready' ? handleStartCrack : undefined}
            >
              <BreedEgg
                breedId={breedId}
                size={160}
                crackStage={crackStage}
                glowing={true}
              />
            </div>

            {/* Action Prompt */}
            {phase === 'ready' && (
              <button
                type="button"
                onClick={handleStartCrack}
                className="mt-8 py-3.5 px-8 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(250,204,21,0.35)] active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>{locale === 'ru' ? 'Разбить яйцо' : 'Crack Open Egg'}</span>
              </button>
            )}

            {phase === 'cracking' && (
              <div className="mt-8 flex items-center gap-2 text-xs font-mono font-bold text-yellow-400 animate-pulse">
                <span>{crackStage === 1 ? '⚡ Трещина скорлупы...' : '💥 Пробитие ядра!'}</span>
              </div>
            )}
          </div>
        )}

        {/* Phase: Revealed Skin */}
        {phase === 'revealed' && droppedSkin && (
          <div className="flex flex-col items-center w-full animate-in zoom-in-95 duration-300">
            {/* Value-Based Celebration Banner */}
            {isLegendaryDrop ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-yellow-400 border border-amber-400/40 text-xs font-black uppercase tracking-wider mb-2 animate-bounce">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>{locale === 'ru' ? '★ ЛЕГЕНДАРНЫЙ ДРОП! ★' : '★ LEGENDARY DROP! ★'}</span>
              </div>
            ) : isRareDrop ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30 text-xs font-black uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>{locale === 'ru' ? '★ ЭЛИТНЫЙ CS2 ДРОП! ★' : '★ ELITE CS2 DROP! ★'}</span>
              </div>
            ) : (
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1">
                {locale === 'ru' ? '★ ПОЛУЧЕН СКИН!' : '★ SKIN UNLOCKED!'}
              </span>
            )}

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">
              {droppedSkin.skinName || droppedSkin.name}
            </h2>

            {/* Dropped Skin Card */}
            <div
              className="relative w-full rounded-3xl p-5 border bg-black/60 shadow-2xl flex flex-col items-center my-2 overflow-hidden"
              style={{
                borderColor: rarityCfg.border,
                boxShadow: isLegendaryDrop
                  ? `0 0 50px rgba(250,204,21,0.4)`
                  : `0 0 35px ${rarityCfg.color}40`,
              }}
            >
              {/* Legendary Rotating Sunburst Rays */}
              {isLegendaryDrop && (
                <div className="animate-sunburst absolute inset-0 -m-20 pointer-events-none opacity-20">
                  <div
                    className="w-full h-full"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg 20deg, #facc15 20deg 40deg, transparent 40deg 60deg, #facc15 60deg 80deg, transparent 80deg 100deg, #facc15 100deg 120deg, transparent 120deg 140deg, #facc15 140deg 160deg, transparent 160deg 180deg, #facc15 180deg 200deg, transparent 200deg 220deg, #facc15 220deg 240deg, transparent 240deg 260deg, #facc15 260deg 280deg, transparent 280deg 300deg, #facc15 300deg 320deg, transparent 320deg 340deg, #facc15 340deg 360deg)',
                    }}
                  />
                </div>
              )}

              {/* Top Badges */}
              <div className="w-full flex items-center justify-between mb-2 z-10">
                <div className="flex items-center gap-1.5">
                  {droppedSkin.statTrak && isStatTrakableItem(droppedSkin) && <StatTrakBadge size="sm" />}
                  <WearBadge skin={droppedSkin} size="sm" />
                </div>
                <RarityBadge rarity={droppedSkin.rarity} size="sm" />
              </div>

              {/* Skin Image */}
              <div className="w-full h-44 sm:h-52 flex items-center justify-center my-3 z-10">
                <SkinImage
                  src={droppedSkin.image}
                  alt={droppedSkin.name}
                  size={240}
                  className="w-full h-40 sm:h-48 object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300"
                />
              </div>

              {/* Weapon name & DC Price */}
              <div className="flex flex-col items-center z-10">
                <span className="text-xs text-white/50">{droppedSkin.weapon}</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <DropCoinIcon className="w-5 h-5" />
                  <span className="font-mono font-black text-xl text-yellow-400">
                    {droppedSkin.priceDc.toLocaleString('ru-RU')} DC
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{locale === 'ru' ? 'Забрать' : 'Keep'}</span>
              </button>

              <button
                type="button"
                onClick={handleSell}
                className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <DropCoinIcon className="w-4 h-4" />
                <span>
                  {locale === 'ru'
                    ? `Продать (+${droppedSkin.priceDc.toLocaleString('ru-RU')} DC)`
                    : `Sell (+${droppedSkin.priceDc.toLocaleString('ru-RU')} DC)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
