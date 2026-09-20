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
  description: 'Универсальная удача на 3 действия: кейсы, апгрейдер и контракты',
};

// Roll drop from opening a case
export function rollCaseBonusDrop(): { token?: UpgradeToken; potion?: boolean } {
  // Rare bonus drop: only 5.5% overall chance to get ANY bonus drop on opening a case
  if (Math.random() > 0.055) {
    return {};
  }

  // Luck Potion is Contraband rarity — extremely rare (~3% of bonus drops -> ~0.16% per case opening)
  if (Math.random() < 0.03) {
    return { potion: true };
  }

  // Otherwise, roll an Upgrade Token with rarity weighting (higher rarity = much rarer)
  const roll = Math.random() * 100;
  let token: UpgradeToken;
  if (roll < 0.1) {
    // 0.1% -> ★ Gold Token
    token = UPGRADE_TOKENS[6];
  } else if (roll < 0.5) {
    // 0.4% -> ★ Covert Token
    token = UPGRADE_TOKENS[5];
  } else if (roll < 1.8) {
    // 1.3% -> Classified Token
    token = UPGRADE_TOKENS[4];
  } else if (roll < 6.0) {
    // 4.2% -> Restricted Token
    token = UPGRADE_TOKENS[3];
  } else if (roll < 16.0) {
    // 10% -> Mil-Spec Token
    token = UPGRADE_TOKENS[2];
  } else if (roll < 42.0) {
    // 26% -> Industrial Token
    token = UPGRADE_TOKENS[1];
  } else {
    // 58% -> Consumer Token
    token = UPGRADE_TOKENS[0];
  }

  return { token };
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
