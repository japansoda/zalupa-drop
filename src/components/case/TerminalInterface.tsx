'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  RotateCcw, 
  AlertTriangle,
  Award,
  Zap,
  Clover
} from 'lucide-react';
import { SkinEntity, SkinWear } from '../../lib/types';
import { RARITY_CONFIG } from '../../data/skins';
import { useGameStore } from '../../store/useGameStore';
import { useLanguage } from '../../lib/i18n';
import { sound } from '../../lib/sound';
import { DropCoinIcon } from '../ui/DropCoinIcon';

interface TerminalInterfaceProps {
  terminalId: string;
  terminalName: string;
  terminalPriceDc: number;
  terminalSkins: SkinEntity[];
}

const WEARS: SkinWear[] = ['FN', 'MW', 'FT', 'WW', 'BS'];
const WEAR_LABELS: Record<SkinWear, { ru: string; en: string }> = {
  FN: { ru: 'Прямо с завода', en: 'Factory New' },
  MW: { ru: 'Немного поношенное', en: 'Minimal Wear' },
  FT: { ru: 'После полевых испытаний', en: 'Field-Tested' },
  WW: { ru: 'Поношенное', en: 'Well-Worn' },
  BS: { ru: 'Закалённое в боях', en: 'Battle-Scarred' },
};

export const TerminalInterface: React.FC<TerminalInterfaceProps> = ({
  terminalId,
  terminalName,
  terminalPriceDc,
  terminalSkins,
}) => {
  const { 
    balance, 
    deductBalance, 
    addToInventory, 
    addLiveDrop,
    activePotionCharges,
    consumePotionCharge,
    potionsCount,
    drinkPotion
  } = useGameStore();
  const { locale } = useLanguage();
  const isRu = locale === 'ru';

  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [currentOfferIdx, setCurrentOfferIdx] = useState<number>(0);
  const [sessionOffers, setSessionOffers] = useState<SkinEntity[]>([]);
  const [declinedCount, setDeclinedCount] = useState<number>(0);
  const [acceptedSkin, setAcceptedSkin] = useState<SkinEntity | null>(null);
  const [isTerminated, setIsTerminated] = useState<boolean>(false);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [sessionHasLuck, setSessionHasLuck] = useState<boolean>(false);

  // Generate 5 offers for this terminal unseal session
  const generateOffers = (hasLuck = false): SkinEntity[] => {
    const list: SkinEntity[] = [];
    const pool = terminalSkins.length > 0 ? terminalSkins : [];

    for (let i = 0; i < 5; i++) {
      let candidate: SkinEntity;
      // Normal: 4% Gold/Glove, 10% Covert, 26% Classified, 36% Restricted, 24% Mil-Spec
      // With Luck Potion: 9.5% Gold/Glove, 22% Covert, 34% Classified, 24.5% Restricted, 10% Mil-Spec
      const roll = Math.random() * 100;
      const golds = pool.filter((s) => s.rarity === 'gold' || s.rarity === 'extraordinary' || (s.weapon || '').toLowerCase().includes('glove'));
      const coverts = pool.filter((s) => s.rarity === 'covert');
      const classifieds = pool.filter((s) => s.rarity === 'classified');
      const restricteds = pool.filter((s) => s.rarity === 'restricted');

      const goldThreshold = hasLuck ? 9.5 : 4;
      const covertThreshold = hasLuck ? (goldThreshold + 22) : 14;
      const classifiedThreshold = hasLuck ? (covertThreshold + 34) : 40;
      const restrictedThreshold = hasLuck ? (classifiedThreshold + 24.5) : 76;

      if (roll < goldThreshold && golds.length > 0) {
        candidate = golds[Math.floor(Math.random() * golds.length)];
      } else if (roll < covertThreshold && coverts.length > 0) {
        candidate = coverts[Math.floor(Math.random() * coverts.length)];
      } else if (roll < classifiedThreshold && classifieds.length > 0) {
        candidate = classifieds[Math.floor(Math.random() * classifieds.length)];
      } else if (roll < restrictedThreshold && restricteds.length > 0) {
        candidate = restricteds[Math.floor(Math.random() * restricteds.length)];
      } else {
        candidate = pool[Math.floor(Math.random() * pool.length)];
      }

      // Roll authentic wear & StatTrak (boosted StatTrak with luck)
      const wear = WEARS[Math.floor(Math.random() * WEARS.length)];
      const stChance = hasLuck ? 0.28 : 0.12;
      const isSt = Math.random() < stChance && !candidate.name.startsWith('★');
      const instanceSkin: SkinEntity = {
        ...candidate,
        id: `term_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
        wear,
        wearLabel: isRu ? WEAR_LABELS[wear].ru : WEAR_LABELS[wear].en,
        statTrak: isSt,
      };

      list.push(instanceSkin);
    }
    return list;
  };

  const handleUnsealTerminal = () => {
    if (balance < terminalPriceDc) {
      useGameStore.getState().setRefillOpen(true);
      return;
    }

    const deducted = deductBalance(terminalPriceDc);
    if (!deducted) return;

    let hasLuck = false;
    if (activePotionCharges > 0) {
      consumePotionCharge();
      hasLuck = true;
      setSessionHasLuck(true);
      sound.playAngelicChime();
    } else {
      setSessionHasLuck(false);
      sound.playClick();
    }

    const offers = generateOffers(hasLuck);
    setSessionOffers(offers);
    setCurrentOfferIdx(0);
    setDeclinedCount(0);
    setAcceptedSkin(null);
    setIsTerminated(false);
    setIsGlitching(false);
    setSessionActive(true);
  };

  const currentSkin = sessionOffers[currentOfferIdx] || null;
  const config = currentSkin ? RARITY_CONFIG[currentSkin.rarity] || RARITY_CONFIG.milspec : RARITY_CONFIG.milspec;

  const handleAcceptDeal = () => {
    if (!currentSkin) return;

    sound.playWin(currentSkin.rarity);
    addToInventory([currentSkin]);
    setAcceptedSkin(currentSkin);
    setSessionActive(false);

    // Broadcast if valuable
    if (currentSkin.priceDc >= 25000) {
      addLiveDrop({
        id: `real_term_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user: isRu ? 'Вы' : 'YOU',
        avatar: '',
        skin: currentSkin,
        caseName: terminalName,
        timestamp: Date.now(),
      });
    }
  };

  const handleDeclineDeal = () => {
    sound.playError();
    setIsGlitching(true);

    setTimeout(() => {
      setIsGlitching(false);
      const nextIdx = currentOfferIdx + 1;
      setDeclinedCount((prev) => prev + 1);

      if (nextIdx >= sessionOffers.length) {
        // All offers declined -> container destroyed
        setIsTerminated(true);
        setSessionActive(false);
      } else {
        setCurrentOfferIdx(nextIdx);
      }
    }, 350);
  };

  return (
    <div className="w-full rounded-3xl bg-[#070b09] border-2 border-emerald-500/40 p-4 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden font-mono">
      {/* Retro CRT Scanlines & Ambient Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

      {/* Luck Potion Floating Clovers & Radiant Aura Background */}
      {sessionHasLuck && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.18)_0%,rgba(6,95,70,0.1)_60%,transparent_100%)]" />
          {[
            { top: '12%', left: '7%', size: 36, delay: '0s', dur: '4s', opacity: 0.4 },
            { top: '42%', left: '12%', size: 48, delay: '1s', dur: '5.2s', opacity: 0.5 },
            { top: '72%', left: '8%', size: 30, delay: '2s', dur: '4.5s', opacity: 0.35 },
            { top: '15%', right: '10%', size: 40, delay: '0.5s', dur: '4.8s', opacity: 0.45 },
            { top: '48%', right: '14%', size: 52, delay: '1.8s', dur: '5.5s', opacity: 0.55 },
            { top: '78%', right: '7%', size: 34, delay: '2.5s', dur: '4.2s', opacity: 0.35 },
            { top: '8%', left: '46%', size: 28, delay: '1.2s', dur: '3.9s', opacity: 0.3 },
            { top: '82%', left: '50%', size: 38, delay: '0.8s', dur: '4.6s', opacity: 0.4 },
          ].map((p, idx) => (
            <div
              key={idx}
              className="absolute animate-pulse pointer-events-none transition-transform"
              style={{
                top: p.top,
                left: p.left,
                right: p.right,
                opacity: p.opacity,
                animationDuration: p.dur,
                animationDelay: p.delay,
                filter: 'drop-shadow(0 0 16px rgba(16,185,129,0.85))'
              }}
            >
              <Clover 
                style={{ width: p.size, height: p.size }} 
                className="text-emerald-400 fill-emerald-400/40" 
              />
            </div>
          ))}
        </div>
      )}

      {/* Terminal Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-emerald-500/30 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Terminal className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-emerald-400/80 tracking-widest">
                CS2 UPLINK PROTOCOL v2.6
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
              {terminalName}
            </h2>
          </div>
        </div>

        {/* Status / Negotiation Slots Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          {sessionHasLuck && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 text-xs font-black shadow-[0_0_18px_rgba(16,185,129,0.45)] animate-pulse">
              <Clover className="w-4 h-4 text-emerald-400 fill-emerald-400/40 animate-spin" style={{ animationDuration: '10s' }} />
              <span>{isRu ? 'ЗЕЛЬЕ УДАЧИ АКТИВНО (+35% К РЕДКОСТИ)' : 'LUCK POTION ACTIVE (+35% ODDS)'}</span>
            </div>
          )}

          {sessionActive ? (
            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400/70 font-bold uppercase mr-1">
                {isRu ? 'Предложение:' : 'Offer:'}
              </span>
              {[0, 1, 2, 3, 4].map((idx) => {
                const isPassed = idx < currentOfferIdx;
                const isCurrent = idx === currentOfferIdx;
                return (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black transition-all ${
                      isCurrent
                        ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.8)] scale-110'
                        : isPassed
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 line-through'
                        : 'bg-white/5 text-white/30 border border-white/10'
                    }`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>{isRu ? 'Сеть подключена' : 'Online Uplink'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Terminal Viewport */}
      <div className="relative z-10 py-6 sm:py-8 flex flex-col items-center justify-center min-h-[380px]">
        {/* CASE 1: IDLE / SEALED */}
        {!sessionActive && !acceptedSkin && !isTerminated && (
          <div className="flex flex-col items-center text-center max-w-md">
            <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border-2 border-dashed border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-5 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Terminal className="w-12 h-12" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-2">
              {isRu ? 'Терминал запечатан' : 'Terminal Sealed'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-300/70 mb-6 leading-relaxed">
              {isRu
                ? 'Распечатайте терминал, чтобы связаться с оружейным дилером. Вам будет предложено до 5 последовательных сделок — примите лучшее предложение или отклоните!'
                : 'Unseal the terminal to initiate contact with the arms dealer. You will receive up to 5 sequential offers — accept the best deal or decline!'}
            </p>

            {/* Luck Potion status & drink shortcut */}
            {activePotionCharges > 0 ? (
              <div className="mb-4 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
                <Clover className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
                <span>
                  {isRu 
                    ? `Зелье удачи активно (${activePotionCharges} зар.) — усилит офферы терминала!`
                    : `Luck Potion active (${activePotionCharges} ch.) — boosts terminal offers!`}
                </span>
              </div>
            ) : potionsCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  drinkPotion();
                  sound.playAngelicChime();
                }}
                className="mb-4 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Clover className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
                <span>
                  {isRu
                    ? `Выпить Зелье удачи (+35% к редкости, в запасе: ${potionsCount})`
                    : `Drink Luck Potion (+35% rarity, in stock: ${potionsCount})`}
                </span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleUnsealTerminal}
              className="px-8 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-black" />
              <span>{isRu ? 'Распечатать терминал' : 'Unseal Terminal'}</span>
              <span className="bg-black/20 px-2 py-0.5 rounded text-xs">
                {terminalPriceDc.toLocaleString('ru-RU')} DC
              </span>
            </button>
          </div>
        )}

        {/* CASE 2: ACTIVE NEGOTIATION OFFER */}
        {sessionActive && currentSkin && (
          <div className={`w-full max-w-xl flex flex-col items-center text-center transition-opacity duration-200 ${isGlitching ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                {isRu ? `Предложение #${currentOfferIdx + 1} из 5` : `Offer #${currentOfferIdx + 1} of 5`}
              </span>
              <span className="text-[11px] font-bold text-white/50">
                {isRu ? 'Режим: Deal or No Deal' : 'Mode: Deal or No Deal'}
              </span>
            </div>

            {/* Skin Display Card */}
            <div
              className="w-full rounded-2xl p-6 bg-black/60 border flex flex-col items-center relative overflow-hidden shadow-2xl my-3"
              style={{ borderColor: `${config.color}60` }}
            >
              {/* Rarity Glow */}
              <div
                className="absolute inset-0 blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: config.color }}
              />

              {/* Watermark Clover if luck potion was active */}
              {sessionHasLuck && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <Clover className="w-64 h-64 text-emerald-400/10 fill-emerald-400/5 animate-pulse" />
                </div>
              )}

              {/* Weapon image */}
              <div className="relative z-10 w-48 h-36 sm:w-56 sm:h-40 flex items-center justify-center mb-4">
                <img
                  src={currentSkin.image}
                  alt={currentSkin.name}
                  className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform"
                />
              </div>

              {/* Weapon details */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold" style={{ color: config.color }}>
                  {currentSkin.weapon}
                </span>
                <span className="text-sm font-black text-white">
                  {currentSkin.skinName}
                </span>
              </div>

              {/* Badges: Wear & StatTrak & Original Owner */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                {currentSkin.statTrak && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-black">
                    StatTrak™
                  </span>
                )}
                {currentSkin.wearLabel && (
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10 text-[10px] font-bold">
                    {currentSkin.wearLabel}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-400" />
                  {isRu ? 'Первый владелец' : 'Original Owner'}
                </span>
              </div>

              {/* Value */}
              <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-xs text-white/50">{isRu ? 'Рыночная цена:' : 'Market Value:'}</span>
                <div className="flex items-center gap-1">
                  <DropCoinIcon size={16} />
                  <span className="font-mono font-black text-base text-yellow-400">
                    {currentSkin.priceDc.toLocaleString('ru-RU')} DC
                  </span>
                </div>
              </div>
            </div>

            {/* Tactical Decision Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-4">
              {/* Accept Button */}
              <button
                type="button"
                onClick={handleAcceptDeal}
                className="w-full sm:flex-1 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>{isRu ? 'Принять предложение' : 'Accept Deal'}</span>
              </button>

              {/* Decline Button */}
              <button
                type="button"
                onClick={handleDeclineDeal}
                className="w-full sm:flex-1 py-4 rounded-2xl bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/40 font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {currentOfferIdx === 4
                    ? (isRu ? 'Отклонить (Сжечь)' : 'Decline (Destroy)')
                    : (isRu ? 'Отклонить и следующее' : 'Decline & Next')}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <p className="text-[11px] text-white/40 mt-3">
              {isRu
                ? 'Внимание: Отклонив сделку, вы безвозвратно теряете этот скин и переходите к следующему.'
                : 'Caution: Declining permanently burns this offer to unveil the next one.'}
            </p>
          </div>
        )}

        {/* CASE 3: DEAL ACCEPTED */}
        {acceptedSkin && (
          <div className="flex flex-col items-center text-center max-w-md animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-emerald-400 uppercase tracking-tight mb-1">
              {isRu ? 'Сделка заключена!' : 'Deal Completed!'}
            </h3>
            <span className="text-xs text-white/60 mb-4">
              {isRu ? 'Предмет успешно зачислен в ваш инвентарь' : 'Item has been added to your inventory'}
            </span>

            <div className="w-full p-4 rounded-2xl bg-black/60 border border-emerald-500/40 flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-xl bg-black/40 p-1 shrink-0">
                <img src={acceptedSkin.image} alt={acceptedSkin.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="text-xs font-bold text-emerald-400">{acceptedSkin.weapon}</span>
                <span className="text-sm font-black text-white truncate">{acceptedSkin.skinName}</span>
                <span className="text-[11px] font-mono text-yellow-400 font-bold">
                  {acceptedSkin.priceDc.toLocaleString('ru-RU')} DC
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUnsealTerminal}
              className="px-6 py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isRu ? 'Открыть ещё один терминал' : 'Open Another Terminal'}</span>
            </button>
          </div>
        )}

        {/* CASE 4: ALL OFFERS DECLINED (CONTAINER DESTROYED) */}
        {isTerminated && (
          <div className="flex flex-col items-center text-center max-w-md animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-2xl bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-red-400 uppercase tracking-tight mb-2">
              {isRu ? 'Терминал уничтожен' : 'Terminal Destroyed'}
            </h3>
            <p className="text-xs text-white/60 mb-6 leading-relaxed">
              {isRu
                ? 'Вы отклонили все 5 предложений оружейного дилера. Связь с терминалом разорвана, а контейнер деактивирован.'
                : 'You declined all 5 offers from the arms dealer. Connection has been terminated and the container is expired.'}
            </p>

            <button
              type="button"
              onClick={handleUnsealTerminal}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>{isRu ? 'Попробовать снова' : 'Try Again'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
