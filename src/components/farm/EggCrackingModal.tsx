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

// 16 jagged procedural eggshell fragments bursting in 360-degree trajectories
const SHELL_SHARDS = [
  { id: 1, tx: -150, ty: -140, rot: -320, size: 28, path: 'M0,0 L24,4 L16,22 Z' },
  { id: 2, tx: 140, ty: -155, rot: 360, size: 32, path: 'M4,0 L28,10 L10,26 Z' },
  { id: 3, tx: -190, ty: -25, rot: -240, size: 26, path: 'M0,6 L20,0 L16,22 Z' },
  { id: 4, tx: 185, ty: -40, rot: 280, size: 30, path: 'M2,2 L24,4 L12,24 Z' },
  { id: 5, tx: -160, ty: 120, rot: -190, size: 34, path: 'M0,8 L26,0 L18,28 Z' },
  { id: 6, tx: 150, ty: 135, rot: 310, size: 27, path: 'M5,0 L24,12 L7,22 Z' },
  { id: 7, tx: -30, ty: -200, rot: -180, size: 31, path: 'M0,4 L22,0 L13,23 Z' },
  { id: 8, tx: 40, ty: -195, rot: 210, size: 29, path: 'M3,0 L26,7 L9,24 Z' },
  { id: 9, tx: -45, ty: 190, rot: 260, size: 33, path: 'M2,7 L23,0 L14,26 Z' },
  { id: 10, tx: 50, ty: 185, rot: -220, size: 30, path: 'M0,2 L25,5 L11,23 Z' },
  { id: 11, tx: -115, ty: -95, rot: 150, size: 22, path: 'M0,0 L16,5 L9,16 Z' },
  { id: 12, tx: 120, ty: -90, rot: -160, size: 24, path: 'M2,0 L18,7 L7,18 Z' },
  { id: 13, tx: -125, ty: 75, rot: 190, size: 20, path: 'M0,3 L16,0 L10,16 Z' },
  { id: 14, tx: 115, ty: 85, rot: -210, size: 23, path: 'M2,0 L17,9 L5,17 Z' },
  { id: 15, tx: 0, ty: -160, rot: 45, size: 25, path: 'M0,0 L20,3 L10,20 Z' },
  { id: 16, tx: 0, ty: 160, rot: -45, size: 25, path: 'M0,3 L20,0 L12,20 Z' },
];

export const EggCrackingModal: React.FC<EggCrackingModalProps> = ({
  isOpen,
  slotIndex,
  breedId,
  onClose,
}) => {
  const { farmSlots, claimEggDrop, sellSkin } = useGameStore();
  const { locale } = useLanguage();

  const [phase, setPhase] = useState<'ready' | 'cracking' | 'revealed'>('ready');
  const [crackStage, setCrackStage] = useState<0 | 1 | 2 | 3>(0);
  const [droppedSkin, setDroppedSkin] = useState<SkinEntity | null>(null);
  const [showShards, setShowShards] = useState(false);

  const slot = farmSlots[slotIndex];
  const hasLuck = Boolean(slot?.hasLuckPotion);
  const breed = CHICKEN_BREEDS[breedId] || CHICKEN_BREEDS.white_inferno;

  useEffect(() => {
    if (isOpen) {
      setPhase('ready');
      setCrackStage(0);
      setDroppedSkin(null);
      setShowShards(false);
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
    }, 450);

    // Stage 3 (Crack open, blast shards)
    setTimeout(() => {
      setCrackStage(3);
      setShowShards(true);
      sound.playEggCrack();

      // Reveal skin 650ms after shards start blasting
      setTimeout(() => {
        const skin = claimEggDrop(slotIndex);
        if (skin) {
          setDroppedSkin(skin);
          setPhase('revealed');
          sound.playWin(skin.rarity);

          const isHighTier =
            skin.priceDc >= 10000 ||
            skin.name.startsWith('★') ||
            skin.rarity === 'gold' ||
            skin.rarity === 'extraordinary';
          const isMidTier = skin.priceDc >= 1000;

          if (isHighTier) {
            confetti({
              particleCount: 260,
              spread: 110,
              origin: { y: 0.5 },
              colors: ['#ffd700', '#f59e0b', '#ef4444', '#38bdf8', '#ffffff', '#22c55e'],
            });
          } else if (isMidTier) {
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#facc15', '#ffffff', '#38bdf8', '#eab308', '#ec4899'],
            });
          } else {
            confetti({
              particleCount: 75,
              spread: 55,
              origin: { y: 0.6 },
              colors: ['#38bdf8', '#ffffff', '#facc15'],
            });
          }
        } else {
          onClose();
        }
      }, 650);
    }, 950);
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

  const rarityCfg = droppedSkin
    ? RARITY_CONFIG[droppedSkin.rarity] || RARITY_CONFIG.milspec
    : RARITY_CONFIG.milspec;
  const isLegendaryDrop =
    droppedSkin &&
    (droppedSkin.priceDc >= 10000 || droppedSkin.name.startsWith('★') || droppedSkin.rarity === 'gold');
  const isRareDrop = droppedSkin && !isLegendaryDrop && droppedSkin.priceDc >= 1000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <style jsx>{`
        @keyframes eggWobble {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-6deg) scale(1.04);
          }
          75% {
            transform: rotate(6deg) scale(1.04);
          }
        }
        @keyframes sunburstSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes shardFly {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          60% {
            opacity: 0.9;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0.4) rotate(var(--rot));
            opacity: 0;
          }
        }
        @keyframes floatClover {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(15deg);
          }
        }
        .animate-egg-wobble {
          animation: eggWobble 0.2s infinite;
        }
        .animate-sunburst {
          animation: sunburstSpin 22s linear infinite;
        }
        .animate-shell-shard {
          animation: shardFly 0.95s cubic-bezier(0.12, 0.85, 0.35, 1) forwards;
        }
        .animate-clover {
          animation: floatClover 2.2s ease-in-out infinite;
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

        {/* Flying Eggshell Shards (Rendered at modal root so shards persist flying across reveal) */}
        {showShards && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            {SHELL_SHARDS.map((shard) => (
              <svg
                key={shard.id}
                width={shard.size}
                height={shard.size}
                viewBox="0 0 32 32"
                className="absolute animate-shell-shard drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
                style={
                  {
                    '--tx': `${shard.tx}px`,
                    '--ty': `${shard.ty}px`,
                    '--rot': `${shard.rot}deg`,
                    fill: breed.eggShellColor || '#e2e8f0',
                    stroke: '#0f172a',
                    strokeWidth: 1.5,
                  } as React.CSSProperties
                }
              >
                <path d={shard.path} />
              </svg>
            ))}
          </div>
        )}

        {/* Breed Attribution & Luck Pill */}
        <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border"
            style={{
              borderColor: `${breed.color}40`,
              backgroundColor: `${breed.color}15`,
              color: breed.color,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{locale === 'ru' ? breed.eggNameRu || breed.name : breed.eggNameEn || breed.nameEn}</span>
          </div>

          {hasLuck && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-clover">
              <span>🍀 {locale === 'ru' ? 'Зелье удачи' : 'Luck Potion'}</span>
            </div>
          )}
        </div>

        {/* Phase: Ready or Cracking */}
        {phase !== 'revealed' && (
          <div className="flex flex-col items-center my-4 sm:my-6 relative">
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
              {hasLuck
                ? locale === 'ru'
                  ? '🍀 Зелье удачи активно! Повышенный шанс на ножи, перчатки и тайное!'
                  : '🍀 Luck potion active! Boosted knife, glove, and covert rates!'
                : locale === 'ru'
                ? 'Внутри находится подлинное оружие, нож или перчатки CS2'
                : 'Inside lies an authentic CS2 weapon, knife, or gloves skin'}
            </p>

            {/* Egg Container */}
            <div className="relative flex items-center justify-center my-2">
              {/* Egg Visual */}
              <div
                className={`relative cursor-pointer transition-transform ${
                  phase === 'cracking'
                    ? crackStage === 1
                      ? 'animate-egg-wobble'
                      : crackStage === 2
                      ? 'scale-105 animate-egg-wobble'
                      : 'scale-115'
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
                <span>{crackStage === 1 ? '⚡ Трещина скорлупы...' : '💥 Раскол скорлупы!'}</span>
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
                  ? `0 0 50px rgba(250,204,21,0.45)`
                  : `0 0 35px ${rarityCfg.color}40`,
              }}
            >
              {/* Top Badges */}
              <div className="w-full flex items-center justify-between mb-2 z-10">
                <div className="flex items-center gap-1.5">
                  {droppedSkin.statTrak && isStatTrakableItem(droppedSkin) && <StatTrakBadge size="sm" />}
                  <WearBadge skin={droppedSkin} size="sm" />
                </div>
                <RarityBadge rarity={droppedSkin.rarity} size="sm" />
              </div>

              {/* Skin Image Container with PERFECTLY CENTERED Sunburst directly behind the weapon */}
              <div className="relative w-full h-44 sm:h-52 flex items-center justify-center my-3 z-10">
                {isLegendaryDrop && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Soft diffuse ambient glow */}
                    <div className="absolute w-64 h-64 bg-[radial-gradient(circle_at_center,_rgba(250,204,21,0.22)_0%,_transparent_70%)]" />
                    {/* Sunburst rays with smooth gradual fade out (NO cut-off boundary) */}
                    <div
                      className="animate-sunburst w-80 h-80 shrink-0 opacity-40 pointer-events-none"
                      style={{
                        background:
                          'conic-gradient(from 0deg, transparent 0deg 18deg, #facc15 18deg 36deg, transparent 36deg 54deg, #facc15 54deg 72deg, transparent 72deg 90deg, #facc15 90deg 108deg, transparent 108deg 126deg, #facc15 126deg 144deg, transparent 144deg 162deg, #facc15 162deg 180deg, transparent 180deg 198deg, #facc15 198deg 216deg, transparent 216deg 234deg, #facc15 234deg 252deg, transparent 252deg 270deg, #facc15 270deg 288deg, transparent 288deg 306deg, #facc15 306deg 324deg, transparent 324deg 342deg, #facc15 342deg 360deg)',
                        maskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 25%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0) 65%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 25%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0) 65%)',
                      }}
                    />
                  </div>
                )}

                <SkinImage
                  src={droppedSkin.image}
                  alt={droppedSkin.name}
                  size={240}
                  className="relative z-10 w-full h-40 sm:h-48 object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-300"
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
