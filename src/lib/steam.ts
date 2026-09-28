import { SkinEntity, SkinWear } from './types';

// Map wear code to official Steam Market English wear string
export const WEAR_NAME_MAP: Record<string, string> = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
};

/**
 * Check if item is a Vanilla Knife in CS2 (e.g. ★ Flip Knife, ★ Karambit, ★ Butterfly Knife).
 * Vanilla knives DO NOT have wear quality (Factory New, Field-Tested, etc.) on Steam or in CS2.
 */
export function isVanillaKnife(skin: Partial<SkinEntity>): boolean {
  const w = (skin.weapon || '').replace(/^★\s*/, '').trim().toLowerCase();
  const n = (skin.name || '').replace(/^StatTrak™\s*/i, '').replace(/^★\s*StatTrak™\s*/i, '').replace(/^★\s*/, '').trim().toLowerCase();
  const sn = (skin.skinName || '').replace(/^★\s*/, '').trim().toLowerCase();

  const isKnife =
    w.includes('knife') ||
    w.includes('bayonet') ||
    w.includes('karambit') ||
    w.includes('daggers') ||
    n.includes('knife') ||
    n.includes('bayonet') ||
    n.includes('karambit') ||
    n.includes('daggers');

  if (!isKnife) return false;

  // If it has a distinct skinName (like "Rust Coat", "Doppler", "Fade"), it is NOT vanilla!
  if (sn && sn !== w && sn !== n && sn !== 'vanilla') return false;

  // If the full name has " | " with a skin pattern, it is NOT vanilla!
  if (n.includes('|')) {
    const parts = n.split('|');
    if (parts[1] && parts[1].trim().length > 0) return false;
  }

  // Otherwise, it is a vanilla knife (e.g. "★ Flip Knife", "★ Karambit")
  return true;
}

/**
 * Returns the exact list of valid wear qualities that exist in CS2 for this skin finish.
 * For example:
 * - Vanilla knives: [] (no wear exists)
 * - Rust Coat: ['WW', 'BS'] (FN, MW, FT do NOT exist)
 * - Doppler / Gamma Doppler / Fade / Marble Fade / Tiger Tooth: ['FN', 'MW'] (FT, WW, BS do NOT exist)
 * - Asiimov: ['FT', 'WW', 'BS'] (FN, MW do NOT exist)
 * - Other wearable weapons: ['FN', 'MW', 'FT', 'WW', 'BS']
 */
export function getValidWearList(skin: Partial<SkinEntity>): SkinWear[] {
  if (!isWearableItem(skin)) return [];

  const name = `${skin.weapon || ''} ${skin.skinName || ''} ${skin.name || ''}`.toLowerCase();

  if (name.includes('rust coat') || name.includes('пыльник')) {
    return ['WW', 'BS'];
  }

  if (
    name.includes('doppler') ||
    name.includes('волны') ||
    name.includes('tiger tooth') ||
    name.includes('зуб тигра') ||
    name.includes('marble fade') ||
    name.includes('мраморный градиент') ||
    name.includes('fade') ||
    name.includes('градиент')
  ) {
    return ['FN', 'MW'];
  }

  if (name.includes('asiimov') || name.includes('азимов')) {
    return ['FT', 'WW', 'BS'];
  }

  return ['FN', 'MW', 'FT', 'WW', 'BS'];
}

/**
 * Check if skin type has wear qualities in CS2.
 * In CS2, Vanilla Knives, Charms, Agents, and Stickers DO NOT have wear qualities.
 */
export function isWearableItem(skin: Partial<SkinEntity>): boolean {
  if (isVanillaKnife(skin)) return false;

  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();

  if (w === 'charm' || w === 'брелок' || n.startsWith('charm |') || n.startsWith('брелок |')) return false;
  if (w === 'agent' || w === 'оперативник' || n.startsWith('agent |')) return false;
  if (w === 'sticker' || w === 'наклейка' || n.startsWith('sticker |') || n.startsWith('наклейка |')) return false;
  if (w === 'patch' || n.startsWith('patch |') || w.includes('music kit') || w.includes('pin')) return false;

  return true;
}

/**
 * Check if skin type can have StatTrak in CS2.
 * In CS2, Agents, Charms, Stickers, and Gloves CANNOT have StatTrak.
 */
export function isStatTrakableItem(skin: Partial<SkinEntity>): boolean {
  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();

  if (w === 'charm' || w === 'брелок' || n.startsWith('charm |') || n.startsWith('брелок |')) return false;
  if (w === 'agent' || w === 'оперативник' || n.startsWith('agent |')) return false;
  if (w === 'sticker' || w === 'наклейка' || n.startsWith('sticker |') || n.startsWith('наклейка |')) return false;
  if (w.includes('gloves') || w.includes('wraps') || w.includes('перчатки') || w.includes('обмотки')) return false;

  return true;
}

/**
 * Constructs the exact official Steam Community Market hash name for any CS2 item.
 */
export function getSteamMarketHashName(skin: Partial<SkinEntity>): string {
  const isCharm = !isWearableItem(skin) && ((skin.weapon || '').toLowerCase().includes('charm') || (skin.weapon || '').toLowerCase().includes('брелок') || (skin.name || '').toLowerCase().includes('charm'));
  const isAgent = !isWearableItem(skin) && ((skin.weapon || '').toLowerCase().includes('agent') || (skin.weapon || '').toLowerCase().includes('оперативник'));
  const isSticker = !isWearableItem(skin) && ((skin.weapon || '').toLowerCase().includes('sticker') || (skin.weapon || '').toLowerCase().includes('наклейка') || (skin.name || '').toLowerCase().includes('sticker'));

  // Clean raw name from any previous StatTrak or wear string
  let cleanName = skin.name || (skin.weapon && skin.skinName ? `${skin.weapon} | ${skin.skinName}` : skin.skinName || skin.weapon || '');
  cleanName = cleanName.replace(/^StatTrak™\s*/i, '').replace(/^★\s*StatTrak™\s*/i, '★ ').trim();
  cleanName = cleanName.replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '').trim();

  // 0. Vanilla Knives: exact hash is ★ {Knife} or ★ StatTrak™ {Knife} (NO wear string)
  if (isVanillaKnife(skin)) {
    let knifeName = (skin.weapon || cleanName || '').replace(/^StatTrak™\s*/i, '').replace(/^★\s*StatTrak™\s*/i, '').replace(/^★\s*/, '').trim();
    if (knifeName.includes('|')) {
      knifeName = knifeName.split('|')[0].trim();
    }
    if (skin.statTrak) {
      return `★ StatTrak™ ${knifeName}`;
    }
    return `★ ${knifeName}`;
  }

  // 1. Stickers: exact name as registered on Steam
  if (isSticker) {
    if (!cleanName.startsWith('Sticker |') && !cleanName.startsWith('Наклейка |')) {
      cleanName = `Sticker | ${cleanName}`;
    }
    return cleanName;
  }

  // 2. Charms: exact charm name
  if (isCharm) {
    if (!cleanName.startsWith('Charm |') && !cleanName.startsWith('Брелок |')) {
      cleanName = `Charm | ${cleanName}`;
    }
    return cleanName;
  }

  // 3. Agents: agent full name without wear
  if (isAgent) {
    return cleanName;
  }

  // 4. Knives & Gloves & Weapons with Wear
  const rawWeapon = (skin.weapon || '').toLowerCase();
  const rawName = (cleanName || '').toLowerCase();
  const isKnifeOrGlove =
    cleanName.startsWith('★') ||
    rawWeapon.includes('knife') ||
    rawWeapon.includes('bayonet') ||
    rawWeapon.includes('karambit') ||
    rawWeapon.includes('daggers') ||
    rawWeapon.includes('gloves') ||
    rawWeapon.includes('wraps') ||
    rawWeapon.includes('нож') ||
    rawWeapon.includes('перчатки') ||
    rawWeapon.includes('обмотки') ||
    rawName.includes('knife') ||
    rawName.includes('bayonet') ||
    rawName.includes('karambit') ||
    rawName.includes('daggers') ||
    rawName.includes('gloves') ||
    rawName.includes('wraps');

  if (isKnifeOrGlove && !cleanName.startsWith('★')) {
    cleanName = `★ ${cleanName}`;
  }

  const wear = skin.wear ? WEAR_NAME_MAP[skin.wear.toUpperCase()] : null;
  const isStatTrak = Boolean(skin.statTrak && isStatTrakableItem(skin));

  let marketName = cleanName;

  if (isKnifeOrGlove) {
    if (isStatTrak) {
      // Format: ★ StatTrak™ Knife | Skin (Wear)
      marketName = cleanName.replace(/^★\s*/, '★ StatTrak™ ');
    }
  } else if (isStatTrak) {
    // Format: StatTrak™ Weapon | Skin (Wear)
    marketName = `StatTrak™ ${cleanName}`;
  }

  if (wear) {
    marketName = `${marketName} (${wear})`;
  }

  return marketName;
}

/**
 * Returns direct official Steam Community Market listing page URL.
 * URL: https://steamcommunity.com/market/listings/730/{market_hash_name}
 */
export function getSteamMarketListingUrl(skin: Partial<SkinEntity>): string {
  const hashName = getSteamMarketHashName(skin);
  return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(hashName)}`;
}
