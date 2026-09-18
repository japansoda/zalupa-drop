'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { SkinEntity } from '../../lib/types';
import { rollCaseBonusDrop, UpgradeToken } from '../../lib/consumables';
import { RARITY_CONFIG } from '../../data/skins';
import { sound } from '../../lib/sound';
import { DropModal } from './DropModal';
import { WearBadge } from '../ui/WearBadge';
import { useGameStore } from '../../store/useGameStore';
import { Zap, Layers } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

interface ReelRouletteProps {
  caseId?: string;
  caseSkins: SkinEntity[];
  casePriceDc: number;
  caseName: string;
}

const ITEM_WIDTH = 180;
const ITEM_GAP = 12;
const WIN_INDEX = 45;
const REEL_SIZE = 55;

export const ReelRoulette: React.FC<ReelRouletteProps> = ({ caseId, caseSkins, casePriceDc, caseName }) => {
  const { balance, deductBalance, addToInventory, addBalance, addLiveDrop } = useGameStore();
  const { t, locale } = useLanguage();
  const [openCount, setOpenCount] = useState<1 | 2 | 3>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [fastOpen, setFastOpen] = useState(false);

  // Up to 3 reels
  const [reels, setReels] = useState<SkinEntity[][]>([[], [], []]);
  const [winningSkins, setWinningSkins] = useState<SkinEntity[]>([]);
  const [bonusConsumables, setBonusConsumables] = useState<{ tokens: UpgradeToken[]; potions: number }>({
    tokens: [],
    potions: 0,
  });
  const [showModal, setShowModal] = useState(false);

  const containerRef0 = useRef<HTMLDivElement>(null);
  const controls0 = useAnimation();
  const controls1 = useAnimation();
  const controls2 = useAnimation();
  const lastSoundTickPos = useRef<number>(0);

  const pickWeightedSkin = (): SkinEntity => {
    const isKnifeOrGlove = (s: SkinEntity) =>
      s.rarity === 'gold' ||
      s.rarity === 'extraordinary' ||
      (s.weapon &&
        (s.weapon.includes('Knife') ||
          s.weapon.includes('Bayonet') ||
          s.weapon.includes('Karambit') ||
          s.weapon.includes('Daggers') ||
          s.weapon.includes('Gloves') ||
          s.weapon.includes('Wraps')));

    // 1. Exact 10% knife cases
    if (caseId === 'case_10_knife' || caseName.includes('10% Нож')) {
      const knives = caseSkins.filter(isKnifeOrGlove);
      const others = caseSkins.filter((s) => !isKnifeOrGlove(s));
      const weights = caseSkins.map((s) =>
        isKnifeOrGlove(s) ? 10.0 / (knives.length || 1) : 90.0 / (others.length || 1)
      );
      const totalW = weights.reduce((a, b) => a + b, 0);
      let rnd = Math.random() * totalW;
      for (let i = 0; i < caseSkins.length; i++) {
        if (rnd <= weights[i]) return caseSkins[i];
        rnd -= weights[i];
      }
      return caseSkins[caseSkins.length - 1];
    }

    // 2. Exact 50% knife cases
    if (caseId === 'case_50_knife' || caseName.includes('50% Нож')) {
      const knives = caseSkins.filter(isKnifeOrGlove);
      const others = caseSkins.filter((s) => !isKnifeOrGlove(s));
      const weights = caseSkins.map((s) =>
        isKnifeOrGlove(s) ? 50.0 / (knives.length || 1) : 50.0 / (others.length || 1)
      );
      const totalW = weights.reduce((a, b) => a + b, 0);
      let rnd = Math.random() * totalW;
      for (let i = 0; i < caseSkins.length; i++) {
        if (rnd <= weights[i]) return caseSkins[i];
        rnd -= weights[i];
      }
      return caseSkins[caseSkins.length - 1];
    }

    // 3. Safari Troll case (exciting 4.0% jackpot)
    if (caseId === 'case_safari_troll') {
      const dlores = caseSkins.filter((s) => (s.skinName || s.name).includes('Dragon Lore'));
      const meshes = caseSkins.filter((s) => !(s.skinName || s.name).includes('Dragon Lore'));
      const weights = caseSkins.map((s) =>
        (s.skinName || s.name).includes('Dragon Lore')
          ? 4.0 / (dlores.length || 1)
          : 96.0 / (meshes.length || 1)
      );
      const totalW = weights.reduce((a, b) => a + b, 0);
      let rnd = Math.random() * totalW;
      for (let i = 0; i < caseSkins.length; i++) {
        if (rnd <= weights[i]) return caseSkins[i];
        rnd -= weights[i];
      }
      return caseSkins[caseSkins.length - 1];
    }

    // 4. All or Nothing (20% legend, 80% cheap)
    if (caseId === 'case_all_or_nothing') {
      const topItems = caseSkins.filter((s) => s.priceDc >= 50000 || isKnifeOrGlove(s));
      const lowItems = caseSkins.filter((s) => s.priceDc < 50000 && !isKnifeOrGlove(s));
      const weights = caseSkins.map((s) =>
        s.priceDc >= 50000 || isKnifeOrGlove(s)
          ? 20.0 / (topItems.length || 1)
          : 80.0 / (lowItems.length || 1)
      );
      const totalW = weights.reduce((a, b) => a + b, 0);
      let rnd = Math.random() * totalW;
      for (let i = 0; i < caseSkins.length; i++) {
        if (rnd <= weights[i]) return caseSkins[i];
        rnd -= weights[i];
      }
      return caseSkins[caseSkins.length - 1];
    }

    // 5. Zalupa trash case (4.0% jackpot)
    if (caseId === 'case_zalupa') {
      const rareItems = caseSkins.filter((s) => s.priceDc >= 50000 || isKnifeOrGlove(s));
      const trashItems = caseSkins.filter((s) => s.priceDc < 50000 && !isKnifeOrGlove(s));
      const weights = caseSkins.map((s) =>
        s.priceDc >= 50000 || isKnifeOrGlove(s)
          ? 4.0 / (rareItems.length || 1)
          : 96.0 / (trashItems.length || 1)
      );
      const totalW = weights.reduce((a, b) => a + b, 0);
      let rnd = Math.random() * totalW;
      for (let i = 0; i < caseSkins.length; i++) {
        if (rnd <= weights[i]) return caseSkins[i];
        rnd -= weights[i];
      }
      return caseSkins[caseSkins.length - 1];
    }

    const hasLowTier = caseSkins.some(
      (s) => s.rarity === 'milspec' || s.rarity === 'industrial' || s.rarity === 'consumer'
    );

    if (hasLowTier) {
      // Highly rewarding and profitable simulator odds:
      // Gold (Knives/Gloves): ~5.0% (1 in 20 spins!)
      // Covert (Reds): ~16.0% (almost 1 in 6 spins!)
      // Classified (Pinks): ~28.0% (break-even / solid profit)
      // Restricted (Purples): ~30.0%
      // Milspec (Blues): ~21.0%
      const counts = { gold: 0, covert: 0, classified: 0, restricted: 0, milspec: 0, low: 0 };
      caseSkins.forEach((s) => {
        if (isKnifeOrGlove(s)) counts.gold++;
        else if (s.rarity === 'covert' || s.rarity === 'contraband') counts.covert++;
        else if (s.rarity === 'classified') counts.classified++;
        else if (s.rarity === 'restricted') counts.restricted++;
        else if (s.rarity === 'milspec') counts.milspec++;
        else counts.low++;
      });

      const targetShares = {
        gold: counts.gold ? 5.0 : 0,
        covert: counts.covert ? 16.0 : 0,
        classified: counts.classified ? 28.0 : 0,
        restricted: counts.restricted ? 30.0 : 0,
        milspec: counts.milspec ? 21.0 : 0,
        low: counts.low ? 15.0 : 0,
      };

      const weights = caseSkins.map((s) => {
        if (isKnifeOrGlove(s)) return targetShares.gold / counts.gold;
        if (s.rarity === 'covert' || s.rarity === 'contraband') return targetShares.covert / counts.covert;
        if (s.rarity === 'classified') return targetShares.classified / counts.classified;
        if (s.rarity === 'restricted') return targetShares.restricted / counts.restricted;
        if (s.rarity === 'milspec') return (targetShares.milspec || 21) / counts.milspec;
        return (targetShares.low || 15) / (counts.low || 1);
      });

      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let rnd = Math.random() * totalWeight;
      for (let i = 0; i < caseSkins.length; i++) {
        if (rnd <= weights[i]) return caseSkins[i];
        rnd -= weights[i];
      }
      return caseSkins[caseSkins.length - 1];
    } else {
      // High-tier, knives or theme custom case:
      // Soft sublinear exponent (0.32) allows winning top-tier jackpots regularly
      const weights = caseSkins.map((s) => 100000 / Math.pow(Math.max(50, s.priceDc), 0.32));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let rnd = Math.random() * totalWeight;
      for (let i = 0; i < caseSkins.length; i++) {
        if (rnd <= weights[i]) return caseSkins[i];
        rnd -= weights[i];
      }
      return caseSkins[caseSkins.length - 1];
    }
  };

  const generateReel = (winner: SkinEntity): SkinEntity[] => {
    const list: SkinEntity[] = [];
    for (let i = 0; i < REEL_SIZE; i++) {
      if (i === WIN_INDEX) {
        list.push(winner);
      } else {
        list.push(caseSkins[Math.floor(Math.random() * caseSkins.length)]);
      }
    }
    return list;
  };

  useEffect(() => {
    const initial0: SkinEntity[] = [];
    const initial1: SkinEntity[] = [];
    const initial2: SkinEntity[] = [];
    for (let i = 0; i < REEL_SIZE; i++) {
      initial0.push(caseSkins[i % caseSkins.length]);
      initial1.push(caseSkins[(i + 3) % caseSkins.length]);
      initial2.push(caseSkins[(i + 7) % caseSkins.length]);
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

    sound.playClick();
    setIsSpinning(true);
    setShowModal(false);

    // Roll bonus consumables for each opened case
    const droppedTokens: UpgradeToken[] = [];
    let droppedPotions = 0;
    for (let i = 0; i < openCount; i++) {
      const bonus = rollCaseBonusDrop();
      if (bonus.token) {
        droppedTokens.push(bonus.token);
        useGameStore.getState().addToken(bonus.token.id);
      }
      if (bonus.potion) {
        droppedPotions++;
        useGameStore.getState().addPotion(1);
      }
    }
    setBonusConsumables({ tokens: droppedTokens, potions: droppedPotions });

    // Pick winners for each reel
    const winners: SkinEntity[] = [];
    for (let i = 0; i < openCount; i++) {
      winners.push(pickWeightedSkin());
    }
    setWinningSkins(winners);

    // Build new reels
    const newReels = [...reels];
    for (let i = 0; i < openCount; i++) {
      newReels[i] = generateReel(winners[i]);
    }
    setReels(newReels);

    if (fastOpen) {
      setTimeout(() => {
        // Play single win sound of highest rarity
        const highestWinner = winners.reduce((prev, curr) => {
          const rank = (s: SkinEntity) =>
            s.rarity === 'gold' ? 6 : s.rarity === 'covert' ? 5 : s.rarity === 'classified' ? 4 : s.rarity === 'restricted' ? 3 : 2;
          return rank(curr) > rank(prev) ? curr : prev;
        }, winners[0]);

        sound.playWin(highestWinner.rarity);
        setIsSpinning(false);
        setShowModal(true);
      }, 350);
      return;
    }

    const containerWidth = containerRef0.current?.offsetWidth || 800;
    const centerOffset = containerWidth / 2;

    // Reset positions
    controls0.set({ x: 0 });
    controls1.set({ x: 0 });
    controls2.set({ x: 0 });

    const duration = 6.0;
    const startTime = Date.now();
    lastSoundTickPos.current = 0;

    // SINGLE sound tick loop - sound DOES NOT stack!
    const jitter0 = (Math.random() - 0.5) * (ITEM_WIDTH * 0.7);
    const targetX0 = -(WIN_INDEX * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerOffset + jitter0);

    const jitter1 = (Math.random() - 0.5) * (ITEM_WIDTH * 0.7);
    const targetX1 = -(WIN_INDEX * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerOffset + jitter1);

    const jitter2 = (Math.random() - 0.5) * (ITEM_WIDTH * 0.7);
    const targetX2 = -(WIN_INDEX * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerOffset + jitter2);

    const tickInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= duration) {
        clearInterval(tickInterval);
        return;
      }
      const progress = elapsed / duration;
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentPos = Math.abs(targetX0 * easeProgress);

      const itemsPassed = Math.floor(currentPos / (ITEM_WIDTH + ITEM_GAP));
      if (itemsPassed > lastSoundTickPos.current) {
        sound.playTick(0.8 + (1 - progress) * 0.4);
        lastSoundTickPos.current = itemsPassed;
      }
    }, 30);

    const animPromises = [
      controls0.start({
        x: targetX0,
        transition: { duration, ease: [0.12, 0.8, 0.15, 1] },
      }),
    ];

    if (openCount >= 2) {
      animPromises.push(
        controls1.start({
          x: targetX1,
          transition: { duration: duration + 0.05, ease: [0.12, 0.8, 0.15, 1] },
        })
      );
    }

    if (openCount >= 3) {
      animPromises.push(
        controls2.start({
          x: targetX2,
          transition: { duration: duration + 0.1, ease: [0.12, 0.8, 0.15, 1] },
        })
      );
    }

    await Promise.all(animPromises);

    clearInterval(tickInterval);

    // Single win sound of highest rarity
    const highestWinner = winners.reduce((prev, curr) => {
      const rank = (s: SkinEntity) =>
        s.rarity === 'gold' ? 6 : s.rarity === 'covert' ? 5 : s.rarity === 'classified' ? 4 : s.rarity === 'restricted' ? 3 : 2;
      return rank(curr) > rank(prev) ? curr : prev;
    }, winners[0]);

    sound.playWin(highestWinner.rarity);
    setIsSpinning(false);
    setShowModal(true);
  };

  const handleKeep = () => {
    if (winningSkins.length === 0) return;
    addToInventory(winningSkins);
    winningSkins.forEach((skin) => {
      addLiveDrop({
        id: `user_${Date.now()}_${Math.random()}`,
        user: 'Вы',
        avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        skin: skin,
        caseName: caseName,
        timestamp: Date.now(),
      });
    });
    setShowModal(false);
  };

  const handleSell = () => {
    if (winningSkins.length === 0) return;
    const totalWon = winningSkins.reduce((sum, s) => sum + s.priceDc, 0);
    addBalance(totalWon);
    sound.playCashout();
    setShowModal(false);
  };

  const animControls = [controls0, controls1, controls2];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Multi-reel display */}
      <div className="w-full max-w-5xl flex flex-col gap-4">
        {Array.from({ length: openCount }).map((_, reelIdx) => (
          <div
            key={reelIdx}
            className="relative w-full rounded-3xl p-3 glass-panel border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Center Winner Indicator */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col justify-between items-center py-1">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-yellow-400 filter drop-shadow-[0_0_10px_#facc15]" />
              <div className="w-[2px] h-full bg-yellow-400 opacity-90 shadow-[0_0_12px_#facc15]" />
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-yellow-400 filter drop-shadow-[0_0_10px_#facc15]" />
            </div>

            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#08080a] to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#08080a] to-transparent z-20 pointer-events-none" />

            <div ref={reelIdx === 0 ? containerRef0 : undefined} className="relative w-full overflow-hidden py-3">
              <motion.div
                animate={animControls[reelIdx]}
                className="flex gap-3 will-change-transform"
                style={{ width: `${(reels[reelIdx] || []).length * (ITEM_WIDTH + ITEM_GAP)}px` }}
              >
                {(reels[reelIdx] || []).map((skin, idx) => {
                  const config = RARITY_CONFIG[skin.rarity] || RARITY_CONFIG.milspec;
                  return (
                    <div
                      key={`${skin.id}_${idx}`}
                      className="relative rounded-2xl glass-card shrink-0 flex flex-col items-center justify-between p-3 select-none overflow-hidden"
                      style={{
                        width: `${ITEM_WIDTH}px`,
                        height: openCount > 1 ? '180px' : '210px',
                        borderBottomWidth: '4px',
                        borderBottomColor: config.color,
                      }}
                    >
                      <div className="w-full flex justify-between items-center z-10">
                        <div className="flex items-center gap-1">
                          {skin.statTrak && (
                            <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/40">
                              ST
                            </span>
                          )}
                          <WearBadge skin={skin} size="xs" />
                        </div>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ color: config.color, backgroundColor: config.bg }}
                        >
                          {config.label}
                        </span>
                      </div>

                      <div className={`relative ${openCount > 1 ? 'w-24 h-24' : 'w-28 h-28'} my-auto flex items-center justify-center z-10`}>
                        <img
                          src={skin.image}
                          alt={skin.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain filter drop-shadow-md"
                        />
                      </div>

                      <div className="w-full text-center z-10">
                        <p className="text-xs font-bold text-white truncate">{skin.weapon}</p>
                        <p className="text-[11px] truncate" style={{ color: config.color }}>{skin.skinName}</p>
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
      <div className="flex flex-col items-center gap-5 mt-8 w-full max-w-xl">
        <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={startSpin}
            disabled={isSpinning}
            className={`w-full sm:w-auto px-10 py-4 rounded-2xl btn-yellow text-black font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all ${
              isSpinning ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span>
              {isSpinning
                ? t('case.openingAction')
                : locale === 'ru'
                ? `Открыть ${openCount > 1 ? `${openCount} кейса` : 'кейс'} за ${totalCost.toLocaleString('ru-RU')} DC`
                : `Open ${openCount > 1 ? `${openCount} cases` : 'case'} for ${totalCost.toLocaleString('ru-RU')} DC`}
            </span>
          </button>
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
