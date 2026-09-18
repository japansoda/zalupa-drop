import { SkinRarity } from './types';

export interface UpgradeToken {
  id: string;
  name: string;
  rarity: SkinRarity;
  valueDc: number;
  maxTargetDc: number;
}

export const UPGRADE_TOKENS: UpgradeToken[] = [
  { id: 'token_consumer', name: 'Ширпотреб Токен', rarity: 'consumer', valueDc: 500, maxTargetDc: 2000 },
  { id: 'token_industrial', name: 'Промышленный Токен', rarity: 'industrial', valueDc: 1500, maxTargetDc: 5000 },
  { id: 'token_milspec', name: 'Армейский Токен', rarity: 'milspec', valueDc: 5000, maxTargetDc: 15000 },
  { id: 'token_restricted', name: 'Запрещенный Токен', rarity: 'restricted', valueDc: 15000, maxTargetDc: 35000 },
  { id: 'token_classified', name: 'Засекреченный Токен', rarity: 'classified', valueDc: 35000, maxTargetDc: 65000 },
  { id: 'token_covert', name: '★ Тайный Токен', rarity: 'covert', valueDc: 70000, maxTargetDc: 85000 },
  { id: 'token_gold', name: '★ Золотой Токен', rarity: 'gold', valueDc: 100000, maxTargetDc: 120000 },
];

export interface LuckPotion {
  id: 'potion_luck';
  name: 'Зелье удачи';
  rarity: 'contraband';
  charges: number;
  bonusChancePercent: number;
  description: string;
}

export const LUCK_POTION: LuckPotion = {
  id: 'potion_luck',
  name: 'Зелье удачи',
  rarity: 'contraband',
  charges: 3,
  bonusChancePercent: 15,
  description: '+15% к шансу на следующие 3 апгрейда',
};

// Roll drop from opening a case
export function rollCaseBonusDrop(): { token?: UpgradeToken; potion?: boolean } {
  const res: { token?: UpgradeToken; potion?: boolean } = {};

  // 24% chance to drop an upgrade token alongside the regular skin
  if (Math.random() < 0.24) {
    const roll = Math.random() * 100;
    // Higher rarity = rarer
    if (roll < 0.5) {
      res.token = UPGRADE_TOKENS.find((t) => t.id === 'token_gold');
    } else if (roll < 1.8) {
      res.token = UPGRADE_TOKENS.find((t) => t.id === 'token_covert');
    } else if (roll < 5.5) {
      res.token = UPGRADE_TOKENS.find((t) => t.id === 'token_classified');
    } else if (roll < 14.0) {
      res.token = UPGRADE_TOKENS.find((t) => t.id === 'token_restricted');
    } else if (roll < 32.0) {
      res.token = UPGRADE_TOKENS.find((t) => t.id === 'token_milspec');
    } else if (roll < 62.0) {
      res.token = UPGRADE_TOKENS.find((t) => t.id === 'token_industrial');
    } else {
      res.token = UPGRADE_TOKENS.find((t) => t.id === 'token_consumer');
    }
  }

  // 6% chance to drop Luck Potion (Contraband)
  if (Math.random() < 0.06) {
    res.potion = true;
  }

  return res;
}

// Roll token for consolation prize in upgrader
export function rollConsolationToken(): UpgradeToken {
  const roll = Math.random() * 100;
  if (roll < 0.5) return UPGRADE_TOKENS[6]; // Gold
  if (roll < 2.0) return UPGRADE_TOKENS[5]; // Covert
  if (roll < 6.0) return UPGRADE_TOKENS[4]; // Classified
  if (roll < 16.0) return UPGRADE_TOKENS[3]; // Restricted
  if (roll < 38.0) return UPGRADE_TOKENS[2]; // Milspec
  if (roll < 70.0) return UPGRADE_TOKENS[1]; // Industrial
  return UPGRADE_TOKENS[0]; // Consumer
}
