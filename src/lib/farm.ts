import { SkinEntity, SkinRarity, SkinWear } from './types';
import { SKINS_DATABASE } from '../data/skins';

export type ChickenBreedId =
  | 'white_inferno'
  | 'brown_rooster'
  | 'toxic_zombie'
  | 'cyber_neon'
  | 'blaze_phoenix'
  | 'ghost_fade'
  | 'golden_nugget';

export interface ChickenBreed {
  id: ChickenBreedId;
  name: string;
  nameEn: string;
  rarity: 'common' | 'restricted' | 'classified' | 'covert' | 'legendary';
  rarityName: string;
  rarityNameEn: string;
  color: string;
  secondaryColor: string;
  description: string;
  descriptionEn: string;
  hatchWeight: number; // probability weight when hatching an egg
  eggDropTier: 'tier_common' | 'tier_restricted' | 'tier_classified' | 'tier_covert' | 'tier_legendary';
}

export const CHICKEN_BREEDS: Record<ChickenBreedId, ChickenBreed> = {
  white_inferno: {
    id: 'white_inferno',
    name: 'Белая классическая',
    nameEn: 'White Inferno',
    rarity: 'common',
    rarityName: 'Обычная',
    rarityNameEn: 'Common',
    color: '#e2e8f0',
    secondaryColor: '#ef4444',
    description: 'Легендарная курочка с карты Inferno. Любит зерно и стабильно приносит классические CS2 дропы!',
    descriptionEn: 'The legendary chicken from Inferno. Loves seeds and brings solid classic CS2 drops!',
    hatchWeight: 45,
    eggDropTier: 'tier_common',
  },
  brown_rooster: {
    id: 'brown_rooster',
    name: 'Деревенский петушок',
    nameEn: 'Village Rooster',
    rarity: 'common',
    rarityName: 'Обычный',
    rarityNameEn: 'Common',
    color: '#b45309',
    secondaryColor: '#f59e0b',
    description: 'Бодрый деревенский петух из Италии. Прилежно кукарекает и откладывает надежные оружейные яйца.',
    descriptionEn: 'Lively Italian farm rooster. Faithful morning clucker with dependable weapon egg drops.',
    hatchWeight: 26,
    eggDropTier: 'tier_common',
  },
  toxic_zombie: {
    id: 'toxic_zombie',
    name: 'Чумная курица',
    nameEn: 'Toxic Zombie',
    rarity: 'restricted',
    rarityName: 'Запрещенная',
    rarityNameEn: 'Restricted',
    color: '#84cc16',
    secondaryColor: '#15803d',
    description: 'Мутировавшая птица с ядерного полигона. Светящиеся радиоактивные глаза и повышенный шанс на Запрещенное!',
    descriptionEn: 'Mutated chicken with glowing radioactive eyes and increased drop chances for Restricted skins!',
    hatchWeight: 14,
    eggDropTier: 'tier_restricted',
  },
  cyber_neon: {
    id: 'cyber_neon',
    name: 'Кибер-курица v2.0',
    nameEn: 'Cyber Neon v2.0',
    rarity: 'classified',
    rarityName: 'Засекреченная',
    rarityNameEn: 'Classified',
    color: '#06b6d4',
    secondaryColor: '#ec4899',
    description: 'Модифицированный киборг с неоновыми контурами и HUD-визором. Сносит яйца с Засекреченным оружием!',
    descriptionEn: 'Cyborg chicken with glowing neon circuitry and HUD visor. Lays eggs with Classified grade skins!',
    hatchWeight: 8,
    eggDropTier: 'tier_classified',
  },
  blaze_phoenix: {
    id: 'blaze_phoenix',
    name: 'Пламенный Феникс',
    nameEn: 'Blaze Phoenix',
    rarity: 'covert',
    rarityName: 'Тайная',
    rarityNameEn: 'Covert',
    color: '#f97316',
    secondaryColor: '#dc2626',
    description: 'Рождённая в огне Молотова! Пылающие крылья и магматический клюв. Высокий шанс на Тайные скины и ножи!',
    descriptionEn: 'Born in a Molotov fire! Burning wings, ember beak, and high probability of Coverts & Knives!',
    hatchWeight: 4,
    eggDropTier: 'tier_covert',
  },
  ghost_fade: {
    id: 'ghost_fade',
    name: 'Призрачный Fade',
    nameEn: 'Ghost Fade',
    rarity: 'covert',
    rarityName: 'Тайная',
    rarityNameEn: 'Covert',
    color: '#a855f7',
    secondaryColor: '#06b6d4',
    description: 'Переливающийся CS2 Градиент с призрачным эфиром. Премиум коллекция ножей и перчаток!',
    descriptionEn: 'Shimmering CS2 Fade chromatic gradient with spectral smoke. Premium tier Knives & Gloves drops!',
    hatchWeight: 2.2,
    eggDropTier: 'tier_covert',
  },
  golden_nugget: {
    id: 'golden_nugget',
    name: 'Золотой Самородок ★',
    nameEn: 'Golden Nugget ★',
    rarity: 'legendary',
    rarityName: 'Экстраординарная',
    rarityNameEn: 'Legendary',
    color: '#eab308',
    secondaryColor: '#fef08a',
    description: 'Королевская птица из чистого золота 999 пробы с сияющей короной. Преимущественно сносит ножи и перчатки!',
    descriptionEn: 'Pure 24k gold royal chicken wearing a diamond crown. Exclusively lays eggs with Knives & Gloves!',
    hatchWeight: 0.8,
    eggDropTier: 'tier_legendary',
  },
};

export interface ChickenEntity {
  id: string;
  breedId: ChickenBreedId;
  name: string;
  nameEn: string;
  hatchedAt: number;
  eggsLaidCount: number;
}

export type FarmSlotStatus = 'empty' | 'incubating' | 'hatch_ready' | 'chicken' | 'egg_ready';

export interface FarmSlot {
  index: number;
  status: FarmSlotStatus;
  incubatingUntil?: number; // timestamp ms (e.g. 2 hours from start)
  incubationStartedAt?: number;
  chicken?: ChickenEntity;
  feedStatus?: 'hungry' | 'producing';
  eggReadyUntil?: number; // timestamp ms when egg will be ready to crack
  readyEggBreed?: ChickenBreedId; // stores breed of chicken that produced the ready egg
}

export const INCUBATION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
export const EGG_PRODUCTION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Filter out stickers, charms, agents, patches.
 * Guaranteed strictly actual weapons, knives, and gloves!
 */
export function isActualWeaponOrKnifeGlove(skin: SkinEntity): boolean {
  if (!skin) return false;
  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();

  if (w.includes('sticker') || w.includes('наклейка') || n.startsWith('sticker |') || n.startsWith('наклейка |')) return false;
  if (w.includes('charm') || w.includes('брелок') || n.startsWith('charm |') || n.startsWith('брелок |')) return false;
  if (w.includes('agent') || w.includes('оперативник') || n.startsWith('agent |') || n.startsWith('оперативник |')) return false;
  if (w.includes('patch') || w.includes('нашивка') || n.startsWith('patch |')) return false;
  if (w.includes('music') || w.includes('музыка') || n.startsWith('music kit |')) return false;
  if (w.includes('pin') || w.includes('значок') || n.startsWith('pin |')) return false;

  return true;
}

/**
 * Pick a random chicken breed when an egg hatches
 */
export function rollHatchedChickenBreed(): ChickenBreedId {
  const breeds = Object.values(CHICKEN_BREEDS);
  const totalWeight = breeds.reduce((sum, b) => sum + b.hatchWeight, 0);
  let rnd = Math.random() * totalWeight;

  for (const b of breeds) {
    if (rnd <= b.hatchWeight) {
      return b.id;
    }
    rnd -= b.hatchWeight;
  }
  return 'white_inferno';
}

/**
 * Roll a skin drop from an egg laid by a specific chicken breed.
 * STRICT: Absolutely NO stickers, NO charms, NO agents!
 * Higher breed rarity yields higher-value weapons, covert skins, and knives/gloves.
 */
export function rollEggSkinDrop(breedId: ChickenBreedId): SkinEntity {
  const breed = CHICKEN_BREEDS[breedId] || CHICKEN_BREEDS.white_inferno;
  
  // Filter all weapons/knives/gloves
  const weaponsPool = SKINS_DATABASE.filter(isActualWeaponOrKnifeGlove);
  
  const knivesAndGloves = weaponsPool.filter(
    (s) => s.name.startsWith('★') || s.rarity === 'gold' || s.rarity === 'extraordinary' || (s.weapon || '').toLowerCase().includes('knife') || (s.weapon || '').toLowerCase().includes('gloves')
  );
  const covertPool = weaponsPool.filter((s) => s.rarity === 'covert');
  const classifiedPool = weaponsPool.filter((s) => s.rarity === 'classified');
  const restrictedPool = weaponsPool.filter((s) => s.rarity === 'restricted');
  const milspecPool = weaponsPool.filter((s) => s.rarity === 'milspec' || s.rarity === 'industrial' || s.rarity === 'consumer');

  const roll = Math.random() * 100;

  let candidateBucket: SkinEntity[] = [];

  switch (breed.eggDropTier) {
    case 'tier_legendary':
      // Golden Rooster: 75% Knives/Gloves, 25% Covert
      if (roll < 75 && knivesAndGloves.length > 0) {
        candidateBucket = knivesAndGloves;
      } else {
        candidateBucket = covertPool.length > 0 ? covertPool : knivesAndGloves;
      }
      break;

    case 'tier_covert':
      // Blaze / Fade: 40% Knives/Gloves, 50% Covert, 10% Classified
      if (roll < 40 && knivesAndGloves.length > 0) {
        candidateBucket = knivesAndGloves;
      } else if (roll < 90 && covertPool.length > 0) {
        candidateBucket = covertPool;
      } else {
        candidateBucket = classifiedPool;
      }
      break;

    case 'tier_classified':
      // Cyber Neon: 15% Knives/Gloves, 45% Covert, 40% Classified
      if (roll < 15 && knivesAndGloves.length > 0) {
        candidateBucket = knivesAndGloves;
      } else if (roll < 60 && covertPool.length > 0) {
        candidateBucket = covertPool;
      } else {
        candidateBucket = classifiedPool;
      }
      break;

    case 'tier_restricted':
      // Toxic Zombie: 5% Knives, 20% Covert, 40% Classified, 35% Restricted
      if (roll < 5 && knivesAndGloves.length > 0) {
        candidateBucket = knivesAndGloves;
      } else if (roll < 25 && covertPool.length > 0) {
        candidateBucket = covertPool;
      } else if (roll < 65 && classifiedPool.length > 0) {
        candidateBucket = classifiedPool;
      } else {
        candidateBucket = restrictedPool;
      }
      break;

    case 'tier_common':
    default:
      // White / Brown: 2% Knives, 8% Covert, 25% Classified, 40% Restricted, 25% Mil-Spec
      if (roll < 2 && knivesAndGloves.length > 0) {
        candidateBucket = knivesAndGloves;
      } else if (roll < 10 && covertPool.length > 0) {
        candidateBucket = covertPool;
      } else if (roll < 35 && classifiedPool.length > 0) {
        candidateBucket = classifiedPool;
      } else if (roll < 75 && restrictedPool.length > 0) {
        candidateBucket = restrictedPool;
      } else {
        candidateBucket = milspecPool.length > 0 ? milspecPool : restrictedPool;
      }
      break;
  }

  if (candidateBucket.length === 0) {
    candidateBucket = weaponsPool;
  }

  const selectedSkin = candidateBucket[Math.floor(Math.random() * candidateBucket.length)];

  // Give wear & potential StatTrak
  const wears: SkinWear[] = ['FN', 'MW', 'FT'];
  const wearIdx = Math.floor(Math.random() * wears.length);
  const isSt = Math.random() < 0.15 && !selectedSkin.name.startsWith('★');

  return {
    ...selectedSkin,
    wear: wears[wearIdx],
    statTrak: isSt,
  };
}
