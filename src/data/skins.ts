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
