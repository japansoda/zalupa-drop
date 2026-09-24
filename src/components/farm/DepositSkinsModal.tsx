'use client';

import React, { useState, useMemo } from 'react';
import { X, Check, Egg, AlertCircle, Sparkles, Wand2 } from 'lucide-react';
import { InventoryItem } from '../../lib/types';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { SkinImage } from '../ui/SkinImage';
import { WearBadge } from '../ui/WearBadge';
import { StatTrakBadge } from '../ui/StatTrakBadge';
import { RarityBadge } from '../ui/RarityBadge';
import { isStatTrakableItem } from '../../lib/steam';

interface DepositSkinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlotIndex?: number;
}

export const DepositSkinsModal: React.FC<DepositSkinsModalProps> = ({
  isOpen,
  onClose,
  targetSlotIndex,
}) => {
  const { inventory, depositSkinsForEgg } = useGameStore();
  const { locale } = useLanguage();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Only skins with price >= 1000 DC are eligible
  const eligibleSkins = useMemo(() => {
    return inventory.filter((item) => item.priceDc >= 1000);
  }, [inventory]);

  const toggleSelect = (instanceId: string) => {
    sound.playClick();
    setSelectedIds((prev) => {
      if (prev.includes(instanceId)) {
        return prev.filter((id) => id !== instanceId);
      }
      if (prev.length >= 10) return prev;
      return [...prev, instanceId];
    });
  };

  const handleAutoSelectCheapest = () => {
    sound.playClick();
    const sorted = [...eligibleSkins].sort((a, b) => a.priceDc - b.priceDc);
    const top10 = sorted.slice(0, 10).map((i) => i.instanceId);
    setSelectedIds(top10);
  };

  const handleDeposit = () => {
    if (selectedIds.length !== 10) return;
    const success = depositSkinsForEgg(selectedIds, targetSlotIndex);
    if (success) {
      setSelectedIds([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  const totalValue = eligibleSkins
    .filter((s) => selectedIds.includes(s.instanceId))
    .reduce((sum, s) => sum + s.priceDc, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0d0e14] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
              <Egg className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                {locale === 'ru' ? 'Получить яйцо курицы' : 'Acquire Chicken Egg'}
              </h2>
              <p className="text-xs text-white/50">
                {locale === 'ru'
                  ? 'Пожертвуйте 10 скинов от 1 000 DC каждый для инкубации'
                  : 'Sacrifice 10 skins of at least 1 000 DC each for incubation'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action / Progress Bar */}
        <div className="px-4 sm:px-6 py-3 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/70">
              {locale === 'ru' ? 'Выбрано:' : 'Selected:'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-mono text-xs font-black ${
                selectedIds.length === 10
                  ? 'bg-emerald-500 text-black'
                  : 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
              }`}
            >
              {selectedIds.length} / 10
            </span>
            {selectedIds.length > 0 && (
              <span className="text-xs font-mono text-white/40 ml-2">
                (~{totalValue.toLocaleString('ru-RU')} DC)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAutoSelectCheapest}
            disabled={eligibleSkins.length < 10}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-yellow-400 border border-white/10 transition-all cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{locale === 'ru' ? 'Выбрать 10 самых дешёвых' : 'Auto-select 10 cheapest'}</span>
          </button>
        </div>

        {/* Skin Selection Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 [scrollbar-width:thin] [scrollbar-color:rgba(250,204,21,0.35)_transparent]">
          {eligibleSkins.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-10 h-10 text-amber-400/60 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">
                {locale === 'ru' ? 'Нет подходящих скинов' : 'No eligible skins found'}
              </h4>
              <p className="text-xs text-white/40 max-w-sm mx-auto">
                {locale === 'ru'
                  ? 'В вашем инвентаре нет скинов стоимостью от 1 000 DC. Вы можете выиграть их в кейсах или купить в Маркетплейсе!'
                  : 'You have no skins worth at least 1 000 DC. You can win them in cases or buy in the Marketplace!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {eligibleSkins.map((item) => {
                const isSelected = selectedIds.includes(item.instanceId);

                return (
                  <button
                    key={item.instanceId}
                    type="button"
                    onClick={() => toggleSelect(item.instanceId)}
                    className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.25)] scale-[1.02]'
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="w-full flex items-center justify-between z-10 min-h-[18px] mb-1">
                      <div className="flex items-center gap-1">
                        {item.statTrak && isStatTrakableItem(item) && <StatTrakBadge size="xs" />}
                        <WearBadge skin={item} size="xs" />
                      </div>
                    </div>

                    <div className="w-full h-18 flex items-center justify-center my-1">
                      <SkinImage
                        src={item.image}
                        alt={item.name}
                        size={100}
                        className="w-full h-16 object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
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
              })}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-[#08080a] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white/70 hover:text-white cursor-pointer transition-colors"
          >
            {locale === 'ru' ? 'Отмена' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleDeposit}
            disabled={selectedIds.length !== 10}
            className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all ${
              selectedIds.length === 10
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.35)] cursor-pointer active:scale-95'
                : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
            }`}
          >
            <Egg className="w-4 h-4" />
            <span>
              {locale === 'ru'
                ? `Пожертвовать 10 скинов в инкубатор (${selectedIds.length}/10)`
                : `Sacrifice 10 Skins to Incubator (${selectedIds.length}/10)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
