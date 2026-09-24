'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Egg, Sparkles, Check, DollarSign } from 'lucide-react';
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
  const [crackStage, setCrackStage] = useState<number>(0);
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

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#facc15', '#ffffff', '#38bdf8', '#eab308', '#ec4899'],
        });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0d0e14] border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center text-center p-6 sm:p-8">
        {/* Close Button */}
        {phase === 'revealed' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
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
          <Egg className="w-3.5 h-3.5" />
          <span>{locale === 'ru' ? `Яйцо от: ${breed.name}` : `Egg from: ${breed.nameEn}`}</span>
        </div>

        {/* Phase: Ready or Cracking */}
        {phase !== 'revealed' && (
          <div className="flex flex-col items-center my-6">
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

            {/* Egg Visual with Cracks */}
            <div
              className={`relative w-48 h-56 flex items-center justify-center cursor-pointer transition-transform ${
                phase === 'cracking'
                  ? crackStage === 1
                    ? 'animate-wobble'
                    : crackStage === 2
                    ? 'scale-105 animate-pulse'
                    : 'scale-110'
                  : 'hover:scale-105 active:scale-95'
              }`}
              onClick={phase === 'ready' ? handleStartCrack : undefined}
            >
              <style jsx>{`
                @keyframes eggWobble {
                  0%, 100% { transform: rotate(0deg); }
                  25% { transform: rotate(-4deg); }
                  75% { transform: rotate(4deg); }
                }
                .animate-wobble {
                  animation: eggWobble 0.25s infinite;
                }
              `}</style>

              {/* Ambient Glow */}
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-60"
                style={{
                  background: `radial-gradient(circle, ${breed.color} 0%, transparent 70%)`,
                }}
              />

              <svg viewBox="0 0 160 200" className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]">
                <defs>
                  <linearGradient id="eggShellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="40%" stopColor="#fde047" />
                    <stop offset="70%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#a16207" />
                  </linearGradient>
                </defs>

                {/* Egg Body */}
                <path
                  d="M 80 15 C 38 15 22 75 22 130 C 22 172 48 188 80 188 C 112 188 138 172 138 130 C 138 75 122 15 80 15 Z"
                  fill="url(#eggShellGrad)"
                  stroke="#78350f"
                  strokeWidth="3"
                />

                {/* Shading / Reflection */}
                <path
                  d="M 45 60 C 45 40 60 25 78 22 C 70 24 55 35 52 55 C 50 68 55 80 50 82 C 46 82 45 72 45 60 Z"
                  fill="#ffffff"
                  opacity="0.45"
                />

                {/* Crack Stage 1 */}
                {crackStage >= 1 && (
                  <path
                    d="M 80 30 L 74 58 L 86 78 L 76 102 L 88 118"
                    stroke="#451a03"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}

                {/* Crack Stage 2 */}
                {crackStage >= 2 && (
                  <>
                    <path
                      d="M 86 78 L 105 85 L 118 72 M 76 102 L 55 110 L 42 105"
                      stroke="#451a03"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M 88 118 L 82 145 L 94 165"
                      stroke="#451a03"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </>
                )}

                {/* Crack Stage 3 - Full Split Flash */}
                {crackStage >= 3 && (
                  <g>
                    <polygon points="80,10 90,80 145,130 80,195 15,130 70,80" fill="#ffffff" opacity="0.8" />
                  </g>
                )}
              </svg>
            </div>

            {phase === 'ready' && (
              <button
                type="button"
                onClick={handleStartCrack}
                className="mt-6 px-8 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(250,204,21,0.4)] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{locale === 'ru' ? 'Разбить яйцо!' : 'Crack Egg!'}</span>
              </button>
            )}
          </div>
        )}

        {/* Phase: Revealed Skin */}
        {phase === 'revealed' && droppedSkin && (
          <div className="flex flex-col items-center w-full animate-in zoom-in-95 fade-in duration-300">
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1">
              {locale === 'ru' ? '★ ПОЛУЧЕН СКИH!' : '★ SKIN UNLOCKED!'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">
              {droppedSkin.skinName || droppedSkin.name}
            </h2>

            {/* Dropped Skin Card */}
            <div
              className="relative w-full rounded-3xl p-5 border bg-black/60 shadow-2xl flex flex-col items-center my-2"
              style={{
                borderColor: rarityCfg.border,
                boxShadow: `0 0 35px ${rarityCfg.color}40`,
              }}
            >
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {droppedSkin.statTrak && isStatTrakableItem(droppedSkin) && <StatTrakBadge size="sm" />}
                  <WearBadge skin={droppedSkin} size="sm" />
                </div>
                <RarityBadge rarity={droppedSkin.rarity} size="sm" />
              </div>

              <div className="w-full h-44 sm:h-52 flex items-center justify-center my-3">
                <SkinImage
                  src={droppedSkin.image}
                  alt={droppedSkin.name}
                  size={240}
                  className="w-full h-40 sm:h-48 object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300"
                />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs text-white/50">{droppedSkin.weapon}</span>
                <div className="flex items-center gap-2 mt-2">
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
                <DollarSign className="w-4 h-4" />
                <span>
                  {locale === 'ru'
                    ? `Продать (+${droppedSkin.priceDc.toLocaleString('ru-RU')})`
                    : `Sell (+${droppedSkin.priceDc.toLocaleString('ru-RU')})`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
