'use client';

import React, { useState, useMemo, useCallback, useDeferredValue } from 'react';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { LiveDropBar } from '../../components/layout/LiveDropBar';
import { RefillModal } from '../../components/layout/RefillModal';
import { ZalupaCoinIcon } from '../../components/ui/ZalupaCoinIcon';
import { SkinImage } from '../../components/ui/SkinImage';
import { WearBadge } from '../../components/ui/WearBadge';
import { StatTrakBadge } from '../../components/ui/StatTrakBadge';
import { RarityBadge } from '../../components/ui/RarityBadge';
import { SKINS_DATABASE, RARITY_CONFIG, WEAR_CONFIG } from '../../data/skins';
import { SkinEntity, SkinRarity, SkinWear, LivePricesMap } from '../../lib/types';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';
import { isStatTrakableItem, isWearableItem, isVanillaKnife, getValidWearList } from '../../lib/steam';
import { isActualWeaponOrKnifeGlove } from '../../lib/farm';
import { getCanonicalPrice } from '../../lib/marketPricing';
import { formatZc } from '../../lib/formatZc';
import {
  Search,
  ShoppingBag,
  Store,
  Check,
  Sword,
  Hand,
  Crosshair,
  LayoutGrid,
  Zap,
  Shield,
  Layers,
  X,
  Sparkles,
  Anchor,
  Sticker,
  User,
} from 'lucide-react';

const ITEM_CATEGORIES = [
  { id: 'all', labelRu: 'Все товары', labelEn: 'All Items', icon: LayoutGrid },
  { id: 'knives', labelRu: 'Ножи', labelEn: 'Knives', icon: Sword },
  { id: 'gloves', labelRu: 'Перчатки', labelEn: 'Gloves', icon: Hand },
  { id: 'snipers', labelRu: 'Снайперки', labelEn: 'Snipers', icon: Crosshair },
  { id: 'rifles', labelRu: 'Винтовки', labelEn: 'Rifles', icon: Crosshair },
  { id: 'pistols', labelRu: 'Пистолеты', labelEn: 'Pistols', icon: Zap },
  { id: 'smgs', labelRu: 'ПП', labelEn: 'SMGs', icon: Layers },
  { id: 'heavy', labelRu: 'Дробовики & Пулеметы', labelEn: 'Heavy & Shotguns', icon: Shield },
  { id: 'charms', labelRu: 'Брелоки', labelEn: 'Charms', icon: Anchor },
  { id: 'stickers', labelRu: 'Стикеры', labelEn: 'Stickers', icon: Sticker },
  { id: 'agents', labelRu: 'Агенты', labelEn: 'Agents', icon: User },
];

const SNIPER_MODELS = ['awp', 'ssg 08', 'scar-20', 'g3sg1'];
const RIFLE_MODELS = ['ak-47', 'm4a4', 'm4a1-s', 'galil ar', 'famas', 'aug', 'sg 553'];
const PISTOL_MODELS = ['desert eagle', 'usp-s', 'glock-18', 'five-seven', 'p250', 'tec-9', 'dual berettas', 'cz75-auto', 'r8 revolver'];
const SMG_MODELS = ['mp9', 'mac-10', 'mp7', 'mp5-sd', 'ump-45', 'p90', 'pp-bizon'];
const HEAVY_MODELS = ['nova', 'xm1014', 'mag-7', 'sawed-off', 'm249', 'negev'];

const WEAR_ORDER: SkinWear[] = ['FN', 'MW', 'FT', 'WW', 'BS'];
const WEAR_LABELS: Record<SkinWear, { ru: string; en: string }> = {
  FN: { ru: 'Прямо с завода', en: 'Factory New' },
  MW: { ru: 'Немного поношенное', en: 'Minimal Wear' },
  FT: { ru: 'После полевых испытаний', en: 'Field-Tested' },
  WW: { ru: 'Поношенное', en: 'Well-Worn' },
  BS: { ru: 'Закалённое в боях', en: 'Battle-Scarred' },
};

export interface GroupedMarketSkin {
  groupKey: string;
  weapon: string;
  skinName: string;
  rarity: SkinRarity;
  image: string;
  minPriceDc: number;
  maxPriceDc: number;
  hasStatTrak: boolean;
  hasNonStatTrak: boolean;
  variants: SkinEntity[];
}

// Grouped Skin Card Component: only weapon, rarity, and price range!
const MarketGroupCard = React.memo<{
  group: GroupedMarketSkin;
  canAffordAny: boolean;
  onSelect: (group: GroupedMarketSkin) => void;
  locale: string;
}>(({ group, canAffordAny, onSelect, locale }) => {
  const rarityCfg = RARITY_CONFIG[group.rarity] || RARITY_CONFIG.milspec;

  return (
    <div
      className="relative rounded-3xl p-3 flex flex-col justify-between border bg-[#0d0e14] transition-[border-color,transform] duration-150 hover:-translate-y-1 hover:shadow-xl group"
      style={{
        borderColor: rarityCfg.border,
        contentVisibility: 'auto',
        containIntrinsicSize: '270px',
        contain: 'content',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      {/* Top Rarity Badge */}
      <div className="w-full flex items-center justify-between z-10 min-h-[22px] mb-1">
        <RarityBadge rarity={group.rarity} size="xs" short />
      </div>

      {/* Skin Image */}
      <div className="w-full h-28 sm:h-32 flex items-center justify-center my-2 relative">
        <div
          className="absolute w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ background: rarityCfg.color }}
        />
        <SkinImage
          src={group.image}
          alt={group.skinName}
          size={150}
          className="w-full h-24 sm:h-28 object-contain group-hover:scale-105 transition-transform duration-150 relative z-10"
        />
      </div>

      {/* Info & Buy Button */}
      <div className="w-full flex flex-col pt-2 border-t border-white/5">
        <span className="text-xs font-black text-white truncate" title={group.skinName}>
          {group.skinName}
        </span>
        <span className="text-[10px] text-white/40 truncate">{group.weapon}</span>

        {/* Price Range */}
        <div className="flex items-center gap-1.5 mt-1.5 mb-2">
          <ZalupaCoinIcon className="w-3.5 h-3.5" />
          <span className="font-mono font-black text-xs text-yellow-400 truncate">
            {group.minPriceDc === group.maxPriceDc
              ? formatZc(group.minPriceDc)
              : `${formatZc(group.minPriceDc)} – ${formatZc(group.maxPriceDc)}`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelect(group)}
          className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            canAffordAny
              ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_15px_rgba(250,204,21,0.25)] active:scale-95'
              : 'bg-white/5 hover:bg-white/10 text-white/40 border border-white/5'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{locale === 'ru' ? 'Купить' : 'Buy'}</span>
        </button>
      </div>
    </div>
  );
});
MarketGroupCard.displayName = 'MarketGroupCard';

// Purchase Modal: select quality (wear) and StatTrak to see exact price and buy!
interface SkinPurchaseModalProps {
  group: GroupedMarketSkin;
  balance: number;
  locale: string;
  onClose: () => void;
  onBuy: (skin: SkinEntity) => void;
  onRefill: () => void;
}

const SkinPurchaseModal: React.FC<SkinPurchaseModalProps> = ({
  group,
  balance,
  locale,
  onClose,
  onBuy,
  onRefill,
}) => {
  const isRu = locale === 'ru';
  const rarityCfg = RARITY_CONFIG[group.rarity] || RARITY_CONFIG.milspec;

  // StatTrak mode: default to false if non-ST available, else true
  const [isStatTrak, setIsStatTrak] = useState<boolean>(() => {
    return group.hasNonStatTrak ? false : true;
  });

  // Filter variants matching current StatTrak mode
  const currentStVariants = useMemo(() => {
    const list = group.variants.filter((v) => Boolean(v.statTrak) === isStatTrak);
    return list.length > 0 ? list : group.variants;
  }, [group.variants, isStatTrak]);

  const isWearable = isWearableItem(group.variants[0] || {});

  // Selected wear quality
  const [selectedWear, setSelectedWear] = useState<SkinWear>(() => {
    // Pick first available wear in current variants
    for (const w of WEAR_ORDER) {
      if (currentStVariants.some((v) => v.wear === w)) return w;
    }
    return (currentStVariants[0]?.wear as SkinWear) || 'FN';
  });

  // Ensure selectedWear is valid when isStatTrak changes
  const activeVariant = useMemo<SkinEntity>(() => {
    if (!isWearable) {
      return currentStVariants[0] || group.variants[0];
    }
    const exact = currentStVariants.find((v) => v.wear === selectedWear);
    if (exact) return exact;
    return currentStVariants[0] || group.variants[0];
  }, [isWearable, currentStVariants, selectedWear, group.variants]);

  const canAfford = balance >= activeVariant.priceDc;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl sm:max-w-4xl rounded-3xl bg-[#0e0f17] border border-white/10 p-5 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col gap-6 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 relative z-10 pb-3 border-b border-white/10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <RarityBadge rarity={group.rarity} size="xs" />
              <span className="text-xs text-white/40 font-bold">{group.weapon}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {group.skinName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isWearable ? (
          /* 2-Column Body for Weapons: Left (Weapon Top + StatTrak Bottom) | Right (Wear Qualities) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 relative z-10">
            {/* Left Column: Top Weapon Preview + Bottom StatTrak Selector */}
            <div className="flex flex-col gap-4">
              {/* Skin Preview Card */}
              <div className="relative w-full h-52 sm:h-60 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center p-4 overflow-hidden">
                <SkinImage
                  src={activeVariant.image}
                  alt={activeVariant.name}
                  size={240}
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)]"
                />

                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  {activeVariant.statTrak && isStatTrakableItem(activeVariant) && <StatTrakBadge size="sm" />}
                  <WearBadge skin={activeVariant} size="sm" />
                </div>
              </div>

              {/* StatTrak Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase text-white/50 tracking-wider">
                  {isRu ? 'Тип предмета' : 'Item Type'}
                </label>

                {group.hasStatTrak && group.hasNonStatTrak ? (
                  <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/60 border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsStatTrak(false);
                      }}
                      className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer text-center ${
                        !isStatTrak
                          ? 'bg-white/20 text-white shadow-lg border border-white/30'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {isRu ? 'Обычный' : 'Regular'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsStatTrak(true);
                      }}
                      className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isStatTrak
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : 'text-white/50 hover:text-amber-400'
                      }`}
                    >
                      <StatTrakBadge size="xs" />
                      <span>StatTrak™</span>
                    </button>
                  </div>
                ) : group.hasStatTrak ? (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2">
                    <StatTrakBadge size="xs" />
                    <span>{isRu ? 'Доступен только в версии StatTrak™' : 'Only available as StatTrak™'}</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-xs">
                    <span>{isRu ? 'Обычный (StatTrak™ недоступен)' : 'Regular (No StatTrak™ version)'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Wear Quality Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase text-white/50 tracking-wider mb-0.5">
                {isRu ? 'Качество предмета' : 'Item Wear Quality'}
              </label>

              <div className="flex flex-col gap-2.5 flex-1 justify-center">
                {WEAR_ORDER.map((w) => {
                  const variant = currentStVariants.find((v) => v.wear === w);
                  const isAvailable = Boolean(variant);
                  const isSelected = activeVariant.wear === w && isAvailable;
                  const wearCfg = WEAR_CONFIG[w];

                  if (!isAvailable) {
                    return (
                      <div
                        key={w}
                        className="py-3 px-4 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between opacity-35 cursor-not-allowed select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-white/20 shrink-0" />
                          <span className="text-xs font-medium text-white/40">
                            {isRu ? WEAR_LABELS[w].ru : WEAR_LABELS[w].en} ({w})
                          </span>
                        </div>
                        <span className="text-[11px] text-white/30">{isRu ? 'Нет в наличии' : 'N/A'}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedWear(w);
                      }}
                      className={`py-3.5 px-4 sm:py-4 sm:px-5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-yellow-400/20 border-yellow-400 text-white shadow-[0_0_20px_rgba(250,204,21,0.25)] ring-1 ring-yellow-400/50'
                          : 'bg-black/50 border-white/10 hover:border-white/30 text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{
                            background: wearCfg?.color || '#10b981',
                            boxShadow: `0 0 10px ${wearCfg?.color || '#10b981'}80`,
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-black tracking-wide text-white">
                            {isRu ? WEAR_LABELS[w].ru : WEAR_LABELS[w].en}
                          </span>
                          <span className="text-[11px] font-bold text-white/40">
                            {wearCfg?.label || w} • {wearCfg?.short || w}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-sm sm:text-base text-yellow-400 shrink-0 ml-2 inline-flex items-center gap-1">
                        <ZalupaCoinIcon size={14} />
                        {formatZc(variant!.priceDc)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Non-Wearable Layout: Charms, Stickers, Agents */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 relative z-10">
            <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center p-6 overflow-hidden">
              <SkinImage
                src={activeVariant.image}
                alt={activeVariant.name}
                size={260}
                className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
              />
            </div>

            <div className="flex flex-col justify-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-2">
                <RarityBadge rarity={group.rarity} size="sm" />
                <span className="text-xs uppercase font-bold text-white/40">{group.weapon}</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{group.skinName}</h3>
                <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                  {isRu
                    ? 'Коллекционный предмет без степени износа в CS2. Поставляется в оригинальном виде с моментальным зачислением в инвентарь.'
                    : 'Collectible item without wear condition in CS2. Delivered in pristine original state directly to your inventory.'}
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/50">{isRu ? 'Стоимость в маркете' : 'Market Price'}:</span>
                <span className="font-mono font-black text-lg text-yellow-400 inline-flex items-center gap-1.5">
                  <ZalupaCoinIcon size={18} />
                  {formatZc(activeVariant.priceDc)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Price & Action Section (Full Width Footer) */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center justify-between w-full sm:w-auto gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-white/40">
                {isRu ? 'Итоговая цена' : 'Final Price'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ZalupaCoinIcon size={20} />
                <span className="font-mono font-black text-xl text-yellow-400">
                  {formatZc(activeVariant.priceDc)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end sm:items-start">
              <span className="text-[10px] font-bold uppercase text-white/40">
                {isRu ? 'Ваш баланс' : 'Your Balance'}
              </span>
              <span className="font-mono font-bold text-sm text-white/80 inline-flex items-center gap-1">
                <ZalupaCoinIcon size={14} />
                {formatZc(balance)}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-auto flex-1 max-w-sm flex justify-end">
            {canAfford ? (
              <button
                type="button"
                onClick={() => {
                  onBuy(activeVariant);
                  onClose();
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(250,204,21,0.35)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="inline-flex items-center gap-1.5">
                  <span>{isRu ? 'Купить за' : 'Purchase for'}</span>
                  <ZalupaCoinIcon size={16} />
                  <span>{formatZc(activeVariant.priceDc)}</span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRefill}
                className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-yellow-400 font-black text-sm uppercase tracking-wider border border-yellow-400/40 shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span className="inline-flex items-center gap-1.5">
                  <span>{isRu ? 'Недостаточно' : 'Insufficient'}</span>
                  <ZalupaCoinIcon size={14} />
                  <span>({isRu ? 'Пополнить' : 'Top Up'})</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function isMarketAllowedItem(skin: SkinEntity): boolean {
  if (!skin || !skin.name || !skin.image) return false;
  const img = skin.image;
  if (img.startsWith('file:') || img.includes('file://') || img.includes('C:/') || img.includes('C:\\')) return false;
  if (skin.name.includes('Spruce DDPAT')) return false;

  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();

  // 1. Regular weapons, knives, gloves
  if (isActualWeaponOrKnifeGlove(skin)) return true;

  // 2. Charms
  if (w.includes('charm') || w.includes('брелок') || n.startsWith('charm |') || n.startsWith('брелок |')) return true;

  // 3. Stickers
  if (w.includes('sticker') || w.includes('наклейка') || n.startsWith('sticker |') || n.startsWith('наклейка |')) return true;

  // 4. Agents
  if (w.includes('agent') || w.includes('оперативник') || n.startsWith('agent |') || n.startsWith('оперативник |')) return true;

  return false;
}

export default function MarketplacePage() {
  const balance = useGameStore((s) => s.balance);
  const livePrices = useGameStore((s) => s.livePrices);
  const deductBalance = useGameStore((s) => s.deductBalance);
  const addToInventory = useGameStore((s) => s.addToInventory);
  const setRefillOpen = useGameStore((s) => s.setRefillOpen);
  const { locale } = useLanguage();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubWeapon, setSelectedSubWeapon] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortOption, setSortOption] = useState<'price_asc' | 'price_desc' | 'name_asc'>('price_asc');
  const [priceRange, setPriceRange] = useState<'all' | 'under1k' | '1k_10k' | 'over10k'>('all');
  const [visibleCount, setVisibleCount] = useState(48);

  const [purchasedSkinName, setPurchasedSkinName] = useState<string | null>(null);
  const [selectedGroupForModal, setSelectedGroupForModal] = useState<GroupedMarketSkin | null>(null);

  // BASE POOL: Strictly weapons, knives, gloves, charms, stickers, and agents
  const basePool = useMemo(() => {
    return SKINS_DATABASE.filter(isMarketAllowedItem);
  }, []);

// Synthesize only the genuine wear variants that actually exist in CS2 for this skin
function synthesizeCompleteVariants(
  rawVariants: SkinEntity[],
  livePrices?: LivePricesMap
): SkinEntity[] {
  if (rawVariants.length === 0) return rawVariants;

  const best =
    rawVariants.find((v) => !v.statTrak && v.wear === 'FN') ||
    rawVariants.find((v) => !v.statTrak && v.wear === 'MW') ||
    rawVariants.find((v) => !v.statTrak && v.wear === 'FT') ||
    rawVariants.find((v) => !v.statTrak) ||
    rawVariants[0];

  // 1. Vanilla Knives: Only Regular and StatTrak (NO wear qualities exist in CS2)
  if (isVanillaKnife(best)) {
    const cleanW = (best.weapon || '').replace(/^★\s*/, '').trim();
    const regName = `★ ${cleanW}`;
    const stName = `★ StatTrak™ ${cleanW}`;

    const regCanonical = getCanonicalPrice({ weapon: cleanW, name: regName, statTrak: false }, livePrices);
    const stCanonical = getCanonicalPrice({ weapon: cleanW, name: stName, statTrak: true }, livePrices);

    return [
      {
        ...best,
        id: `${best.id}_reg`,
        name: regName,
        weapon: cleanW,
        skinName: cleanW,
        priceDc: regCanonical.priceDc,
        priceUsd: regCanonical.priceUsd,
        statTrak: false,
        wear: undefined,
        wearLabel: undefined,
      },
      {
        ...best,
        id: `${best.id}_st`,
        name: stName,
        weapon: cleanW,
        skinName: cleanW,
        priceDc: stCanonical.priceDc,
        priceUsd: stCanonical.priceUsd,
        statTrak: true,
        wear: undefined,
        wearLabel: undefined,
      },
    ];
  }

  // 2. For non-wearables (Stickers, Charms, Agents, Patches, etc.): keep single item
  if (!isWearableItem(best)) {
    const canonical = getCanonicalPrice(best, livePrices);
    return [
      {
        ...best,
        priceDc: canonical.priceDc,
        priceUsd: canonical.priceUsd,
        statTrak: false,
        wear: undefined,
      },
    ];
  }

  const canBeSt = isStatTrakableItem(best);

  const cleanName = (best.skinName || best.name)
    .replace(/^StatTrak™\s*/i, '')
    .replace(/^★\s*StatTrak™\s*/i, '★ ')
    .replace(/\s*\([^)]*\)$/, '')
    .trim();

  const result: SkinEntity[] = [];
  const stOptions = canBeSt ? [false, true] : [false];
  const allowedWears = getValidWearList(best);

  for (const st of stOptions) {
    for (const wear of allowedWears) {
      const existing = rawVariants.find((v) => v.wear === wear && Boolean(v.statTrak) === st);
      const wearName = WEAR_LABELS[wear]?.en || wear;

      const formattedName = st
        ? (best.weapon.startsWith('★') || cleanName.startsWith('★')
            ? `★ StatTrak™ ${best.weapon.replace(/^★\s*/, '')} | ${cleanName.replace(/^★\s*/, '')} (${wearName})`
            : `StatTrak™ ${best.weapon} | ${cleanName} (${wearName})`)
        : (best.weapon.startsWith('★') || cleanName.startsWith('★')
            ? `★ ${best.weapon.replace(/^★\s*/, '')} | ${cleanName.replace(/^★\s*/, '')} (${wearName})`
            : `${best.weapon} | ${cleanName} (${wearName})`);

      const canonical = getCanonicalPrice(
        existing || {
          weapon: best.weapon,
          skinName: cleanName,
          name: formattedName,
          wear,
          statTrak: st,
        },
        livePrices
      );

      if (existing) {
        result.push({
          ...existing,
          priceDc: canonical.priceDc,
          priceUsd: canonical.priceUsd,
        });
      } else {
        result.push({
          ...best,
          id: `${best.id || best.name}_${wear}_${st ? 'st' : 'reg'}`,
          name: formattedName,
          skinName: cleanName,
          wear,
          statTrak: st,
          priceDc: canonical.priceDc,
          priceUsd: canonical.priceUsd,
        });
      }
    }
  }

  return result;
}

  // GROUPED SKINS POOL: unique weapon + skin name
  const groupedPool = useMemo<GroupedMarketSkin[]>(() => {
    const map = new Map<string, SkinEntity[]>();
    for (const s of basePool) {
      const key = `${s.weapon || ''}___${s.skinName || s.name}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(s);
    }

    const result: GroupedMarketSkin[] = [];
    for (const [key, rawVariants] of map.entries()) {
      const variants = synthesizeCompleteVariants(rawVariants, livePrices);
      const prices = variants.map((v) => v.priceDc).filter((p) => typeof p === 'number' && p > 0);
      if (prices.length === 0) continue;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Best image: preferably clean FN/MW or first
      const best =
        variants.find((v) => !v.statTrak && v.wear === 'FN') ||
        variants.find((v) => !v.statTrak && v.wear === 'MW') ||
        variants.find((v) => !v.statTrak) ||
        variants[0];

      result.push({
        groupKey: key,
        weapon: best.weapon,
        skinName: best.skinName || best.name,
        rarity: best.rarity,
        image: best.image,
        minPriceDc: minPrice,
        maxPriceDc: maxPrice,
        hasStatTrak: variants.some((v) => v.statTrak),
        hasNonStatTrak: variants.some((v) => !v.statTrak),
        variants,
      });
    }

    return result;
  }, [basePool, livePrices]);

  // Filtered grouped skins
  const filteredGroups = useMemo(() => {
    let list = groupedPool;

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((group) => {
        const w = (group.weapon || '').toLowerCase();
        const sn = (group.skinName || '').toLowerCase();
        const isGlove = w.includes('gloves') || w.includes('wraps') || w.includes('перчатки');
        const isKnife =
          (group.skinName.startsWith('★') && !isGlove) ||
          w.includes('knife') ||
          w.includes('нож') ||
          w.includes('bayonet') ||
          w.includes('karambit') ||
          w.includes('daggers') ||
          w.includes('stiletto') ||
          w.includes('kukri') ||
          w.includes('talon') ||
          w.includes('ursus');

        const isCharm = w.includes('charm') || w.includes('брелок') || sn.startsWith('charm |');
        const isSticker = w.includes('sticker') || w.includes('наклейка') || sn.startsWith('sticker |');
        const isAgent = w.includes('agent') || w.includes('оперативник') || sn.startsWith('agent |');

        if (selectedCategory === 'knives') return isKnife;
        if (selectedCategory === 'gloves') return isGlove;
        if (selectedCategory === 'snipers') return SNIPER_MODELS.some((m) => w.includes(m));
        if (selectedCategory === 'rifles') return RIFLE_MODELS.some((m) => w.includes(m));
        if (selectedCategory === 'pistols') return PISTOL_MODELS.some((m) => w.includes(m));
        if (selectedCategory === 'smgs') return SMG_MODELS.some((m) => w.includes(m));
        if (selectedCategory === 'heavy') return HEAVY_MODELS.some((m) => w.includes(m));
        if (selectedCategory === 'charms') return isCharm;
        if (selectedCategory === 'stickers') return isSticker;
        if (selectedCategory === 'agents') return isAgent;
        return true;
      });
    }

    // Sub-weapon model filter
    if (selectedSubWeapon !== 'all') {
      const q = selectedSubWeapon.toLowerCase();
      list = list.filter((group) => (group.weapon || '').toLowerCase().includes(q));
    }

    // Rarity filter
    if (selectedRarity !== 'all') {
      list = list.filter((group) => group.rarity === selectedRarity);
    }

    // Price range filter (based on min price)
    if (priceRange === 'under1k') {
      list = list.filter((g) => g.minPriceDc < 1000);
    } else if (priceRange === '1k_10k') {
      list = list.filter((g) => g.minPriceDc <= 10000 && g.maxPriceDc >= 1000);
    } else if (priceRange === 'over10k') {
      list = list.filter((g) => g.maxPriceDc > 10000);
    }

    // Text search
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase().trim();
      list = list.filter(
        (g) =>
          g.skinName.toLowerCase().includes(q) ||
          g.weapon.toLowerCase().includes(q)
      );
    }

    // Sorting
    const sorted = [...list].sort((a, b) => {
      if (sortOption === 'price_asc') return a.minPriceDc - b.minPriceDc;
      if (sortOption === 'price_desc') return b.maxPriceDc - a.maxPriceDc;
      if (sortOption === 'name_asc') return a.skinName.localeCompare(b.skinName);
      return 0;
    });

    return sorted;
  }, [groupedPool, selectedCategory, selectedSubWeapon, selectedRarity, priceRange, deferredSearch, sortOption]);

  // Sub-weapons available in current category
  const availableSubWeapons = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const counts: Record<string, number> = {};
    for (const g of groupedPool) {
      const w = g.weapon || '';
      if (!w) continue;
      const lw = w.toLowerCase();
      const isGlove = lw.includes('gloves') || lw.includes('wraps') || lw.includes('перчатки');
      const isKnife =
        (g.skinName.startsWith('★') && !isGlove) ||
        lw.includes('knife') ||
        lw.includes('нож') ||
        lw.includes('bayonet') ||
        lw.includes('karambit') ||
        lw.includes('daggers') ||
        lw.includes('stiletto') ||
        lw.includes('kukri') ||
        lw.includes('talon') ||
        lw.includes('ursus');

      let matches = false;
      if (selectedCategory === 'knives' && isKnife) matches = true;
      if (selectedCategory === 'gloves' && isGlove) matches = true;
      if (selectedCategory === 'snipers' && SNIPER_MODELS.some((m) => lw.includes(m))) matches = true;
      if (selectedCategory === 'rifles' && RIFLE_MODELS.some((m) => lw.includes(m))) matches = true;
      if (selectedCategory === 'pistols' && PISTOL_MODELS.some((m) => lw.includes(m))) matches = true;
      if (selectedCategory === 'smgs' && SMG_MODELS.some((m) => lw.includes(m))) matches = true;
      if (selectedCategory === 'heavy' && HEAVY_MODELS.some((m) => lw.includes(m))) matches = true;
      if (selectedCategory === 'charms' && (lw.includes('charm') || lw.includes('брелок') || g.skinName.toLowerCase().startsWith('charm |'))) matches = true;
      if (selectedCategory === 'stickers' && (lw.includes('sticker') || lw.includes('наклейка') || g.skinName.toLowerCase().startsWith('sticker |'))) matches = true;
      if (selectedCategory === 'agents' && (lw.includes('agent') || lw.includes('оперативник') || g.skinName.toLowerCase().startsWith('agent |'))) matches = true;

      if (matches) {
        counts[w] = (counts[w] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [groupedPool, selectedCategory]);

  const handleBuy = useCallback(
    (skin: SkinEntity) => {
      if (balance < skin.priceDc) {
        sound.playError();
        setRefillOpen(true);
        return;
      }

      deductBalance(skin.priceDc);
      addToInventory([skin]);
      sound.playBuy();

      setPurchasedSkinName(`${skin.weapon} | ${skin.skinName || skin.name}`);
      setTimeout(() => {
        setPurchasedSkinName(null);
      }, 2800);
    },
    [balance, deductBalance, addToInventory, setRefillOpen]
  );

  const handleLoadMore = () => {
    sound.playClick();
    setVisibleCount((prev) => prev + 36);
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a] text-white pb-24 sm:pb-16 max-w-full overflow-x-hidden">
      <div>
        <Header />
        <LiveDropBar />
        <RefillModal />

        {/* Hero Banner */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#13141f] via-[#0c0d14] to-[#08080a] py-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider mb-3">
                <Store className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Каталог оружия CS2' : 'CS2 Armory Catalog'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                {locale === 'ru' ? 'МАРКЕТПЛЕЙС' : 'MARKETPLACE'}{' '}
                <span className="text-yellow-400">CS2</span>
              </h1>
              <p className="text-sm text-white/50 max-w-xl mt-1">
                {locale === 'ru'
                  ? 'Выберите оружие и скин, выберите качество и StatTrak в удобном меню и покупайте напрямую за ZalupaCoins (DC).'
                  : 'Select any CS2 skin, choose your desired wear and StatTrak in the purchase menu, and buy directly using ZalupaCoins (DC).'}
              </p>
            </div>

            {/* Balance Badge */}
            <div className="flex items-center gap-3">
              <div className="bg-[#0d0e14] px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
                <ZalupaCoinIcon className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/40 uppercase">
                    {locale === 'ru' ? 'Ваш баланс' : 'Your Balance'}
                  </span>
                  <span className="font-mono font-black text-lg text-yellow-400">
                    {formatZc(balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {ITEM_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedCategory(cat.id);
                    setSelectedSubWeapon('all');
                    setVisibleCount(48);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-yellow-400 text-black border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.3)] font-black scale-[1.02]'
                      : 'bg-[#0d0e14] text-white/70 hover:text-white border-white/10 hover:border-white/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{locale === 'ru' ? cat.labelRu : cat.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Weapon Model Chips */}
          {availableSubWeapons.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 p-2 rounded-2xl bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSelectedSubWeapon('all');
                  setVisibleCount(48);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedSubWeapon === 'all'
                    ? 'bg-yellow-400 text-black border-yellow-300 font-black'
                    : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                }`}
              >
                {locale === 'ru' ? 'Все модели' : 'All Models'}
              </button>

              {availableSubWeapons.slice(0, 12).map((w) => {
                const isAct = selectedSubWeapon.toLowerCase() === w.name.toLowerCase();
                return (
                  <button
                    key={w.name}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedSubWeapon(isAct ? 'all' : w.name);
                      setVisibleCount(48);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isAct
                        ? 'bg-yellow-400 text-black border-yellow-300 font-black'
                        : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                    }`}
                  >
                    {w.name} <span className="text-[10px] opacity-60">({w.count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Filter Controls Row */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
          <div className="p-4 rounded-3xl bg-[#0d0e14] border border-white/10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 w-full md:w-80">
              <Search className="w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder={locale === 'ru' ? 'Поиск оружия или скина...' : 'Search skin or weapon...'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(48);
                }}
                className="w-full bg-transparent text-xs text-white outline-none"
              />
            </div>

            {/* Dropdown Filters & Sort */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Rarity */}
              <select
                value={selectedRarity}
                onChange={(e) => {
                  setSelectedRarity(e.target.value);
                  setVisibleCount(48);
                }}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">{locale === 'ru' ? 'Все редкости' : 'All rarities'}</option>
                <option value="contraband">★ {locale === 'ru' ? 'Контрабанда' : 'Contraband'}</option>
                <option value="extraordinary">★ {locale === 'ru' ? 'Экстраординарное' : 'Extraordinary'}</option>
                <option value="covert">★ {locale === 'ru' ? 'Тайное' : 'Covert'}</option>
                <option value="classified">{locale === 'ru' ? 'Засекреченное' : 'Classified'}</option>
                <option value="restricted">{locale === 'ru' ? 'Запрещенное' : 'Restricted'}</option>
                <option value="milspec">{locale === 'ru' ? 'Армейское' : 'Mil-Spec'}</option>
                <option value="industrial">{locale === 'ru' ? 'Промышленное' : 'Industrial'}</option>
                <option value="consumer">{locale === 'ru' ? 'Ширпотреб' : 'Consumer'}</option>
                <option value="gold">★ {locale === 'ru' ? 'Редкий особый' : 'Rare Special'}</option>
              </select>

              {/* Price Range */}
              <select
                value={priceRange}
                onChange={(e) => {
                  setPriceRange(e.target.value as any);
                  setVisibleCount(48);
                }}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">{locale === 'ru' ? 'Все цены' : 'All prices'}</option>
                <option value="under1k">{locale === 'ru' ? 'До 1 000' : 'Under 1k'}</option>
                <option value="1k_10k">{locale === 'ru' ? '1 000 – 10 000' : '1k – 10k'}</option>
                <option value="over10k">{locale === 'ru' ? 'От 10 000' : 'Above 10k'}</option>
              </select>

              {/* Sort */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="price_asc">{locale === 'ru' ? 'Сначала дешевле' : 'Price: Low to High'}</option>
                <option value="price_desc">{locale === 'ru' ? 'Сначала дороже' : 'Price: High to Low'}</option>
                <option value="name_asc">{locale === 'ru' ? 'По названию' : 'By Name'}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Skins Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-white/50">
              {locale === 'ru' ? 'Найдено моделей скинов:' : 'Skin models found:'}{' '}
              <span className="text-yellow-400 font-black">{filteredGroups.length}</span>
            </span>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <Store className="w-12 h-12 text-white/20 mb-3" />
              <span className="text-sm font-bold text-white/50 mb-4">
                {locale === 'ru' ? 'Скины не найдены по заданным критериям' : 'No skins match your filters'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedSubWeapon('all');
                  setSelectedRarity('all');
                  setPriceRange('all');
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
              >
                {locale === 'ru' ? 'Сбросить фильтры' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
                style={{ contain: 'layout' }}
              >
                {filteredGroups.slice(0, visibleCount).map((group) => (
                  <MarketGroupCard
                    key={group.groupKey}
                    group={group}
                    canAffordAny={balance >= group.minPriceDc}
                    onSelect={(g) => {
                      sound.playClick();
                      setSelectedGroupForModal(g);
                    }}
                    locale={locale}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {visibleCount < filteredGroups.length && (
                <div className="flex justify-center mt-8">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="px-8 py-3.5 rounded-2xl bg-[#0d0e14] hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider border border-white/10 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    {locale === 'ru'
                      ? `Показать еще 36 из ${filteredGroups.length - visibleCount}`
                      : `Load More: 36 of ${filteredGroups.length - visibleCount}`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Selected Skin Purchase Modal */}
        {selectedGroupForModal && (
          <SkinPurchaseModal
            group={selectedGroupForModal}
            balance={balance}
            locale={locale}
            onClose={() => setSelectedGroupForModal(null)}
            onBuy={handleBuy}
            onRefill={() => {
              setSelectedGroupForModal(null);
              setRefillOpen(true);
            }}
          />
        )}

        {/* Purchase Notification Toast */}
        {purchasedSkinName && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0d0e14] border border-yellow-400 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-yellow-400 uppercase">
                {locale === 'ru' ? 'Успешно куплено!' : 'Purchased!'}
              </span>
              <span className="text-sm font-black text-white">{purchasedSkinName}</span>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
