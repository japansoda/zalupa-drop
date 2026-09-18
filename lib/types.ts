export type RarityTier = 
  | "consumer"     // Ширпотреб (Gray)
  | "industrial"   // Промышленное (Light Blue)
  | "milspec"      // Армейское качество (Blue)
  | "restricted"   // Запрещенное (Purple)
  | "classified"   // Засекреченное (Pink)
  | "covert"       // Тайное (Red)
  | "special";     // Экстраординарное (Gold / Ножи / Перчатки)

export type WearCondition = "FN" | "MW" | "FT" | "WW" | "BS";

export interface RarityConfig {
  nameRu: string;
  color: string;
  borderClass: string;
  bgClass: string;
  glowClass: string;
  textClass: string;
  dropChance: number; // percentage
}

export const RARITY_MAP: Record<RarityTier, RarityConfig> = {
  consumer: {
    nameRu: "Ширпотреб",
    color: "#b0c3d9",
    borderClass: "border-[#b0c3d9]/40",
    bgClass: "bg-[#b0c3d9]/10",
    glowClass: "shadow-[0_0_15px_rgba(176,195,217,0.3)]",
    textClass: "text-[#b0c3d9]",
    dropChance: 40.0,
  },
  industrial: {
    nameRu: "Промышленное",
    color: "#5e98d9",
    borderClass: "border-[#5e98d9]/40",
    bgClass: "bg-[#5e98d9]/10",
    glowClass: "shadow-[0_0_15px_rgba(94,152,217,0.3)]",
    textClass: "text-[#5e98d9]",
    dropChance: 30.0,
  },
  milspec: {
    nameRu: "Армейское качество",
    color: "#4b69ff",
    borderClass: "border-[#4b69ff]/40",
    bgClass: "bg-[#4b69ff]/10",
    glowClass: "shadow-[0_0_15px_rgba(75,105,255,0.3)]",
    textClass: "text-[#4b69ff]",
    dropChance: 18.0,
  },
  restricted: {
    nameRu: "Запрещенное",
    color: "#8847ff",
    borderClass: "border-[#8847ff]/40",
    bgClass: "bg-[#8847ff]/10",
    glowClass: "shadow-[0_0_20px_rgba(136,71,255,0.4)]",
    textClass: "text-[#8847ff]",
    dropChance: 7.5,
  },
  classified: {
    nameRu: "Засекреченное",
    color: "#d32ce6",
    borderClass: "border-[#d32ce6]/50",
    bgClass: "bg-[#d32ce6]/10",
    glowClass: "shadow-[0_0_25px_rgba(211,44,230,0.5)]",
    textClass: "text-[#d32ce6]",
    dropChance: 3.2,
  },
  covert: {
    nameRu: "Тайное",
    color: "#eb4b4b",
    borderClass: "border-[#eb4b4b]/60",
    bgClass: "bg-[#eb4b4b]/15",
    glowClass: "shadow-[0_0_30px_rgba(235,75,75,0.6)]",
    textClass: "text-[#eb4b4b]",
    dropChance: 0.9,
  },
  special: {
    nameRu: "Экстраординарное",
    color: "#ffd700",
    borderClass: "border-[#ffd700]/70",
    bgClass: "bg-[#ffd700]/15",
    glowClass: "shadow-[0_0_35px_rgba(255,215,0,0.7)]",
    textClass: "text-[#ffd700]",
    dropChance: 0.4,
  },
};

export const WEAR_NAMES: Record<WearCondition, string> = {
  FN: "Прямо с завода",
  MW: "Немного поношенное",
  FT: "После полевых испытаний",
  WW: "Поношенное",
  BS: "Закаленное в боях",
};

export interface Skin {
  id: string;
  name: string;
  weapon: string;
  skinName: string;
  rarity: RarityTier;
  wear: WearCondition;
  statTrak?: boolean;
  priceDC: number;
  imageUrl: string;
  steamMarketUrl: string;
}

export interface CaseItem {
  id: string;
  name: string;
  priceDC: number;
  imageUrl: string;
  description: string;
  category: "popular" | "exclusive" | "cheap" | "knives";
  badge?: string;
  skins: Skin[];
}

export interface InventoryItem extends Skin {
  instanceId: string;
  acquiredAt: number;
  source: "case" | "upgrade" | "crash" | "coinflip";
}

export interface LiveDrop {
  id: string;
  userName: string;
  avatarUrl: string;
  skin: Skin;
  caseName?: string;
  timestamp: number;
}
