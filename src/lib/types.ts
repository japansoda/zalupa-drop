export type SkinRarity = 
  | 'consumer'       // Ширпотреб (#b0c3d9)
  | 'industrial'     // Промышленное (#5e98d9)
  | 'milspec'        // Армейское (#4b69ff)
  | 'restricted'     // Запрещенное (#8847ff)
  | 'classified'     // Засекреченное (#d32ce6)
  | 'covert'         // ★ Тайное (#eb4b4b)
  | 'extraordinary'  // ★ Экстраординарное (#eb4b4b)
  | 'gold'           // ★ Особый редкий (#ffd700)
  | 'contraband';    // Контрабанда (#e4ae39)

export type SkinWear = 'FN' | 'MW' | 'FT' | 'WW' | 'BS';

export interface SkinEntity {
  id: string;
  name: string;
  weapon: string;
  skinName: string;
  rarity: SkinRarity;
  wear: SkinWear;
  wearLabel: string;
  image: string;
  priceUsd: number;
  priceDc: number;
  steamMarketUrl: string;
  statTrak?: boolean;
  effect?: 'Holo' | 'Foil' | 'Gold' | 'Glitter' | 'Lenticular';
  category?: string;
}

export interface CaseItem {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  priceDc: number;
  badge?: string;
  category?: 'official' | 'custom' | 'knives' | 'budget' | 'highroller' | 'weapons' | 'stickers';
  skins: SkinEntity[];
}

export interface InventoryItem extends SkinEntity {
  instanceId: string;
  obtainedAt: number;
}

export interface LiveDrop {
  id: string;
  user: string;
  avatar: string;
  skin: SkinEntity;
  caseName: string;
  timestamp: number;
}

export interface UserStats {
  casesOpened: number;
  totalWonDc: number;
  upgradesWon: number;
  upgradesLost: number;
  crashWonDc: number;
}
