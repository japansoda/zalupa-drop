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
import { isKnifeOrGlove, isOfficialCase, rollSpecialKnifeDrop } from '../../lib/caseSpecials';

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
  const [isRevealed, setIsRevealed] = useState(false);
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
    if (caseId === 'case_50_knife' || caseName.includes('50% Нож')) {
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

    // 3. Guaranteed 98.0% RTP for ALL cases:
    // Target EV = 0.98 * casePriceDc.
    // Solves alpha power exponent via binary search so expected drop return is strictly 98%!
    const targetEV = Math.max(10, casePriceDc * 0.98);
    const prices = caseSkins.map((s) => Math.max(1, s.priceDc));
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);

    let weights: number[];

    if (targetEV <= minP) {
      // Even cheapest skin is >= 98% of case price (super value case)
      weights = caseSkins.map(() => 1);
    } else if (targetEV >= maxP) {
      // Target EV exceeds max skin -> weight towards highest items
      weights = prices.map((p) => Math.pow(p / maxP, 2));
    } else {
      // Binary search for exact 98% RTP alpha exponent
      let low = 0.01;
      let high = 4.0;
      let bestW = prices.map(() => 1);

      for (let iter = 0; iter < 22; iter++) {
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

    // Authentic CS2 reel visual distribution:
    // Common items dominate (78%), Restricted (16%), Classified (4.5%), Covert (1.2%), Gold (0.3%)
    const bucketWeights: { bucket: keyof typeof buckets; weight: number }[] = [
      { bucket: 'common', weight: 78 },
      { bucket: 'restricted', weight: 16 },
      { bucket: 'classified', weight: 4.5 },
      { bucket: 'covert', weight: 1.2 },
      { bucket: 'gold', weight: 0.3 },
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
        list.push(pickVisualTapeSkin(caseSkins));
      }
    }
    return list;
  };

  useEffect(() => {
    const initial0: SkinEntity[] = [];
    const initial1: SkinEntity[] = [];
    const initial2: SkinEntity[] = [];
    for (let i = 0; i < REEL_SIZE; i++) {
      initial0.push(pickVisualTapeSkin(caseSkins));
      initial1.push(pickVisualTapeSkin(caseSkins));
      initial2.push(pickVisualTapeSkin(caseSkins));
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
    setIsRevealed(false);
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
        setIsRevealed(true);
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

    let rafId: number;
    const updateSoundTick = () => {
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
    cancelAnimationFrame(rafId);
    setIsRevealed(true);

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

  const handleKeep = (itemsToKeep?: SkinEntity[]) => {
    const list = itemsToKeep !== undefined ? itemsToKeep : winningSkins;
    if (list.length === 0) {
      setShowModal(false);
      return;
    }
    addToInventory(list);
    list.forEach((skin) => {
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
                  const displaySkinName = showAsSpecial ? 'Редкий особый предмет' : skin.skinName;

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
                          {!showAsSpecial && skin.statTrak && (
                            <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/40">
                              ST
                            </span>
                          )}
                          {!showAsSpecial && <WearBadge skin={skin} size="xs" />}
                          {showAsSpecial && (
                            <span className="text-[8.5px] font-black text-yellow-300 bg-yellow-500/20 px-1 py-0.5 rounded border border-yellow-500/30">
                              ★
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ color: config.color, backgroundColor: config.bg }}
                        >
                          {showAsSpecial ? '★ РЕДКИЙ ОСОБЫЙ' : config.label}
                        </span>
                      </div>

                      <div className={`relative ${
                        showAsSpecial 
                          ? (openCount > 1 ? 'w-24 h-20' : 'w-28 h-24') 
                          : (openCount > 1 ? 'w-24 h-24' : 'w-28 h-28')
                      } my-auto flex items-center justify-center z-10`}>
                        <img
                          src={displayImage}
                          alt={displayWeapon}
                          referrerPolicy="no-referrer"
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
