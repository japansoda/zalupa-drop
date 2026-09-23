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
import { Zap, Layers, FlaskConical, Anchor } from 'lucide-react';
import { createRope, stepRope, stepFree, ropePath, resetRope, RopePoint } from '../../lib/ropeChain';
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
    hookCount,
    useHook,
  } = useGameStore();
  const { t, locale } = useLanguage();
  const [openCount, setOpenCount] = useState<1 | 2 | 3>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [fastOpen, setFastOpen] = useState(false);

  // Up to 3 reels
  const [reels, setReels] = useState<SkinEntity[][]>([[], [], []]);
  const [winningSkins, setWinningSkins] = useState<SkinEntity[]>([]);
  const [bonusConsumables, setBonusConsumables] = useState<{ potions: number; saveTokens: number; zeus: number; hooks: number }>({
    potions: 0,
    saveTokens: 0,
    zeus: 0,
    hooks: 0,
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

  // Potion BG snapshot: фон держится весь спин, даже если заряды кончились mid-spin
  const [potionBgSnapshot, setPotionBgSnapshot] = useState(false);
  const showPotionBg = activePotionCharges > 0 || (isSpinning && potionBgSnapshot);

  // Grappling Hook state (объявлен раньше Zeus из-за взаимных гардов)
  const [hookArmed, setHookArmed] = useState(false);
  const [hookUsedThisSpin, setHookUsedThisSpin] = useState(false);
  const [hookFlying, setHookFlying] = useState(false);
  const [hookResult, setHookResult] = useState<'hooked' | 'slipped' | null>(null);
  const [hookPicked, setHookPicked] = useState<{ reelIdx: number; itemIdx: number } | null>(null);
  const [hookSparks, setHookSparks] = useState<{ reelIdx: number; x: number; y: number; key: number } | null>(null);
  // Живая цепь-верёвка: один rAF-цикл пишет d напрямую в SVG (без ре-рендеров)
  const [ropeOn, setRopeOn] = useState(false);
  const ropePtsRef = useRef<RopePoint[]>(createRope(12));
  const ropeBRef = useRef({ x: 0, y: 0 });
  const ropeRafRef = useRef(0);
  const ropeModeRef = useRef<'cursor' | 'card' | 'snapped' | 'off'>('off');
  // Разорванная цепь: первая половина болтается на стрелке, вторая лежит на карте
  const snapRef = useRef<{ first: RopePoint[]; second: RopePoint[]; life: number } | null>(null);
  const ropeReelRef = useRef(0);
  const ropeCursorRef = useRef({ x: 0, y: 0 });
  const ropeDimsRef = useRef({ w: 800, h: 220 });
  const ropeCardRef = useRef({ reelIdx: 0, itemIdx: 0 });
  const ropeBaseRefs = useRef<Array<SVGPathElement | null>>([]);
  const ropeLinkRefs = useRef<Array<SVGPathElement | null>>([]);
  const ropeHookRefs = useRef<Array<SVGGElement | null>>([]);
  const ropeWrapRefs = useRef<Array<HTMLDivElement | null>>([]);
  const hookResolveRef = useRef<(() => void) | null>(null);
  const hookTargetRef = useRef<{ reelIdx: number; itemIdx: number } | null>(null);
  const frozenXRef = useRef<number[]>([0, 0, 0]);
  const liveXRef = useRef<number[]>([0, 0, 0]);
  const rafIdRef = useRef(0);
  const rafCancelRef = useRef(false);
  const reelsRef = useRef<SkinEntity[][]>([[], [], []]);

  const canPressZeus =
    isSpinning && !isRevealed && !zeusUsedThisSpin && !zeusStriking && !hookUsedThisSpin && !hookArmed && !hookFlying && zeusCount > 0 && !fastOpen;

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

  // Чистим rAF-циклы при размонтировании
  useEffect(() => {
    return () => {
      ropeModeRef.current = 'off';
      cancelAnimationFrame(ropeRafRef.current);
      rafCancelRef.current = true;
      cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const canPressHook =
    isSpinning && !isRevealed && !hookUsedThisSpin && !hookFlying && !zeusUsedThisSpin && !zeusStriking && hookCount > 0 && !fastOpen;

  // Один rAF-цикл живой цепи: якорь A (стрелка сверху), цель B (курсор/карта).
  // Пишет напрямую в DOM через ref — React не ре-рендерится каждый кадр.
  const ropeLoop = () => {
    if (ropeModeRef.current === 'off') return;
    const { w, h } = ropeDimsRef.current;
    const ax = w / 2;
    const ay = 4;
    let bx = ropeBRef.current.x;
    let by = ropeBRef.current.y;
    if (ropeModeRef.current === 'card') {
      const { reelIdx, itemIdx } = ropeCardRef.current;
      bx = itemIdx * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 + liveXRef.current[reelIdx];
      by = h / 2;
      ropeBRef.current = { x: bx, y: by };
    } else if (ropeModeRef.current === 'snapped') {
      // Разрыв пополам: кусок на стрелке болтается и падает, кусок на карте лежит.
      // Обе половины быстро и плавно гаснут.
      const snap = snapRef.current;
      if (!snap) {
        ropeModeRef.current = 'off';
        setRopeOn(false);
        cancelAnimationFrame(ropeRafRef.current);
        return;
      }
      snap.life -= 0.06;
      stepFree(snap.first, ax, ay);
      const d1 = ropePath(snap.first);
      const d2 = ropePath(snap.second);
      const end2 = snap.second[snap.second.length - 1];
      const prev2 = snap.second[snap.second.length - 2] || end2;
      const hang2 = (Math.atan2(end2.y - prev2.y, end2.x - prev2.x) * 180) / Math.PI + 90;
      for (let i = 0; i < 3; i++) {
        const wrap = ropeWrapRefs.current[i];
        const base = ropeBaseRefs.current[i];
        const link = ropeLinkRefs.current[i];
        const hook = ropeHookRefs.current[i];
        const show = i === ropeReelRef.current;
        if (wrap) {
          wrap.style.display = show ? '' : 'none';
          if (show) wrap.style.opacity = Math.max(0, snap.life).toFixed(2);
        }
        if (!show) continue;
        if (base) base.setAttribute('d', d1);
        if (link) {
          link.setAttribute('d', d2);
          link.setAttribute('stroke-dasharray', 'none');
        }
        if (hook) hook.setAttribute('transform', `translate(${end2.x.toFixed(1)} ${end2.y.toFixed(1)}) rotate(${hang2.toFixed(1)})`);
      }
      if (snap.life <= 0) {
        ropeModeRef.current = 'off';
        snapRef.current = null;
        setRopeOn(false);
        cancelAnimationFrame(ropeRafRef.current);
        return;
      }
      ropeRafRef.current = requestAnimationFrame(ropeLoop);
      return;
    }
    stepRope(ropePtsRef.current, ax, ay, bx, by);
    const d = ropePath(ropePtsRef.current);
    const pts = ropePtsRef.current;
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2] || tail;
    const hang = (Math.atan2(tail.y - prev.y, tail.x - prev.x) * 180) / Math.PI + 90;
    for (let i = 0; i < 3; i++) {
      const wrap = ropeWrapRefs.current[i];
      const base = ropeBaseRefs.current[i];
      const link = ropeLinkRefs.current[i];
      const hook = ropeHookRefs.current[i];
      const show = i === ropeReelRef.current;
      if (wrap) {
        wrap.style.display = show ? '' : 'none';
        if (show) wrap.style.opacity = '1';
      }
      if (!show) continue;
      if (base) base.setAttribute('d', d);
      if (link) link.setAttribute('d', d);
      if (hook) hook.setAttribute('transform', `translate(${tail.x.toFixed(1)} ${tail.y.toFixed(1)}) rotate(${hang.toFixed(1)})`);
    }
    ropeRafRef.current = requestAnimationFrame(ropeLoop);
  };

  const startRopeLoop = () => {
    cancelAnimationFrame(ropeRafRef.current);
    ropeRafRef.current = requestAnimationFrame(ropeLoop);
  };

  const stopRopeLoop = () => {
    ropeModeRef.current = 'off';
    cancelAnimationFrame(ropeRafRef.current);
    setRopeOn(false);
  };

  const handleArmHook = () => {
    if (hookUsedThisSpin || hookFlying) return;
    if (hookArmed) {
      sound.playClick();
      setHookArmed(false);
      stopRopeLoop();
      return;
    }
    if (!canPressHook) return;
    sound.playClick();
    const w = containerRef0.current?.offsetWidth || 800;
    const h = containerRef0.current?.offsetHeight || 220;
    ropeDimsRef.current = { w, h };
    resetRope(ropePtsRef.current, w / 2, 4, w / 2, h * 0.4);
    ropeBRef.current = { x: w / 2, y: h * 0.4 };
    ropeModeRef.current = 'cursor';
    setHookArmed(true);
    setRopeOn(true);
    startRopeLoop();
  };

  // Курсор тянет цепь (только пока крюк вооружён и цель не выбрана)
  const handleReelMouseMove = (reelIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!hookArmed || hookFlying) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Координаты вьюпорта ленты (минус паддинг внешнего контейнера p-3)
    const x = e.clientX - rect.left - 12;
    const y = e.clientY - rect.top - 12;
    ropeReelRef.current = reelIdx;
    ropeBRef.current = { x, y };
  };

  // Надёжный тап по летящей карте: click теряется, т.к. press и release
  // попадают в разные карты. Ловим pointerdown (цель фиксируется в момент
  // нажатия) и подтверждаем коротким pointerup почти без сдвига.
  const tapDownRef = useRef<{ reelIdx: number; itemIdx: number; x: number; y: number; t: number; pointerId: number } | null>(null);

  const handleCardPointerDown = (reelIdx: number, itemIdx: number, e: React.PointerEvent) => {
    if (!hookArmed || hookFlying) return;
    tapDownRef.current = { reelIdx, itemIdx, x: e.clientX, y: e.clientY, t: Date.now(), pointerId: e.pointerId };
  };

  const handleCardPointerUp = (e: React.PointerEvent) => {
    const down = tapDownRef.current;
    tapDownRef.current = null;
    if (!down || e.pointerId !== down.pointerId) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved > 14 || Date.now() - down.t > 600) return;
    handleCardClick(down.reelIdx, down.itemIdx);
  };

  const handleCardClick = (reelIdx: number, itemIdx: number) => {
    if (!hookArmed || hookUsedThisSpin || hookFlying || !isSpinning || isRevealed) return;
    if (reelIdx >= openCount) return;
    useHook();
    setHookUsedThisSpin(true);
    setHookArmed(false);
    setHookFlying(true);
    setHookPicked({ reelIdx, itemIdx });
    sound.playHookThrow();
    ropeCardRef.current = { reelIdx, itemIdx };
    ropeReelRef.current = reelIdx;
    ropeModeRef.current = 'card';
    hookTargetRef.current = { reelIdx, itemIdx };
    if (hookResolveRef.current) {
      hookResolveRef.current();
      hookResolveRef.current = null;
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
    reelsRef.current = [initial0, initial1, initial2];
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
    setHookArmed(false);
    setHookUsedThisSpin(false);
    setHookFlying(false);
    setHookResult(null);
    setHookSparks(null);
    setHookPicked(null);
    stopRopeLoop();
    hookTargetRef.current = null;
    hookResolveRef.current = null;
    // Снапшот зелья ДО списания зарядов — фон живёт весь спин
    setPotionBgSnapshot(useGameStore.getState().activePotionCharges > 0);

    // Roll bonus consumables for each opened case (low chance)
    let droppedPotions = 0;
    let droppedSaveTokens = 0;
    let droppedZeus = 0;
    let droppedHooks = 0;
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
      if (bonus.hook) {
        droppedHooks++;
        useGameStore.getState().addHook(1);
      }
    }
    setBonusConsumables({ potions: droppedPotions, saveTokens: droppedSaveTokens, zeus: droppedZeus, hooks: droppedHooks });

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
      // Синяя полоса гаснет СРАЗУ после спина — возврат к обычному состоянию.
      // Фон зелья тоже пропадает только сейчас (а не когда кончились заряды).
      setZeusUsedThisSpin(false);
      setZeusStriking(false);
      spinResolveRef.current = null;
      setPotionBgSnapshot(false);
      setHookArmed(false);
      setHookFlying(false);
      setHookSparks(null);
      stopRopeLoop();
      setTimeout(() => {
        setHookResult(null);
        setHookPicked(null);
      }, 1500);
      setIsRevealed(true);
      const highestWinner = finalWinners.reduce((prev, curr) => {
        const rank = (s: SkinEntity) =>
          s.rarity === 'gold' ? 6 : s.rarity === 'covert' ? 5 : s.rarity === 'classified' ? 4 : s.rarity === 'restricted' ? 3 : 2;
        return rank(curr) > rank(prev) ? curr : prev;
      }, finalWinners[0]);

      sound.playWin(highestWinner.rarity);
      setIsSpinning(false);
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
      const nr = [...reelsRef.current];
      for (let i = 0; i < spinOpenCount; i++) {
        nr[i] = generateReel(ws[i]);
      }
      return nr;
    };
    const builtReels = buildReels(winners);
    reelsRef.current = builtReels;
    setReels(builtReels);
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

      rafCancelRef.current = false;
      const updateSoundTick = () => {
        if (rafCancelRef.current) return;
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
        rafIdRef.current = requestAnimationFrame(updateSoundTick);
      };
      rafIdRef.current = requestAnimationFrame(updateSoundTick);

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
      const hookInterrupt = new Promise<'hook'>((resolve) => {
        hookResolveRef.current = () => resolve('hook');
      });

      const result = await Promise.race([
        Promise.all(animPromises).then(() => 'done' as const),
        zeusInterrupt,
        hookInterrupt,
      ]);

      rafCancelRef.current = true;
      cancelAnimationFrame(rafIdRef.current);

      if (result === 'zeus') {
        // Zeus pressed mid-spin: stop reels, lightning flash, reroll with small luck
        try {
          controls0.stop();
          controls1.stop();
          controls2.stop();
        } catch {}
        hookResolveRef.current = null;
        await new Promise<void>((r) => setTimeout(r, 650));
        setZeusStriking(false);
        winners = rollWinners(true);
        setWinningSkins(winners);
        const rebuilt = buildReels(winners);
        reelsRef.current = rebuilt;
        setReels(rebuilt);
        await new Promise<void>((r) => setTimeout(r, 60));
        continue;
      }

      if (result === 'hook') {
        // Крюк вцепился в карту: лента резко стынет, живая цепь уже летит (rope loop), 50/50
        const target = hookTargetRef.current;
        hookTargetRef.current = null;
        spinResolveRef.current = null;
        try {
          controls0.stop();
          controls1.stop();
          controls2.stop();
        } catch {}
        if (!target) {
          setHookFlying(false);
          stopRopeLoop();
          finishSpin(winners);
          break;
        }
        const { reelIdx, itemIdx } = target;
        frozenXRef.current = [...liveXRef.current];
        const containerW = containerRef0.current?.offsetWidth || 800;
        const centerHook = containerW / 2;
        const cardCenter = itemIdx * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2;
        ropeDimsRef.current = { w: containerW, h: containerRef0.current?.offsetHeight || 220 };
        ropeReelRef.current = reelIdx;
        // Цепь долетает до карты (rope loop сам тянет конец к карте)
        await new Promise<void>((r) => setTimeout(r, 600));
        const hooked = Math.random() < 0.5;
        const ctrls = [controls0, controls1, controls2];
        // Точка искр — текущее положение карты
        const sparkX = cardCenter + liveXRef.current[reelIdx];
        const sparkY = ropeDimsRef.current.h / 2;
        if (hooked) {
          // ЗАЦЕПИЛАСЬ: искры + звон, карта становится выигрышем.
          // Фаза 1 — быстрое плавное гашение скорости, фаза 2 — довод в секцию.
          // Цепь всё время следует за картой (rope loop читает liveXRef).
          setHookResult('hooked');
          setHookSparks({ reelIdx, x: sparkX, y: sparkY, key: Date.now() });
          sound.playHookLatch();
          setTimeout(() => setHookSparks(null), 750);
          const skin = (reelsRef.current[reelIdx] || [])[itemIdx];
          if (skin) {
            const newWinners = [...winners];
            newWinners[reelIdx] = skin;
            winners = newWinners;
            setWinningSkins(newWinners);
          }
          const hookTx = -(itemIdx * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerHook);
          const hookDist = Math.abs(hookTx - frozenXRef.current[reelIdx]);
          // Одно fluid-движение: резкий рывок цепи и плавная посадка.
          // Длительность от дистанции — и рядом, и далеко едет естественно.
          const glideDur = Math.max(0.9, Math.min(2.1, 0.85 + hookDist / 5200));
          const glides = [];
          for (let i = 0; i < spinOpenCount; i++) {
            const tx = -((i === reelIdx ? itemIdx : WIN_INDEX) * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerHook);
            // Крюк тащит только свой барабан; остальные докручиваются как шли
            const hooked = i === reelIdx;
            glides.push(
              ctrls[i].start({
                x: tx,
                transition: hooked
                  ? { duration: glideDur, ease: [0.2, 0.9, 0.25, 1] }
                  : { duration: glideDur, ease: [0.12, 0.8, 0.15, 1] },
              })
            );
          }
          sound.startSpinWhoosh(glideDur);
          await Promise.all(glides);
          sound.stopSpinWhoosh();
          setHookFlying(false);
          stopRopeLoop();
          finishSpin(winners);
          break;
        } else {
          // СОРВАЛАСЬ: цепь РВЁТСЯ пополам с искрами — кусок остаётся
          // на стрелке, кусок на карте, оба быстро и плавно исчезают.
          // Лента стартует с места, быстро разгоняется и мягко садится в цель.
          await new Promise<void>((r) => setTimeout(r, 250));
          setHookFlying(false);
          {
            const pts = ropePtsRef.current;
            const mid = Math.floor(pts.length / 2);
            const first = pts.slice(0, mid + 1).map((p) => ({ ...p }));
            const second = pts.slice(mid).map((p) => ({ ...p }));
            snapRef.current = { first, second, life: 1 };
            const mp = pts[mid];
            setHookSparks({ reelIdx: ropeReelRef.current, x: mp.x, y: mp.y, key: Date.now() });
            setTimeout(() => setHookSparks(null), 750);
          }
          ropeModeRef.current = 'snapped';
          setHookResult('slipped');
          sound.playHookSlip();
          // Старт с места: быстрый разгон и мягкая посадка точно в цель.
          // ease [0.5,0,0.2,1] — нулевая скорость на старте и на финише.
          const remain = Math.abs(
            -(WIN_INDEX * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerHook) - frozenXRef.current[0]
          );
          const resumeDur = Math.max(0.9, Math.min(2.0, 0.8 + remain / 6000));
          const resume = [];
          for (let i = 0; i < spinOpenCount; i++) {
            const tx = -(WIN_INDEX * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerHook);
            ctrls[i].set({ x: frozenXRef.current[i] });
            resume.push(
              ctrls[i].start({
                x: tx,
                transition: { duration: resumeDur, ease: [0.5, 0, 0.2, 1] },
              })
            );
          }
          setTimeout(() => setHookResult(null), 1500);
          await Promise.all(resume);
          finishSpin(winners);
          break;
        }
      }

      spinResolveRef.current = null;
      hookResolveRef.current = null;
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
            8% { opacity: 0.5; }
            16% { opacity: 1; }
            30% { opacity: 0.65; }
            45% { opacity: 1; }
            62% { opacity: 0.55; }
            78% { opacity: 1; }
          }
          @keyframes caseZeusBoltFlow {
            0% { stroke-dashoffset: 0; opacity: 1; }
            50% { opacity: 0.55; }
            100% { stroke-dashoffset: -28; opacity: 1; }
          }
          @keyframes caseZeusPulse {
            0% { transform: translateY(-20px); opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translateY(250px); opacity: 0; }
          }
          @keyframes caseZeusSpark {
            0%, 100% { transform: scale(0.65) rotate(-12deg); opacity: 0.35; }
            50% { transform: scale(1.35) rotate(10deg); opacity: 1; }
          }
          .case-zeus-stripe {
            animation: caseZeusFlicker 0.7s linear infinite;
          }
          .case-zeus-glow {
            animation: caseZeusFlicker 0.7s linear infinite;
          }
          .case-zeus-bolt {
            animation: caseZeusBoltFlow 0.45s linear infinite;
          }
          .case-zeus-pulse {
            animation: caseZeusPulse 1.1s ease-in infinite;
          }
          .case-zeus-spark {
            animation: caseZeusSpark ease-in-out infinite;
            transform-origin: center;
            transform-box: fill-box;
          }
          @keyframes hookSparkFly {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--dx), var(--dy)) scale(0.25); opacity: 0; }
          }
          .hook-spark-burst {
            animation: hookSparkFly 0.55s ease-out forwards;
            box-shadow: 0 0 8px rgba(253, 186, 116, 0.9);
            will-change: transform, opacity;
          }
          @keyframes casePotionRise {
            0% { transform: translateY(0) translateX(0) scale(0.7); opacity: 0; }
            10% { opacity: 0.85; }
            35% { transform: translateY(-110px) translateX(7px) scale(1); opacity: 0.75; }
            65% { transform: translateY(-200px) translateX(-7px) scale(1.05); opacity: 0.65; }
            88% { opacity: 0.5; }
            100% { transform: translateY(-320px) translateX(4px) scale(1.15); opacity: 0; }
          }
          @keyframes casePotionGlowPulse {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
          .case-potion-bubble {
            animation: casePotionRise linear infinite;
            will-change: transform, opacity;
          }
          .case-potion-glow {
            animation: casePotionGlowPulse 2.4s ease-in-out infinite;
          }
        `}
      </style>
      {/* Multi-reel display */}
      <div className="w-full max-w-5xl flex flex-col gap-4">
        {Array.from({ length: openCount }).map((_, reelIdx) => (
          <div
            key={reelIdx}
            onMouseMove={(e) => handleReelMouseMove(reelIdx, e)}
            onPointerUp={handleCardPointerUp}
            onPointerCancel={() => {
              tapDownRef.current = null;
            }}
            className={`relative w-full rounded-3xl p-3 glass-panel border shadow-2xl overflow-hidden transition-colors duration-300 ${
              isZeusCharged
                ? 'border-sky-400/50 shadow-[0_0_35px_rgba(56,189,248,0.35)]'
                : showPotionBg
                ? 'border-emerald-400/40 shadow-[0_0_30px_rgba(16,185,129,0.22)]'
                : 'border-white/10'
            }`}
          >
            {/* Зелье удачи активно — зелень выше, до верха окна спина */}
            {showPotionBg && (
              <div
                className="case-potion-glow absolute inset-0 z-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to top, rgba(16,185,129,0.24) 0%, rgba(16,185,129,0.13) 45%, rgba(16,185,129,0.06) 70%, rgba(16,185,129,0.015) 88%, transparent 100%)',
                }}
              />
            )}
            {/* Пузырьки и клевер вверх при активном зелье — фон ЗА карточками, летят до самого верха */}
            {showPotionBg && (
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
                {Array.from({ length: 8 }).map((__, bi) => {
                  const seed = (reelIdx * 37 + bi * 17) % 100;
                  const left = (seed * 0.9 + 2) % 96;
                  const size = 5 + (seed % 10);
                  const delay = ((seed % 40) / 10).toFixed(2);
                  const dur = (3.8 + ((seed * 7) % 30) / 10).toFixed(2);
                  return (
                    <span
                      key={bi}
                      className="case-potion-bubble absolute rounded-full"
                      style={{
                        left: `${left.toFixed(1)}%`,
                        bottom: '-14px',
                        width: size,
                        height: size,
                        animationDelay: `${delay}s`,
                        animationDuration: `${dur}s`,
                        background: 'radial-gradient(circle at 32% 30%, rgba(236,253,245,0.9) 0%, rgba(110,231,183,0.55) 35%, rgba(16,185,129,0.22) 70%, transparent 100%)',
                      }}
                    />
                  );
                })}
                {/* Частицы четырёхлистного клевера — тот же дешёвый rise, только transform+opacity */}
                {Array.from({ length: 5 }).map((__, ci) => {
                  const seed = (reelIdx * 53 + ci * 29 + 11) % 100;
                  const left = (seed * 1.1 + 4) % 94;
                  const size = 9 + (seed % 6);
                  const delay = ((seed % 50) / 10).toFixed(2);
                  const dur = (4.6 + ((seed * 5) % 24) / 10).toFixed(2);
                  return (
                    <svg
                      key={`clover-${ci}`}
                      viewBox="0 0 20 20"
                      className="case-potion-bubble absolute"
                      style={{
                        left: `${left.toFixed(1)}%`,
                        bottom: '-16px',
                        width: size,
                        height: size,
                        animationDelay: `${delay}s`,
                        animationDuration: `${dur}s`,
                      }}
                    >
                      <g fill="#34d399" opacity="0.85">
                        <circle cx="7" cy="7" r="3.6" />
                        <circle cx="13" cy="7" r="3.6" />
                        <circle cx="7" cy="13" r="3.6" />
                        <circle cx="13" cy="13" r="3.6" />
                      </g>
                      <path d="M10 12 C10 15 11.5 17 14 18" fill="none" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" />
                      <circle cx="7.6" cy="6.4" r="1" fill="#ecfdf5" opacity="0.9" />
                    </svg>
                  );
                })}
              </div>
            )}
            {/* Center Winner Indicator — обычная жёлтая / синяя с живыми молниями при Zeus */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 z-30 pointer-events-none flex flex-col justify-between items-center py-0.5">
              {isZeusCharged ? (
                <>
                  {/* Верхняя стрелка: слоёный наконечник с ядром-молнией */}
                  <div className="relative w-6 h-[18px] flex items-start justify-center">
                    <svg viewBox="0 0 24 18" className="case-zeus-glow w-6 h-[18px]">
                      <polygon points="12,18 2,2 22,2" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1.5" strokeLinejoin="round" />
                      <polygon points="12,15 7,5 17,5" fill="#bae6fd" opacity="0.9" />
                      <path d="M 12 4 L 10.4 9.5 L 12.4 9.5 L 11 15" fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="case-zeus-stripe" />
                    </svg>
                  </div>
                  {/* Вертикаль: внешнее свечение + синее ядро + белое горячее ядро + бегущая молния + пульс */}
                  <div className="relative flex-1 w-[10px] flex justify-center">
                    <div className="case-zeus-stripe absolute inset-y-0 w-[10px] bg-sky-400/20" />
                    <div className="case-zeus-stripe absolute inset-y-0 w-[3px] bg-sky-400 opacity-95" />
                    <div className="case-zeus-glow absolute inset-y-0 w-[1px] bg-white opacity-90" />
                    {/* Бегущая по полосе молния (dash-flow) */}
                    <svg viewBox="0 0 14 100" className="absolute inset-y-0 left-1/2 -translate-x-1/2 h-full w-[14px] filter drop-shadow-[0_0_7px_#38bdf8]" preserveAspectRatio="none">
                      <path
                        d="M 8 0 L 4.5 22 L 8.5 22 L 5 45 L 9 45 L 6 68 L 9.5 55 L 6.5 55 L 10 30 L 6 30 L 9.5 10 Z"
                        fill="none"
                        stroke="#f0f9ff"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="7 5"
                        className="case-zeus-bolt"
                      />
                      <path
                        d="M 8 0 L 4.5 22 L 8.5 22 L 5 45 L 9 45 L 6 68 L 9.5 55 L 6.5 55 L 10 30 L 6 30 L 9.5 10 Z"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.45"
                      />
                    </svg>
                    {/* Бегущий энергетический сгусток сверху вниз */}
                    <div className="absolute left-1/2 top-0 -ml-[3px] w-[6px] h-[16px] rounded-full bg-gradient-to-b from-white via-sky-200 to-transparent case-zeus-pulse" />
                    {/* Боковые искры-молнии */}
                    <svg viewBox="0 0 10 14" className="case-zeus-spark absolute -left-[9px] top-[10%] w-[10px] h-[14px] filter drop-shadow-[0_0_6px_#38bdf8]" style={{ animationDelay: '0s', animationDuration: '0.5s' }}>
                      <path d="M 6 1 L 2.5 8 L 5.5 8 L 4 13" fill="none" stroke="#fefce8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <svg viewBox="0 0 10 14" className="case-zeus-spark absolute -right-[9px] top-[38%] w-[10px] h-[14px] filter drop-shadow-[0_0_6px_#38bdf8]" style={{ animationDelay: '0.18s', animationDuration: '0.6s' }}>
                      <path d="M 4 1 L 7.5 8 L 4.5 8 L 6 13" fill="none" stroke="#bae6fd" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <svg viewBox="0 0 10 14" className="case-zeus-spark absolute -left-[9px] bottom-[12%] w-[10px] h-[14px] filter drop-shadow-[0_0_6px_#38bdf8]" style={{ animationDelay: '0.32s', animationDuration: '0.55s' }}>
                      <path d="M 6 1 L 2.5 8 L 5.5 8 L 4 13" fill="none" stroke="#e0f2fe" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {/* Нижняя стрелка — зеркально верхней */}
                  <div className="relative w-6 h-[18px] flex items-end justify-center">
                    <svg viewBox="0 0 24 18" className="case-zeus-glow w-6 h-[18px]">
                      <polygon points="12,0 2,16 22,16" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1.5" strokeLinejoin="round" />
                      <polygon points="12,3 7,13 17,13" fill="#bae6fd" opacity="0.9" />
                      <path d="M 12 3 L 13.6 8.5 L 11.6 8.5 L 13 14" fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="case-zeus-stripe" />
                    </svg>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-yellow-400 filter drop-shadow-[0_0_10px_#facc15]" />
                  <div className="w-[2px] h-full bg-yellow-400 opacity-90 shadow-[0_0_12px_#facc15]" />
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-yellow-400 filter drop-shadow-[0_0_10px_#facc15]" />
                </>
              )}
            </div>

            {/* Zeus lightning flash overlay — тройной разряд */}
            {zeusStriking && (
              <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center bg-sky-500/10 animate-in fade-in zoom-in duration-150">
                <svg viewBox="0 0 200 120" className="case-zeus-glow w-2/3 h-2/3 filter drop-shadow-[0_0_25px_#38bdf8]">
                  <path
                    d="M 100 2 L 86 45 L 108 42 L 80 82 L 106 77 L 94 118"
                    stroke="#38bdf8"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                  <path
                    d="M 100 2 L 86 45 L 108 42 L 80 82 L 106 77 L 94 118"
                    stroke="#ffffff"
                    strokeWidth="2.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="10 4"
                    className="case-zeus-bolt"
                  />
                  <path
                    d="M 132 8 L 124 34 L 136 32 L 122 62"
                    stroke="#bae6fd"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="case-zeus-stripe"
                  />
                  <path
                    d="M 68 8 L 76 34 L 64 32 L 78 62"
                    stroke="#bae6fd"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="case-zeus-stripe"
                  />
                </svg>
              </div>
            )}

            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#08080a] to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#08080a] to-transparent z-20 pointer-events-none" />

            <div ref={reelIdx === 0 ? containerRef0 : undefined} className="relative z-[1] w-full overflow-hidden py-3">
              <motion.div
                animate={animControls[reelIdx]}
                onUpdate={(latest) => {
                  const v = (latest as { x?: unknown }).x;
                  if (typeof v === 'number') liveXRef.current[reelIdx] = v;
                }}
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

                  const isHookPicked = hookPicked?.reelIdx === reelIdx && hookPicked?.itemIdx === idx;
                  return (
                    <div
                      key={`${skin.id}_${idx}`}
                      onPointerDown={(e) => handleCardPointerDown(reelIdx, idx, e)}
                      onPointerCancel={() => {
                        tapDownRef.current = null;
                      }}
                      className={`relative rounded-2xl bg-[#11121a] border shrink-0 flex flex-col items-center justify-between p-3 select-none overflow-hidden transition-all ${
                        isHookPicked
                          ? 'border-orange-400 shadow-[0_0_22px_rgba(249,115,22,0.6)]'
                          : showAsSpecial
                          ? 'border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                          : hookArmed
                          ? 'border-white/10 cursor-pointer touch-manipulation hover:border-orange-400/80 hover:shadow-[0_0_18px_rgba(249,115,22,0.45)]'
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
                      <div className="w-full flex justify-between items-center gap-1 z-10">
                        <div className="flex items-center gap-1 min-w-0">
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
              {/* Живая железная цепь крюка (верёвочная физика, пишет rAF напрямую в DOM) */}
              {ropeOn && (
                <div
                  ref={(el) => {
                    ropeWrapRefs.current[reelIdx] = el;
                  }}
                  className="absolute inset-0 z-30 pointer-events-none"
                  style={{ display: 'none' }}
                >
                  <svg viewBox={`0 0 ${ropeDimsRef.current.w} ${ropeDimsRef.current.h}`} className="w-full h-full">
                    <path
                      ref={(el) => {
                        ropeBaseRefs.current[reelIdx] = el;
                      }}
                      d=""
                      stroke="#52525b"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                    <path
                      ref={(el) => {
                        ropeLinkRefs.current[reelIdx] = el;
                      }}
                      d=""
                      stroke="#d4d4d8"
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="7 5"
                      opacity="0.95"
                    />
                    <g
                      ref={(el) => {
                        ropeHookRefs.current[reelIdx] = el;
                      }}
                      className="filter drop-shadow-[0_0_7px_rgba(161,161,170,0.9)]"
                    >
                      <circle cx="0" cy="-10" r="2.6" fill="none" stroke="#a1a1aa" strokeWidth="2.4" />
                      <path d="M 0 -8 L 0 6" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" />
                      <path d="M 0 6 C -0.5 2, -5 1, -8 -2.5 M -8 -2.5 L -5.4 -2.1 M -8 -2.5 L -7.4 0.6" fill="none" stroke="#a1a1aa" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 0 6 C 0.5 2, 5 1, 8 -2.5 M 8 -2.5 L 5.4 -2.1 M 8 -2.5 L 7.4 0.6" fill="none" stroke="#a1a1aa" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 0 6 L 0 10.5" stroke="#e4e4e7" strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                  </svg>
                </div>
              )}
              {/* Вспышка искр в точке зацепа */}
              {hookSparks && hookSparks.reelIdx === reelIdx && (
                <div
                  key={hookSparks.key}
                  className="absolute z-40 pointer-events-none"
                  style={{ left: hookSparks.x, top: hookSparks.y, width: 0, height: 0 }}
                >
                  {Array.from({ length: 9 }).map((__, si) => {
                    const ang = (si / 9) * Math.PI * 2 + 0.3;
                    const dist = 26 + (si % 3) * 12;
                    return (
                      <span
                        key={si}
                        className="hook-spark-burst absolute rounded-full"
                        style={{
                          width: si % 3 === 0 ? 5 : 3,
                          height: si % 3 === 0 ? 5 : 3,
                          background: si % 2 === 0 ? '#fdba74' : '#fff7ed',
                          // @ts-expect-error CSS vars
                          '--dx': `${(Math.cos(ang) * dist).toFixed(1)}px`,
                          '--dy': `${(Math.sin(ang) * dist).toFixed(1)}px`,
                          animationDelay: `${(si * 0.02).toFixed(2)}s`,
                        }}
                      />
                    );
                  })}
                </div>
              )}
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

          {/* Universal Luck Potion Indicator — единый стиль пилюль сайта */}
          {activePotionCharges > 0 ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass-panel border border-emerald-500/30 bg-emerald-500/10 text-white select-none text-xs shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              title={locale === 'ru'
                ? `Зелье удачи активно! Осталось ${activePotionCharges} — повышенный шанс на тайное и ножи!`
                : `Luck Potion active! ${activePotionCharges} left — boosted covert and knives!`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-bold text-xs text-emerald-400">{activePotionCharges}/3</span>
            </div>
          ) : potionsCount > 0 ? (
            <button
              type="button"
              onClick={() => drinkPotion()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass-panel border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-white/80 hover:text-white font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              title={locale === 'ru' ? `Выпить зелье удачи +3 заряда. В наличии: ${potionsCount}` : `Drink Luck Potion +3 charges. In stock: ${potionsCount}`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-bold text-xs text-emerald-400">{potionsCount}</span>
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
                <span>
                  {zeusUsedThisSpin || zeusStriking
                    ? (locale === 'ru' ? 'Zeus бьёт! Перекрут...' : 'Zeus strikes! Rerolling...')
                    : (locale === 'ru' ? `Вжать Zeus! · ${zeusCount} шт.` : `Hit Zeus! · ${zeusCount}`)}
                </span>
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
          {/* Крюк-кошка во время спина — клик по карте на ленте, 50/50 */}
          {isSpinning && (hookCount > 0 || hookArmed || hookUsedThisSpin || hookFlying) && (
            <button
              type="button"
              onClick={handleArmHook}
              disabled={!canPressHook && !hookArmed}
              className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 ${
                hookArmed
                  ? 'bg-orange-400 text-black border-orange-200 shadow-[0_0_25px_rgba(249,115,22,0.7)] cursor-pointer active:scale-95 animate-pulse'
                  : canPressHook
                  ? 'bg-orange-950/40 hover:bg-orange-900/50 border-orange-500/40 hover:border-orange-400 text-orange-200 cursor-pointer active:scale-95'
                  : 'bg-orange-500/10 border-orange-500/30 text-orange-300/70 cursor-default'
              }`}
            >
              <Anchor className={`w-4 h-4 ${hookArmed ? 'animate-bounce' : ''}`} />
              <span>
                {hookUsedThisSpin || hookFlying
                  ? hookResult === 'slipped'
                    ? (locale === 'ru' ? 'Сорвался!' : 'Slipped!')
                    : hookResult === 'hooked'
                    ? (locale === 'ru' ? 'Зацепился!' : 'Latched!')
                    : (locale === 'ru' ? 'Крюк летит...' : 'Hook flying...')
                  : hookArmed
                  ? (locale === 'ru' ? 'Кликни по карте!' : 'Click a card!')
                  : (locale === 'ru' ? `Крюк-кошка 50/50 · ${hookCount} шт.` : `Grappling Hook 50/50 · ${hookCount}`)}
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
