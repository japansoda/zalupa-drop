import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
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
import { SkinImage } from '../ui/SkinImage';
import { useLanguage } from '../../lib/i18n';

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
  { id: 'all', label: 'Все типы' },
  { id: 'knives', label: '★ Ножи' },
  { id: 'gloves', label: '★ Перчатки' },
  { id: 'snipers', label: 'Снайперские' },
  { id: 'rifles', label: 'Винтовки' },
  { id: 'pistols', label: 'Пистолеты' },
  { id: 'smgs', label: 'ПП' },
  { id: 'heavy', label: 'Тяжелое' },
  { id: 'stickers', label: 'Наклейки' },
  { id: 'agents', label: 'Агенты' },
  { id: 'charms', label: 'Брелоки' },
];

interface RadialGaugeProps {
  inventory: InventoryItem[];
  catalogSkins: SkinEntity[];
}

import { UPGRADE_TOKENS, UpgradeToken, rollConsolationToken, LUCK_POTION } from '../../lib/consumables';

export const RadialGauge: React.FC<RadialGaugeProps> = ({ inventory, catalogSkins }) => {
  const {
    balance,
    deductBalance,
    addToInventory,
    recordUpgrade,
    tokens,
    potionsCount,
    activePotionCharges,
    drinkPotion,
    useToken,
    consumePotionCharge,
    addToken,
    addPotion,
  } = useGameStore();
  const { t, locale } = useLanguage();

  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [customBetDc, setCustomBetDc] = useState<number>(1000);
  const [betMode, setBetMode] = useState<'skin' | 'dc' | 'consumables'>('skin');
  const [selectedToken, setSelectedToken] = useState<UpgradeToken | null>(null);

  const [targetChance, setTargetChance] = useState<number>(50);
  const [targetSkin, setTargetSkin] = useState<SkinEntity | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [lastResult, setLastResult] = useState<'win' | 'lose' | null>(null);

  // Cashback state
  const [cashbackModal, setCashbackModal] = useState<{
    isOpen: boolean;
    caseItem?: CaseItem;
    skin?: SkinEntity;
    awardedToken?: UpgradeToken;
    awardedPotion?: boolean;
    lostAmount: number;
  } | null>(null);

  // Search & Filter state
  const [mySearch, setMySearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogRarity, setCatalogRarity] = useState('all');
  const [catalogType, setCatalogType] = useState('all');
  const [catalogSort, setCatalogSort] = useState<'asc' | 'desc'>('asc');

  // Infinite scroll for catalog
  const [catalogLimit, setCatalogLimit] = useState(60);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);



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
    if (betMode === 'consumables') {
      return selectedToken ? selectedToken.valueDc : 0;
    }
    return customBetDc;
  }, [betMode, selectedItems, selectedToken, customBetDc]);

  // Max target price restriction (tokens have target limit)
  const maxTargetPrice = useMemo(() => {
    if (betMode === 'consumables' && selectedToken) {
      return selectedToken.maxTargetDc;
    }
    return Infinity;
  }, [betMode, selectedToken]);

  // Reset catalog limit when filters change
  useEffect(() => {
    setCatalogLimit(60);
  }, [catalogSearch, catalogRarity, catalogType, catalogSort, effectiveBetDc, maxTargetPrice]);

  // Auto-Select target skin when bet or target chance changes
  const autoSelectTargetSkin = (desiredChance: number, currentBet: number, forceType?: string) => {
    if (currentBet <= 0) return;
    const typeToMatch = forceType !== undefined ? forceType : catalogType;
    let candidates = catalogSkins.filter(
      (s) => s.priceDc > currentBet && s.priceDc <= maxTargetPrice && matchesCatalogType(s, typeToMatch)
    );
    if (candidates.length === 0) {
      candidates = catalogSkins.filter(
        (s) => s.priceDc > currentBet && s.priceDc <= maxTargetPrice
      );
    }
    if (candidates.length === 0) return;

    // Filter out stickers/charms/agents from default general auto-upgrades
    if (typeToMatch === 'all') {
      const weaponOnly = candidates.filter(isActualWeapon);
      if (weaponOnly.length > 0) candidates = weaponOnly;
    }

    // Ideal target price based on 95% RTP
    const idealPrice = Math.min(maxTargetPrice, (currentBet / (desiredChance / 100)) * 0.95);

    // Knife Priority:
    // When knives appear (idealPrice >= 35,000 DC or user specifically filtered knives or bet allows knife)
    const knifeCandidates = candidates.filter((s) => matchesCatalogType(s, 'knives'));
    const shouldTargetKnife =
      knifeCandidates.length > 0 &&
      (typeToMatch === 'knives' ||
        idealPrice >= 35000 ||
        (currentBet >= 15000 && (currentBet / 40320) * 95 >= desiredChance * 0.5));

    if (shouldTargetKnife) {
      // Sort knives by distance to idealPrice
      const sortedKnives = [...knifeCandidates].sort(
        (a, b) => Math.abs(a.priceDc - idealPrice) - Math.abs(b.priceDc - idealPrice)
      );
      // Pick among top diverse knives close to idealPrice (diverse knives, not just one Doppler)
      const topKnives = sortedKnives.slice(0, 10);
      const picked = topKnives[Math.floor(Math.random() * Math.min(5, topKnives.length))];
      if (picked) {
        setTargetSkin(picked);
        return;
      }
    }

    // Regular weapons pool (guns, rifles, snipers, pistols, etc.)
    const sortedWeapons = [...candidates].sort(
      (a, b) => Math.abs(a.priceDc - idealPrice) - Math.abs(b.priceDc - idealPrice)
    );
    const topWeapons = sortedWeapons.slice(0, 8);
    const picked = topWeapons[Math.floor(Math.random() * Math.min(4, topWeapons.length))];
    if (picked) {
      setTargetSkin(picked);
    }
  };

  // Initial load or item selection changes
  useEffect(() => {
    if (inventory.length > 0 && selectedItems.length === 0 && betMode === 'skin') {
      setSelectedItems([inventory[0]]);
      autoSelectTargetSkin(50, inventory[0].priceDc);
    } else if (betMode === 'dc' && !targetSkin) {
      autoSelectTargetSkin(targetChance, customBetDc);
    } else if (betMode === 'consumables' && !selectedToken) {
      const firstOwnedToken = UPGRADE_TOKENS.find(tok => (tokens[tok.id] || 0) > 0);
      if (firstOwnedToken) {
        setSelectedToken(firstOwnedToken);
        autoSelectTargetSkin(50, firstOwnedToken.valueDc);
      }
    }
  }, [inventory, betMode, tokens]);

  // When effectiveBetDc changes, ensure targetSkin is valid
  useEffect(() => {
    if (effectiveBetDc > 0) {
      if (!targetSkin || targetSkin.priceDc <= effectiveBetDc || targetSkin.priceDc > maxTargetPrice) {
        autoSelectTargetSkin(targetChance, effectiveBetDc);
      }
    }
  }, [effectiveBetDc, maxTargetPrice]);

  // Base raw chance from bet vs target
  const baseChance = useMemo(() => {
    if (!targetSkin || targetSkin.priceDc <= 0 || effectiveBetDc <= 0) return 0;
    const raw = (effectiveBetDc / targetSkin.priceDc) * 95;
    return Math.min(95, Math.max(0.01, Number(raw.toFixed(2))));
  }, [effectiveBetDc, targetSkin]);

  // Luck Potion bonus (+15% to chance if charges active)
  const potionBonus = activePotionCharges > 0 && targetSkin && effectiveBetDc > 0 ? 15 : 0;

  // Total chance displayed and used for roll
  const chance = useMemo(() => {
    if (baseChance <= 0) return 0;
    return Math.min(95, Number((baseChance + potionBonus).toFixed(2)));
  }, [baseChance, potionBonus]);

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
    { label: '85%', chance: 85.0 },
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

  // Guard check: strictly disallow spinning without skins / bet / token
  const canUpgrade = useMemo(() => {
    if (isUpgrading || !targetSkin) return false;
    if (betMode === 'skin') {
      return selectedItems.length > 0 && effectiveBetDc > 0;
    }
    if (betMode === 'dc') {
      return customBetDc > 0 && balance >= customBetDc;
    }
    if (betMode === 'consumables') {
      return selectedToken !== null && (tokens[selectedToken.id] || 0) > 0 && effectiveBetDc > 0;
    }
    return false;
  }, [isUpgrading, targetSkin, betMode, selectedItems, effectiveBetDc, customBetDc, balance, selectedToken, tokens]);

  // Perform Upgrade Spin
  const handleStartUpgrade = async () => {
    if (!canUpgrade || !targetSkin || effectiveBetDc <= 0) return;

    const currentLostAmount = effectiveBetDc;

    if (betMode === 'skin') {
      if (selectedItems.length === 0) return;
      const idsToRemove = new Set(selectedItems.map((i) => i.instanceId));
      useGameStore.setState((state) => ({
        inventory: state.inventory.filter((i) => !idsToRemove.has(i.instanceId)),
      }));
    } else if (betMode === 'dc') {
      if (balance < customBetDc) {
        useGameStore.getState().setRefillOpen(true);
        return;
      }
      const deducted = deductBalance(customBetDc);
      if (!deducted) return;
    } else if (betMode === 'consumables' && selectedToken) {
      // Consume 1 token from inventory
      const used = useToken(selectedToken.id);
      if (!used) return;
    }

    sound.playClick();
    setIsUpgrading(true);
    setLastResult(null);

    // Math: Winning sector is centered at bottom (90 deg)
    const span = chance * 3.6;
    const halfSpan = span / 2;
    const isWin = Math.random() * 100 <= chance;

    let targetAngle: number;
    if (isWin) {
      targetAngle = 90 - halfSpan + Math.random() * span;
    } else {
      const loseSpan = 360 - span;
      targetAngle = 90 + halfSpan + Math.random() * loseSpan;
    }

    // Spin 5 full revolutions + targetAngle
    const totalRotation = 360 * 5 + targetAngle;
    const duration = 4.2;

    // Aerodynamic continuous WHOOSH spin sound (no crackling clicks)
    sound.startSpinWhoosh(duration);

    await needleControls.set({ rotate: 0 });
    await needleControls.start({
      rotate: totalRotation,
      transition: {
        duration: duration,
        ease: [0.12, 0.85, 0.18, 1],
      },
    });

    sound.stopSpinWhoosh();
    setIsUpgrading(false);

    // Consume 1 potion charge if active
    if (activePotionCharges > 0) {
      consumePotionCharge();
    }

    if (isWin) {
      sound.playWin(targetSkin.rarity);
      setLastResult('win');
      addToInventory([targetSkin]);
      recordUpgrade(true, targetSkin.priceDc - effectiveBetDc);
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

      // ── CONSOLATION PRIZE (Кешбэк / Утешительный приз) ──
      // Triggers on losses >= 500 DC
      const shouldTriggerConsolation =
        currentLostAmount >= 2000 ? Math.random() < 0.85 :
        currentLostAmount >= 1000 ? Math.random() < 0.65 :
        currentLostAmount >= 500 ? Math.random() < 0.40 : false;

      if (shouldTriggerConsolation) {
        // 1. Зелье удачи (Контрабанда): ОЧЕНЬ РЕДКО, и ТОЛЬКО если сумма проигрыша >= 10 000 DC!
        // Шанс плавно растет от 1.0% (при 10к) до 3% (при 100к+)
        let awardedPotion = false;
        if (currentLostAmount >= 10000) {
          const potionChance = Math.min(0.03, 0.01 + ((currentLostAmount - 10000) / 200000) * 0.02);
          if (Math.random() < potionChance) {
            awardedPotion = true;
          }
        }

        if (awardedPotion) {
          setCashbackModal({
            isOpen: true,
            awardedPotion: true,
            lostAmount: currentLostAmount,
          });
        } else {
          // 2. Основной пул утешительного приза:
          // Кейсы падают ЧАЩЕ ВСЕГО (~76%), а Токены — РЕДКО (~24%)
          const rollType = Math.random();
          const isCasePrize = rollType < 0.76;

          if (isCasePrize) {
            // КЕЙС: Выбираем дешевый кейс (кешбэк 10-12% от суммы проигрыша, максимум 2 500 DC)
            const casesList = allCasesJson as CaseItem[];
            const validCases = casesList.filter((c) => c.skins && c.skins.length > 0);

            const maxCasePrice = Math.min(2500, Math.max(300, Math.floor(currentLostAmount * 0.12)));
            // Предпочитаем оружейные кейсы (не капсулы и не сувенирные наборы за 100k+)
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
              // КЕШБЭК НЕ ДОЛЖЕН ОКУПАТЬ АПГРЕЙД!
              // Дроп со скина составляет скромную долю от проигрыша (до 15% от проигранной суммы)
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
          } else {
            // ТОКЕН (Редко): Редкость токена зависит от суммы проигрыша
            let tokenPrize: UpgradeToken;
            const tRoll = Math.random() * 100;

            if (currentLostAmount < 3000) {
              // Ширпотреб (85%) / Промышленный (15%)
              tokenPrize = tRoll < 15 ? UPGRADE_TOKENS[1] : UPGRADE_TOKENS[0];
            } else if (currentLostAmount < 10000) {
              // Промышленный (60%) / Армейский (40%)
              tokenPrize = tRoll < 40 ? UPGRADE_TOKENS[2] : UPGRADE_TOKENS[1];
            } else if (currentLostAmount < 25000) {
              // Армейский (60%) / Запрещенный (40%)
              tokenPrize = tRoll < 40 ? UPGRADE_TOKENS[3] : UPGRADE_TOKENS[2];
            } else if (currentLostAmount < 60000) {
              // Запрещенный (50%) / Засекреченный (50%)
              tokenPrize = tRoll < 50 ? UPGRADE_TOKENS[4] : UPGRADE_TOKENS[3];
            } else {
              // Засекреченный (45%) / Тайный (40%) / Золотой (15%)
              tokenPrize = tRoll < 15 ? UPGRADE_TOKENS[6] : tRoll < 55 ? UPGRADE_TOKENS[5] : UPGRADE_TOKENS[4];
            }

            setCashbackModal({
              isOpen: true,
              awardedToken: tokenPrize,
              lostAmount: currentLostAmount,
            });
          }
        }
      }
    }

    if (betMode === 'skin') {
      setSelectedItems([]);
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

      return true;
    });

    result.sort((a, b) => (catalogSort === 'asc' ? a.priceDc - b.priceDc : b.priceDc - a.priceDc));
    return result;
  }, [catalogSkins, catalogSearch, catalogRarity, catalogType, catalogSort, effectiveBetDc, maxTargetPrice]);

  // Circular gauge constants
  const gaugeR = 100;
  const gaugeC = 2 * Math.PI * gaugeR;
  const baseArcLen = Math.max(0.5, (baseChance / 100) * gaugeC);
  const halfPotion = potionBonus / 2;
  const wingArcLen = halfPotion > 0 ? (halfPotion / 100) * gaugeC : 0;

  // Symmetrical layout: Winning sector centered at bottom (90 deg)
  const baseStartDeg = 90 - (baseChance * 1.8);
  const leftWingStartDeg = baseStartDeg - (halfPotion * 3.6);
  const rightWingStartDeg = 90 + (baseChance * 1.8);

  // Bubbles strictly inside potion wings
  const potionBubbles = useMemo(() => {
    if (potionBonus <= 0) return [];
    const bubbles: Array<{ id: string; cx: number; cy: number; r: number; delay: string; duration: string; color: string }> = [];

    const leftSpan = halfPotion * 3.6;
    const rightSpan = halfPotion * 3.6;

    // 4 bubbles strictly in left wing
    const leftFractions = [0.2, 0.45, 0.7, 0.9];
    const leftOffsets = [-3, 2, -1, 3];
    const leftSizes = [2.8, 3.4, 2.2, 3.0];
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

    // 4 bubbles strictly in right wing
    const rightFractions = [0.15, 0.4, 0.65, 0.88];
    const rightOffsets = [3, -2, 2, -3];
    const rightSizes = [3.2, 2.4, 3.5, 2.0];

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
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setBetMode('skin');
                    const bet = selectedItems.reduce((s, i) => s + i.priceDc, 0);
                    if (bet > 0) autoSelectTargetSkin(targetChance, bet);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    betMode === 'skin' ? 'bg-yellow-400 text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t('upg.tab.skins')} ({selectedItems.length}/5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBetMode('dc');
                    if (customBetDc > 0) autoSelectTargetSkin(targetChance, customBetDc);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    betMode === 'dc' ? 'bg-yellow-400 text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t('upg.tab.balance')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBetMode('consumables');
                    let tok = selectedToken;
                    if (!tok) {
                      tok = UPGRADE_TOKENS.find(t => (tokens[t.id] || 0) > 0) || null;
                      if (tok) setSelectedToken(tok);
                    }
                    if (tok) autoSelectTargetSkin(targetChance, tok.valueDc);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    betMode === 'consumables' ? 'bg-yellow-400 text-black' : 'text-yellow-400/80 hover:text-yellow-400'
                  }`}
                >
                  <Gift className="w-3 h-3" />
                  <span>{t('upg.tab.consumables')}</span>
                </button>
              </div>

              {betMode === 'skin' && selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSelected}
                  className="text-xs text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                >
                  {t('upg.reset')}
                </button>
              )}
            </div>

            {/* Input card box */}
            <div className="h-68 rounded-2xl bg-black/40 border border-white/10 p-3 flex flex-col justify-between">
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
                    <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-48 pr-1">
                      {selectedItems.map((item) => (
                        <div
                          key={item.instanceId}
                          className="relative rounded-xl bg-[#13141c] border border-white/10 p-2 flex flex-col items-center justify-between group hover:border-yellow-400/50 transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedItem(item.instanceId)}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 object-contain"
                          />
                          <span className="text-[10px] text-white font-black truncate w-full text-center mt-1">
                            {item.skinName || item.name}
                          </span>
                          <span className="text-[10px] font-mono font-black text-yellow-400">
                            {item.priceDc.toLocaleString('ru-RU')} DC
                          </span>
                        </div>
                      ))}

                      {Array.from({ length: 5 - selectedItems.length }).map((_, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center h-20 text-white/20"
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
                /* CONSUMABLES TAB: POTIONS & TOKENS */
                <div className="flex flex-col h-full justify-between overflow-y-auto pr-1 gap-2.5">
                  {/* Luck Potion Row */}
                  <div className="p-2.5 rounded-xl bg-[#091a13] border border-emerald-500/40 flex flex-col gap-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base animate-pulse">🧪</span>
                        <span className="text-xs font-black text-emerald-300">{t('upg.potionTitle')}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {t('upg.contraband')}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-black text-white">
                        {locale === 'ru' ? `${potionsCount} шт.` : `${potionsCount} pcs.`}
                      </span>
                    </div>

                    {activePotionCharges > 0 ? (
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-900/50 border border-emerald-400/40 text-[11px] font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          {t('upg.potionActive')}
                        </span>
                        <span className="font-mono font-black">
                          {activePotionCharges}/3 {t('upg.potionCharges')}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          drinkPotion();
                        }}
                        disabled={potionsCount <= 0}
                        className={`w-full py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          potionsCount > 0
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95'
                            : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        <span>{potionsCount > 0 ? t('upg.drinkPotion') : t('upg.noPotions')}</span>
                      </button>
                    )}
                  </div>

                  {/* Tokens Row */}
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-white/70">{t('upg.myTokens')}</span>
                      {selectedToken && (
                        <span className="text-[10px] text-yellow-400 font-mono font-bold">
                          +{selectedToken.valueDc.toLocaleString('ru-RU')} DC
                        </span>
                      )}
                    </div>

                    {UPGRADE_TOKENS.filter((tok) => (tokens[tok.id] || 0) > 0).length === 0 ? (
                      <div className="p-3 text-center text-[11px] text-white/40 border border-dashed border-white/10 rounded-xl">
                        {t('upg.noTokensOwned')}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 overflow-y-auto max-h-28 pr-1">
                        {UPGRADE_TOKENS.filter((tok) => (tokens[tok.id] || 0) > 0).map((token) => {
                          const isSel = selectedToken?.id === token.id;
                          const rConf = RARITY_CONFIG[token.rarity];
                          const count = tokens[token.id] || 0;

                          return (
                            <button
                              key={token.id}
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setSelectedToken(token);
                                autoSelectTargetSkin(targetChance, token.valueDc);
                              }}
                              className={`flex items-center justify-between p-1.5 rounded-xl border transition-all cursor-pointer text-left ${
                                isSel
                                  ? 'border-yellow-400 bg-yellow-400/15 shadow-[0_0_10px_rgba(250,204,21,0.25)]'
                                  : 'border-white/10 bg-black/40 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rConf.color }} />
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-black text-white">{t('token.' + token.rarity) || token.name}</span>
                                    <span className="text-[10px] font-mono text-yellow-400 font-bold">x{count}</span>
                                  </div>
                                  <span className="text-[9px] text-white/40">
                                    {t('upg.targetUpTo')} {token.maxTargetDc.toLocaleString('ru-RU')} DC
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-black text-xs text-yellow-400">
                                +{token.valueDc.toLocaleString('ru-RU')} DC
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
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
              </svg>

              {/* Rotating Pointer Needle with inward-pointing arrow */}
              <motion.div
                animate={needleControls}
                className="absolute w-full h-full flex items-center justify-center pointer-events-none z-10"
              >
                <div className="relative w-full h-4 flex items-center justify-end pr-1.5">
                  <svg
                    className="w-7 h-7 drop-shadow-[0_0_12px_rgba(250,204,21,0.95)]"
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
                </div>
              </motion.div>

              {/* Center Display Hub */}
              <div className="relative z-10 w-40 h-40 rounded-full bg-[#0a0a0f] border-4 border-[#1f212e] flex flex-col items-center justify-center text-center shadow-inner">
                <span className="font-mono font-black text-4xl sm:text-5xl text-white tracking-tight">
                  {chance < 1 ? chance.toFixed(2) : chance.toFixed(1)}%
                </span>
                {activePotionCharges > 0 ? (
                  <div className="flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500 text-[10px] font-black text-emerald-300 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    <span>{t('upg.potionBadge')} ({activePotionCharges}/3)</span>
                  </div>
                ) : (
                  <span
                    className="text-[11px] font-bold mt-1 max-w-[120px] leading-tight"
                    style={{ color: riskLabel.color }}
                  >
                    {riskLabel.text}
                  </span>
                )}
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="mt-4 w-full max-w-xs">
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
                  {isUpgrading
                    ? t('upg.spinning')
                    : betMode === 'skin' && selectedItems.length === 0
                    ? t('upg.selectSkinsBtn')
                    : betMode === 'consumables' && !selectedToken
                    ? t('upg.selectTokenBtn')
                    : !targetSkin
                    ? t('upg.selectTargetBtn')
                    : t('upg.upgradeBtn')}
                </span>
              </button>
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
              className="h-68 rounded-2xl border p-4 flex flex-col justify-between relative overflow-hidden transition-all"
              style={{
                backgroundColor: targetConfig.bg,
                borderColor: targetConfig.border,
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white/60 uppercase">{t('upg.targetItem')}</span>
                <span
                  className="font-black px-2 py-0.5 rounded-full text-[10px]"
                  style={{ backgroundColor: targetConfig.border, color: '#FFFFFF' }}
                >
                  {targetConfig.label}
                </span>
              </div>

              {targetSkin ? (
                <div className="flex flex-col items-center justify-center my-auto">
                  <img
                    src={targetSkin.image}
                    alt={targetSkin.name}
                    referrerPolicy="no-referrer"
                    className="w-32 h-32 object-contain filter drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                  />
                  <span className="font-black text-white text-base text-center line-clamp-1 mt-1">
                    {targetSkin.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/50">{targetSkin.weapon}</span>
                    <WearBadge skin={targetSkin} size="xs" showFullLabel />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center my-auto text-center text-white/40">
                  <AlertCircle className="w-8 h-8 mb-1" />
                  <span className="text-xs">{t('upg.chooseTarget')}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
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
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="w-16 h-16 flex items-center justify-center my-1">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="w-full flex flex-col">
                      <div className="flex items-center gap-1">
                        {item.statTrak && (
                          <span className="text-[8px] font-mono font-black text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/40 shrink-0">
                            ST
                          </span>
                        )}
                        <span className="text-[11px] font-black text-white truncate">
                          {item.skinName || item.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-white/40">
                        <span className="truncate">{item.weapon}</span>
                        <WearBadge skin={item} size="xs" />
                      </div>
                      <span className="text-[11px] font-mono font-black text-yellow-400 mt-1">
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

          {/* Item Types Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
            {ITEM_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCatalogType(type.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  catalogType === type.id
                    ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {t('type.' + type.id) || type.label}
              </button>
            ))}
          </div>

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
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div className="w-16 h-16 flex items-center justify-center my-1">
                        <img
                          src={skin.image}
                          alt={skin.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="w-full flex flex-col">
                        <div className="flex items-center gap-1">
                          {skin.statTrak && (
                            <span className="text-[8px] font-mono font-black text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/40 shrink-0">
                              ST
                            </span>
                          )}
                          <span className="text-[11px] font-black text-white truncate">
                            {skin.skinName || skin.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-white/40">
                          <span className="truncate">{skin.weapon}</span>
                          <WearBadge skin={skin} size="xs" />
                        </div>
                        <span className="text-[11px] font-mono font-black text-yellow-400 mt-1">
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
          awardedToken={cashbackModal.awardedToken}
          awardedPotion={cashbackModal.awardedPotion}
          lostAmount={cashbackModal.lostAmount}
          onClaim={() => {
            if (cashbackModal.awardedPotion) {
              addPotion(1);
            } else if (cashbackModal.awardedToken) {
              addToken(cashbackModal.awardedToken.id);
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
