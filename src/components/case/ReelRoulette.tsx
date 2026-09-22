'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { SkinEntity } from '../../lib/types';
import { rollCaseBonusDrop } from '../../lib/consumables';
import { RARITY_CONFIG } from '../../data/skins';
import { sound } from '../../lib/sound';
import { DropModal } from './DropModal';
import { WearBadge } from '../ui/WearBadge';
import { StatTrakBadge } from '../ui/StatTrakBadge';
import { RarityBadge } from '../ui/RarityBadge';
import { SkinImage } from '../ui/SkinImage';
import { useGameStore } from '../../store/useGameStore';
import { Zap, Layers } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { isOfficialCase, isKnifeOrGlove, rollSpecialKnifeDrop } from '../../lib/caseSpecials';
import { isStatTrakableItem } from '../../lib/steam';
import { rollWearAndStatTrak } from '../../lib/dropRoll';

interface ReelRouletteProps {
  caseSkins: SkinEntity[];
  casePriceDc: number;
  caseName: string;
  caseImage?: string;
  caseId?: string;
}

const REEL_SIZE = 55;
const WINNER_INDEX = 48;
const WIN_INDEX = WINNER_INDEX;
const ITEM_WIDTH = 180;
const ITEM_GAP = 12;

export const ReelRoulette: React.FC<ReelRouletteProps> = ({
  caseSkins,
  casePriceDc,
  caseName,
  caseImage,
  caseId,
}) => {
  const {
    balance,
    deductBalance,
    addToInventory,
    addBalance,
    addLiveDrop,
    activePotionCharges,
    consumePotionCharge,
    potionsCount,
    drinkPotion,
    zeusCount,
    useZeus,
  } = useGameStore();
  const { t, locale } = useLanguage();
  const [openCount, setOpenCount] = useState<1 | 2 | 3>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [fastOpen, setFastOpen] = useState(false);

  // Up to 3 reels
  const [reels, setReels] = useState<SkinEntity[][]>([[], [], []]);
  const [winningSkins, setWinningSkins] = useState<SkinEntity[]>([]);
  const [bonusConsumables, setBonusConsumables] = useState<{ potions: number; saveTokens: number; zeus: number }>({
    potions: 0,
    saveTokens: 0,
    zeus: 0,
  });
  const [showModal, setShowModal] = useState(false);

  const containerRef0 = useRef<HTMLDivElement>(null);
  const controls0 = useAnimation();
  const controls1 = useAnimation();
  const controls2 = useAnimation();
  const lastSoundTickPos = useRef<number>(0);

  // Zeus reroll state (same as upgrader: press only mid-spin)
  const [zeusUsedThisSpin, setZeusUsedThisSpin] = useState(false);
  const [zeusStriking, setZeusStriking] = useState(false);
  const spinResolveRef = useRef<(() => void) | null>(null);

  const canPressZeus =
    isSpinning && !isRevealed && !zeusUsedThisSpin && !zeusStriking && zeusCount > 0 && !fastOpen;

  const handleActivateZeus = () => {
    if (!canPressZeus) return;
    useZeus();
    setZeusUsedThisSpin(true);
    setZeusStriking(true);
    sound.playZeusShock();
    if (spinResolveRef.current) {
      spinResolveRef.current();
      spinResolveRef.current = null;
    }
  };

  const pickWeightedSkin = (isPotionBoosted: boolean = false, isZeusBoosted: boolean = false): SkinEntity => {
    // 1. Exact 10% knife cases
    if (caseId === 'case_10_knife' || caseName.includes('10% Нож') || caseName.includes('10% Knife')) {
      const knives = caseSkins.filter(isKnifeOrGlove);
      const others = caseSkins.filter((s) => !isKnifeOrGlove(s));
      const weights = caseSkins.map((s) =>
        isKnifeOrGlove(s) ? 10.0 / (knives.length || 1) : 90.0 / (others.length || 1)
      );
      const totalW = weights.reduce((a, b) => a + b, 0);
      let rnd = Math.random() * totalW;
      for (let i = 0; i < caseSkins.length; i++) {
        if (rnd <= weights[i]) {
          const sel = caseSkins[i];
          return caseId && isOfficialCase(caseId) && isKnifeOrGlove(sel) ? rollSpecialKnifeDrop(caseId) : sel;
        }
        rnd -= weights[i];
      }
      const last = caseSkins[caseSkins.length - 1];
      return caseId && isOfficialCase(caseId) && isKnifeOrGlove(last) ? rollSpecialKnifeDrop(caseId) : last;
    }

    // 2. Exact 50% knife cases
    if (caseId === 'case_50_knife' || caseName.includes('50% Нож') || caseName.includes('50% Knife')) {
      const knives = caseSkins.filter(isKnifeOrGlove);
      const others = caseSkins.filter((s) => !isKnifeOrGlove(s));
      const weights = caseSkins.map((s) =>
        isKnifeOrGlove(s) ? 50.0 / (knives.length || 1) : 50.0 / (others.length || 1)
      );
      const totalW = weights.reduce((a, b) => a + b, 0);
      let rnd = Math.random() * totalW;
      for (let i = 0; i < caseSkins.length; i++) {
        if (rnd <= weights[i]) {
          const sel = caseSkins[i];
          return caseId && isOfficialCase(caseId) && isKnifeOrGlove(sel) ? rollSpecialKnifeDrop(caseId) : sel;
        }
        rnd -= weights[i];
      }
      const last = caseSkins[caseSkins.length - 1];
      return caseId && isOfficialCase(caseId) && isKnifeOrGlove(last) ? rollSpecialKnifeDrop(caseId) : last;
    }

    // 3. Calibrated 98.5% RTP for ALL cases:
    // Target EV = 0.985 * casePriceDc.
    // Solves alpha power exponent via binary search so expected drop return is strictly 98.5%!
    const targetEV = Math.max(15, casePriceDc * 0.985);
    const prices = caseSkins.map((s) => Math.max(1, s.priceDc));
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);

    let weights: number[];

    if (targetEV <= minP) {
      weights = caseSkins.map(() => 1);
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
    let selected = caseSkins[caseSkins.length - 1];
    for (let i = 0; i < caseSkins.length; i++) {
      if (rnd <= weights[i]) {
        selected = caseSkins[i];
        break;
      }
      rnd -= weights[i];
    }

    // Extra luck boost roll when Luck Potion charge is active on this roll:
    if (isPotionBoosted) {
      const topTier = caseSkins.filter(
        (s) => s.rarity === 'gold' || s.rarity === 'covert' || s.rarity === 'classified' || s.priceDc >= casePriceDc
      );
      if (topTier.length > 0 && Math.random() < 0.50) {
        selected = topTier[Math.floor(Math.random() * topTier.length)];
      }
    }

    // Zeus small luck: reroll bonus — modest top-tier upgrade chance (~28%)
    if (isZeusBoosted) {
      const topTier = caseSkins.filter(
        (s) => s.rarity === 'gold' || s.rarity === 'covert' || s.rarity === 'classified' || s.priceDc >= casePriceDc
      );
      if (topTier.length > 0 && Math.random() < 0.28) {
        selected = topTier[Math.floor(Math.random() * topTier.length)];
      }
    }

    if (caseId && isOfficialCase(caseId) && isKnifeOrGlove(selected)) {
      return rollSpecialKnifeDrop(caseId);
    }

    return selected;
  };

  const pickVisualTapeSkin = (skins: SkinEntity[]): SkinEntity => {
    const buckets: Record<'common' | 'restricted' | 'classified' | 'covert' | 'gold', SkinEntity[]> = {
      common: [],
      restricted: [],
      classified: [],
      covert: [],
      gold: [],
    };

    for (const s of skins) {
      if (isKnifeOrGlove(s) || s.rarity === 'gold') {
        buckets.gold.push(s);
      } else if (s.rarity === 'covert' || s.rarity === 'extraordinary') {
        buckets.covert.push(s);
      } else if (s.rarity === 'classified') {
        buckets.classified.push(s);
      } else if (s.rarity === 'restricted') {
        buckets.restricted.push(s);
      } else {
        buckets.common.push(s);
      }
    }

    // Authentic CS2 reel visual distribution with boosted exciting tease:
    // Common items (68%), Restricted (18%), Classified (8%), Covert (4%), Gold (2%)
    const bucketWeights: { bucket: keyof typeof buckets; weight: number }[] = [
      { bucket: 'common', weight: 68 },
      { bucket: 'restricted', weight: 18 },
      { bucket: 'classified', weight: 8 },
      { bucket: 'covert', weight: 4 },
      { bucket: 'gold', weight: 2 },
    ];

    const active = bucketWeights.filter((b) => buckets[b.bucket].length > 0);
    if (active.length === 0) return skins[Math.floor(Math.random() * skins.length)];

    const totalW = active.reduce((sum, b) => sum + b.weight, 0);
    let rnd = Math.random() * totalW;
    for (const b of active) {
      if (rnd <= b.weight) {
        const list = buckets[b.bucket];
        return list[Math.floor(Math.random() * list.length)];
      }
      rnd -= b.weight;
    }

    return skins[0];
  };

  const generateReel = (winner: SkinEntity): SkinEntity[] => {
    const list: SkinEntity[] = [];
    for (let i = 0; i < REEL_SIZE; i++) {
      if (i === WIN_INDEX) {
        list.push(winner);
      } else {
        list.push(rollWearAndStatTrak(pickVisualTapeSkin(caseSkins)));
      }
    }
    return list;
  };

  useEffect(() => {
    const initial0: SkinEntity[] = [];
    const initial1: SkinEntity[] = [];
    const initial2: SkinEntity[] = [];
    for (let i = 0; i < REEL_SIZE; i++) {
      initial0.push(rollWearAndStatTrak(pickVisualTapeSkin(caseSkins)));
      initial1.push(rollWearAndStatTrak(pickVisualTapeSkin(caseSkins)));
      initial2.push(rollWearAndStatTrak(pickVisualTapeSkin(caseSkins)));
    }
    setReels([initial0, initial1, initial2]);
  }, [caseSkins]);

  const totalCost = casePriceDc * openCount;

  const startSpin = async () => {
    if (isSpinning) return;
    if (balance < totalCost) {
      useGameStore.getState().setRefillOpen(true);
      return;
    }

    const deducted = deductBalance(totalCost);
    if (!deducted) return;

    if (caseId) {
      useGameStore.getState().recordCaseOpen(caseId, openCount);
    }

    sound.playClick();
    setIsSpinning(true);
    setIsRevealed(false);
    setShowModal(false);
    setZeusUsedThisSpin(false);
    setZeusStriking(false);
    spinResolveRef.current = null;

    // Roll bonus consumables for each opened case (low chance)
    let droppedPotions = 0;
    let droppedSaveTokens = 0;
    let droppedZeus = 0;
    for (let i = 0; i < openCount; i++) {
      const bonus = rollCaseBonusDrop();
      if (bonus.potion) {
        droppedPotions++;
        useGameStore.getState().addPotion(1);
      }
      if (bonus.saveToken) {
        droppedSaveTokens++;
        useGameStore.getState().addSaveToken(1);
      }
      if (bonus.zeus) {
        droppedZeus++;
        useGameStore.getState().addZeus(1);
      }
    }
    setBonusConsumables({ potions: droppedPotions, saveTokens: droppedSaveTokens, zeus: droppedZeus });

    const spinOpenCount = openCount;

    const rollWinners = (isZeusReroll: boolean): SkinEntity[] => {
      const out: SkinEntity[] = [];
      for (let i = 0; i < spinOpenCount; i++) {
        if (!isZeusReroll) {
          const hasCharge = useGameStore.getState().activePotionCharges > 0;
          if (hasCharge) {
            useGameStore.getState().consumePotionCharge();
          }
          const baseSkin = pickWeightedSkin(hasCharge, false);
          out.push(rollWearAndStatTrak(baseSkin));
        } else {
          // Zeus reroll: small luck boost, potion charges NOT consumed again
          const baseSkin = pickWeightedSkin(false, true);
          out.push(rollWearAndStatTrak(baseSkin));
        }
      }
      return out;
    };

    const finishSpin = (finalWinners: SkinEntity[]) => {
      setIsRevealed(true);
      const highestWinner = finalWinners.reduce((prev, curr) => {
        const rank = (s: SkinEntity) =>
          s.rarity === 'gold' ? 6 : s.rarity === 'covert' ? 5 : s.rarity === 'classified' ? 4 : s.rarity === 'restricted' ? 3 : 2;
        return rank(curr) > rank(prev) ? curr : prev;
      }, finalWinners[0]);

      sound.playWin(highestWinner.rarity);
      setIsSpinning(false);
      setZeusStriking(false);
      spinResolveRef.current = null;
      setShowModal(true);

      // Immediately emit real drops to live ticker (ONLY from 25,000 DC!)
      finalWinners.forEach((skin) => {
        if (skin.priceDc >= 25000) {
          addLiveDrop({
            id: `real_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            user: locale === 'ru' ? 'Вы' : 'YOU',
            avatar: '',
            skin: skin,
            caseName: caseName,
            timestamp: Date.now(),
          });
        }
      });
    };

    // Initial roll
    let winners = rollWinners(false);
    setWinningSkins(winners);

    // Build new reels
    const buildReels = (ws: SkinEntity[]) => {
      const nr = [...reels];
      for (let i = 0; i < spinOpenCount; i++) {
        nr[i] = generateReel(ws[i]);
      }
      return nr;
    };
    setReels(buildReels(winners));
    // Let React paint new reels before measuring/animating
    await new Promise<void>((r) => setTimeout(r, 60));

    if (fastOpen) {
      setTimeout(() => {
        finishSpin(winners);
      }, 350);
      return;
    }

    // Animate with Zeus interrupt support (same as upgrader: press mid-spin -> reroll)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const containerWidth = containerRef0.current?.offsetWidth || 800;
      const centerOffset = containerWidth / 2;

      // Reset positions
      controls0.set({ x: 0 });
      controls1.set({ x: 0 });
      controls2.set({ x: 0 });

      const duration = 6.0;
      const startTime = Date.now();
      lastSoundTickPos.current = 0;

      // Perfect centering without jitter so all 1, 2, or 3 reels align dead center under the arrow
      const targetX0 = -(WIN_INDEX * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerOffset);
      const targetX1 = -(WIN_INDEX * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerOffset);
      const targetX2 = -(WIN_INDEX * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerOffset);

      let rafId = 0;
      let rafCancelled = false;
      const updateSoundTick = () => {
        if (rafCancelled) return;
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= duration) return;

        const progress = elapsed / duration;
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentPos = Math.abs(targetX0 * easeProgress);

        const itemsPassed = Math.floor(currentPos / (ITEM_WIDTH + ITEM_GAP));
        if (itemsPassed > lastSoundTickPos.current) {
          sound.playTick(0.8 + (1 - progress) * 0.4);
          lastSoundTickPos.current = itemsPassed;
        }
        rafId = requestAnimationFrame(updateSoundTick);
      };
      rafId = requestAnimationFrame(updateSoundTick);

      const animPromises = [
        controls0.start({
          x: targetX0,
          transition: { duration, ease: [0.12, 0.8, 0.15, 1] },
        }),
      ];

      if (spinOpenCount >= 2) {
        animPromises.push(
          controls1.start({
            x: targetX1,
            transition: { duration: duration + 0.05, ease: [0.12, 0.8, 0.15, 1] },
          })
        );
      }

      if (spinOpenCount >= 3) {
        animPromises.push(
          controls2.start({
            x: targetX2,
            transition: { duration: duration + 0.1, ease: [0.12, 0.8, 0.15, 1] },
          })
        );
      }

      const zeusInterrupt = new Promise<'zeus'>((resolve) => {
        spinResolveRef.current = () => resolve('zeus');
      });

      const result = await Promise.race([
        Promise.all(animPromises).then(() => 'done' as const),
        zeusInterrupt,
      ]);

      rafCancelled = true;
      cancelAnimationFrame(rafId);

      if (result === 'zeus') {
        // Zeus pressed mid-spin: stop reels, lightning flash, reroll with small luck
        try {
          controls0.stop();
          controls1.stop();
          controls2.stop();
        } catch {}
        await new Promise<void>((r) => setTimeout(r, 650));
        setZeusStriking(false);
        winners = rollWinners(true);
        setWinningSkins(winners);
        setReels(buildReels(winners));
        await new Promise<void>((r) => setTimeout(r, 60));
        continue;
      }

      spinResolveRef.current = null;
      finishSpin(winners);
      break;
    }
  };

  const handleKeep = (itemsToKeep?: SkinEntity[]) => {
    const list = itemsToKeep !== undefined ? itemsToKeep : winningSkins;
    if (list.length === 0) {
      setShowModal(false);
      return;
    }
    addToInventory(list);
    setShowModal(false);
  };

  const handleSell = (itemsToSell?: SkinEntity[]) => {
    const list = itemsToSell !== undefined ? itemsToSell : winningSkins;
    if (list.length === 0) {
      setShowModal(false);
      return;
    }
    const totalWon = list.reduce((sum, s) => sum + s.priceDc, 0);
    addBalance(totalWon);
    sound.playCashout();
    setShowModal(false);
  };

  const animControls = [controls0, controls1, controls2];

  const isZeusCharged = zeusUsedThisSpin || zeusStriking;

  return (
    <div className="w-full flex flex-col items-center">
      <style>
        {`
          @keyframes caseZeusFlicker {
            0%, 100% { opacity: 1; }
            10% { opacity: 0.55; }
            20% { opacity: 1; }
            40% { opacity: 0.7; }
            60% { opacity: 1; }
            75% { opacity: 0.6; }
            90% { opacity: 1; }
          }
          @keyframes caseZeusSpark {
            0%, 100% { transform: scale(0.7) rotate(-10deg); opacity: 0.4; }
            50% { transform: scale(1.3) rotate(10deg); opacity: 1; }
          }
          .case-zeus-stripe {
            animation: caseZeusFlicker 0.8s linear infinite;
          }
          .case-zeus-spark {
            animation: caseZeusSpark ease-in-out infinite;
            transform-origin: center;
            transform-box: fill-box;
          }
        `}
      </style>
      {/* Multi-reel display */}
      <div className="w-full max-w-5xl flex flex-col gap-4">
        {Array.from({ length: openCount }).map((_, reelIdx) => (
          <div
            key={reelIdx}
            className={`relative w-full rounded-3xl p-3 glass-panel border shadow-2xl overflow-hidden transition-colors duration-300 ${
              isZeusCharged ? 'border-sky-400/50 shadow-[0_0_35px_rgba(56,189,248,0.35)]' : 'border-white/10'
            }`}
          >
            {/* Center Winner Indicator — синяя с молниями при Zeus */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 z-30 pointer-events-none flex flex-col justify-between items-center py-0.5">
              {isZeusCharged ? (
                <>
                  <div className="case-zeus-stripe w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-sky-400 filter drop-shadow-[0_0_12px_#38bdf8]" />
                  <div className="relative w-[3px] h-full">
                    <div className="case-zeus-stripe absolute inset-0 bg-sky-400 opacity-95 shadow-[0_0_16px_#38bdf8]" />
                    <svg viewBox="0 0 12 60" className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-[20px] h-[60px] filter drop-shadow-[0_0_6px_#38bdf8]" preserveAspectRatio="none">
                      <path
                        d="M 7 2 L 4 20 L 8 20 L 5 32 L 8 32 L 6 45 L 9 30 L 6 30 L 9 14 L 5 14 Z"
                        fill="none"
                        stroke="#e0f2fe"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="case-zeus-stripe"
                      />
                    </svg>
                    <span className="case-zeus-spark absolute -left-2 top-[12%] text-[11px] filter drop-shadow-[0_0_6px_#38bdf8]" style={{ animationDelay: '0s', animationDuration: '0.55s' }}>⚡</span>
                    <span className="case-zeus-spark absolute -right-2 bottom-[14%] text-[11px] filter drop-shadow-[0_0_6px_#38bdf8]" style={{ animationDelay: '0.25s', animationDuration: '0.65s' }}>⚡</span>
                  </div>
                  <div className="case-zeus-stripe w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-sky-400 filter drop-shadow-[0_0_12px_#38bdf8]" />
                </>
              ) : (
                <>
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-yellow-400 filter drop-shadow-[0_0_10px_#facc15]" />
                  <div className="w-[2px] h-full bg-yellow-400 opacity-90 shadow-[0_0_12px_#facc15]" />
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-yellow-400 filter drop-shadow-[0_0_10px_#facc15]" />
                </>
              )}
            </div>

            {/* Zeus lightning flash overlay */}
            {zeusStriking && (
              <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center bg-sky-500/10 animate-in fade-in zoom-in duration-150">
                <svg viewBox="0 0 200 120" className="w-2/3 h-2/3 filter drop-shadow-[0_0_25px_#38bdf8]">
                  <path
                    d="M 100 5 L 88 45 L 108 42 L 82 80 L 105 76 L 95 115"
                    stroke="#38bdf8"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 100 5 L 88 45 L 108 42 L 82 80 L 105 76 L 95 115"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#08080a] to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#08080a] to-transparent z-20 pointer-events-none" />

            <div ref={reelIdx === 0 ? containerRef0 : undefined} className="relative w-full overflow-hidden py-3">
              <motion.div
                animate={animControls[reelIdx]}
                className="flex gap-3 will-change-transform"
                style={{ 
                  width: `${(reels[reelIdx] || []).length * (ITEM_WIDTH + ITEM_GAP)}px`,
                  transform: 'translateZ(0)'
                }}
              >
                {(reels[reelIdx] || []).map((skin, idx) => {
                  const isOfficial = Boolean(caseId && isOfficialCase(caseId));
                  const isKnife = isKnifeOrGlove(skin);
                  const isWinSlot = idx === WIN_INDEX;

                  // In official cases: knives on the tape appear as the gold Special Item
                  // and reveal the actual dropped knife once the spin completes
                  const showAsSpecial = isOfficial && isKnife && (!isWinSlot || !isRevealed);

                  const displayRarity = showAsSpecial ? 'gold' : skin.rarity;
                  const config = RARITY_CONFIG[displayRarity] || RARITY_CONFIG.milspec;
                  const displayImage = showAsSpecial ? '/images/special_item.png' : skin.image;
                  const displayWeapon = showAsSpecial ? '★' : skin.weapon;
                  const displaySkinName = showAsSpecial ? (locale === 'en' ? '★ Rare Special Item' : '★ Редкий особый предмет') : skin.skinName;

                  return (
                    <div
                      key={`${skin.id}_${idx}`}
                      className={`relative rounded-2xl bg-[#11121a] border shrink-0 flex flex-col items-center justify-between p-3 select-none overflow-hidden transition-all ${
                        showAsSpecial
                          ? 'border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                          : 'border-white/10'
                      }`}
                      style={{
                        width: `${ITEM_WIDTH}px`,
                        height: openCount > 1 ? '180px' : '210px',
                        borderBottomWidth: '4px',
                        borderBottomColor: config.color,
                        transform: 'translateZ(0)',
                      }}
                    >
                      <div className="w-full flex justify-between items-center z-10">
                        <div className="flex items-center gap-1">
                          {!showAsSpecial && skin.statTrak && isStatTrakableItem(skin) && <StatTrakBadge size="xs" />}
                          {!showAsSpecial && <WearBadge skin={skin} size="xs" />}
                          {showAsSpecial && (
                            <span className="text-[9px] font-black font-mono tracking-wider px-2 py-0.5 rounded-full text-white bg-[#ea580c] shadow-[0_0_8px_rgba(234,88,12,0.4)] uppercase">
                              ★
                            </span>
                          )}
                        </div>
                        {showAsSpecial ? (
                          <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-black bg-[#facc15] shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                            ★ {locale === 'en' ? 'SPECIAL' : 'ОСОБЫЙ'}
                          </span>
                        ) : (
                          <RarityBadge rarity={skin.rarity} size="sm" />
                        )}
                      </div>

                      <div className={`relative ${
                        showAsSpecial 
                          ? (openCount > 1 ? 'w-28 h-20' : 'w-36 h-28') 
                          : (openCount > 1 ? 'w-28 h-24' : 'w-36 h-32')
                      } my-auto flex items-center justify-center z-10`}>
                        <SkinImage
                          src={displayImage}
                          alt={displayWeapon}
                          size={160}
                          className={`w-full h-full object-contain filter drop-shadow-md ${
                            showAsSpecial ? 'drop-shadow-[0_0_15px_rgba(250,204,21,0.55)]' : ''
                          }`}
                        />
                      </div>

                      <div className="w-full text-center z-10">
                        <p className="text-xs font-bold text-white truncate">{displayWeapon}</p>
                        <p className="text-[11px] truncate font-semibold" style={{ color: config.color }}>{displaySkinName}</p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        ))}
      </div>

      {/* Opening Multiplier Selectors (x1, x2, x3) and Actions */}
      <div className="flex flex-col items-center gap-4 mt-6 w-full max-w-xl">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-yellow-400" />
              {t('case.count')}
            </span>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10">
              {([1, 2, 3] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => {
                    sound.playClick();
                    setOpenCount(cnt);
                  }}
                  className={`px-4 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    openCount === cnt
                      ? 'bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.4)] scale-105'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  x{cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Universal Luck Potion Indicator */}
          {activePotionCharges > 0 ? (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-panel border border-white/10 text-white select-none text-xs"
              title={locale === 'ru' 
                ? `Зелье удачи активно! Осталось ${activePotionCharges} — повышенный шанс на тайное и ножи!`
                : `Luck Potion active! ${activePotionCharges} left — boosted covert and knives!`}
            >
              <span>🧪</span>
              <span className="font-mono font-bold text-emerald-400">{activePotionCharges}/3</span>
            </div>
          ) : potionsCount > 0 ? (
            <button
              type="button"
              onClick={() => drinkPotion()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-button border border-white/10 text-white/80 hover:text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
              title={locale === 'ru' ? `Выпить зелье удачи +3 заряда. В наличии: ${potionsCount}` : `Drink Luck Potion +3 charges. In stock: ${potionsCount}`}
            >
              <span>🧪</span>
              <span className="font-mono text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-1.5 py-0.2 rounded font-bold">x{potionsCount}</span>
            </button>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <label className="flex items-center gap-2 text-xs font-bold text-white/60 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={fastOpen}
              onChange={(e) => setFastOpen(e.target.checked)}
              disabled={isSpinning}
              className="w-4 h-4 rounded bg-white/10 border-white/20 text-yellow-400 focus:ring-yellow-400 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> {t('case.fastOpen')}
            </span>
          </label>

          {isSpinning ? (
            // Во время спина кнопка Открыть заменяется кнопкой Zeus (только если есть Zeus)
            canPressZeus || zeusUsedThisSpin || zeusStriking ? (
              <button
                type="button"
                onClick={handleActivateZeus}
                disabled={!canPressZeus}
                className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all ${
                  canPressZeus
                    ? 'bg-sky-500 hover:bg-sky-400 text-black border-sky-200 shadow-[0_0_35px_rgba(56,189,248,0.7)] cursor-pointer active:scale-95 animate-pulse'
                    : 'bg-sky-500/20 border-sky-400/50 text-sky-300 cursor-default'
                }`}
              >
                <span className={canPressZeus ? 'animate-bounce inline-block' : 'inline-block'}>⚡</span>
                <span>
                  {zeusUsedThisSpin || zeusStriking
                    ? (locale === 'ru' ? 'Zeus бьёт! Перекрут...' : 'Zeus strikes! Rerolling...')
                    : (locale === 'ru' ? `Вжать Zeus! · ${zeusCount} шт.` : `Hit Zeus! · ${zeusCount}`)}
                </span>
                <span className={canPressZeus ? 'animate-bounce inline-block' : 'inline-block'}>⚡</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-10 py-4 rounded-2xl btn-yellow text-black font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
              >
                <span>{t('case.openingAction')}</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={startSpin}
              disabled={isSpinning}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl btn-yellow text-black font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <span>
                {locale === 'ru'
                  ? `Открыть ${openCount > 1 ? `${openCount} кейса` : 'кейс'} за ${totalCost.toLocaleString('ru-RU')} DC`
                  : `Open ${openCount > 1 ? `${openCount} cases` : 'case'} for ${totalCost.toLocaleString('ru-RU')} DC`}
              </span>
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <DropModal
          skins={winningSkins}
          bonusConsumables={bonusConsumables}
          onKeep={handleKeep}
          onSell={handleSell}
        />
      )}
    </div>
  );
};
