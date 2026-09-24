import { SkinEntity, SkinRarity, SkinWear } from './types';
import { SKINS_DATABASE } from '../data/skins';

export type ChickenBreedId =
  | 'white_inferno'
  | 'brown_rooster'
  | 'toxic_zombie'
  | 'cyber_neon'
  | 'asiimov'
  | 'case_hardened'
  | 'blaze_phoenix'
  | 'printstream'
  | 'ghost_fade'
  | 'golden_nugget'
  | 'dragon_lore'
  | 'howl';

export type EggPatternType =
  | 'porcelain'
  | 'speckled'
  | 'toxic'
  | 'cyber'
  | 'magma'
  | 'asiimov'
  | 'case_hardened'
  | 'printstream'
  | 'fade'
  | 'gold'
  | 'dragon'
  | 'howl';

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
  eggPattern: EggPatternType;
  eggShellColor: string;
  eggGlowColor: string;
  eggNameRu: string;
  eggNameEn: string;
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
    hatchWeight: 36,
    eggDropTier: 'tier_common',
    eggPattern: 'porcelain',
    eggShellColor: '#f1f5f9',
    eggGlowColor: 'rgba(255,255,255,0.4)',
    eggNameRu: 'Белое яйцо Инферно',
    eggNameEn: 'White Inferno Egg',
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
    hatchWeight: 22,
    eggDropTier: 'tier_common',
    eggPattern: 'speckled',
    eggShellColor: '#d97706',
    eggGlowColor: 'rgba(217,119,6,0.4)',
    eggNameRu: 'Крапчатое фермерское яйцо',
    eggNameEn: 'Speckled Farm Egg',
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
    eggPattern: 'toxic',
    eggShellColor: '#4d7c0f',
    eggGlowColor: 'rgba(132,204,22,0.6)',
    eggNameRu: 'Радиоактивное яйцо',
    eggNameEn: 'Toxic Biohazard Egg',
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
    hatchWeight: 9,
    eggDropTier: 'tier_classified',
    eggPattern: 'cyber',
    eggShellColor: '#0f172a',
    eggGlowColor: 'rgba(6,182,212,0.6)',
    eggNameRu: 'Кибернетическое яйцо',
    eggNameEn: 'Cybernetic Matrix Egg',
  },
  asiimov: {
    id: 'asiimov',
    name: 'Азимов (Asiimov)',
    nameEn: 'Asiimov Mecha',
    rarity: 'restricted',
    rarityName: 'Запрещенная',
    rarityNameEn: 'Restricted',
    color: '#f97316',
    secondaryColor: '#18181b',
    description: 'Высокотехнологичный боевой дрон в легендарной расцветке Asiimov с цифровыми оптическими сенсорами.',
    descriptionEn: 'High-tech combat mech in iconic Asiimov styling with optical target-tracking sensors.',
    hatchWeight: 7,
    eggDropTier: 'tier_restricted',
    eggPattern: 'asiimov',
    eggShellColor: '#fafafa',
    eggGlowColor: 'rgba(249,115,22,0.6)',
    eggNameRu: 'Яйцо Азимов',
    eggNameEn: 'Asiimov Tech Egg',
  },
  case_hardened: {
    id: 'case_hardened',
    name: 'Blue Gem (Закалка)',
    nameEn: 'Case Hardened (Blue Gem)',
    rarity: 'classified',
    rarityName: 'Засекреченная',
    rarityNameEn: 'Classified',
    color: '#38bdf8',
    secondaryColor: '#eab308',
    description: 'Редчайший паттерн 661 с зеркальным синим блеском и золотыми переливами закалённой стали.',
    descriptionEn: 'Ultra-rare tier-1 661 Blue Gem pattern with iridescent turquoise patina and gold highlights.',
    hatchWeight: 4.5,
    eggDropTier: 'tier_classified',
    eggPattern: 'case_hardened',
    eggShellColor: '#0284c7',
    eggGlowColor: 'rgba(56,189,248,0.7)',
    eggNameRu: 'Яйцо Blue Gem',
    eggNameEn: 'Blue Gem Egg',
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
    hatchWeight: 3.5,
    eggDropTier: 'tier_covert',
    eggPattern: 'magma',
    eggShellColor: '#991b1b',
    eggGlowColor: 'rgba(249,115,22,0.7)',
    eggNameRu: 'Пламенное яйцо Феникса',
    eggNameEn: 'Phoenix Magma Egg',
  },
  printstream: {
    id: 'printstream',
    name: 'Printstream',
    nameEn: 'Printstream',
    rarity: 'covert',
    rarityName: 'Тайная',
    rarityNameEn: 'Covert',
    color: '#f8fafc',
    secondaryColor: '#ec4899',
    description: 'Перламутровый матовый полимер с голографическим переливом, крестами XX и монохромным цифровым кодом.',
    descriptionEn: 'Silky pearlescent polymer with holographic sheen, XX decals and digital ASCII barcode.',
    hatchWeight: 2.2,
    eggDropTier: 'tier_covert',
    eggPattern: 'printstream',
    eggShellColor: '#f8fafc',
    eggGlowColor: 'rgba(236,72,153,0.7)',
    eggNameRu: 'Яйцо Printstream',
    eggNameEn: 'Printstream Egg',
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
    hatchWeight: 1.2,
    eggDropTier: 'tier_covert',
    eggPattern: 'fade',
    eggShellColor: '#7e22ce',
    eggGlowColor: 'rgba(168,85,247,0.7)',
    eggNameRu: 'Яйцо Fade Градиент',
    eggNameEn: 'Chromatic Fade Egg',
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
    hatchWeight: 0.6,
    eggDropTier: 'tier_legendary',
    eggPattern: 'gold',
    eggShellColor: '#ca8a04',
    eggGlowColor: 'rgba(234,179,8,0.85)',
    eggNameRu: 'Золотой самородок-яйцо ★',
    eggNameEn: '24K Golden Nugget Egg ★',
  },
  dragon_lore: {
    id: 'dragon_lore',
    name: 'Dragon Lore ★',
    nameEn: 'Dragon Lore ★',
    rarity: 'legendary',
    rarityName: 'Экстраординарная',
    rarityNameEn: 'Legendary',
    color: '#ca8a04',
    secondaryColor: '#16a34a',
    description: 'Древний дракон из кельтских преданий. Огненное пламя и исключительный шанс на элитные ножи и снайперки!',
    descriptionEn: 'Ancient Celtic dragon rooster with emerald eyes. High tier knives and legendary covert snipers!',
    hatchWeight: 0.35,
    eggDropTier: 'tier_legendary',
    eggPattern: 'dragon',
    eggShellColor: '#854d0e',
    eggGlowColor: 'rgba(202,138,4,0.85)',
    eggNameRu: 'Яйцо Dragon Lore ★',
    eggNameEn: 'Dragon Lore Egg ★',
  },
  howl: {
    id: 'howl',
    name: 'Вой (Howl) ★',
    nameEn: 'Howl Beast ★',
    rarity: 'legendary',
    rarityName: 'Контрабанда',
    rarityNameEn: 'Contraband',
    color: '#ef4444',
    secondaryColor: '#ea580c',
    description: 'Контрабандная ярость дикого волка. Пылающая грива и раскаленные угли. Самый ценный оружейный дроп!',
    descriptionEn: 'Contraband wolf fire rooster. Flaming crimson aura with the absolute rarest CS2 armory drops!',
    hatchWeight: 0.15,
    eggDropTier: 'tier_legendary',
    eggPattern: 'howl',
    eggShellColor: '#18181b',
    eggGlowColor: 'rgba(239,68,68,0.9)',
    eggNameRu: 'Контрабандное яйцо Howl ★',
    eggNameEn: 'Contraband Howl Egg ★',
  },
};

export interface ChickenEntity {
  id: string;
  breedId: ChickenBreedId;
  name: string;
  nameEn: string;
  hatchedAt: number;
  eggsLaidCount: number;
  isStatTrak?: boolean;
  hasLuckPotion?: boolean;
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
  hasLuckPotion?: boolean; // Potion effect: emerald aura, clover particles, boosted drops
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
 * Pick a random chicken breed when an egg hatches.
 * When hasLuckPotion is true, covert and legendary breeds have 3.5x higher weights!
 */
export function rollHatchedChickenBreed(hasLuckPotion = false): ChickenBreedId {
  const breeds = Object.values(CHICKEN_BREEDS);
  const weightedBreeds = breeds.map((b) => {
    let weight = b.hatchWeight;
    if (hasLuckPotion) {
      if (b.rarity === 'legendary') weight *= 4.5;
      else if (b.rarity === 'covert') weight *= 3.0;
      else if (b.rarity === 'classified') weight *= 2.0;
      else if (b.rarity === 'common') weight *= 0.4;
    }
    return { id: b.id, weight };
  });

  const totalWeight = weightedBreeds.reduce((sum, b) => sum + b.weight, 0);
  let rnd = Math.random() * totalWeight;

  for (const b of weightedBreeds) {
    if (rnd <= b.weight) {
      return b.id;
    }
    rnd -= b.weight;
  }
  return 'white_inferno';
}

/**
 * 15% probability for a hatched chicken to be StatTrak™
 * Luck potion increases it to 35%!
 */
export function rollIsStatTrakChicken(hasLuckPotion = false): boolean {
  return Math.random() < (hasLuckPotion ? 0.35 : 0.15);
}

/**
 * Calculate the sell value of a chicken in DropCoins.
 * Tiered base price by rarity + 50% StatTrak multiplier + 1,000 DC per egg laid.
 */
export function calculateChickenSellPrice(
  breedId: ChickenBreedId,
  isStatTrak = false,
  eggsLaidCount = 0
): number {
  const breed = CHICKEN_BREEDS[breedId] || CHICKEN_BREEDS.white_inferno;
  let basePrice = 25000; // Common base

  switch (breed.rarity) {
    case 'legendary':
      basePrice = 1200000;
      break;
    case 'covert':
      basePrice = 450000;
      break;
    case 'classified':
      basePrice = 160000;
      break;
    case 'restricted':
      basePrice = 65000;
      break;
    case 'common':
    default:
      basePrice = 25000;
      break;
  }

  if (isStatTrak) {
    basePrice = Math.round(basePrice * 1.5);
  }

  // Bonus for seasoned egg layers
  basePrice += (eggsLaidCount || 0) * 1000;

  return basePrice;
}

/**
 * Helper to get human-readable loot odds description for ChickenDetailsModal
 */
export function getBreedDropTierStats(breedId: ChickenBreedId, locale: string = 'ru') {
  const breed = CHICKEN_BREEDS[breedId] || CHICKEN_BREEDS.white_inferno;
  const isRu = locale === 'ru';

  switch (breed.eggDropTier) {
    case 'tier_legendary':
      return {
        knivesGloves: '75%',
        covert: '25%',
        classified: '0%',
        summary: isRu ? '75% Ножи & Перчатки · 25% Тайное' : '75% Knives & Gloves · 25% Covert',
      };
    case 'tier_covert':
      return {
        knivesGloves: '40%',
        covert: '50%',
        classified: '10%',
        summary: isRu ? '40% Ножи & Перчатки · 50% Тайное' : '40% Knives & Gloves · 50% Covert',
      };
    case 'tier_classified':
      return {
        knivesGloves: '15%',
        covert: '45%',
        classified: '40%',
        summary: isRu ? '15% Ножи · 45% Тайное · 40% Засекреченное' : '15% Knives · 45% Covert · 40% Classified',
      };
    case 'tier_restricted':
      return {
        knivesGloves: '5%',
        covert: '20%',
        classified: '40%',
        summary: isRu ? '5% Ножи · 20% Тайное · 40% Засекреченное' : '5% Knives · 20% Covert · 40% Classified',
      };
    case 'tier_common':
    default:
      return {
        knivesGloves: '2%',
        covert: '8%',
        classified: '25%',
        summary: isRu ? '2% Ножи · 8% Тайное · 25% Засекреченное' : '2% Knives · 8% Covert · 25% Classified',
      };
  }
}

/**
 * Roll a skin drop from an egg laid by a specific chicken breed.
 * STRICT: Absolutely NO stickers, NO charms, NO agents!
 * When hasLuckPotion is true, knife/glove chances are dramatically increased!
 */
export function rollEggSkinDrop(breedId: ChickenBreedId, hasLuckPotion = false): SkinEntity {
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
      // Golden Rooster: 75% Knives/Gloves, 25% Covert. Luck potion makes it 90% Knives!
      const legKnifePct = hasLuckPotion ? 90 : 75;
      if (roll < legKnifePct && knivesAndGloves.length > 0) {
        candidateBucket = knivesAndGloves;
      } else {
        candidateBucket = covertPool.length > 0 ? covertPool : knivesAndGloves;
      }
      break;

    case 'tier_covert':
      // Blaze / Fade: 40% Knives/Gloves, 50% Covert, 10% Classified. Luck potion: 65% Knives, 35% Covert!
      const covKnifePct = hasLuckPotion ? 65 : 40;
      const covCovertPct = hasLuckPotion ? 95 : 90;
      if (roll < covKnifePct && knivesAndGloves.length > 0) {
        candidateBucket = knivesAndGloves;
      } else if (roll < covCovertPct && covertPool.length > 0) {
        candidateBucket = covertPool;
      } else {
        candidateBucket = classifiedPool;
      }
      break;

    case 'tier_classified':
      // Cyber Neon: 15% Knives, 45% Covert, 40% Classified. Luck potion: 35% Knives, 50% Covert!
      const classKnifePct = hasLuckPotion ? 35 : 15;
      const classCovertPct = hasLuckPotion ? 85 : 60;
      if (roll < classKnifePct && knivesAndGloves.length > 0) {
        candidateBucket = knivesAndGloves;
      } else if (roll < classCovertPct && covertPool.length > 0) {
        candidateBucket = covertPool;
      } else {
        candidateBucket = classifiedPool;
      }
      break;

    case 'tier_restricted':
      // Toxic Zombie: 5% Knives, 20% Covert, 40% Classified, 35% Restricted. Luck potion: 18% Knives, 42% Covert!
      const resKnifePct = hasLuckPotion ? 18 : 5;
      const resCovertPct = hasLuckPotion ? 60 : 25;
      if (roll < resKnifePct && knivesAndGloves.length > 0) {
        candidateBucket = knivesAndGloves;
      } else if (roll < resCovertPct && covertPool.length > 0) {
        candidateBucket = covertPool;
      } else if (roll < (hasLuckPotion ? 90 : 65) && classifiedPool.length > 0) {
        candidateBucket = classifiedPool;
      } else {
        candidateBucket = restrictedPool;
      }
      break;

    case 'tier_common':
    default:
      // White / Brown: 2% Knives, 8% Covert, 25% Classified. Luck potion: 10% Knives, 25% Covert, 40% Classified!
      const comKnifePct = hasLuckPotion ? 10 : 2;
      const comCovertPct = hasLuckPotion ? 35 : 10;
      const comClassPct = hasLuckPotion ? 75 : 35;
      if (roll < comKnifePct && knivesAndGloves.length > 0) {
        candidateBucket = knivesAndGloves;
      } else if (roll < comCovertPct && covertPool.length > 0) {
        candidateBucket = covertPool;
      } else if (roll < comClassPct && classifiedPool.length > 0) {
        candidateBucket = classifiedPool;
      } else if (roll < (hasLuckPotion ? 95 : 75) && restrictedPool.length > 0) {
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
  const isSt = (Math.random() < (hasLuckPotion ? 0.35 : 0.15)) && !selectedSkin.name.startsWith('★');

  return {
    ...selectedSkin,
    wear: wears[wearIdx],
    statTrak: isSt,
  };
}
