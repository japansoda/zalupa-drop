import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { SkinEntity, InventoryItem, CaseItem, SkinRarity } from '../../lib/types';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { RARITY_CONFIG } from '../../data/skins';
import { sound } from '../../lib/sound';
import { useGameStore } from '../../store/useGameStore';
import allCasesJson from '../../data/all_cases.json';
import { Check, X, Search, ChevronRight, RotateCcw, AlertCircle, Plus, Gift, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CashbackModal } from './CashbackModal';
import { WearBadge } from '../ui/WearBadge';

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

export interface UpgradeToken {
  id: string;
  name: string;
  rarity: SkinRarity;
  valueDc: number;
  maxTargetDc: number;
}

export const UPGRADE_TOKENS: UpgradeToken[] = [
  { id: 'token_consumer', name: 'Ширпотреб Токен', rarity: 'consumer', valueDc: 500, maxTargetDc: 2000 },
  { id: 'token_industrial', name: 'Промышленный Токен', rarity: 'industrial', valueDc: 1500, maxTargetDc: 5000 },
  { id: 'token_milspec', name: 'Армейский Токен', rarity: 'milspec', valueDc: 5000, maxTargetDc: 15000 },
  { id: 'token_restricted', name: 'Запрещенный Токен', rarity: 'restricted', valueDc: 15000, maxTargetDc: 35000 },
  { id: 'token_classified', name: 'Засекреченный Токен', rarity: 'classified', valueDc: 35000, maxTargetDc: 65000 },
  { id: 'token_covert', name: '★ Тайный Токен', rarity: 'covert', valueDc: 70000, maxTargetDc: 85000 },
  { id: 'token_gold', name: '★ Золотой Токен', rarity: 'gold', valueDc: 100000, maxTargetDc: 120000 },
];

export const RadialGauge: React.FC<RadialGaugeProps> = ({ inventory, catalogSkins }) => {
  const { balance, deductBalance, addToInventory, recordUpgrade } = useGameStore();

  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [customBetDc, setCustomBetDc] = useState<number>(1000);
  const [betMode, setBetMode] = useState<'skin' | 'dc' | 'token'>('skin');
  const [selectedToken, setSelectedToken] = useState<UpgradeToken | null>(null);

  const [targetChance, setTargetChance] = useState<number>(50);
  const [targetSkin, setTargetSkin] = useState<SkinEntity | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [lastResult, setLastResult] = useState<'win' | 'lose' | null>(null);

  // Cashback state
  const [cashbackModal, setCashbackModal] = useState<{
    isOpen: boolean;
    caseItem: CaseItem;
    skin: SkinEntity;
    lostAmount: number;
  } | null>(null);

  // Search & Filter state
  const [mySearch, setMySearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogRarity, setCatalogRarity] = useState('all');
  const [catalogType, setCatalogType] = useState('all');
  const [catalogSort, setCatalogSort] = useState<'asc' | 'desc'>('asc');

  const needleControls = useAnimation();

  // Calculate Total Bet Sum
  const effectiveBetDc = useMemo(() => {
    if (betMode === 'skin') {
      return selectedItems.reduce((sum, item) => sum + item.priceDc, 0);
    }
    if (betMode === 'token') {
      return selectedToken ? selectedToken.valueDc : 0;
    }
    return customBetDc;
  }, [betMode, selectedItems, selectedToken, customBetDc]);

  // Max target price restriction (tokens have target limit)
  const maxTargetPrice = useMemo(() => {
    if (betMode === 'token' && selectedToken) {
      return selectedToken.maxTargetDc;
    }
    return Infinity;
  }, [betMode, selectedToken]);

  // Auto-Select target skin when bet or target chance changes
  const autoSelectTargetSkin = (desiredChance: number, currentBet: number) => {
    if (currentBet <= 0) return;
    const candidates = catalogSkins.filter(
      (s) => s.priceDc > currentBet && s.priceDc <= maxTargetPrice
    );
    if (candidates.length === 0) return;

    // Ideal target price based on 95% RTP
    const idealPrice = Math.min(maxTargetPrice, (currentBet / (desiredChance / 100)) * 0.95);

    let closest = candidates[0];
    let minDiff = Math.abs(candidates[0].priceDc - idealPrice);

    for (const s of candidates) {
      const diff = Math.abs(s.priceDc - idealPrice);
      if (diff < minDiff) {
        minDiff = diff;
        closest = s;
      }
    }
    setTargetSkin(closest);
  };

  // Initial load or item selection changes
  useEffect(() => {
    if (inventory.length > 0 && selectedItems.length === 0 && betMode === 'skin') {
      setSelectedItems([inventory[0]]);
      autoSelectTargetSkin(50, inventory[0].priceDc);
    } else if (betMode === 'dc' && !targetSkin) {
      autoSelectTargetSkin(targetChance, customBetDc);
    } else if (betMode === 'token' && !selectedToken) {
      setSelectedToken(UPGRADE_TOKENS[2]);
      autoSelectTargetSkin(50, UPGRADE_TOKENS[2].valueDc);
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

  // Calculate Chance (RTP 95%)
  const chance = useMemo(() => {
    if (!targetSkin || targetSkin.priceDc <= 0 || effectiveBetDc <= 0) return 0;
    const raw = (effectiveBetDc / targetSkin.priceDc) * 95;
    return Math.min(95, Math.max(0.01, Number(raw.toFixed(2))));
  }, [effectiveBetDc, targetSkin]);

  // Risk label
  const riskLabel = useMemo(() => {
    if (chance >= 75) return { text: 'Очень высокий шанс', color: '#10B981' };
    if (chance >= 50) return { text: 'Высокий шанс', color: '#10B981' };
    if (chance >= 25) return { text: 'Средний шанс', color: '#FACC15' };
    if (chance >= 10) return { text: 'Рискованный шанс', color: '#FB923C' };
    if (chance >= 1) return { text: 'Низкий шанс', color: '#F87171' };
    return { text: 'Экстремальный шанс', color: '#EF4444' };
  }, [chance]);

  // Toggle inventory item selection (up to 5 items)
  const handleToggleInventoryItem = (item: InventoryItem) => {
    if (isUpgrading) return;
    sound.playClick();
    setBetMode('skin');

    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.instanceId === item.instanceId);
      if (exists) {
        return prev.filter((i) => i.instanceId !== item.instanceId);
      } else {
        if (prev.length >= 5) return prev;
        return [...prev, item];
      }
    });
  };

  const handleRemoveSelectedItem = (instanceId: string) => {
    if (isUpgrading) return;
    sound.playClick();
    setSelectedItems((prev) => prev.filter((i) => i.instanceId !== instanceId));
  };

  const handleClearAllSelected = () => {
    if (isUpgrading) return;
    sound.playClick();
    setSelectedItems([]);
  };

  // Preset buttons
  const presets = [
    { label: '0.01%', chance: 0.01 },
    { label: '1%', chance: 1.0 },
    { label: '1.5x', chance: 63.3 },
    { label: '2x', chance: 47.5 },
    { label: '5x', chance: 19.0 },
    { label: '10x', chance: 9.5 },
    { label: '25%', chance: 25.0 },
    { label: '50%', chance: 50.0 },
    { label: '75%', chance: 75.0 },
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
    if (betMode === 'token') {
      return selectedToken !== null && effectiveBetDc > 0;
    }
    return false;
  }, [isUpgrading, targetSkin, betMode, selectedItems, effectiveBetDc, customBetDc, balance, selectedToken]);

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
    } else if (betMode === 'token') {
      // Free token spin!
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

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= duration) {
        clearInterval(interval);
        return;
      }
      sound.playUpgradeSpin();
    }, 110);

    await needleControls.set({ rotate: 0 });
    await needleControls.start({
      rotate: totalRotation,
      transition: {
        duration: duration,
        ease: [0.12, 0.85, 0.18, 1],
      },
    });

    clearInterval(interval);
    setIsUpgrading(false);

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

      // ── CASHBACK FEATURE: If losing a high-value drop (>= 2000 DC) ──
      if (currentLostAmount >= 2000) {
        const casesList = allCasesJson as CaseItem[];
        const cheapCases = casesList.filter((c) => c.priceDc <= 1500 && c.skins && c.skins.length > 0);
        const selectedCase = cheapCases.length > 0 
          ? cheapCases[Math.floor(Math.random() * cheapCases.length)] 
          : casesList[0];

        if (selectedCase && selectedCase.skins.length > 0) {
          const cashbackDrop = selectedCase.skins[Math.floor(Math.random() * selectedCase.skins.length)];
          setCashbackModal({
            isOpen: true,
            caseItem: selectedCase,
            skin: cashbackDrop,
            lostAmount: currentLostAmount,
          });
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
      if (catalogType !== 'all') {
        const w = skin.weapon.toLowerCase();
        const cat = skin.category?.toLowerCase() || '';
        if (catalogType === 'knives') {
          const isKnife =
            skin.rarity === 'gold' ||
            w.includes('knife') ||
            w.includes('нож') ||
            w.includes('bayonet') ||
            w.includes('karambit') ||
            w.includes('daggers') ||
            w.includes('керамбит') ||
            w.includes('байонет') ||
            w.includes('тычковые');
          if (!isKnife) return false;
        } else if (catalogType === 'gloves') {
          const isGlove =
            skin.rarity === 'extraordinary' ||
            w.includes('gloves') ||
            w.includes('перчатки') ||
            w.includes('wraps') ||
            w.includes('обмотки');
          if (!isGlove) return false;
        } else if (catalogType === 'snipers') {
          if (!w.includes('awp') && !w.includes('ssg') && !w.includes('scar') && !w.includes('g3sg1')) return false;
        } else if (catalogType === 'rifles') {
          if (
            !w.includes('ak-47') &&
            !w.includes('m4a4') &&
            !w.includes('m4a1-s') &&
            !w.includes('galil') &&
            !w.includes('famas') &&
            !w.includes('aug') &&
            !w.includes('sg 553')
          )
            return false;
        } else if (catalogType === 'pistols') {
          if (
            !w.includes('usp-s') &&
            !w.includes('glock') &&
            !w.includes('desert eagle') &&
            !w.includes('deagle') &&
            !w.includes('p250') &&
            !w.includes('five-seven') &&
            !w.includes('tec-9') &&
            !w.includes('cz75') &&
            !w.includes('dual berettas') &&
            !w.includes('r8') &&
            !w.includes('p2000')
          )
            return false;
        } else if (catalogType === 'smgs') {
          if (
            !w.includes('mp9') &&
            !w.includes('mac-10') &&
            !w.includes('mp7') &&
            !w.includes('mp5-sd') &&
            !w.includes('ump-45') &&
            !w.includes('p90') &&
            !w.includes('bizon')
          )
            return false;
        } else if (catalogType === 'heavy') {
          if (
            !w.includes('nova') &&
            !w.includes('xm1014') &&
            !w.includes('mag-7') &&
            !w.includes('sawed-off') &&
            !w.includes('negev') &&
            !w.includes('m249')
          )
            return false;
        } else if (catalogType === 'stickers') {
          if (cat !== 'stickers' && w !== 'наклейка' && !w.includes('sticker')) return false;
        } else if (catalogType === 'agents') {
          if (cat !== 'agents' && w !== 'агент' && !w.includes('agent')) return false;
        } else if (catalogType === 'charms') {
          if (cat !== 'charms' && w !== 'брелок' && !w.includes('charm')) return false;
        }
      }

      return true;
    });

    result.sort((a, b) => (catalogSort === 'asc' ? a.priceDc - b.priceDc : b.priceDc - a.priceDc));
    return result.slice(0, 150);
  }, [catalogSkins, catalogSearch, catalogRarity, catalogType, catalogSort, effectiveBetDc, maxTargetPrice]);

  // Circular gauge constants
  const gaugeR = 100;
  const gaugeC = 2 * Math.PI * gaugeR;
  const arcLen = Math.max(1, (chance / 100) * gaugeC);
  const rotateDeg = 90 - (chance * 1.8);

  const targetConfig = targetSkin ? RARITY_CONFIG[targetSkin.rarity] || RARITY_CONFIG.milspec : RARITY_CONFIG.milspec;

  return (
    <div className="w-full flex flex-col gap-8">
      {/* ── TOP SECTION: PHOTO 2 DRUM & SLOTS ── */}
      <div className="w-full max-w-6xl mx-auto rounded-3xl p-6 sm:p-8 bg-[#0d0e14] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* 1. LEFT CARD: Selected Input / Bet / Tokens */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBetMode('skin')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    betMode === 'skin' ? 'bg-yellow-400 text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  СКИHЫ ({selectedItems.length}/5)
                </button>
                <button
                  type="button"
                  onClick={() => setBetMode('dc')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    betMode === 'dc' ? 'bg-yellow-400 text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  БАЛАНС
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBetMode('token');
                    if (!selectedToken) setSelectedToken(UPGRADE_TOKENS[2]);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    betMode === 'token' ? 'bg-yellow-400 text-black' : 'text-yellow-400/80 hover:text-yellow-400'
                  }`}
                >
                  <Gift className="w-3 h-3" />
                  <span>ТОКЕН</span>
                </button>
              </div>

              {betMode === 'skin' && selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSelected}
                  className="text-xs text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Сбросить
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
                    <span className="text-xs text-white/60 font-bold">Выберите до 5 скинов</span>
                    <span className="text-[11px] text-white/40 mt-1">в инвентаре внизу</span>
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
                          <span className="text-[9px] mt-0.5">Слот</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <span className="text-white/60 font-bold">Сумма ставки:</span>
                      <div className="flex items-center gap-1 font-mono font-black text-yellow-400">
                        <DropCoinIcon size={14} />
                        <span>{effectiveBetDc.toLocaleString('ru-RU')} DC</span>
                      </div>
                    </div>
                  </div>
                )
              ) : betMode === 'token' ? (
                /* FREE TOKENS SELECTOR */
                <div className="flex flex-col h-full justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white/70">Бесплатные токены:</span>
                    <span className="text-[10px] text-yellow-400 font-black uppercase">100% БЕСПЛАТНО</span>
                  </div>

                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-48 pr-1">
                    {UPGRADE_TOKENS.map((token) => {
                      const isSel = selectedToken?.id === token.id;
                      const rConf = RARITY_CONFIG[token.rarity];

                      return (
                        <button
                          key={token.id}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setSelectedToken(token);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer text-left ${
                            isSel
                              ? 'border-yellow-400 bg-yellow-400/15 shadow-[0_0_12px_rgba(250,204,21,0.25)]'
                              : 'border-white/10 bg-black/40 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: rConf.color }}
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-white">{token.name}</span>
                              <span className="text-[10px] text-white/40">
                                Цель до {token.maxTargetDc.toLocaleString('ru-RU')} DC
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 font-mono font-black text-xs text-yellow-400">
                            <span>+{token.valueDc.toLocaleString('ru-RU')} DC</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <span className="text-white/60 font-bold">Выбран токен:</span>
                    <span className="text-yellow-400 font-mono font-black">
                      {selectedToken ? `+${selectedToken.valueDc.toLocaleString('ru-RU')} DC` : 'Не выбран'}
                    </span>
                  </div>
                </div>
              ) : (
                /* DC BET MODE */
                <div className="h-full flex flex-col justify-between p-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-white/60">Ставка с баланса DC:</label>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-black/60 border border-white/10">
                      <DropCoinIcon size={20} />
                      <input
                        type="number"
                        min="10"
                        max={balance}
                        value={customBetDc}
                        onChange={(e) => setCustomBetDc(Math.max(10, Number(e.target.value)))}
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
                        onClick={() => setCustomBetDc(amt)}
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

          {/* 2. CENTER: CIRCULAR DRUM GAUGE MATCHING PHOTO 2 */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
            {/* Circular Speedometer Gauge */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Outer Metallic Ring */}
              <div className="absolute inset-0 rounded-full bg-[#12131b] border-8 border-[#1c1d28] shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)]" />

              {/* Top pointer notch / mark */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2b2d3d] border border-white/20 rotate-45 z-20 shadow-md" />

              {/* SVG Arc Track */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 240">
                <circle
                  cx="120"
                  cy="120"
                  r={gaugeR}
                  fill="none"
                  stroke="#1e202c"
                  strokeWidth="18"
                />

                {/* Bottom-oriented chance arc that sweeps upwards */}
                <circle
                  cx="120"
                  cy="120"
                  r={gaugeR}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="18"
                  strokeDasharray={`${arcLen} ${gaugeC}`}
                  strokeLinecap="round"
                  transform={`rotate(${rotateDeg}, 120, 120)`}
                  className="transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />
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
                <span
                  className="text-[11px] font-bold mt-1 max-w-[120px] leading-tight"
                  style={{ color: riskLabel.color }}
                >
                  {riskLabel.text}
                </span>
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
                    ? 'Крутим...'
                    : betMode === 'skin' && selectedItems.length === 0
                    ? 'Выберите скины'
                    : betMode === 'token' && !selectedToken
                    ? 'Выберите токен'
                    : !targetSkin
                    ? 'Выберите цель'
                    : 'Улучшить »'}
                </span>
              </button>
            </div>
          </div>

          {/* 3. RIGHT CARD: TARGET ITEM (ВЫ ПОЛУЧАЕТЕ) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {/* Quick Multiplier Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectPreset(p.chance)}
                  disabled={isUpgrading}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-yellow-400 hover:text-black border border-white/10 text-xs font-bold text-white/70 transition-all cursor-pointer shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Target Skin Preview Card */}
            <div
              className="h-64 rounded-2xl border p-4 flex flex-col justify-between relative overflow-hidden transition-all"
              style={{
                backgroundColor: targetConfig.bg,
                borderColor: targetConfig.border,
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white/60 uppercase">Вы получаете:</span>
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
                  <span className="text-xs">Выберите цель из каталога</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs text-white/60">Стоимость:</span>
                <div className="flex items-center gap-1 font-mono font-black text-yellow-400 text-base">
                  <DropCoinIcon size={18} />
                  <span>{targetSkin ? targetSkin.priceDc.toLocaleString('ru-RU') : 0} DC</span>
                </div>
              </div>
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
              <h2 className="text-base font-black text-white uppercase">Мои скины</h2>
              <span className="text-xs font-bold text-white/40">({inventory.length})</span>
            </div>

            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllSelected}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Отменить выбор</span>
              </button>
            )}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 mb-4">
            <Search className="w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Поиск по инвентарю..."
              value={mySearch}
              onChange={(e) => setMySearch(e.target.value)}
              className="w-full bg-transparent text-xs text-white outline-none"
            />
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
            {filteredMySkins.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-white/40">
                Инвентарь пуст. Откройте кейсы на главной!
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
              <h2 className="text-base font-black text-white uppercase">Вы получаете</h2>
              <span className="text-[11px] text-yellow-400/80 font-bold">
                (скины дороже {effectiveBetDc.toLocaleString('ru-RU')} DC
                {maxTargetPrice < Infinity ? ` до ${maxTargetPrice.toLocaleString('ru-RU')} DC` : ''})
              </span>
            </div>

            {/* Sort & Rarity Filter */}
            <div className="flex items-center gap-2">
              <select
                value={catalogRarity}
                onChange={(e) => setCatalogRarity(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">Все редкости</option>
                <option value="extraordinary">★ Экстраординарное</option>
                <option value="covert">★ Тайное</option>
                <option value="classified">Засекреченное</option>
                <option value="restricted">Запрещенное</option>
                <option value="gold">★ Редкий особый</option>
              </select>

              <button
                type="button"
                onClick={() => setCatalogSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-1 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white text-xs cursor-pointer"
              >
                {catalogSort === 'asc' ? 'Дешевле ↑' : 'Дороже ↓'}
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
                {type.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 mb-4">
            <Search className="w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Поиск по скинам CS2..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-white outline-none"
            />
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
            {filteredCatalogSkins.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-white/40">
                Нет скинов дороже текущей ставки. Уменьшите ставку!
              </div>
            ) : (
              filteredCatalogSkins.map((skin) => {
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
              })
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
          lostAmount={cashbackModal.lostAmount}
          onClaim={() => {
            addToInventory([cashbackModal.skin]);
            setCashbackModal(null);
          }}
          onClose={() => setCashbackModal(null)}
        />
      )}
    </div>
  );
};
