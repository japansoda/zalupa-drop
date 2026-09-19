import { SkinEntity } from './types';
import officialCaseKnifeIds from '../data/official_case_knife_ids.json';
import { SKINS_DATABASE } from '../data/skins';

export const SPECIAL_ITEM_ENTITY: SkinEntity = {
  id: 'special_rare_item',
  name: '★ Редкий особый предмет',
  weapon: '★',
  skinName: 'Редкий особый предмет',
  rarity: 'gold',
  wear: 'FN',
  wearLabel: 'Прямо с завода',
  image: '/images/special_item.png',
  priceUsd: 1500,
  priceDc: 150000,
  steamMarketUrl: '',
};

export const isKnifeOrGlove = (s?: SkinEntity | null): boolean => {
  if (!s) return false;
  if (s.id === 'special_rare_item') return true;
  if (s.rarity === 'gold' || s.rarity === 'extraordinary') return true;
  const w = (s.weapon || '').toLowerCase();
  return (
    w.includes('knife') ||
    w.includes('bayonet') ||
    w.includes('karambit') ||
    w.includes('daggers') ||
    w.includes('gloves') ||
    w.includes('wraps')
  );
};

// Fast ID-to-Skin map
const skinByIdMap = new Map<string, SkinEntity>();
for (const s of SKINS_DATABASE) {
  skinByIdMap.set(s.id, s);
}

const poolCache = new Map<string, SkinEntity[]>();

export function isOfficialCase(caseId?: string, category?: string): boolean {
  if (category === 'official') return true;
  if (!caseId) return false;
  return Boolean((officialCaseKnifeIds as Record<string, string[]>)[caseId]);
}

export function getCaseKnifePool(caseId: string): SkinEntity[] {
  if (poolCache.has(caseId)) {
    return poolCache.get(caseId)!;
  }

  const ids = (officialCaseKnifeIds as Record<string, string[]>)[caseId];
  if (!ids || ids.length === 0) {
    // Fallback: all knives/gloves from SKINS_DATABASE
    const fallback = SKINS_DATABASE.filter(isKnifeOrGlove).map((s) => ({
      ...s,
      rarity: 'gold' as const,
    }));
    poolCache.set(caseId, fallback);
    return fallback;
  }

  const pool: SkinEntity[] = [];
  for (const id of ids) {
    const item = skinByIdMap.get(id);
    if (item) {
      pool.push({
        ...item,
        rarity: 'gold',
      });
    }
  }

  poolCache.set(caseId, pool);
  return pool;
}

export function rollSpecialKnifeDrop(caseId: string): SkinEntity {
  const pool = getCaseKnifePool(caseId);
  if (pool.length === 0) return SPECIAL_ITEM_ENTITY;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
