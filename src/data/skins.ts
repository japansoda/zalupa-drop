import { SkinEntity } from '../lib/types';
import allSkinsJson from './all_skins.json';

export const SKINS_DATABASE: SkinEntity[] = allSkinsJson as SkinEntity[];

export const RARITY_CONFIG = {
  consumer: { label: 'Ширпотреб', color: '#b0c3d9', bg: 'rgba(176, 195, 217, 0.15)', border: 'rgba(176, 195, 217, 0.4)' },
  industrial: { label: 'Промышленное', color: '#5e98d9', bg: 'rgba(94, 152, 217, 0.15)', border: 'rgba(94, 152, 217, 0.4)' },
  milspec: { label: 'Армейское', color: '#4b69ff', bg: 'rgba(75, 105, 255, 0.15)', border: 'rgba(75, 105, 255, 0.5)' },
  restricted: { label: 'Запрещенное', color: '#8847ff', bg: 'rgba(136, 71, 255, 0.15)', border: 'rgba(136, 71, 255, 0.5)' },
  classified: { label: 'Засекреченное', color: '#d32ce6', bg: 'rgba(211, 44, 230, 0.15)', border: 'rgba(211, 44, 230, 0.5)' },
  covert: { label: '★ Тайное', color: '#eb4b4b', bg: 'rgba(235, 75, 75, 0.15)', border: 'rgba(235, 75, 75, 0.6)' },
  extraordinary: { label: '★ Экстраординарное', color: '#eb4b4b', bg: 'rgba(235, 75, 75, 0.15)', border: 'rgba(235, 75, 75, 0.6)' },
  gold: { label: '★ Редкий особый', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', border: 'rgba(250, 204, 21, 0.6)' },
  contraband: { label: 'Контрабанда', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.6)' },
};

// Wear qualities with deep, high-contrast tactical tones ensuring crisp white text readability
export const WEAR_CONFIG: Record<string, { label: string; short: string; color: string; bg: string; border: string }> = {
  FN: { label: 'Прямо с завода', short: 'FN', color: '#047857', bg: 'rgba(4, 120, 87, 0.25)', border: '#047857' },
  MW: { label: 'Немного поношенное', short: 'MW', color: '#4d7c0f', bg: 'rgba(77, 124, 15, 0.25)', border: '#4d7c0f' },
  FT: { label: 'После полевых испытаний', short: 'FT', color: '#b45309', bg: 'rgba(180, 83, 9, 0.25)', border: '#b45309' },
  WW: { label: 'Поношенное', short: 'WW', color: '#c2410c', bg: 'rgba(194, 65, 12, 0.25)', border: '#c2410c' },
  BS: { label: 'Закаленное в боях', short: 'BS', color: '#b91c1c', bg: 'rgba(185, 28, 28, 0.25)', border: '#b91c1c' },
};

// Sticker special effects badges
export const STICKER_EFFECT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Holo: { label: 'HOLO', color: '#d946ef', bg: 'rgba(217, 70, 239, 0.2)', border: 'rgba(217, 70, 239, 0.5)' },
  Foil: { label: 'FOIL', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.2)', border: 'rgba(148, 163, 184, 0.5)' },
  Gold: { label: 'GOLD', color: '#facc15', bg: 'rgba(250, 204, 21, 0.2)', border: 'rgba(250, 204, 21, 0.5)' },
  Glitter: { label: 'GLITTER', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)', border: 'rgba(56, 189, 248, 0.5)' },
  Lenticular: { label: 'LENTICULAR', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)', border: 'rgba(236, 72, 153, 0.5)' },
};

