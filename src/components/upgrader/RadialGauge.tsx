import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { SkinEntity, InventoryItem, CaseItem, SkinRarity } from '../../lib/types';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { RARITY_CONFIG } from '../../data/skins';
import { sound } from '../../lib/sound';
import { useGameStore } from '../../store/useGameStore';
import allCasesJson from '../../data/all_cases.json';
import { Check, X, Search, ChevronRight, RotateCcw, AlertCircle, Plus, Gift, ShieldCheck, Percent } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CashbackModal } from './CashbackModal';
import { WearBadge } from '../ui/WearBadge';
import { StatTrakBadge } from '../ui/StatTrakBadge';
import { SkinImage } from '../ui/SkinImage';
import { useLanguage } from '../../lib/i18n';
import { isStatTrakableItem } from '../../lib/steam';

export const matchesCatalogType = (skin: SkinEntity, type: string): boolean => {
  if (type === 'all') return true;
  const w = skin.weapon.toLowerCase();
  const n = skin.name.toLowerCase();

  const isSticker = w === 'sticker' || w === 'наклейка' || n.startsWith('sticker |') || n.startsWith('наклейка |');
  const isCharm = w === 'charm' || w === 'брелок' || n.startsWith('charm |') || n.startsWith('брелок |');
  const isAgent = w === 'agent' || w === 'оперативник' || n.startsWith('agent |');
  const isPatch = w === 'patch' || n.startsWith('patch |');

  if (type === 'stickers') return isSticker || isPatch;
  if (type === 'charms') return isCharm;
  if (type === 'agents') return isAgent;

  // Gloves & Knives must NOT be stickers, charms, agents, patches
  if (isSticker || isCharm || isAgent || isPatch) return false;

  const isGlove = w.includes('gloves') || w.includes('wraps') || w.includes('перчатки') || w.includes('обмотки');
  if (type === 'gloves') return isGlove;
  if (isGlove) return false;

  const isKnife =
    (skin.name.startsWith('★') && !isGlove) ||
    w.includes('knife') ||
    w.includes('нож') ||
    w.includes('bayonet') ||
    w.includes('karambit') ||
    w.includes('daggers') ||
    w.includes('stiletto') ||
    w.includes('kukri') ||
    w.includes('talon') ||
    w.includes('ursus');
  if (type === 'knives') return isKnife;
  if (isKnife) return false;

  if (type === 'snipers') return ['awp', 'ssg 08', 'scar-20', 'g3sg1'].includes(w);
  if (type === 'rifles') return ['ak-47', 'm4a4', 'm4a1-s', 'galil ar', 'famas', 'aug', 'sg 553'].includes(w);
  if (type === 'pistols') return ['usp-s', 'glock-18', 'desert eagle', 'p250', 'five-seven', 'tec-9', 'cz75-auto', 'dual berettas', 'r8 revolver', 'p2000', 'zeus x27'].includes(w);
  if (type === 'smgs') return ['mp9', 'mac-10', 'mp7', 'mp5-sd', 'ump-45', 'p90', 'pp-bizon'].includes(w);
  if (type === 'heavy') return ['nova', 'xm1014', 'mag-7', 'sawed-off', 'negev', 'm249'].includes(w);

  return true;
};

export const isActualWeapon = (skin: SkinEntity): boolean => {
  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();
  if (w === 'sticker' || w === 'наклейка' || n.startsWith('sticker |') || n.startsWith('наклейка |')) return false;
  if (w === 'charm' || w === 'брелок' || n.startsWith('charm |') || n.startsWith('брелок |')) return false;
  if (w === 'agent' || w === 'оперативник' || n.startsWith('agent |')) return false;
  if (w === 'patch' || n.startsWith('patch |')) return false;
  if (w.includes('music kit') || n.includes('music kit')) return false;
  if (w.includes('pin') || n.includes('pin |')) return false;
  return true;
};

const ITEM_TYPES = [
  { id: 'all', label: 'Все', icon: '⊞' },
  { id: 'knives', label: 'Ножи', icon: '★' },
  { id: 'gloves', label: 'Перчатки', icon: '🧤' },
  { id: 'snipers', label: 'Снайперские', icon: '🎯' },
  { id: 'rifles', label: 'Винтовки', icon: '⚡' },
  { id: 'pistols', label: 'Пистолеты', icon: '🔫' },
  { id: 'smgs', label: 'ПП', icon: '💥' },
  { id: 'heavy', label: 'Тяжелое', icon: '🛡️' },
  { id: 'stickers', label: 'Наклейки', icon: '🏷️' },
  { id: 'agents', label: 'Агенты', icon: '👤' },
  { id: 'charms', label: 'Брелоки', icon: '🔑' },
];

interface RadialGaugeProps {
  inventory: InventoryItem[];
  catalogSkins: SkinEntity[];
}

import { LUCK_POTION, SAVE_TOKEN, ZEUS_ITEM, rollConsolationPrize } from '../../lib/consumables';

export const RadialGauge: React.FC<RadialGaugeProps> = ({ inventory, catalogSkins }) => {
  const {
    balance,
    deductBalance,
    addToInventory,
    removeFromInventory,
    recordUpgrade,
    potionsCount,
    activePotionCharges,
    drinkPotion,
    consumePotionCharge,
    saveTokensCount,
    useSaveToken,
    zeusCount,
    useZeus,
    addPotion,
    addSaveToken,
    addZeus,
    addLiveDrop,
  } = useGameStore();
  const { t, locale } = useLanguage();

  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [customBetDc, setCustomBetDc] = useState<number>(1000);
  const [betMode, setBetMode] = useState<'skin' | 'dc' | 'consumables'>('skin');
  const [protectedInstanceId, setProtectedInstanceId] = useState<string | null>(null);
  const [zeusStriking, setZeusStriking] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [zeusUsedThisSpin, setZeusUsedThisSpin] = useState<boolean>(false);
  const spinResolveRef = useRef<(() => void) | null>(null);

  const [targetChance, setTargetChance] = useState<number>(50);
  const [targetSkin, setTargetSkin] = useState<SkinEntity | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [lastResult, setLastResult] = useState<'win' | 'lose' | null>(null);

  // Cashback state
  const [cashbackModal, setCashbackModal] = useState<{
    isOpen: boolean;
    caseItem?: CaseItem;
    skin?: SkinEntity;
    awardedConsumable?: 'potion' | 'save_token' | 'zeus';
    lostAmount: number;
  } | null>(null);

  // Search & Filter state
  const [mySearch, setMySearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogRarity, setCatalogRarity] = useState('all');
  const [catalogType, setCatalogType] = useState('all');
  const [catalogWeapon, setCatalogWeapon] = useState('all');
  const [catalogSort, setCatalogSort] = useState<'asc' | 'desc'>('asc');

  // Infinite scroll for catalog
  const [catalogLimit, setCatalogLimit] = useState(60);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const recentPicksRef = useRef<string[]>([]);



  // IntersectionObserver for load-more sentinel
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCatalogLimit(prev => prev + 60);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  });

  const needleControls = useAnimation();

  // Calculate Total Bet Sum
  const effectiveBetDc = useMemo(() => {
    if (betMode === 'skin') {
      return selectedItems.reduce((sum, item) => sum + item.priceDc, 0);
    }
    return customBetDc;
  }, [betMode, selectedItems, customBetDc]);

  // Max target price restriction (infinite since tokens removed)
  const maxTargetPrice = Infinity;

  // Reset catalog limit when filters change
  useEffect(() => {
    setCatalogLimit(100);
  }, [catalogSearch, catalogRarity, catalogType, catalogWeapon, catalogSort, effectiveBetDc, maxTargetPrice]);

  // Reset catalogWeapon when catalogType changes
  useEffect(() => {
    setCatalogWeapon('all');
  }, [catalogType]);

  // Auto-Select target skin when bet or target chance changes
  const autoSelectTargetSkin = (desiredChance: number, currentBet: number, forceType?: string) => {
    if (currentBet <= 0) return;
    const clampedChance = Math.min(80, Math.max(1, desiredChance));
    const typeToMatch = forceType !== undefined ? forceType : catalogType;

    // Filter all skins that are eligible by bet price and category
    let allEligible = catalogSkins.filter(
      (s) => s.priceDc > currentBet && s.priceDc <= maxTargetPrice && matchesCatalogType(s, typeToMatch)
    );
    if (allEligible.length === 0) {
      allEligible = catalogSkins.filter(
        (s) => s.priceDc > currentBet && s.priceDc <= maxTargetPrice
      );
    }
    if (allEligible.length === 0) return;

    // Precise formula for actual resulting chance on gauge
    const calcChance = (s: SkinEntity) => Math.min(80, (currentBet / s.priceDc) * 95);

    // Filter candidates matching requested chance within reasonable tolerance
    // (Broad enough to encompass all wear qualities: FN, MW, FT, WW, BS, and StatTrak)
    let tolerance = Math.max(2.5, clampedChance * 0.25);
    let closeCandidates = allEligible.filter(
      (s) => Math.abs(calcChance(s) - clampedChance) <= tolerance
    );

    // If few skins in tolerance, widen tolerance
    if (closeCandidates.length < 5) {
      tolerance = Math.max(4.5, clampedChance * 0.45);
      closeCandidates = allEligible.filter(
        (s) => Math.abs(calcChance(s) - clampedChance) <= tolerance
      );
    }

    // If still none, sort by closest chance and take top 100
    if (closeCandidates.length === 0) {
      closeCandidates = [...allEligible]
        .sort((a, b) => Math.abs(calcChance(a) - clampedChance) - Math.abs(calcChance(b) - clampedChance))
        .slice(0, 100);
    }

    // Exclude recently shown skins to guarantee cycling through NEW skins and qualities
    const recentSet = new Set(recentPicksRef.current);
    let candidatePool = closeCandidates.filter((s) => !recentSet.has(s.id) && s.id !== targetSkin?.id);
    if (candidatePool.length === 0) {
      // If history exhausted, prune older half and re-filter
      recentPicksRef.current = recentPicksRef.current.slice(-15);
      const prunedSet = new Set(recentPicksRef.current);
      candidatePool = closeCandidates.filter((s) => !prunedSet.has(s.id) && s.id !== targetSkin?.id);
      if (candidatePool.length === 0) {
        candidatePool = closeCandidates.filter((s) => s.id !== targetSkin?.id);
      }
    }
    if (candidatePool.length === 0) {
      candidatePool = closeCandidates;
    }

    let chosenSkin: SkinEntity | null = null;

    if (typeToMatch === 'all') {
      // Group matching candidates into diverse category buckets: weapons, knives, gloves, stickers/charms/agents
      const knifeBucket = candidatePool.filter((s) => matchesCatalogType(s, 'knives'));
      const gloveBucket = candidatePool.filter((s) => matchesCatalogType(s, 'gloves'));
      const gunBucket = candidatePool.filter(
        (s) => isActualWeapon(s) && !matchesCatalogType(s, 'knives') && !matchesCatalogType(s, 'gloves')
      );
      const miscBucket = candidatePool.filter(
        (s) => !isActualWeapon(s) || matchesCatalogType(s, 'stickers') || matchesCatalogType(s, 'charms') || matchesCatalogType(s, 'agents')
      );

      // Category distribution: Guns (45%), Knives (30%), Gloves (15%), Misc (10%)
      const buckets: Array<{ name: string; items: SkinEntity[]; weight: number }> = [];
      if (gunBucket.length > 0) buckets.push({ name: 'guns', items: gunBucket, weight: 45 });
      if (knifeBucket.length > 0) buckets.push({ name: 'knives', items: knifeBucket, weight: 30 });
      if (gloveBucket.length > 0) buckets.push({ name: 'gloves', items: gloveBucket, weight: 15 });
      if (miscBucket.length > 0) buckets.push({ name: 'misc', items: miscBucket, weight: 10 });

      let chosenBucketItems = candidatePool;
      if (buckets.length > 0) {
        const totalWeight = buckets.reduce((acc, b) => acc + b.weight, 0);
        let r = Math.random() * totalWeight;
        for (const b of buckets) {
          r -= b.weight;
          if (r <= 0) {
            chosenBucketItems = b.items;
            break;
          }
        }
      }

      // Pick uniformly at random from the bucket to ensure all wear qualities (FN, MW, FT, WW, BS) appear equally
      const randomIndex = Math.floor(Math.random() * chosenBucketItems.length);
      chosenSkin = chosenBucketItems[randomIndex] || chosenBucketItems[0];
    } else {
      // Specific category tab active
      let tabPool = candidatePool;
      if (catalogWeapon !== 'all') {
        const weaponMatches = candidatePool.filter(
          (s) => s.weapon.toLowerCase() === catalogWeapon.toLowerCase()
        );
        if (weaponMatches.length > 0) {
          tabPool = weaponMatches;
        }
      }

      const randomIndex = Math.floor(Math.random() * tabPool.length);
      chosenSkin = tabPool[randomIndex] || tabPool[0];
    }

    if (chosenSkin) {
      recentPicksRef.current.push(chosenSkin.id);
      if (recentPicksRef.current.length > 60) {
        recentPicksRef.current.shift();
      }
      setTargetSkin(chosenSkin);
    }
  };

  // Initial load or item selection changes
  useEffect(() => {
    if (inventory.length > 0 && selectedItems.length === 0 && betMode === 'skin') {
      setSelectedItems([inventory[0]]);
      autoSelectTargetSkin(50, inventory[0].priceDc);
    } else if (betMode === 'dc' && !targetSkin) {
      autoSelectTargetSkin(targetChance, customBetDc);
    }
  }, [inventory, betMode]);

  // When effectiveBetDc changes, ensure targetSkin is valid
  useEffect(() => {
    if (effectiveBetDc > 0) {
      if (!targetSkin || targetSkin.priceDc <= effectiveBetDc || targetSkin.priceDc > maxTargetPrice) {
        autoSelectTargetSkin(targetChance, effectiveBetDc);
      }
    }
  }, [effectiveBetDc, maxTargetPrice]);

  // Base raw chance from bet vs target (capped at max 80%)
  const baseChance = useMemo(() => {
    if (!targetSkin || targetSkin.priceDc <= 0 || effectiveBetDc <= 0) return 0;
    const raw = (effectiveBetDc / targetSkin.priceDc) * 95;
    return Math.min(80, Math.max(0.01, Number(raw.toFixed(2))));
  }, [effectiveBetDc, targetSkin]);

  // If 80% is reached without potion, the potion is NOT used and charges are saved
  const isBaseAtMax = baseChance >= 79.95;

  // Potion is only eligible & used if base chance is below 80%
  const isPotionUsed = activePotionCharges > 0 && targetSkin !== null && effectiveBetDc > 0 && !isBaseAtMax;

  // Luck Potion bonus (+15% max, but strictly clamped so total chance and potion bar never exceed 80%)
  const potionBonus = useMemo(() => {
    if (!isPotionUsed) return 0;
    const remainingTo80 = Number((80 - baseChance).toFixed(2));
    return Math.min(15, Math.max(0, remainingTo80));
  }, [isPotionUsed, baseChance]);

  // Zeus x27 tactical shock bonus (+5% max, strictly clamped to 80%)
  const zeusBonus = useMemo(() => {
    if (!zeusUsedThisSpin) return 0;
    const remainingTo80 = Number((80 - baseChance - potionBonus).toFixed(2));
    return Math.min(5, Math.max(0, remainingTo80));
  }, [zeusUsedThisSpin, baseChance, potionBonus]);

  // Total chance displayed and used for roll (strictly max 80% with potion & zeus included)
  const chance = useMemo(() => {
    if (baseChance <= 0) return 0;
    return Math.min(80, Number((baseChance + potionBonus + zeusBonus).toFixed(2)));
  }, [baseChance, potionBonus, zeusBonus]);

  // Risk label
  const riskLabel = useMemo(() => {
    if (chance >= 75) return { text: t('risk.veryHigh'), color: '#10B981' };
    if (chance >= 50) return { text: t('risk.high'), color: '#10B981' };
    if (chance >= 25) return { text: t('risk.medium'), color: '#FACC15' };
    if (chance >= 10) return { text: t('risk.risky'), color: '#FB923C' };
    if (chance >= 1) return { text: t('risk.low'), color: '#F87171' };
    return { text: t('risk.extreme'), color: '#EF4444' };
  }, [chance, t]);

  // Toggle inventory item selection (up to 5 items)
  const handleToggleInventoryItem = (item: InventoryItem) => {
    if (isUpgrading) return;
    sound.playClick();
    setBetMode('skin');

    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.instanceId === item.instanceId);
      const next = exists
        ? prev.filter((i) => i.instanceId !== item.instanceId)
        : prev.length >= 5
        ? prev
        : [...prev, item];
      const nextBet = next.reduce((sum, i) => sum + i.priceDc, 0);
      if (nextBet > 0) {
        autoSelectTargetSkin(targetChance, nextBet);
      }
      return next;
    });
  };

  const handleRemoveSelectedItem = (instanceId: string) => {
    if (isUpgrading) return;
    sound.playClick();
    setSelectedItems((prev) => {
      const next = prev.filter((i) => i.instanceId !== instanceId);
      const nextBet = next.reduce((sum, i) => sum + i.priceDc, 0);
      if (nextBet > 0) {
        autoSelectTargetSkin(targetChance, nextBet);
      }
      return next;
    });
  };

  const handleClearAllSelected = () => {
    if (isUpgrading) return;
    sound.playClick();
    setSelectedItems([]);
  };

  // Quick Chance presets (PRIMARY)
  const chancePresets = [
    { label: '1%', chance: 1.0 },
    { label: '5%', chance: 5.0 },
    { label: '10%', chance: 10.0 },
    { label: '25%', chance: 25.0 },
    { label: '35%', chance: 35.0 },
    { label: '50%', chance: 50.0 },
    { label: '75%', chance: 75.0 },
  ];

  // Quick Multiplier presets (SECONDARY)
  const multiplierPresets = [
    { label: '1.5x', chance: 63.3 },
    { label: '2x', chance: 47.5 },
    { label: '5x', chance: 19.0 },
    { label: '10x', chance: 9.5 },
  ];

  const handleSelectPreset = (desiredChance: number) => {
    sound.playClick();
    setTargetChance(desiredChance);
    autoSelectTargetSkin(desiredChance, effectiveBetDc);
  };

  // Guard check: strictly disallow spinning without skins / bet
  const canUpgrade = useMemo(() => {
    if (isUpgrading || !targetSkin) return false;
    if (betMode === 'skin') {
      return selectedItems.length > 0 && effectiveBetDc > 0;
    }
    if (betMode === 'dc') {
      return customBetDc > 0 && balance >= customBetDc;
    }
    return false;
  }, [isUpgrading, targetSkin, betMode, selectedItems, effectiveBetDc, customBetDc, balance]);

  // Zeus: можно прожать ТОЛЬКО когда спин уже идёт и ещё не завершился.
  // Просто прерывает текущий спин и запускает перекрут (+5% к шансу).
  const canPressZeus = isSpinning && isUpgrading && !zeusUsedThisSpin && !zeusStriking && zeusCount > 0;
  const handleActivateZeus = () => {
    if (!canPressZeus) return;
    // Consume zeus and interrupt current spin for re-spin
    useZeus();
    setZeusUsedThisSpin(true);
    setZeusStriking(true);
    sound.playZeusShock();
    // Interrupt current spin — spinResolveRef triggers re-spin in handleStartUpgrade
    if (spinResolveRef.current) {
      spinResolveRef.current();
      spinResolveRef.current = null;
    }
  };

  const handleToggleProtect = (instanceId: string) => {
    if (isUpgrading) return;
    if (protectedInstanceId === instanceId) {
      sound.playClick();
      setProtectedInstanceId(null);
    } else {
      if (saveTokensCount <= 0) {
        sound.playError();
        return;
      }
      sound.playAngelicChime();
      setProtectedInstanceId(instanceId);
    }
  };

  // Perform Upgrade Spin
  const handleStartUpgrade = async () => {
    if (!canUpgrade || !targetSkin || effectiveBetDc <= 0) return;

    const currentLostAmount = effectiveBetDc;
    const wasProtected = Boolean(protectedInstanceId && selectedItems.some((i) => i.instanceId === protectedInstanceId));

    if (betMode === 'dc') {
      if (balance < customBetDc) {
        useGameStore.getState().setRefillOpen(true);
        return;
      }
      const deducted = deductBalance(customBetDc);
      if (!deducted) return;
    }

    sound.playClick();
    setIsUpgrading(true);
    setIsSpinning(true);
    setLastResult(null);
    setZeusUsedThisSpin(false);

    // Save whether potion was actually used to boost this roll
    const potionWasUsed = isPotionUsed && potionBonus > 0;

    // Helper: run a spin with given chance, returns isWin
    const doSpin = async (spinChance: number): Promise<boolean> => {
      const span = spinChance * 3.6;
      const halfSpan = span / 2;
      const isWin = Math.random() * 100 <= spinChance;

      let targetAngle: number;
      if (isWin) {
        targetAngle = 90 - halfSpan + Math.random() * span;
      } else {
        const loseSpan = 360 - span;
        targetAngle = 90 + halfSpan + Math.random() * loseSpan;
      }

      const totalRotation = 360 * 5 + targetAngle;
      const duration = 4.2;

      sound.startSpinWhoosh(duration);
      await needleControls.set({ rotate: 0 });

      // Race: spin animation vs zeus interrupt
      const spinPromise = needleControls.start({
        rotate: totalRotation,
        transition: { duration, ease: [0.12, 0.85, 0.18, 1] },
      });
      const zeusInterrupt = new Promise<'zeus'>((resolve) => {
        spinResolveRef.current = () => resolve('zeus');
      });

      const result = await Promise.race([
        spinPromise.then(() => 'done' as const),
        zeusInterrupt,
      ]);

      sound.stopSpinWhoosh();

      if (result === 'zeus') {
        // Zeus interrupted — stop needle, show lightning, then re-spin
        await needleControls.stop();
        // Lightning strike animation (brief pause)
        await new Promise<void>((r) => setTimeout(r, 600));
        setZeusStriking(false);
        // Re-spin with boosted chance (+5%)
        const boostedChance = Math.min(80, spinChance + 5);
        return doSpin(boostedChance);
      }

      spinResolveRef.current = null;
      return isWin;
    };

    const isWin = await doSpin(chance);

    setIsSpinning(false);
    setIsUpgrading(false);

    // Consume 1 potion charge ONLY IF potion was actually used
    if (potionWasUsed) {
      consumePotionCharge();
    }

    if (isWin) {
      sound.playWin(targetSkin.rarity);
      setLastResult('win');
      addToInventory([targetSkin]);
      recordUpgrade(true, targetSkin.priceDc - effectiveBetDc);

      // Сохранение тратится даже при выигрыше, если предмет был защищён
      if (wasProtected) {
        useSaveToken();
      }

      // On win: ALL bet skins are consumed (including protected skin)
      if (betMode === 'skin') {
        const idsToRemove = selectedItems.map((i) => i.instanceId);
        removeFromInventory(idsToRemove);
        setSelectedItems([]);
      }

      setZeusUsedThisSpin(false);
      setZeusStriking(false);
      setProtectedInstanceId(null);

      // Emit real drop to live drops ticker (strictly >= 25,000 DC)
      if (targetSkin.priceDc >= 25000) {
        addLiveDrop({
          id: `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          user: 'Вы',
          avatar: '',
          skin: targetSkin,
          caseName: locale === 'ru' ? 'Апгрейдер' : 'Upgrader',
          timestamp: Date.now(),
        });
      }

      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FACC15', '#FFFFFF', '#10B981'],
      });
    } else {
      sound.playCrash();
      setLastResult('lose');
      recordUpgrade(false, -effectiveBetDc);

      if (betMode === 'skin') {
        if (wasProtected) {
          // Remove all items EXCEPT the protected one
          const burnedIds = selectedItems
            .filter((i) => i.instanceId !== protectedInstanceId)
            .map((i) => i.instanceId);
          if (burnedIds.length > 0) {
            removeFromInventory(burnedIds);
          }
          // Consume 1 save token
          useSaveToken();
          sound.playAngelicChime();

          // Keep protected item in inventory & selection
          const savedItem = selectedItems.find((i) => i.instanceId === protectedInstanceId);
          setSelectedItems(savedItem ? [savedItem] : []);
        } else {
          const idsToRemove = selectedItems.map((i) => i.instanceId);
          removeFromInventory(idsToRemove);
          setSelectedItems([]);
        }
      }

      setZeusStriking(false);
      setZeusUsedThisSpin(false);
      setProtectedInstanceId(null);

      // ── CONSOLATION PRIZE (Кешбэк / Утешительный приз) ──
      // Если проигрыш был с сохранением предмета — утешительного приза НЕ будет
      if (wasProtected) {
        return;
      }
      // 1. Very rare consumable consolation prize (Save Token, Zeus, Potion)
      const consPrize = rollConsolationPrize(currentLostAmount);
      if (consPrize) {
        if (consPrize.saveToken) {
          setCashbackModal({
            isOpen: true,
            awardedConsumable: 'save_token',
            lostAmount: currentLostAmount,
          });
        } else if (consPrize.zeus) {
          setCashbackModal({
            isOpen: true,
            awardedConsumable: 'zeus',
            lostAmount: currentLostAmount,
          });
        } else if (consPrize.potion) {
          setCashbackModal({
            isOpen: true,
            awardedConsumable: 'potion',
            lostAmount: currentLostAmount,
          });
        }
      } else {
        // 2. Standard Case Consolation for losses >= 500 DC
        const shouldTriggerConsolation =
          currentLostAmount >= 2000 ? Math.random() < 0.85 :
          currentLostAmount >= 1000 ? Math.random() < 0.65 :
          currentLostAmount >= 500 ? Math.random() < 0.40 : false;

        if (shouldTriggerConsolation) {
          const casesList = allCasesJson as CaseItem[];
          const validCases = casesList.filter((c) => c.skins && c.skins.length > 0);

          const maxCasePrice = Math.min(2500, Math.max(300, Math.floor(currentLostAmount * 0.12)));
          let casePool = validCases.filter(
            (c) => c.priceDc <= maxCasePrice && !c.name.includes('Capsule') && !c.name.includes('Package')
          );
          if (casePool.length === 0) {
            casePool = validCases.filter((c) => c.priceDc <= maxCasePrice);
          }
          if (casePool.length === 0) {
            casePool = validCases.filter((c) => c.priceDc <= 1000);
          }

          const selectedCase = casePool[Math.floor(Math.random() * casePool.length)];

          if (selectedCase && selectedCase.skins.length > 0) {
            const maxDropPrice = Math.max(30, Math.floor(currentLostAmount * 0.15));
            let candidateSkins = selectedCase.skins.filter((s) => s.priceDc <= maxDropPrice);
            if (candidateSkins.length === 0) {
              const cheapest = selectedCase.skins.reduce(
                (min, s) => (s.priceDc < min.priceDc ? s : min),
                selectedCase.skins[0]
              );
              candidateSkins = [cheapest];
            }

            const cashbackDrop = candidateSkins[Math.floor(Math.random() * candidateSkins.length)];
            setCashbackModal({
              isOpen: true,
              caseItem: selectedCase,
              skin: cashbackDrop,
              lostAmount: currentLostAmount,
            });
          }
        }
      }
    }
  };

  // Filtered inventory list
  const filteredMySkins = useMemo(() => {
    return inventory.filter((item) =>
      item.name.toLowerCase().includes(mySearch.toLowerCase()) ||
      item.weapon.toLowerCase().includes(mySearch.toLowerCase())
    );
  }, [inventory, mySearch]);

  // Filtered target catalog skins (strictly priceDc > effectiveBetDc AND <= maxTargetPrice)
  const filteredCatalogSkins = useMemo(() => {
    const minPrice = Math.max(1, effectiveBetDc);
    let result = catalogSkins.filter((skin) => {
      if (skin.priceDc <= minPrice) return false;
      if (skin.priceDc > maxTargetPrice) return false;

      const matchesSearch =
        skin.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        skin.weapon.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesRarity = catalogRarity === 'all' || skin.rarity === catalogRarity;
      if (!matchesSearch || !matchesRarity) return false;

      // Filter by item type
      if (!matchesCatalogType(skin, catalogType)) return false;

      // Filter by specific weapon model if chosen
      if (catalogWeapon !== 'all') {
        if (skin.weapon.toLowerCase() !== catalogWeapon.toLowerCase()) return false;
      }

      return true;
    });

    result.sort((a, b) => (catalogSort === 'asc' ? a.priceDc - b.priceDc : b.priceDc - a.priceDc));
    return result;
  }, [catalogSkins, catalogSearch, catalogRarity, catalogType, catalogWeapon, catalogSort, effectiveBetDc, maxTargetPrice]);

  // Dynamic list of unique weapons present in the catalog matching current bet and catalogType
  const availableWeapons = useMemo(() => {
    const minPrice = Math.max(1, effectiveBetDc);
    const matching = catalogSkins.filter(
      (s) =>
        s.priceDc > minPrice &&
        s.priceDc <= maxTargetPrice &&
        matchesCatalogType(s, catalogType)
    );

    const counts = new Map<string, number>();
    for (const s of matching) {
      const w = s.weapon?.trim();
      if (w) {
        counts.set(w, (counts.get(w) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [catalogSkins, effectiveBetDc, maxTargetPrice, catalogType]);

  // Count matching skins per category based on current bet
  const categoryCounts = useMemo(() => {
    const minPrice = Math.max(1, effectiveBetDc);
    const counts: Record<string, number> = {};
    ITEM_TYPES.forEach((t) => {
      counts[t.id] = catalogSkins.filter(
        (s) => s.priceDc > minPrice && s.priceDc <= maxTargetPrice && matchesCatalogType(s, t.id)
      ).length;
    });
    return counts;
  }, [catalogSkins, effectiveBetDc, maxTargetPrice]);

  // Circular gauge constants
  const gaugeR = 100;
  const gaugeC = 2 * Math.PI * gaugeR;
  const baseArcLen = Math.max(0.5, (baseChance / 100) * gaugeC);
  const halfPotion = potionBonus / 2;
  const wingArcLen = halfPotion > 0 ? (halfPotion / 100) * gaugeC : 0;

  // Zeus electric wings calculations (+5% bonus, electric cyan wings)
  const halfZeus = zeusBonus / 2;
  const zeusArcLen = halfZeus > 0 ? (halfZeus / 100) * gaugeC : 0;

  // Symmetrical layout: Winning sector centered at bottom (90 deg)
  const baseStartDeg = 90 - (baseChance * 1.8);
  const leftWingStartDeg = baseStartDeg - (halfPotion * 3.6);
  const rightWingStartDeg = 90 + (baseChance * 1.8);
  const leftZeusStartDeg = leftWingStartDeg - (halfZeus * 3.6);
  const rightZeusStartDeg = rightWingStartDeg + (wingArcLen > 0 ? halfPotion * 3.6 : 0);

  // Bubbles strictly inside potion wings
  const potionBubbles = useMemo(() => {
    if (potionBonus <= 0) return [];
    const bubbles: Array<{ id: string; cx: number; cy: number; r: number; delay: string; duration: string; color: string }> = [];

    const leftSpan = halfPotion * 3.6;
    const rightSpan = halfPotion * 3.6;

    // Adjust bubble count according to wing size so small wings don't overcrowd
    const countPerWing = potionBonus < 4 ? 2 : potionBonus < 8 ? 3 : 4;
    const leftFractions = [0.2, 0.45, 0.7, 0.9].slice(0, countPerWing);
    const leftOffsets = [-3, 2, -1, 3].slice(0, countPerWing);
    const leftSizes = [2.8, 3.4, 2.2, 3.0].slice(0, countPerWing);
    const delays = ['0s', '0.6s', '1.2s', '1.8s', '0.3s', '0.9s', '1.5s', '2.1s'];
    const durations = ['2.2s', '2.6s', '2.0s', '2.8s', '2.4s', '2.1s', '2.7s', '2.3s'];
    const colors = ['#6ee7b7', '#34d399', '#a7f3d0', '#10b981'];

    leftFractions.forEach((frac, idx) => {
      const angle = leftWingStartDeg + frac * leftSpan;
      const rad = (angle * Math.PI) / 180;
      const r = gaugeR + leftOffsets[idx];
      bubbles.push({
        id: `left-b-${idx}`,
        cx: Number((120 + r * Math.cos(rad)).toFixed(2)),
        cy: Number((120 + r * Math.sin(rad)).toFixed(2)),
        r: leftSizes[idx],
        delay: delays[idx],
        duration: durations[idx],
        color: colors[idx % colors.length],
      });
    });

    // Bubbles strictly in right wing
    const rightFractions = [0.15, 0.4, 0.65, 0.88].slice(0, countPerWing);
    const rightOffsets = [3, -2, 2, -3].slice(0, countPerWing);
    const rightSizes = [3.2, 2.4, 3.5, 2.0].slice(0, countPerWing);

    rightFractions.forEach((frac, idx) => {
      const angle = rightWingStartDeg + frac * rightSpan;
      const rad = (angle * Math.PI) / 180;
      const r = gaugeR + rightOffsets[idx];
      bubbles.push({
        id: `right-b-${idx}`,
        cx: Number((120 + r * Math.cos(rad)).toFixed(2)),
        cy: Number((120 + r * Math.sin(rad)).toFixed(2)),
        r: rightSizes[idx],
        delay: delays[idx + 4],
        duration: durations[idx + 4],
        color: colors[(idx + 2) % colors.length],
      });
    });

    return bubbles;
  }, [potionBonus, leftWingStartDeg, rightWingStartDeg, halfPotion, gaugeR]);

  const targetConfig = targetSkin ? RARITY_CONFIG[targetSkin.rarity] || RARITY_CONFIG.milspec : RARITY_CONFIG.milspec;

  return (
    <div className="w-full flex flex-col gap-8">
      {/* ── TOP SECTION: PHOTO 2 DRUM & SLOTS ── */}
      <div className="w-full max-w-6xl mx-auto rounded-3xl p-6 sm:p-8 bg-[#0d0e14] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* 1. LEFT CARD: Selected Input / Bet / Consumables */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10 gap-2">
              <div className="relative flex items-center p-1 bg-black/50 border border-white/10 rounded-xl gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBetMode('skin');
                    const bet = selectedItems.reduce((s, i) => s + i.priceDc, 0);
                    if (bet > 0) autoSelectTargetSkin(targetChance, bet);
                  }}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap z-10 ${
                    betMode === 'skin' ? 'text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {betMode === 'skin' && (
                    <motion.div
                      layoutId="upgraderBetModeIndicator"
                      className="absolute inset-0 rounded-lg bg-yellow-400 shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span>{t('upg.tab.skins')} ({selectedItems.length}/5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBetMode('dc');
                    if (customBetDc > 0) autoSelectTargetSkin(targetChance, customBetDc);
                  }}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap z-10 ${
                    betMode === 'dc' ? 'text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {betMode === 'dc' && (
                    <motion.div
                      layoutId="upgraderBetModeIndicator"
                      className="absolute inset-0 rounded-lg bg-yellow-400 shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span>{t('upg.tab.balance')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBetMode('consumables');
                  }}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap z-10 ${
                    betMode === 'consumables' ? 'text-black' : 'text-yellow-400/80 hover:text-yellow-400'
                  }`}
                >
                  {betMode === 'consumables' && (
                    <motion.div
                      layoutId="upgraderBetModeIndicator"
                      className="absolute inset-0 rounded-lg bg-yellow-400 shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Gift className="w-3.5 h-3.5" />
                  <span>{t('upg.tab.consumables')}</span>
                </button>
              </div>

              {betMode === 'skin' && selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSelected}
                  className="text-xs font-medium text-white/50 hover:text-red-400 transition-colors cursor-pointer px-2 py-1 shrink-0"
                >
                  {t('upg.reset')}
                </button>
              )}
            </div>

            {/* Input card box */}
            <div className="min-h-[350px] sm:h-[360px] rounded-2xl bg-black/40 border border-white/10 p-3 flex flex-col justify-between">
              {betMode === 'skin' ? (
                selectedItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/40 mb-2">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-white/60 font-bold">{t('upg.selectUpTo5')}</span>
                    <span className="text-[11px] text-white/40 mt-1">{t('upg.inInventoryBelow')}</span>
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-between">
                    <div className="grid grid-cols-3 gap-2 py-1 overflow-visible">
                      {selectedItems.map((item) => {
                        const isProtected = protectedInstanceId === item.instanceId;
                        return (
                          <div
                            key={item.instanceId}
                            onClick={() => handleRemoveSelectedItem(item.instanceId)}
                            className={`relative rounded-xl p-1.5 h-[105px] flex flex-col items-center justify-between group cursor-pointer transition-all ${
                              isProtected
                                ? 'bg-yellow-500/15 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] z-20'
                                : 'bg-[#13141c] border border-white/10 hover:border-red-500/60 hover:bg-red-500/5'
                            }`}
                            title={locale === 'ru' ? 'Нажмите, чтобы убрать скин' : 'Click to remove skin'}
                          >
                            {/* Halo (Нимб) */}
                            {isProtected && (
                              <motion.div
                                animate={{ y: [-2, 2, -2], opacity: [0.9, 1, 0.9] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-30"
                              >
                                <div className="w-10 h-2.5 rounded-full border-2 border-yellow-300 bg-yellow-400/20 shadow-[0_0_10px_#facc15]" />
                              </motion.div>
                            )}

                            {/* Left Angel Wing */}
                            {isProtected && (
                              <motion.div
                                animate={{ rotate: [-3, 4, -3], y: [-1, 1, -1] }}
                                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                                className="absolute -left-5 top-1/2 -translate-y-1/2 w-6 h-12 pointer-events-none z-20 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]"
                              >
                                <svg viewBox="0 0 40 60" fill="none" className="w-full h-full text-yellow-300">
                                  <path
                                    d="M38 30C28 20 20 8 10 2C6 0 2 3 2 7C2 15 10 28 14 36C8 38 4 43 5 47C6 52 14 55 22 53C28 51 34 42 38 30Z"
                                    fill="#facc15"
                                    stroke="#fef08a"
                                    strokeWidth="1.5"
                                  />
                                </svg>
                              </motion.div>
                            )}

                            {/* Right Angel Wing */}
                            {isProtected && (
                              <motion.div
                                animate={{ rotate: [3, -4, 3], y: [-1, 1, -1] }}
                                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                                className="absolute -right-5 top-1/2 -translate-y-1/2 w-6 h-12 pointer-events-none z-20 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]"
                              >
                                <svg viewBox="0 0 40 60" fill="none" className="w-full h-full text-yellow-300">
                                  <path
                                    d="M2 30C12 20 20 8 30 2C34 0 38 3 38 7C38 15 30 28 26 36C32 38 36 43 35 47C34 52 26 55 18 53C12 51 6 42 2 30Z"
                                    fill="#facc15"
                                    stroke="#fef08a"
                                    strokeWidth="1.5"
                                  />
                                </svg>
                              </motion.div>
                            )}

                            {/* Protect / Unprotect Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleProtect(item.instanceId);
                              }}
                              className={`absolute top-1 left-1 px-1 py-0.5 rounded text-[9px] font-black flex items-center gap-0.5 transition-all z-20 cursor-pointer ${
                                isProtected
                                  ? 'bg-yellow-400 text-black shadow-md'
                                  : saveTokensCount > 0
                                  ? 'bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400 hover:text-black border border-yellow-400/40'
                                  : 'hidden'
                              }`}
                              title={
                                isProtected
                                  ? (locale === 'ru' ? 'Снять защиту оберега' : 'Remove protection')
                                  : (locale === 'ru' ? 'Защитить жетоном сохранения' : 'Protect with Guardian Aegis')
                              }
                            >
                              <span>🪽</span>
                              {isProtected && <span className="text-[7.5px] uppercase tracking-tighter">Спасён</span>}
                            </button>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isProtected) setProtectedInstanceId(null);
                                handleRemoveSelectedItem(item.instanceId);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center text-xs shadow-md transition-opacity cursor-pointer z-20"
                              aria-label="Remove item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            <SkinImage
                              src={item.image}
                              alt={item.name}
                              size={100}
                              className="w-14 h-12 sm:w-16 sm:h-14 object-contain drop-shadow-md group-hover:scale-95 transition-transform"
                            />
                            <span className="text-[10px] text-white font-black truncate w-full text-center mt-0.5">
                              {item.skinName || item.name}
                            </span>
                            <span className="text-[10px] font-mono font-black text-yellow-400">
                              {item.priceDc.toLocaleString('ru-RU')} DC
                            </span>
                          </div>
                        );
                      })}

                      {Array.from({ length: 5 - selectedItems.length }).map((_, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center h-[105px] text-white/20"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-[9px] mt-0.5">{t('upg.slot')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <span className="text-white/60 font-bold">{t('upg.betSum')}</span>
                      <div className="flex items-center gap-1 font-mono font-black text-yellow-400">
                        <DropCoinIcon size={14} />
                        <span>{effectiveBetDc.toLocaleString('ru-RU')} DC</span>
                      </div>
                    </div>
                  </div>
                )
              ) : betMode === 'consumables' ? (
                /* CONSUMABLES TAB: POTIONS, SAVE TOKENS & ZEUS */
                <div className="flex flex-col h-full justify-between overflow-y-auto pr-1 gap-2">
                  {/* 1. Luck Potion Row */}
                  <div className="p-2 rounded-xl bg-black/40 border border-emerald-500/20 flex flex-col gap-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🧪</span>
                        <span className="text-xs font-black text-white">{locale === 'ru' ? 'Зелье удачи' : 'Luck Potion'}</span>
                        <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          +15%
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-black text-emerald-400">
                        {locale === 'ru' ? `${potionsCount} шт.` : `${potionsCount} pcs.`}
                      </span>
                    </div>

                    {activePotionCharges > 0 ? (
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs font-bold text-emerald-300 shadow-sm">
                        <span className="flex items-center gap-1 text-[11px]">
                          <span>🧪</span>
                          <span>{t('upg.potionActive')}</span>
                        </span>
                        <span className="font-mono font-black text-emerald-400">
                          {activePotionCharges}/3
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => drinkPotion()}
                        disabled={potionsCount <= 0}
                        className={`w-full py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          potionsCount > 0
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        <span>{potionsCount > 0 ? t('upg.drinkPotion') : t('upg.noPotions')}</span>
                      </button>
                    )}
                  </div>

                  {/* 2. Guardian Aegis (Жетон сохранения) Row */}
                  <div className="p-2 rounded-xl bg-black/40 border border-yellow-500/20 flex flex-col gap-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🪽</span>
                        <span className="text-xs font-black text-white">{locale === 'ru' ? 'Жетон сохранения' : 'Guardian Aegis'}</span>
                        <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                          {locale === 'ru' ? 'Оберег' : 'Shield'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-black text-yellow-400">
                        {locale === 'ru' ? `${saveTokensCount} шт.` : `${saveTokensCount} pcs.`}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-white/50 leading-tight">
                      {locale === 'ru'
                        ? 'Дарует 1 предмету ангельские крылья и нимб. Не сгорает при неудаче!'
                        : 'Grants 1 item wings and halo. Will not burn on failure!'}
                    </p>
                    {selectedItems.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleToggleProtect(selectedItems[0].instanceId)}
                        disabled={saveTokensCount <= 0 && !protectedInstanceId}
                        className={`w-full py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          protectedInstanceId
                            ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/50'
                            : saveTokensCount > 0
                            ? 'btn-yellow text-black active:scale-95 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                            : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        <span>
                          {protectedInstanceId
                            ? (locale === 'ru' ? '🪽 Скин защищён' : '🪽 Skin Protected')
                            : (locale === 'ru' ? '🪽 Защитить выбранный скин' : '🪽 Protect Selected Skin')}
                        </span>
                      </button>
                    ) : (
                      <div className="text-[9.5px] text-center text-white/40 italic py-0.5">
                        {locale === 'ru' ? 'Выберите скин в инвентаре для защиты' : 'Select a skin to protect'}
                      </div>
                    )}
                  </div>

                  {/* 3. Zeus x27 Tactical Shock Row */}
                  <div className="p-2 rounded-xl bg-black/40 border border-sky-500/20 flex flex-col gap-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">⚡</span>
                        <span className="text-xs font-black text-white">Zeus x27</span>
                        <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          +5%
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-black text-sky-400">
                        {locale === 'ru' ? `${zeusCount} шт.` : `${zeusCount} pcs.`}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-white/50 leading-tight">
                      {locale === 'ru'
                        ? 'Жми Zeus только во время спина — перекрут и +5% к шансу!'
                        : 'Press Zeus only mid-spin — reroll and +5% chance!'}
                    </p>
                    <button
                      type="button"
                      onClick={handleActivateZeus}
                      disabled={!canPressZeus}
                      className={`w-full py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                        zeusUsedThisSpin
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)] cursor-default'
                          : canPressZeus
                          ? 'bg-sky-500 hover:bg-sky-400 text-black active:scale-95 shadow-[0_0_12px_rgba(56,189,248,0.3)] cursor-pointer'
                          : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <span>
                        {zeusUsedThisSpin
                          ? (locale === 'ru' ? '⚡ Zeus использован (+5%)' : '⚡ Zeus Used (+5%)')
                          : canPressZeus
                          ? (locale === 'ru' ? '⚡ Вжать Zeus! (+5% перекрут)' : '⚡ Hit Zeus! (+5% reroll)')
                          : zeusCount <= 0
                          ? (locale === 'ru' ? '⚡ Нет Zeus' : '⚡ No Zeus')
                          : (locale === 'ru' ? '⚡ Жми во время спина' : '⚡ Press mid-spin')}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* DC BET MODE */
                <div className="h-full flex flex-col justify-between p-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-white/60">{t('upg.dcBet')}</label>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-black/60 border border-white/10">
                      <DropCoinIcon size={20} />
                      <input
                        type="number"
                        min="10"
                        max={balance}
                        value={customBetDc}
                        onChange={(e) => {
                          const val = Math.max(10, Number(e.target.value));
                          setCustomBetDc(val);
                          autoSelectTargetSkin(targetChance, val);
                        }}
                        disabled={isUpgrading}
                        className="w-full bg-transparent font-mono font-black text-lg text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const val = amt;
                          setCustomBetDc(val);
                          autoSelectTargetSkin(targetChance, val);
                        }}
                        disabled={isUpgrading}
                        className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white cursor-pointer"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. CENTER: CIRCULAR DRUM GAUGE WITH SYMMETRICAL POTION EXPANSION & BUBBLES */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
            {/* Circular Speedometer Gauge */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Outer Metallic Ring */}
              <div className="absolute inset-0 rounded-full bg-[#12131b] border-8 border-[#1c1d28] shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)]" />

              {/* Top pointer notch / mark */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2b2d3d] border border-white/20 rotate-45 z-20 shadow-md" />

              {/* SVG Arc Track */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 240">
                <defs>
                  <style>
                    {`
                      @keyframes potionBubblePulse {
                        0%, 100% {
                          transform: scale(0.85) translate(0, 0);
                          opacity: 0.5;
                        }
                        50% {
                          transform: scale(1.25) translate(0.5px, -1px);
                          opacity: 1;
                        }
                      }
                      .potion-bubble-item {
                        animation: potionBubblePulse ease-in-out infinite;
                        transform-origin: center;
                        transform-box: fill-box;
                      }
                      @keyframes zeusFlicker {
                        0%, 100% { opacity: 1; }
                        8% { opacity: 0.55; }
                        16% { opacity: 1; }
                        32% { opacity: 0.7; }
                        48% { opacity: 1; }
                        64% { opacity: 0.6; }
                        80% { opacity: 1; }
                      }
                      @keyframes zeusSparkFloat {
                        0%, 100% { transform: scale(0.7) rotate(-8deg); opacity: 0.4; }
                        50% { transform: scale(1.25) rotate(8deg); opacity: 1; }
                      }
                      .zeus-electric-arc {
                        animation: zeusFlicker 0.9s linear infinite;
                      }
                      .zeus-spark-item {
                        animation: zeusSparkFloat ease-in-out infinite;
                        transform-origin: center;
                        transform-box: fill-box;
                      }
                      @keyframes zeusArrowCharge {
                        0%, 100% { filter: drop-shadow(0 0 6px #38bdf8) drop-shadow(0 0 18px #38bdf8); }
                        50% { filter: drop-shadow(0 0 14px #e0f2fe) drop-shadow(0 0 30px #38bdf8); }
                      }
                      .zeus-arrow-charged {
                        animation: zeusArrowCharge 0.5s ease-in-out infinite;
                      }
                    `}
                  </style>
                </defs>

                {/* Dark Background Track */}
                <circle
                  cx="120"
                  cy="120"
                  r={gaugeR}
                  fill="none"
                  stroke="#1e202c"
                  strokeWidth="18"
                />

                {/* Left Potion Wing (Symmetrical left expansion, sharp butt joint) */}
                {potionBonus > 0 && (
                  <circle
                    cx="120"
                    cy="120"
                    r={gaugeR}
                    fill="none"
                    stroke="#047857"
                    strokeWidth="18"
                    strokeDasharray={`${wingArcLen} ${gaugeC}`}
                    strokeLinecap="butt"
                    transform={`rotate(${leftWingStartDeg}, 120, 120)`}
                    className="filter drop-shadow-[0_0_12px_rgba(5,150,105,0.85)] transition-all duration-300"
                  />
                )}

                {/* Base chance arc (Emerald Green, sharp butt joint meeting potion wings) */}
                <circle
                  cx="120"
                  cy="120"
                  r={gaugeR}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="18"
                  strokeDasharray={`${baseArcLen} ${gaugeC}`}
                  strokeLinecap="butt"
                  transform={`rotate(${baseStartDeg}, 120, 120)`}
                  className="transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />

                {/* Right Potion Wing (Symmetrical right expansion, sharp butt joint) */}
                {potionBonus > 0 && (
                  <circle
                    cx="120"
                    cy="120"
                    r={gaugeR}
                    fill="none"
                    stroke="#047857"
                    strokeWidth="18"
                    strokeDasharray={`${wingArcLen} ${gaugeC}`}
                    strokeLinecap="butt"
                    transform={`rotate(${rightWingStartDeg}, 120, 120)`}
                    className="filter drop-shadow-[0_0_12px_rgba(5,150,105,0.85)] transition-all duration-300"
                  />
                )}

                {/* Floating SVG bubbles: STRICTLY inside potion wings */}
                {potionBonus > 0 && (
                  <g className="transition-all duration-300 pointer-events-none">
                    {potionBubbles.map((b) => (
                      <g
                        key={b.id}
                        className="potion-bubble-item"
                        style={{
                          animationDelay: b.delay,
                          animationDuration: b.duration,
                        }}
                      >
                        <circle
                          cx={b.cx}
                          cy={b.cy}
                          r={b.r}
                          fill={b.color}
                          className="filter drop-shadow-[0_0_5px_rgba(52,211,153,0.9)]"
                        />
                        <circle
                          cx={b.cx - b.r * 0.3}
                          cy={b.cy - b.r * 0.3}
                          r={b.r * 0.35}
                          fill="#ffffff"
                          opacity="0.85"
                        />
                      </g>
                    ))}
                  </g>
                )}

                {/* Zeus Electric Sky-Blue Wings with lightning effects */}
                {zeusBonus > 0 && (
                  <g className="transition-all duration-300 pointer-events-none">
                    {/* Base blue wings */}
                    <circle
                      cx="120"
                      cy="120"
                      r={gaugeR}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="18"
                      strokeDasharray={`${zeusArcLen} ${gaugeC}`}
                      strokeLinecap="butt"
                      transform={`rotate(${leftZeusStartDeg}, 120, 120)`}
                      className="zeus-electric-arc filter drop-shadow-[0_0_15px_#38bdf8] transition-all duration-300"
                    />
                    <circle
                      cx="120"
                      cy="120"
                      r={gaugeR}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="18"
                      strokeDasharray={`${zeusArcLen} ${gaugeC}`}
                      strokeLinecap="butt"
                      transform={`rotate(${rightZeusStartDeg}, 120, 120)`}
                      className="zeus-electric-arc filter drop-shadow-[0_0_15px_#38bdf8] transition-all duration-300"
                    />
                    {/* Floating lightning sparks on blue wings */}
                    {(() => {
                      const sparks: Array<{ id: string; cx: number; cy: number; s: number; delay: string; dur: string }> = [];
                      const midLeft = leftZeusStartDeg + (halfZeus * 3.6) / 2;
                      const midRight = rightZeusStartDeg + (halfZeus * 3.6) / 2;
                      [midLeft, midRight].forEach((ang, wi) => {
                        [0, 1, 2].forEach((k) => {
                          const a = (ang + (k - 1) * 2.2) * Math.PI / 180;
                          const rr = gaugeR + (k % 2 === 0 ? 11 : -11);
                          sparks.push({
                            id: `zeus-spark-${wi}-${k}`,
                            cx: Number((120 + rr * Math.cos(a)).toFixed(1)),
                            cy: Number((120 + rr * Math.sin(a)).toFixed(1)),
                            s: 7 + (k % 2) * 3,
                            delay: `${(wi * 0.3 + k * 0.18).toFixed(2)}s`,
                            dur: `${(0.5 + k * 0.14).toFixed(2)}s`,
                          });
                        });
                      });
                      return sparks.map((sp) => (
                        <g key={sp.id} className="zeus-spark-item" style={{ animationDelay: sp.delay, animationDuration: sp.dur }}>
                          <path
                            d={`M ${sp.cx} ${sp.cy - sp.s / 2} L ${sp.cx - sp.s * 0.28} ${sp.cy} L ${sp.cx + sp.s * 0.12} ${sp.cy} L ${sp.cx} ${sp.cy + sp.s / 2}`}
                            stroke="#fefce8"
                            strokeWidth="1.8"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="filter drop-shadow-[0_0_6px_#38bdf8]"
                          />
                        </g>
                      ));
                    })()}
                  </g>
                )}
              </svg>

              {/* Zeus Lightning Bolt Strike Animation */}
              {zeusStriking && (
                <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-in fade-in zoom-in duration-150">
                  <svg viewBox="0 0 240 240" className="w-full h-full filter drop-shadow-[0_0_25px_#38bdf8]">
                    <path
                      d="M 120 15 L 105 85 L 140 80 L 100 150 L 135 145 L 120 220"
                      stroke="#38bdf8"
                      strokeWidth="5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 120 15 L 105 85 L 140 80 L 100 150 L 135 145 L 120 220"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              {/* Rotating Pointer Needle with inward-pointing arrow + Zeus lightning */}
              <motion.div
                animate={needleControls}
                className="absolute w-full h-full flex items-center justify-center pointer-events-none z-10"
                style={{ transformOrigin: 'center center', willChange: 'transform' }}
              >
                <div className="relative w-full h-4 flex items-center justify-end pr-1.5">
                  {(zeusUsedThisSpin || zeusStriking) ? (
                    <div className="relative">
                      <svg
                        className="w-8 h-8 transition-all duration-300 scale-110 zeus-arrow-charged"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <polygon
                          points="2,12 20,4 20,20"
                          fill="#38bdf8"
                          stroke="#e0f2fe"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        {/* Mini lightning etched into arrow */}
                        <path
                          d="M 13 7 L 10.5 12 L 13.5 12 L 11 17"
                          stroke="#ffffff"
                          strokeWidth="1.4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="zeus-electric-arc"
                        />
                      </svg>
                      {/* Crackling sparks around electrified arrow */}
                      <svg viewBox="0 0 32 32" className="absolute -inset-2 w-12 h-12 -left-2 -top-4 pointer-events-none">
                        <path
                          d="M 24 2 L 21 9 L 25 9 L 20 18"
                          stroke="#fefce8"
                          strokeWidth="1.6"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="zeus-spark-item filter drop-shadow-[0_0_6px_#38bdf8]"
                          style={{ animationDelay: '0s', animationDuration: '0.5s' }}
                        />
                        <path
                          d="M 8 22 L 11 25 L 9 28"
                          stroke="#bae6fd"
                          strokeWidth="1.4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="zeus-spark-item filter drop-shadow-[0_0_5px_#38bdf8]"
                          style={{ animationDelay: '0.25s', animationDuration: '0.6s' }}
                        />
                      </svg>
                      <span className="absolute right-0 -top-2 text-xs animate-ping">⚡</span>
                    </div>
                  ) : (
                    <svg
                      className="w-7 h-7 transition-all duration-300 filter drop-shadow-[0_0_12px_rgba(250,204,21,0.95)]"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <polygon
                        points="2,12 20,4 20,20"
                        fill="#FACC15"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </motion.div>

              {/* Center Display Hub */}
              <div className="relative z-10 w-40 h-40 rounded-full bg-[#0a0a0f] border-4 border-[#1f212e] flex flex-col items-center justify-center text-center shadow-inner">
                <span className="font-mono font-black text-4xl sm:text-5xl text-white tracking-tight">
                  {chance < 1 ? chance.toFixed(2) : chance.toFixed(1)}%
                </span>
                {activePotionCharges > 0 && isPotionUsed && potionBonus > 0 ? (
                  <div className="flex items-center gap-1 mt-1 font-mono text-[11px] font-bold text-emerald-400 tracking-tight">
                    <span>🧪</span>
                    <span>+{potionBonus % 1 === 0 ? potionBonus.toFixed(0) : potionBonus.toFixed(1)}%</span>
                    <span className="text-emerald-500/60">·</span>
                    <span className="text-zinc-300">{activePotionCharges}/3</span>
                  </div>
                ) : activePotionCharges > 0 && isBaseAtMax ? (
                  <div className="flex items-center gap-1 mt-1 font-mono text-[10px] font-semibold text-emerald-400/80">
                    <span>{t('upg.potionSaved')}</span>
                    <span className="text-zinc-400">{activePotionCharges}/3</span>
                  </div>
                ) : null}

                {zeusUsedThisSpin && zeusBonus > 0 && (
                  <div className="flex items-center gap-1 mt-0.5 font-mono text-[10px] font-bold text-sky-400 tracking-tight">
                    <span className="zeus-spark-item inline-block">⚡</span>
                    <span>+{zeusBonus}% Zeus</span>
                  </div>
                )}

                {potionBonus === 0 && zeusBonus === 0 && (
                  <span
                    className="text-[11px] font-bold mt-1 max-w-[120px] leading-tight"
                    style={{ color: riskLabel.color }}
                  >
                    {riskLabel.text}
                  </span>
                )}
              </div>
            </div>

            {/* Action CTA Button: Upgrade заменяется кнопкой Zeus во время спина */}
            <div className="mt-4 w-full max-w-xs flex flex-col gap-2">
              {isUpgrading ? (
                // Во время спина: если есть Zeus — показываем кнопку Zeus вместо "Улучшить"
                canPressZeus || zeusUsedThisSpin || zeusStriking ? (
                  <button
                    type="button"
                    onClick={handleActivateZeus}
                    disabled={!canPressZeus}
                    className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 ${
                      canPressZeus
                        ? 'bg-sky-500 hover:bg-sky-400 text-black border-sky-200 shadow-[0_0_35px_rgba(56,189,248,0.7)] cursor-pointer active:scale-95 animate-pulse'
                        : 'bg-sky-500/20 border-sky-400/50 text-sky-300 cursor-default'
                    }`}
                  >
                    <span className={canPressZeus ? 'animate-bounce inline-block' : 'inline-block'}>⚡</span>
                    <span>
                      {zeusUsedThisSpin || zeusStriking
                        ? (locale === 'ru' ? 'Zeus бьёт! Перекрут...' : 'Zeus strikes! Rerolling...')
                        : (locale === 'ru' ? `Вжать Zeus! (+5%) · ${zeusCount} шт.` : `Hit Zeus! (+5%) · ${zeusCount}`)}
                    </span>
                    <span className={canPressZeus ? 'animate-bounce inline-block' : 'inline-block'}>⚡</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-4 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider bg-white/10 text-white/30 cursor-not-allowed border border-white/5 flex items-center justify-center gap-2"
                  >
                    <span>{t('upg.spinning')}</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleStartUpgrade}
                  disabled={!canUpgrade}
                  className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                    !canUpgrade
                      ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
                      : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_30px_rgba(250,204,21,0.4)]'
                  }`}
                >
                  <span>
                    {betMode === 'skin' && selectedItems.length === 0
                      ? t('upg.selectSkinsBtn')
                      : !targetSkin
                      ? t('upg.selectTargetBtn')
                      : t('upg.upgradeBtn')}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 3. RIGHT CARD: TARGET ITEM (ВЫ ПОЛУЧАЕТЕ) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 min-h-[37px]">
              <span className="text-xs font-black text-white/80 uppercase tracking-wider">
                {t('upg.targetItem')}
              </span>
              {targetSkin && (
                <button
                  type="button"
                  onClick={() => setTargetSkin(null)}
                  disabled={isUpgrading}
                  className="text-xs text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                >
                  {t('upg.reset')}
                </button>
              )}
            </div>

            {/* Target Skin Preview Card */}
            <div
              className="min-h-[350px] sm:h-[360px] rounded-2xl border p-4 flex flex-col justify-between relative overflow-hidden transition-all"
              style={{
                backgroundColor: targetConfig.bg,
                borderColor: targetConfig.border,
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white/60 uppercase">{t('upg.targetItem')}</span>
                <div className="flex items-center gap-2">
                  {targetSkin && (
                    <button
                      type="button"
                      onClick={() => setTargetSkin(null)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-[11px] font-bold text-white/50 hover:text-red-400 transition-all flex items-center gap-1 cursor-pointer"
                      title={locale === 'ru' ? 'Убрать целевой скин' : 'Remove target skin'}
                    >
                      <X className="w-3 h-3" />
                      <span>{t('upg.reset')}</span>
                    </button>
                  )}
                  <span
                    className="font-black px-2 py-0.5 rounded-full text-[10px]"
                    style={{ backgroundColor: targetConfig.border, color: '#FFFFFF' }}
                  >
                    {targetConfig.label}
                  </span>
                </div>
              </div>

              {targetSkin ? (
                <div className="flex flex-col items-center justify-center my-auto">
                  <SkinImage
                    key={targetSkin.id}
                    src={targetSkin.image}
                    alt={targetSkin.name}
                    size={280}
                    priority={true}
                    className="w-48 h-32 sm:w-56 sm:h-36 object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.9)] hover:scale-105 transition-transform duration-300"
                  />
                  <span className="font-black text-white text-base text-center line-clamp-1 mt-2">
                    {targetSkin.name}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/50">{targetSkin.weapon}</span>
                    {targetSkin.statTrak && isStatTrakableItem(targetSkin) && <StatTrakBadge size="sm" />}
                    <WearBadge skin={targetSkin} size="sm" showFullLabel />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center my-auto text-center text-white/40">
                  <AlertCircle className="w-8 h-8 mb-1" />
                  <span className="text-xs">{t('upg.chooseTarget')}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-xs text-white/60">{t('upg.target')}</span>
                <div className="flex items-center gap-1 font-mono font-black text-yellow-400 text-base">
                  <DropCoinIcon size={18} />
                  <span>{targetSkin ? targetSkin.priceDc.toLocaleString('ru-RU') : 0} DC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Chance & Multiplier Presets Control Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Chance Presets (PRIMARY) */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            <span className="text-xs font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1.5 mr-1 bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20">
              <Percent className="w-3.5 h-3.5 text-yellow-400" />
              <span>{t('upg.presetsTitle')}</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {chancePresets.map((p) => {
                const isActive = Math.abs(targetChance - p.chance) < 0.2;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectPreset(p.chance)}
                    disabled={isUpgrading}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)] scale-105'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:border-yellow-400/50 hover:text-yellow-400'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multipliers (SECONDARY) */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider mr-1">
              {t('upg.multipliersTitle')}
            </span>
            <div className="flex items-center gap-1.5">
              {multiplierPresets.map((p) => {
                const isActive = Math.abs(targetChance - p.chance) < 0.2;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectPreset(p.chance)}
                    disabled={isUpgrading}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Reroll Button: Pick another skin and quality for current chance */}
            <button
              type="button"
              onClick={() => autoSelectTargetSkin(targetChance, effectiveBetDc)}
              disabled={isUpgrading || effectiveBetDc <= 0}
              className="px-3 py-1.5 ml-1 rounded-xl text-xs font-black bg-white/5 hover:bg-yellow-400/20 text-white/80 hover:text-yellow-400 border border-white/10 hover:border-yellow-400/40 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title={locale === 'ru' ? 'Выбрать другой скин и качество на этот же шанс' : 'Reroll another skin & quality with this chance'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{locale === 'ru' ? 'Другой скин' : 'Reroll'}</span>
            </button>
          </div>
        </div>
      </div>


      {/* ── BOTTOM SECTION: INVENTORY & CATALOG ── */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Bottom: МОИ СКИНЫ */}
        <div className="rounded-3xl p-6 bg-[#0d0e14] border border-white/10 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white uppercase">{t('upg.myInventory')}</h2>
              <span className="text-xs font-bold text-white/40">({inventory.length})</span>
            </div>

            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllSelected}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('upg.clearAll')}</span>
              </button>
            )}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 mb-4">
            <Search className="w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder={t('upg.searchMy')}
              value={mySearch}
              onChange={(e) => setMySearch(e.target.value)}
              className="w-full bg-transparent text-xs text-white outline-none"
            />
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
            {filteredMySkins.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-white/40">
                {t('inv.emptyHint')}
              </div>
            ) : (
              filteredMySkins.map((item) => {
                const isSelected = selectedItems.some((i) => i.instanceId === item.instanceId);

                return (
                  <button
                    key={item.instanceId}
                    type="button"
                    onClick={() => handleToggleInventoryItem(item)}
                    className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Top Badges Row */}
                    <div className="w-full flex items-center justify-between z-10 min-h-[20px] mb-1">
                      <div className="flex items-center gap-1">
                        {item.statTrak && isStatTrakableItem(item) && <StatTrakBadge size="xs" />}
                        <WearBadge skin={item} size="xs" />
                      </div>
                    </div>

                    <div className="w-full h-24 sm:h-28 flex items-center justify-center my-1">
                      <SkinImage
                        src={item.image}
                        alt={item.name}
                        size={140}
                        className="w-full h-20 sm:h-24 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.8)] group-hover:scale-108 transition-transform duration-200"
                      />
                    </div>

                    <div className="w-full flex flex-col">
                      <span className="text-[11px] font-black text-white truncate">
                        {item.skinName || item.name}
                      </span>
                      <span className="text-[9px] text-white/40 truncate">{item.weapon}</span>
                      <span className="text-[11px] font-mono font-black text-yellow-400 mt-0.5">
                        {item.priceDc.toLocaleString('ru-RU')} DC
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Bottom: ВЫ ПОЛУЧАЕТЕ (Catalog, only items > bet) */}
        <div className="rounded-3xl p-6 bg-[#0d0e14] border border-white/10 shadow-xl flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white uppercase">{t('upg.targetCatalog')}</h2>
              <span className="text-[11px] text-yellow-400/80 font-bold">
                {locale === 'ru'
                  ? `(скины дороже ${effectiveBetDc.toLocaleString('ru-RU')} DC${maxTargetPrice < Infinity ? ` до ${maxTargetPrice.toLocaleString('ru-RU')} DC` : ''})`
                  : `(skins above ${effectiveBetDc.toLocaleString('ru-RU')} DC${maxTargetPrice < Infinity ? ` up to ${maxTargetPrice.toLocaleString('ru-RU')} DC` : ''})`}
              </span>
            </div>

            {/* Sort & Rarity Filter */}
            <div className="flex items-center gap-2">
              <select
                value={catalogRarity}
                onChange={(e) => setCatalogRarity(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">{locale === 'ru' ? 'Все редкости' : 'All rarities'}</option>
                <option value="extraordinary">★ {locale === 'ru' ? 'Экстраординарное' : 'Extraordinary'}</option>
                <option value="covert">★ {locale === 'ru' ? 'Тайное' : 'Covert'}</option>
                <option value="classified">{locale === 'ru' ? 'Засекреченное' : 'Classified'}</option>
                <option value="restricted">{locale === 'ru' ? 'Запрещенное' : 'Restricted'}</option>
                <option value="gold">★ {locale === 'ru' ? 'Редкий особый' : 'Rare Special'}</option>
              </select>

              <button
                type="button"
                onClick={() => setCatalogSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-1 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white text-xs cursor-pointer"
              >
                {catalogSort === 'asc' ? t('home.sort.priceAsc') : t('home.sort.priceDesc')}
              </button>
            </div>
          </div>

          {/* Item Types Filter Pills - Multi-Row Flex Wrap (No horizontal scroll) */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {ITEM_TYPES.map((type) => {
              const isAct = catalogType === type.id;
              const count = categoryCounts[type.id] ?? 0;
              const label = t('type.' + type.id) || type.label;

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setCatalogType(type.id);
                    setCatalogWeapon('all');
                  }}
                  className={`group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer z-10 border ${
                    isAct
                      ? 'text-black border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.35)] scale-[1.02]'
                      : 'text-white/70 border-white/10 hover:border-white/20 hover:text-white bg-white/[0.03] hover:bg-white/[0.08]'
                  }`}
                >
                  {isAct && (
                    <motion.div
                      layoutId="upgraderCatalogTypeIndicator"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}

                  <span className={`text-xs ${isAct ? 'text-black' : 'text-yellow-400/80 group-hover:text-yellow-400'}`}>
                    {type.icon}
                  </span>
                  <span className="relative z-10">{label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md transition-colors ${
                      isAct
                        ? 'bg-black/20 text-black font-black'
                        : 'bg-black/40 text-white/40 group-hover:text-white/70'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Weapon / Model Subcategories (No horizontal scroll, mobile-first responsive design) */}
          {availableWeapons.length > 1 && (
            <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 mb-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-yellow-400">⚡</span>
                  <span>{locale === 'ru' ? 'Модель / Оружие' : 'Model / Weapon'}</span>
                  <span className="text-white/30 font-mono text-[10px]">({availableWeapons.length})</span>
                </span>
                {catalogWeapon !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setCatalogWeapon('all');
                    }}
                    className="text-[10px] text-yellow-400 hover:underline font-bold transition-colors cursor-pointer"
                  >
                    {locale === 'ru' ? 'Сбросить (Все)' : 'Reset (All)'}
                  </button>
                )}
              </div>

              {/* Mobile View: Clean Native Select for fast thumb-friendly selection */}
              <div className="block sm:hidden">
                <select
                  value={catalogWeapon}
                  onChange={(e) => {
                    sound.playClick();
                    setCatalogWeapon(e.target.value);
                  }}
                  className="w-full bg-[#13141f] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option value="all">
                    {locale === 'ru' ? 'Все модели оружия' : 'All weapon models'} ({availableWeapons.reduce((acc, w) => acc + w.count, 0)} {locale === 'ru' ? 'шт.' : 'items'})
                  </option>
                  {availableWeapons.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name} ({w.count} {locale === 'ru' ? 'шт.' : 'items'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop & Tablet View: Wrapping Chips (Top 8) + Overflow Dropdown */}
              <div className="hidden sm:flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setCatalogWeapon('all');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    catalogWeapon === 'all'
                      ? 'bg-yellow-400 text-black border-yellow-300 font-black shadow-sm'
                      : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                  }`}
                >
                  {locale === 'ru' ? 'Все' : 'All'} ({availableWeapons.reduce((acc, w) => acc + w.count, 0)})
                </button>

                {availableWeapons.slice(0, 8).map((w) => {
                  const isSel = catalogWeapon.toLowerCase() === w.name.toLowerCase();
                  return (
                    <button
                      key={w.name}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setCatalogWeapon(isSel ? 'all' : w.name);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                        isSel
                          ? 'bg-yellow-400 text-black border-yellow-300 font-black shadow-sm'
                          : 'bg-white/5 text-white/70 hover:text-white border-white/10 hover:border-white/25'
                      }`}
                    >
                      <span>{w.name}</span>
                      <span className={`text-[10px] font-mono ${isSel ? 'text-black/80 font-black' : 'text-white/40'}`}>
                        {w.count}
                      </span>
                    </button>
                  );
                })}

                {availableWeapons.length > 8 && (
                  <select
                    value={availableWeapons.slice(8).some((w) => w.name.toLowerCase() === catalogWeapon.toLowerCase()) ? catalogWeapon : ''}
                    onChange={(e) => {
                      sound.playClick();
                      setCatalogWeapon(e.target.value || 'all');
                    }}
                    className="bg-black/60 border border-white/15 text-xs text-white/80 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-white/30"
                  >
                    <option value="">
                      {locale === 'ru'
                        ? `+ Еще ${availableWeapons.length - 8} моделей...`
                        : `+ More ${availableWeapons.length - 8} models...`}
                    </option>
                    {availableWeapons.slice(8).map((w) => (
                      <option key={w.name} value={w.name}>
                        {w.name} ({w.count})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 mb-4">
            <Search className="w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder={t('upg.searchCatalog')}
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-white outline-none"
            />
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
            {filteredCatalogSkins.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-white/40">
                {t('upg.noSkins')}
              </div>
            ) : (
              <>
                {filteredCatalogSkins.slice(0, catalogLimit).map((skin) => {
                  const isSelected = targetSkin?.id === skin.id;

                  return (
                    <button
                      key={skin.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setTargetSkin(skin);
                      }}
                      className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-400/15 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                          : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Top Badges Row */}
                      <div className="w-full flex items-center justify-between z-10 min-h-[20px] mb-1">
                        <div className="flex items-center gap-1">
                          {skin.statTrak && isStatTrakableItem(skin) && <StatTrakBadge size="xs" />}
                          <WearBadge skin={skin} size="xs" />
                        </div>
                      </div>

                      <div className="w-full h-24 sm:h-28 flex items-center justify-center my-1">
                        <SkinImage
                          src={skin.image}
                          alt={skin.name}
                          size={140}
                          className="w-full h-20 sm:h-24 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.8)] group-hover:scale-108 transition-transform duration-200"
                        />
                      </div>

                      <div className="w-full flex flex-col">
                        <span className="text-[11px] font-black text-white truncate">
                          {skin.skinName || skin.name}
                        </span>
                        <span className="text-[9px] text-white/40 truncate">{skin.weapon}</span>
                        <span className="text-[11px] font-mono font-black text-yellow-400 mt-0.5">
                          {skin.priceDc.toLocaleString('ru-RU')} DC
                        </span>
                      </div>
                    </button>
                  );
                })}
                {/* Load-more sentinel */}
                {catalogLimit < filteredCatalogSkins.length && (
                  <div
                    ref={loadMoreRef}
                    className="col-span-full py-4 text-center text-xs text-white/30"
                  >
                    {t('upg.showing')} {Math.min(catalogLimit, filteredCatalogSkins.length)} {t('upg.of')} {filteredCatalogSkins.length}. {t('upg.scrollMore')}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cashback Modal */}
      {cashbackModal && (
        <CashbackModal
          isOpen={cashbackModal.isOpen}
          caseItem={cashbackModal.caseItem}
          winningSkin={cashbackModal.skin}
          awardedConsumable={cashbackModal.awardedConsumable}
          lostAmount={cashbackModal.lostAmount}
          onClaim={() => {
            if (cashbackModal.awardedConsumable === 'potion') {
              addPotion(1);
            } else if (cashbackModal.awardedConsumable === 'save_token') {
              addSaveToken(1);
            } else if (cashbackModal.awardedConsumable === 'zeus') {
              addZeus(1);
            } else if (cashbackModal.skin) {
              addToInventory([cashbackModal.skin]);
            }
            setCashbackModal(null);
          }}
          onClose={() => setCashbackModal(null)}
        />
      )}
    </div>
  );
};
