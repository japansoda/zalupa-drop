'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { SkinEntity } from '../../lib/types';
import { RARITY_CONFIG } from '../../data/skins';
import { sound } from '../../lib/sound';
import { DropModal } from './DropModal';
import { useGameStore } from '../../store/useGameStore';
import { Zap } from 'lucide-react';

interface ReelRouletteProps {
  caseSkins: SkinEntity[];
  casePriceDc: number;
  caseName: string;
}

const ITEM_WIDTH = 180;
const ITEM_GAP = 12;
const WIN_INDEX = 45;
const REEL_SIZE = 55;

export const ReelRoulette: React.FC<ReelRouletteProps> = ({ caseSkins, casePriceDc, caseName }) => {
  const { balance, deductBalance, addToInventory, addBalance, addLiveDrop } = useGameStore();
  const [isSpinning, setIsSpinning] = useState(false);
  const [fastOpen, setFastOpen] = useState(false);
  const [reelItems, setReelItems] = useState<SkinEntity[]>([]);
  const [winningSkin, setWinningSkin] = useState<SkinEntity | null>(null);
  const [showModal, setShowModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const lastSoundTickPos = useRef<number>(0);

  const pickWeightedSkin = (): SkinEntity => {
    const golds = caseSkins.filter(s => s.rarity === 'gold');
    const coverts = caseSkins.filter(s => s.rarity === 'covert' || s.rarity === 'contraband');
    const classifieds = caseSkins.filter(s => s.rarity === 'classified');
    const restricteds = caseSkins.filter(s => s.rarity === 'restricted');
    const milspecs = caseSkins.filter(s => s.rarity === 'milspec' || s.rarity === 'consumer');

    const roll = Math.random() * 100;
    if (roll < 0.6 && golds.length > 0) return golds[Math.floor(Math.random() * golds.length)];
    if (roll < 2.2 && coverts.length > 0) return coverts[Math.floor(Math.random() * coverts.length)];
    if (roll < 8.5 && classifieds.length > 0) return classifieds[Math.floor(Math.random() * classifieds.length)];
    if (roll < 26.0 && restricteds.length > 0) return restricteds[Math.floor(Math.random() * restricteds.length)];
    if (milspecs.length > 0) return milspecs[Math.floor(Math.random() * milspecs.length)];
    return caseSkins[Math.floor(Math.random() * caseSkins.length)];
  };

  useEffect(() => {
    const initial: SkinEntity[] = [];
    for (let i = 0; i < REEL_SIZE; i++) {
      initial.push(caseSkins[i % caseSkins.length]);
    }
    setReelItems(initial);
  }, [caseSkins]);

  const startSpin = async () => {
    if (isSpinning) return;
    if (balance < casePriceDc) {
      useGameStore.getState().setRefillOpen(true);
      return;
    }

    const deducted = deductBalance(casePriceDc);
    if (!deducted) return;

    sound.playClick();
    setIsSpinning(true);
    setShowModal(false);

    const winner = pickWeightedSkin();
    setWinningSkin(winner);

    const newReel: SkinEntity[] = [];
    for (let i = 0; i < REEL_SIZE; i++) {
      if (i === WIN_INDEX) {
        newReel.push(winner);
      } else {
        newReel.push(caseSkins[Math.floor(Math.random() * caseSkins.length)]);
      }
    }
    setReelItems(newReel);

    if (fastOpen) {
      setTimeout(() => {
        sound.playWin(winner.rarity);
        setIsSpinning(false);
        setShowModal(true);
      }, 350);
      return;
    }

    const containerWidth = containerRef.current?.offsetWidth || 800;
    const centerOffset = containerWidth / 2;
    const jitter = (Math.random() - 0.5) * (ITEM_WIDTH * 0.7);
    const targetX = -(WIN_INDEX * (ITEM_WIDTH + ITEM_GAP) + ITEM_WIDTH / 2 - centerOffset + jitter);

    await controls.set({ x: 0 });

    const duration = 6.0;
    const startTime = Date.now();
    lastSoundTickPos.current = 0;

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
      if (itemsPassed > lastSoundTickPos.current) {
        sound.playTick(0.8 + (1 - progress) * 0.4);
        lastSoundTickPos.current = itemsPassed;
      }
    }, 30);

    await controls.start({
      x: targetX,
      transition: {
        duration: duration,
        ease: [0.12, 0.8, 0.15, 1],
      },
    });

    clearInterval(tickInterval);
    sound.playWin(winner.rarity);
    setIsSpinning(false);
    setShowModal(true);
  };

  const handleKeep = () => {
    if (!winningSkin) return;
    addToInventory([winningSkin]);
    addLiveDrop({
      id: `user_${Date.now()}`,
      user: 'Вы',
      avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      skin: winningSkin,
      caseName: caseName,
      timestamp: Date.now(),
    });
    setShowModal(false);
  };

  const handleSell = () => {
    if (!winningSkin) return;
    addBalance(winningSkin.priceDc);
    sound.playCashout();
    setShowModal(false);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-5xl rounded-3xl p-3 glass-panel border border-white/10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col justify-between items-center py-1">
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-yellow-400 filter drop-shadow-[0_0_10px_#facc15]" />
          <div className="w-[2px] h-full bg-yellow-400 opacity-90 shadow-[0_0_12px_#facc15]" />
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-yellow-400 filter drop-shadow-[0_0_10px_#facc15]" />
        </div>

        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#08080a] to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#08080a] to-transparent z-20 pointer-events-none" />

        <div ref={containerRef} className="relative w-full overflow-hidden py-3">
          <motion.div
            animate={controls}
            className="flex gap-3 will-change-transform"
            style={{ width: `${reelItems.length * (ITEM_WIDTH + ITEM_GAP)}px` }}
          >
            {reelItems.map((skin, idx) => {
              const config = RARITY_CONFIG[skin.rarity] || RARITY_CONFIG.milspec;
              return (
                <div
                  key={`${skin.id}_${idx}`}
                  className="relative rounded-2xl glass-card shrink-0 flex flex-col items-center justify-between p-3 select-none overflow-hidden"
                  style={{
                    width: `${ITEM_WIDTH}px`,
                    height: '210px',
                    borderBottomWidth: '4px',
                    borderBottomColor: config.color,
                  }}
                >
                  <div className="w-full flex justify-between items-center z-10">
                    <span className="text-[10px] text-white/40 font-medium">{skin.wear}</span>
                    <span 
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                      style={{ color: config.color, backgroundColor: config.bg }}
                    >
                      {config.label}
                    </span>
                  </div>

                  <div className="relative w-28 h-28 my-auto flex items-center justify-center z-10">
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

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-full max-w-md">
        <label className="flex items-center gap-2 text-xs font-bold text-white/60 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={fastOpen}
            onChange={(e) => setFastOpen(e.target.checked)}
            disabled={isSpinning}
            className="w-4 h-4 rounded bg-white/10 border-white/20 text-yellow-400 focus:ring-yellow-400 cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" /> Быстрое открытие
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
          <span>{isSpinning ? 'Открываем...' : `Открыть кейс за ${casePriceDc.toLocaleString('ru-RU')} DC`}</span>
        </button>
      </div>

      {showModal && (
        <DropModal
          skin={winningSkin}
          onKeep={handleKeep}
          onSell={handleSell}
        />
      )}
    </div>
  );
};
