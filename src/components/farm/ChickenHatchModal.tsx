'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Check, Egg, Trophy } from 'lucide-react';
import { ChickenBreedId, CHICKEN_BREEDS, ChickenEntity } from '../../lib/farm';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';
import { StatTrakBadge } from '../ui/StatTrakBadge';
import { BreedEgg } from './BreedEgg';
import { AnimatedChicken } from './AnimatedChicken';

interface ChickenHatchModalProps {
  isOpen: boolean;
  slotIndex: number;
  onClose: () => void;
}

// 18 jagged procedural eggshell fragments bursting in 360-degree trajectories
const SHELL_SHARDS = [
  { id: 1, tx: -160, ty: -150, rot: -320, size: 30, path: 'M0,0 L24,4 L16,22 Z' },
  { id: 2, tx: 150, ty: -160, rot: 360, size: 34, path: 'M4,0 L28,10 L10,26 Z' },
  { id: 3, tx: -200, ty: -30, rot: -240, size: 28, path: 'M0,6 L20,0 L16,22 Z' },
  { id: 4, tx: 195, ty: -45, rot: 280, size: 32, path: 'M2,2 L24,4 L12,24 Z' },
  { id: 5, tx: -170, ty: 130, rot: -190, size: 36, path: 'M0,8 L26,0 L18,28 Z' },
  { id: 6, tx: 160, ty: 145, rot: 310, size: 28, path: 'M5,0 L24,12 L7,22 Z' },
  { id: 7, tx: -35, ty: -210, rot: -180, size: 32, path: 'M0,4 L22,0 L13,23 Z' },
  { id: 8, tx: 45, ty: -205, rot: 210, size: 30, path: 'M3,0 L26,7 L9,24 Z' },
  { id: 9, tx: -50, ty: 200, rot: 260, size: 34, path: 'M2,7 L23,0 L14,26 Z' },
  { id: 10, tx: 55, ty: 195, rot: -220, size: 32, path: 'M0,2 L25,5 L11,23 Z' },
  { id: 11, tx: -125, ty: -105, rot: 150, size: 24, path: 'M0,0 L16,5 L9,16 Z' },
  { id: 12, tx: 130, ty: -100, rot: -160, size: 26, path: 'M2,0 L18,7 L7,18 Z' },
  { id: 13, tx: -135, ty: 85, rot: 190, size: 22, path: 'M0,3 L16,0 L10,16 Z' },
  { id: 14, tx: 125, ty: 95, rot: -210, size: 25, path: 'M2,0 L17,9 L5,17 Z' },
  { id: 15, tx: -80, ty: -170, rot: 75, size: 26, path: 'M0,0 L20,3 L10,20 Z' },
  { id: 16, tx: 80, ty: 170, rot: -75, size: 26, path: 'M0,3 L20,0 L12,20 Z' },
  { id: 17, tx: -210, ty: 50, rot: 140, size: 28, path: 'M0,5 L22,0 L15,24 Z' },
  { id: 18, tx: 210, ty: -100, rot: -250, size: 30, path: 'M3,2 L24,5 L11,21 Z' },
];

export const ChickenHatchModal: React.FC<ChickenHatchModalProps> = ({
  isOpen,
  slotIndex,
  onClose,
}) => {
  const { farmSlots, hatchEgg } = useGameStore();
  const { locale } = useLanguage();

  const [phase, setPhase] = useState<'ready' | 'cracking' | 'hatched'>('ready');
  const [crackStage, setCrackStage] = useState<0 | 1 | 2 | 3>(0);
  const [showShards, setShowShards] = useState(false);
  const [hatchedChicken, setHatchedChicken] = useState<ChickenEntity | null>(null);

  const slot = farmSlots[slotIndex];
  const hasLuck = Boolean(slot?.hasLuckPotion);

  useEffect(() => {
    if (isOpen) {
      setPhase('ready');
      setCrackStage(0);
      setShowShards(false);
      setHatchedChicken(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartHatch = () => {
    sound.playClick();
    setPhase('cracking');
    setCrackStage(1);
    sound.playEggCrack();

    // Stage 2: deeper crack
    setTimeout(() => {
      setCrackStage(2);
      sound.playEggCrack();
    }, 450);

    // Stage 3: violent crack, shard explosion
    setTimeout(() => {
      setCrackStage(3);
      setShowShards(true);
      sound.playEggCrack();

      // Hatch chicken
      const chicken = hatchEgg(slotIndex);
      if (chicken) {
        setHatchedChicken(chicken);

        // Transition to hatched chicken reveal after shards start flying
        setTimeout(() => {
          setPhase('hatched');
          sound.playEggHatch();
          setTimeout(() => {
            sound.playChickenCluck();
          }, 200);

          const b = CHICKEN_BREEDS[chicken.breedId];
          const isHighRarity =
            b?.rarity === 'legendary' ||
            b?.rarity === 'covert' ||
            chicken.isStatTrak;

          confetti({
            particleCount: isHighRarity ? 220 : 120,
            spread: isHighRarity ? 100 : 75,
            origin: { y: 0.55 },
            colors: ['#ffd700', '#f59e0b', '#38bdf8', '#ffffff', '#22c55e', '#ef4444'],
          });
        }, 650);
      } else {
        onClose();
      }
    }, 950);
  };

  const breed = hatchedChicken ? CHICKEN_BREEDS[hatchedChicken.breedId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <style jsx>{`
        @keyframes eggWobble {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-7deg) scale(1.05);
          }
          75% {
            transform: rotate(7deg) scale(1.05);
          }
        }
        @keyframes shardFly {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          80% {
            opacity: 0.85;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0.3) rotate(var(--rot));
            opacity: 0;
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
        .animate-egg-wobble {
          animation: eggWobble 0.18s infinite;
        }
        .animate-shell-shard {
          animation: shardFly 1.25s cubic-bezier(0.12, 0.85, 0.35, 1) forwards;
        }
        .animate-sunburst {
          animation: sunburstSpin 24s linear infinite;
        }
      `}</style>

      <div className="relative w-full max-w-lg rounded-3xl bg-[#0d0e14] border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center text-center p-6 sm:p-8">
        {/* Close Button */}
        {phase === 'hatched' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Flying Eggshell Shards (Rendered at modal root so never cut off or prematurely unmounted) */}
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
                    fill: breed?.eggShellColor || '#f1f5f9',
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

        {/* Phase: Ready or Cracking */}
        {phase !== 'hatched' && (
          <div className="flex flex-col items-center my-4 sm:my-6 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border bg-amber-500/15 border-amber-500/30 text-amber-400 mb-3">
              <Egg className="w-3.5 h-3.5" />
              <span>{locale === 'ru' ? 'Инкубатор курятника' : 'Coop Incubator'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-2">
              {phase === 'cracking'
                ? locale === 'ru'
                  ? 'Скорлупа раскалывается...'
                  : 'Shell is cracking...'
                : locale === 'ru'
                ? 'Курочка готова вылупиться!'
                : 'Chicken ready to hatch!'}
            </h2>
            <p className="text-xs sm:text-sm text-white/50 max-w-sm mb-6">
              {hasLuck
                ? locale === 'ru'
                  ? '🍀 Зелье удачи активно! Повышенный шанс на элитных и тайных куриц!'
                  : '🍀 Luck potion active! Boosted elite & covert chicken chances!'
                : locale === 'ru'
                ? 'Нажмите, чтобы разбить скорлупу и выпустить новую боевую курочку!'
                : 'Click to crack the egg and release your new battle chicken!'}
            </p>

            {/* Egg Visual */}
            <div
              className={`relative cursor-pointer transition-transform my-3 ${
                phase === 'cracking'
                  ? crackStage === 1
                    ? 'animate-egg-wobble'
                    : crackStage === 2
                    ? 'scale-105 animate-egg-wobble'
                    : 'scale-115'
                  : 'hover:scale-105 active:scale-95'
              }`}
              onClick={phase === 'ready' ? handleStartHatch : undefined}
            >
              <BreedEgg
                breedId="white_inferno"
                size={160}
                crackStage={crackStage}
                glowing={true}
              />
            </div>

            {/* Action Prompt */}
            {phase === 'ready' && (
              <button
                type="button"
                onClick={handleStartHatch}
                className="mt-6 px-8 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(250,204,21,0.45)] hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>🐣</span>
                <span>{locale === 'ru' ? 'Разбить скорлупу!' : 'Crack Egg Open!'}</span>
              </button>
            )}

            {phase === 'cracking' && (
              <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 animate-pulse">
                <span>💥</span>
                <span>
                  {crackStage === 1
                    ? (locale === 'ru' ? 'Трещина скорлупы...' : 'Shell cracking...')
                    : (locale === 'ru' ? 'Раскол яйца!' : 'Bursting shell!')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Phase: Hatched Chicken Reveal */}
        {phase === 'hatched' && hatchedChicken && breed && (
          <div className="flex flex-col items-center w-full animate-in zoom-in-95 duration-300">
            {/* Header Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border mb-2"
              style={{
                borderColor: `${breed.color}50`,
                backgroundColor: `${breed.color}15`,
                color: breed.color,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{breed.rarityName}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-1">
              {locale === 'ru' ? hatchedChicken.name : hatchedChicken.nameEn}
            </h2>

            {/* Chicken Preview Card */}
            <div
              className="relative w-full rounded-3xl p-5 border bg-black/60 shadow-2xl flex flex-col items-center my-3 overflow-hidden"
              style={{
                borderColor: `${breed.color}50`,
                boxShadow: `0 0 35px ${breed.color}35`,
              }}
            >
              {/* StatTrak Badge */}
              {hatchedChicken.isStatTrak && (
                <div className="absolute top-4 left-4 z-20">
                  <StatTrakBadge size="sm" />
                </div>
              )}

              {/* Centered Sunburst Glow behind Chicken */}
              <div className="relative w-full h-44 flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-72 h-72 animate-sunburst opacity-25"
                    style={{
                      background: `conic-gradient(from 0deg, transparent 0deg 20deg, ${breed.color} 20deg 40deg, transparent 40deg 60deg, ${breed.color} 60deg 80deg, transparent 80deg 100deg, ${breed.color} 100deg 120deg, transparent 120deg 140deg, ${breed.color} 140deg 160deg, transparent 160deg 180deg, ${breed.color} 180deg 200deg, transparent 200deg 220deg, ${breed.color} 220deg 240deg, transparent 240deg 260deg, ${breed.color} 260deg 280deg, transparent 280deg 300deg, ${breed.color} 300deg 320deg, transparent 320deg 340deg, ${breed.color} 340deg 360deg)`,
                      maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0) 65%)',
                      WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0) 65%)',
                    }}
                  />
                </div>

                <div className="relative z-10 animate-bounce">
                  <AnimatedChicken
                    breedId={hatchedChicken.breedId}
                    isStatTrak={hatchedChicken.isStatTrak}
                    hasLuckPotion={hatchedChicken.hasLuckPotion}
                    size={140}
                  />
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-white/60 max-w-sm mt-2 text-center">
                {locale === 'ru' ? breed.description : breed.descriptionEn}
              </p>
            </div>

            {/* Action: Collect Chicken */}
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(250,204,21,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{locale === 'ru' ? 'Забрать в курятник' : 'Move to Coop'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
