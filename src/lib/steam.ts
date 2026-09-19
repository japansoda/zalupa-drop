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
 * Check if skin type has wear qualities in CS2.
 * In CS2, Charms, Agents, and Stickers DO NOT have wear qualities.
 */
export function isWearableItem(skin: Partial<SkinEntity>): boolean {
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
  let cleanName = skin.name || '';
  cleanName = cleanName.replace(/^StatTrak™\s*/i, '').replace(/^★\s*StatTrak™\s*/i, '★ ').trim();
  cleanName = cleanName.replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '').trim();

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
  const wear = skin.wear ? WEAR_NAME_MAP[skin.wear.toUpperCase()] : null;
  const isStatTrak = Boolean(skin.statTrak && isStatTrakableItem(skin));
  const isKnifeOrGlove = cleanName.startsWith('★');

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
