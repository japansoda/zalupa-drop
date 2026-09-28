import { SkinEntity, SkinWear } from './types';
import { SKINS_DATABASE } from '../data/skins';
import { isWearableItem, isStatTrakableItem, getSteamMarketHashName } from './steam';

// Canonical wear multipliers (identical across Marketplace, Cases, Upgrader, Farm, Contracts)
export const WEAR_RATES: Record<SkinWear, number> = {
  FN: 1.6,
  MW: 1.25,
  FT: 1.0,
  WW: 0.82,
  BS: 0.68,
};

// Canonical StatTrak multiplier
export const STATTRAK_RATE = 1.95;

// Clean weapon & skinName key for fast lookups
export function getSkinDesignKey(weapon?: string, skinName?: string, name?: string): string {
  let cleanWeapon = (weapon || '')
    .replace(/^★\s*StatTrak™\s*/i, '★ ')
    .replace(/^StatTrak™\s*/i, '')
    .replace(/^★\s*/, '')
    .trim();

  let cleanName = (skinName || name || '')
    .replace(/^★\s*StatTrak™\s*/i, '★ ')
    .replace(/^StatTrak™\s*/i, '')
    .replace(/^★\s*/, '')
    .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '')
    .trim();

  // If weapon is in cleanName (e.g. "AK-47 | Redline"), extract the skin part
  if (cleanName.includes(' | ')) {
    const parts = cleanName.split(' | ');
    if (!cleanWeapon) cleanWeapon = parts[0].trim();
    cleanName = parts.slice(1).join(' | ').trim();
  }

  return `${cleanWeapon}___${cleanName}`.toLowerCase();
}

// In-memory registry for base Field-Tested prices and base design prices
let baseFtPriceCache: Map<string, number> | null = null;
let baseDesignPriceCache: Map<string, number> | null = null;

function initPricingCaches(): void {
  if (baseFtPriceCache && baseDesignPriceCache) return;

  const ftMap = new Map<string, number>();
  const designMap = new Map<string, number>();
  const groupedVariants = new Map<string, SkinEntity[]>();

  for (const skin of SKINS_DATABASE) {
    const key = getSkinDesignKey(skin.weapon, skin.skinName, skin.name);
    let group = groupedVariants.get(key);
    if (!group) {
      group = [];
      groupedVariants.set(key, group);
    }
    group.push(skin);
  }

  for (const [key, variants] of groupedVariants.entries()) {
    // Record general base price for non-wearable designs (stickers, charms, agents)
    const baseP = variants[0]?.priceDc || 100;
    designMap.set(key, Math.max(1, baseP));

    // Derive canonical Field-Tested price using Marketplace standard hierarchy
    const ftVariant = variants.find((v) => !v.statTrak && v.wear === 'FT');
    const mwVariant = variants.find((v) => !v.statTrak && v.wear === 'MW');
    const fnVariant = variants.find((v) => !v.statTrak && v.wear === 'FN');
    const wwVariant = variants.find((v) => !v.statTrak && v.wear === 'WW');
    const bsVariant = variants.find((v) => !v.statTrak && v.wear === 'BS');

    let baseFt = 100;
    if (ftVariant && ftVariant.priceDc > 0) {
      baseFt = ftVariant.priceDc;
    } else if (mwVariant && mwVariant.priceDc > 0) {
      baseFt = Math.round(mwVariant.priceDc / WEAR_RATES.MW);
    } else if (fnVariant && fnVariant.priceDc > 0) {
      baseFt = Math.round(fnVariant.priceDc / WEAR_RATES.FN);
    } else if (wwVariant && wwVariant.priceDc > 0) {
      baseFt = Math.round(wwVariant.priceDc / WEAR_RATES.WW);
    } else if (bsVariant && bsVariant.priceDc > 0) {
      baseFt = Math.round(bsVariant.priceDc / WEAR_RATES.BS);
    } else {
      const p = variants[0]?.priceDc || 100;
      baseFt = variants[0]?.statTrak ? Math.round(p / STATTRAK_RATE) : p;
    }

    ftMap.set(key, Math.max(1, baseFt));
  }

  baseFtPriceCache = ftMap;
  baseDesignPriceCache = designMap;
}

/**
 * Retrieves the base Field-Tested price for a weapon and skin design.
 */
export function getBaseFtPrice(weapon?: string, skinName?: string, name?: string): number {
  initPricingCaches();
  const key = getSkinDesignKey(weapon, skinName, name);
  const found = baseFtPriceCache?.get(key);
  if (found && found > 0) return found;

  // Fallback try without weapon prefix or with name
  if (name) {
    const keyAlt = getSkinDesignKey('', '', name);
    const foundAlt = baseFtPriceCache?.get(keyAlt);
    if (foundAlt && foundAlt > 0) return foundAlt;
  }

  return 100;
}

/**
 * Retrieves the base design price for non-wearable items (Stickers, Agents, Charms).
 */
export function getBaseDesignPrice(weapon?: string, skinName?: string, name?: string): number {
  initPricingCaches();
  const key = getSkinDesignKey(weapon, skinName, name);
  return baseDesignPriceCache?.get(key) || 100;
}

/**
 * Computes canonical price in DropCoin (DC) and USD for ANY skin entity.
 * - Single source of truth across Marketplace, Cases, Roulette, Upgrader, Farm, Contracts.
 * - If livePrices contains an exact Steam price for this item's Steam hash name, it takes precedence.
 * - Otherwise computes exact Marketplace formula price.
 */
export function getCanonicalPrice(
  skin: Partial<SkinEntity>,
  livePrices?: Record<string, { priceDc: number; priceUsd?: number }>
): { priceDc: number; priceUsd: number } {
  // 1. Direct match in live Steam prices
  const hashName = getSteamMarketHashName(skin);
  if (livePrices && livePrices[hashName] && livePrices[hashName].priceDc > 0) {
    const pDc = livePrices[hashName].priceDc;
    const pUsd = livePrices[hashName].priceUsd ?? Number((pDc * 0.01).toFixed(2));
    return { priceDc: pDc, priceUsd: pUsd };
  }

  const wearable = isWearableItem(skin);
  const stattrakable = isStatTrakableItem(skin);
  const isSt = Boolean(skin.statTrak && stattrakable);

  // 2. Non-wearable items (Stickers, Charms, Agents, Patches, Music Kits)
  if (!wearable) {
    const baseP = getBaseDesignPrice(skin.weapon, skin.skinName, skin.name) || skin.priceDc || 100;
    const priceDc = Math.max(1, baseP);
    const priceUsd = Number((priceDc * 0.01).toFixed(2));
    return { priceDc, priceUsd };
  }

  // 3. Wearable items (Guns, Knives, Gloves)
  // Check if livePrices has the base Field-Tested price for this skin design
  let baseFtPrice = 0;
  if (livePrices) {
    const cleanW = (skin.weapon || '').replace(/^★\s*StatTrak™\s*/i, '★ ').replace(/^StatTrak™\s*/i, '').trim();
    const cleanN = (skin.skinName || skin.name || '')
      .replace(/^★\s*StatTrak™\s*/i, '★ ')
      .replace(/^StatTrak™\s*/i, '')
      .replace(/\s*\([^)]*\)$/, '')
      .trim();

    const ftHash = getSteamMarketHashName({ weapon: cleanW, skinName: cleanN, wear: 'FT', statTrak: false });
    if (livePrices[ftHash]?.priceDc && livePrices[ftHash].priceDc > 0) {
      baseFtPrice = livePrices[ftHash].priceDc;
    }
  }

  if (baseFtPrice <= 0) {
    baseFtPrice = getBaseFtPrice(skin.weapon, skin.skinName, skin.name);
    if (baseFtPrice <= 0 && skin.priceDc && skin.priceDc > 0) {
      baseFtPrice = skin.priceDc;
    }
  }

  baseFtPrice = Math.max(1, baseFtPrice);

  const wearKey: SkinWear = (skin.wear ? skin.wear.toUpperCase() : 'FT') as SkinWear;
  const wearRate = WEAR_RATES[wearKey] || 1.0;
  const stRate = isSt ? STATTRAK_RATE : 1.0;

  const priceDc = Math.max(1, Math.round(baseFtPrice * wearRate * stRate));
  const priceUsd = Number((priceDc * 0.01).toFixed(2));

  return { priceDc, priceUsd };
}

/**
 * Applies canonical marketplace price to a skin entity.
 */
export function applyCanonicalPrice<T extends Partial<SkinEntity>>(
  skin: T,
  livePrices?: Record<string, { priceDc: number; priceUsd?: number }>
): T {
  const { priceDc, priceUsd } = getCanonicalPrice(skin, livePrices);
  return {
    ...skin,
    priceDc,
    priceUsd,
  };
}
