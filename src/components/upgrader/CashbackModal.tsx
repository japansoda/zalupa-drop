'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { SkinEntity, CaseItem } from '../../lib/types';
import { UpgradeToken } from '../../lib/consumables';
import { RARITY_CONFIG } from '../../data/skins';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { SkinImage } from '../ui/SkinImage';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';
import { Gift, FastForward, Check, Sparkles, Ticket, FlaskConical } from 'lucide-react';

interface CashbackModalProps {
  isOpen: boolean;
  caseItem?: CaseItem;
  winningSkin?: SkinEntity;
  awardedToken?: UpgradeToken;
  awardedPotion?: boolean;
  lostAmount: number;
  onClaim: () => void;
  onClose: () => void;
}

const ITEM_WIDTH = 150;
const ITEM_GAP = 12;
const WIN_INDEX = 32;
const REEL_SIZE = 40;

export const CashbackModal: React.FC<CashbackModalProps> = ({
  isOpen,
  caseItem,
  winningSkin,
  awardedToken,
  awardedPotion,
  lostAmount,
  onClaim,
  onClose,
}) => {
  const { t, locale } = useLanguage();
  const [isSpinning, setIsSpinning] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reelItems, setReelItems] = useState<SkinEntity[]>([]);

  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSoundTick = useRef<number>(0);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsSpinning(true);
      setIsRevealed(false);
      return;
    }

    if (awardedPotion && !winningSkin) {
      setIsSpinning(false);
      setIsRevealed(true);
      sound.playConsolation(true);
      return;
    }

    if (awardedToken && !winningSkin) {
      setIsSpinning(false);
      setIsRevealed(true);
      sound.playConsolation(false);
      return;
    }

    if (!winningSkin || !caseItem) return;

    // Build reel with winningSkin at WIN_INDEX
    const items: SkinEntity[] = [];
    const pool = caseItem.skins && caseItem.skins.length > 0 ? caseItem.skins : [winningSkin];

    for (let i = 0; i < REEL_SIZE; i++) {
      if (i === WIN_INDEX) {
        items.push(winningSkin);
      } else {
        items.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }
    setReelItems(items);
    setIsSpinning(true);
    setIsRevealed(false);

    // Start spin animation
    const containerWidth = containerRef.current?.offsetWidth || 560;
    const centerOffset = containerWidth / 2;
    const targetX = -(WIN_INDEX * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerOffset);

    controls.set({ x: 0 });

    const duration = 3.6;
    const startTime = Date.now();
    lastSoundTick.current = 0;

    const tickInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= duration) {
        clearInterval(tickInterval);
        return;
      }
      const progress = elapsed / duration;
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentPos = Math.abs(targetX * easeProgress);

      const itemsPassed = Math.floor(currentPos / (ITEM_WIDTH + ITEM_GAP));
      if (itemsPassed > lastSoundTick.current) {
        sound.playTick(0.85 + (1 - progress) * 0.35);
        lastSoundTick.current = itemsPassed;
      }
    }, 40);

    controls.start({
      x: targetX,
      transition: {
        duration,
        ease: [0.12, 0.85, 0.18, 1],
      },
    });

    spinTimerRef.current = setTimeout(() => {
      clearInterval(tickInterval);
      revealDrop();
    }, duration * 1000 + 150);

    return () => {
      clearInterval(tickInterval);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, [isOpen, caseItem, winningSkin, awardedToken]);

  const revealDrop = () => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    setIsSpinning(false);
    setIsRevealed(true);
    sound.playConsolation(false);
  };

  const handleSkip = () => {
    revealDrop();
  };

  if (!isOpen) return null;

  const rConf = awardedPotion
    ? RARITY_CONFIG.contraband
    : awardedToken
    ? RARITY_CONFIG[awardedToken.rarity] || RARITY_CONFIG.milspec
    : winningSkin
    ? RARITY_CONFIG[winningSkin.rarity] || RARITY_CONFIG.milspec
    : RARITY_CONFIG.milspec;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0d0e15] border-2 border-yellow-400/50 p-6 sm:p-8 shadow-[0_0_50px_rgba(250,204,21,0.25)] flex flex-col items-center text-center overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider mb-2">
          <Gift className="w-3.5 h-3.5" />
          <span>
            {awardedPotion
              ? t('cashback.badgePotion')
              : awardedToken
              ? t('cashback.badgeToken')
              : t('cashback.badgeCase')}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-1">
          {awardedPotion
            ? (locale === 'ru' ? 'Зелье удачи' : 'Luck Potion')
            : awardedToken
            ? (t('token.' + awardedToken.rarity) || awardedToken.name)
            : caseItem
            ? `${t('cashback.spinningCase')} «${caseItem.name}»`
            : t('cashback.badgeCase')}
        </h3>
        <p className="text-xs text-white/50 mb-6">
          {t('cashback.lostSub')} {lostAmount.toLocaleString('ru-RU')} DC
        </p>

        {/* STAGE 1: SPINNING REEL */}
        {!isRevealed ? (
          <div className="w-full flex flex-col items-center">
            {/* Roulette Viewport */}
            <div
              ref={containerRef}
              className="relative w-full h-44 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex items-center mb-6 shadow-inner"
            >
              {/* Center Needle Marker */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-yellow-400 z-20 shadow-[0_0_12px_#facc15]">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-solid border-t-[8px] border-t-yellow-400 border-x-[6px] border-x-transparent border-b-0" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-solid border-b-[8px] border-b-yellow-400 border-x-[6px] border-x-transparent border-t-0" />
              </div>

              {/* Scrolling Strip */}
              <motion.div
                animate={controls}
                className="flex items-center gap-3 pl-4"
                style={{ width: REEL_SIZE * (ITEM_WIDTH + ITEM_GAP) }}
              >
                {reelItems.map((item, idx) => {
                  const itemConf = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.milspec;
                  return (
                    <div
                      key={idx}
                      className="shrink-0 rounded-xl p-3 flex flex-col items-center justify-between border bg-black/40 relative overflow-hidden"
                      style={{
                        width: ITEM_WIDTH,
                        height: 140,
                        borderColor: itemConf.border,
                      }}
                    >
                      <div className="w-16 h-16 flex items-center justify-center my-auto">
                        <SkinImage
                          src={item.image}
                          alt={item.name}
                          size={80}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="w-full text-center truncate">
                        <p className="text-[11px] font-black text-white truncate">
                          {item.skinName || item.name}
                        </p>
                        <p className="text-[9px] text-white/40 truncate">{item.weapon}</p>
                      </div>
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ backgroundColor: itemConf.color }}
                      />
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-105"
            >
              <FastForward className="w-4 h-4 text-yellow-400" />
              <span>{t('cashback.skip')}</span>
            </button>
          </div>
        ) : (
          /* STAGE 2: REVEAL DROP IN THE SAME MODAL */
          <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
            {/* Display Card */}
            <div
              className="relative w-full max-w-sm rounded-3xl p-6 flex flex-col items-center justify-center border-2 mb-6 shadow-2xl"
              style={{
                backgroundColor: rConf.bg,
                borderColor: rConf.color,
                boxShadow: `0 0 35px ${rConf.color}40`,
              }}
            >
              {/* Card Body */}
              {awardedPotion ? (
                <div className="w-full flex flex-col items-center my-4">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-950/70 border-2 border-emerald-400 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                    <FlaskConical className="w-10 h-10 text-emerald-400 animate-pulse" />
                  </div>
                  <h4 className="font-black text-2xl text-white tracking-tight">
                    {locale === 'ru' ? 'Зелье удачи' : 'Luck Potion'}
                  </h4>
                  <p className="text-xs font-black mt-1 uppercase tracking-wider text-amber-400">
                    {locale === 'ru' ? '★ Контрабанда' : '★ Contraband'}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-400/40 shadow-inner">
                    <span className="font-mono font-black text-emerald-300 text-lg">
                      +15% {locale === 'ru' ? 'шанс (3 прокрута)' : 'chance (3 spins)'}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-2">
                    {locale === 'ru' ? 'Сверхредкий утешительный приз за крупный проигрыш!' : 'Ultra-rare consolation reward for major loss!'}
                  </p>
                </div>
              ) : awardedToken ? (
                <div className="w-full flex flex-col items-center my-4">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3 border-2 shadow-lg"
                    style={{
                      backgroundColor: `${rConf.color}15`,
                      borderColor: rConf.color,
                      boxShadow: `0 0 25px ${rConf.color}40`,
                    }}
                  >
                    <Ticket className="w-10 h-10" style={{ color: rConf.color }} />
                  </div>
                  <h4 className="font-black text-2xl text-white tracking-tight">
                    {t('token.' + awardedToken.rarity) || awardedToken.name}
                  </h4>
                  <p className="text-xs font-bold mt-1 uppercase tracking-wider" style={{ color: rConf.color }}>
                    {t('rarity.' + awardedToken.rarity) || rConf.label}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-black/60 border border-white/10">
                    <DropCoinIcon size={20} />
                    <span className="font-mono font-black text-yellow-400 text-xl">
                      +{awardedToken.valueDc.toLocaleString('ru-RU')} DC
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-2">
                    {t('cashback.maxTarget')} {awardedToken.maxTargetDc.toLocaleString('ru-RU')} DC
                  </p>
                </div>
              ) : winningSkin ? (
                <>
                  {/* StatTrak badge */}
                  {winningSkin.statTrak && (
                    <div className="absolute top-4 left-4 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500 text-amber-400 font-mono font-black text-[10px] uppercase tracking-wider">
                      StatTrak™
                    </div>
                  )}

                  {/* Wear Badge */}
                  <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-md bg-black/60 border border-white/10 text-white/80 font-bold text-[10px]">
                    {winningSkin.wearLabel || winningSkin.wear}
                  </div>

                  {/* Big Image */}
                  <div className="relative w-36 h-36 flex items-center justify-center my-3">
                    <SkinImage
                      src={winningSkin.image}
                      alt={winningSkin.name}
                      size={180}
                      className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] animate-pulse"
                    />
                  </div>

                  {/* Titles */}
                  <div className="w-full text-center">
                    <h4 className="font-black text-xl text-white truncate">
                      {winningSkin.name}
                    </h4>
                    <p className="text-xs text-white/60 mt-0.5" style={{ color: rConf.color }}>
                      {t('rarity.' + winningSkin.rarity) || rConf.label}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-3">
                      <DropCoinIcon size={20} />
                      <span className="font-mono font-black text-yellow-400 text-xl">
                        +{winningSkin.priceDc.toLocaleString('ru-RU')} DC
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Claim Button */}
            <button
              type="button"
              onClick={onClaim}
              className="w-full max-w-sm py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(250,204,21,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-105"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>
                {awardedPotion
                  ? t('cashback.claimPotion')
                  : awardedToken
                  ? t('cashback.claimToken')
                  : t('cashback.claimSkin')}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
