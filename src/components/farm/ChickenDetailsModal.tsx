'use client';

import React, { useState } from 'react';
import { X, Sparkles, Trophy, Egg, Coins, Flame, AlertCircle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { useLanguage } from '../../lib/i18n';
import { sound } from '../../lib/sound';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { AnimatedChicken } from './AnimatedChicken';
import {
  CHICKEN_BREEDS,
  calculateChickenSellPrice,
  getBreedDropTierStats,
} from '../../lib/farm';

interface ChickenDetailsModalProps {
  isOpen: boolean;
  slotIndex: number;
  onClose: () => void;
}

export const ChickenDetailsModal: React.FC<ChickenDetailsModalProps> = ({
  isOpen,
  slotIndex,
  onClose,
}) => {
  const { farmSlots, sellChicken } = useGameStore();
  const { locale } = useLanguage();
  const [isConfirmingSell, setIsConfirmingSell] = useState(false);

  if (!isOpen) return null;

  const slot = farmSlots[slotIndex];
  if (!slot || !slot.chicken) return null;

  const chicken = slot.chicken;
  const breed = CHICKEN_BREEDS[chicken.breedId] || CHICKEN_BREEDS.white_inferno;
  const sellPrice = calculateChickenSellPrice(
    chicken.breedId,
    chicken.isStatTrak,
    chicken.eggsLaidCount
  );
  const tierStats = getBreedDropTierStats(chicken.breedId, locale, Boolean(chicken.isStatTrak));

  const handleSell = () => {
    sound.playCashout();
    sellChicken(slotIndex);
    setIsConfirmingSell(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#0d0e14] border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center text-center p-6 sm:p-8"
        style={{
          boxShadow: `0 0 40px ${breed.color}25`,
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Breed Rarity Pill */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 border"
          style={{
            borderColor: `${breed.color}40`,
            backgroundColor: `${breed.color}15`,
            color: breed.color,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{locale === 'ru' ? breed.rarityName : breed.rarityNameEn}</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2 flex-wrap">
          {chicken.isStatTrak && (
            <span className="text-amber-400 font-mono text-sm px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
              StatTrak™
            </span>
          )}
          <span>{locale === 'ru' ? breed.name : breed.nameEn}</span>
        </h2>

        {/* Animated Chicken Preview */}
        <div className="relative my-4 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full blur-2xl pointer-events-none opacity-40"
            style={{ backgroundColor: breed.color }}
          />
          <AnimatedChicken
            breedId={chicken.breedId}
            isHungry={slot.feedStatus === 'hungry'}
            isEating={false}
            isLaying={slot.feedStatus === 'producing' || slot.status === 'egg_ready'}
            isStatTrak={chicken.isStatTrak}
            eggsLaidCount={chicken.eggsLaidCount}
            size={160}
          />
        </div>

        {/* Lore Description */}
        <p className="text-xs sm:text-sm text-white/60 max-w-md mb-5 leading-relaxed">
          {locale === 'ru' ? breed.description : breed.descriptionEn}
        </p>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full mb-6">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-start text-left">
            <div className="flex items-center gap-1.5 text-white/40 text-[11px] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{locale === 'ru' ? 'Модификатор' : 'Modifier'}</span>
            </div>
            {chicken.isStatTrak ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-black text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  ST™
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {locale === 'ru' ? '+20% к удаче' : '+20% Luck'}
                </span>
              </div>
            ) : (
              <span className="font-mono font-bold text-sm text-white/70 mt-0.5">
                {locale === 'ru' ? 'Обычная' : 'Standard'}
              </span>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-start text-left">
            <div className="flex items-center gap-1.5 text-white/40 text-[11px] mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{locale === 'ru' ? 'Шанс на ножи' : 'Knife/Glove Odds'}</span>
            </div>
            <span className="font-mono font-black text-lg text-amber-400">
              {tierStats.knivesGloves}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-start text-left">
            <div className="flex items-center gap-1.5 text-white/40 text-[11px] mb-1">
              <Flame className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>{locale === 'ru' ? 'Тайные скины' : 'Covert Odds'}</span>
            </div>
            <span className="font-mono font-black text-lg text-fuchsia-400">
              {tierStats.covert}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-start text-left">
            <div className="flex items-center gap-1.5 text-white/40 text-[11px] mb-1">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>{locale === 'ru' ? 'Стоимость' : 'Market Value'}</span>
            </div>
            <span className="font-mono font-black text-base text-yellow-400 truncate">
              {sellPrice.toLocaleString('ru-RU')} DC
            </span>
          </div>
        </div>

        {/* Sell Section */}
        {!isConfirmingSell ? (
          <div className="w-full flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/10 cursor-pointer"
            >
              {locale === 'ru' ? 'Закрыть' : 'Close'}
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmingSell(true)}
              className="flex-1 py-3 px-4 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-black text-xs uppercase tracking-wider transition-all border border-red-500/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <DropCoinIcon className="w-4 h-4" />
              <span>
                {locale === 'ru'
                  ? `Продать (+${sellPrice.toLocaleString('ru-RU')} DC)`
                  : `Sell (+${sellPrice.toLocaleString('ru-RU')} DC)`}
              </span>
            </button>
          </div>
        ) : (
          <div className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col items-center">
            <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase mb-1">
              <AlertCircle className="w-4 h-4" />
              <span>{locale === 'ru' ? 'Подтвердите продажу' : 'Confirm Sale'}</span>
            </div>
            <p className="text-xs text-white/60 mb-3">
              {locale === 'ru'
                ? `Вы точно хотите продать эту курочку за ${sellPrice.toLocaleString('ru-RU')} DC? Насест освободится.`
                : `Are you sure you want to sell this chicken for ${sellPrice.toLocaleString('ru-RU')} DC? Slot will be freed.`}
            </p>
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsConfirmingSell(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer"
              >
                {locale === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSell}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              >
                {locale === 'ru' ? 'Да, продать' : 'Yes, sell'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
