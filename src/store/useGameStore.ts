import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { InventoryItem, LiveDrop, SkinEntity, UserStats } from '../lib/types';
import { sound } from '../lib/sound';
import { SKINS_DATABASE } from '../data/skins';

interface GameState {
  balance: number;
  inventory: InventoryItem[];
  soundEnabled: boolean;
  liveDrops: LiveDrop[];
  stats: UserStats;
  isRefillOpen: boolean;

  // Consumables (tokens & luck potion)
  tokens: Record<string, number>;
  potionsCount: number;
  activePotionCharges: number;

  // Actions
  addBalance: (amount: number) => void;
  deductBalance: (amount: number) => boolean;
  refillDemoBalance: (amount?: number) => void;
  addToInventory: (skins: SkinEntity[]) => void;
  sellSkin: (instanceId: string) => number;
  sellAllSkins: () => number;
  addLiveDrop: (drop: LiveDrop) => void;
  toggleSound: () => void;
  setRefillOpen: (open: boolean) => void;
  recordUpgrade: (won: boolean, profitDc: number) => void;
  recordCrash: (profitDc: number) => void;
  addToken: (tokenId: string, count?: number) => void;
  useToken: (tokenId: string) => boolean;
  addPotion: (count?: number) => void;
  drinkPotion: () => boolean;
  consumePotionCharge: () => boolean;
}

const INITIAL_BOT_NAMES = [
  'S1mple_CS', 'ZywOo_God', 'm0NESY_Peak', 'Donk_Rush', 'B1t_Headshot',
  'KennyS_Flick', 'NiKo_Deagle', 'Ropz_Lurk', 'Device_Clutch', 'Shroud99'
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      balance: 10000,
      inventory: [],
      soundEnabled: true,
      isRefillOpen: false,
      tokens: {
        token_consumer: 1,
        token_industrial: 1,
      },
      potionsCount: 1,
      activePotionCharges: 0,
      stats: {
        casesOpened: 0,
        totalWonDc: 0,
        upgradesWon: 0,
        upgradesLost: 0,
        crashWonDc: 0,
      },
      liveDrops: [
        {
          id: 'init_1',
          user: 'm0NESY_Peak',
          avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
          skin: SKINS_DATABASE.find(s => s.id === 'knife_butterfly_doppler') || SKINS_DATABASE[0],
          caseName: 'Кейс «Революция»',
          timestamp: Date.now() - 35000,
        },
        {
          id: 'init_2',
          user: 'S1mple_CS',
          avatar: 'https://avatars.steamstatic.com/7918a36c56db36d338f654b9d034ee8b1efad932_full.jpg',
          skin: SKINS_DATABASE.find(s => s.id === 'm4a1s_printstream') || SKINS_DATABASE[1],
          caseName: 'Грёзы и кошмары',
          timestamp: Date.now() - 85000,
        },
        {
          id: 'init_3',
          user: 'Donk_Rush',
          avatar: 'https://avatars.steamstatic.com/c5c36395b2a0957279148d42d38515091763e003_full.jpg',
          skin: SKINS_DATABASE.find(s => s.id === 'ak47_the_empress') || SKINS_DATABASE[2],
          caseName: 'Мусорка Залупы',
          timestamp: Date.now() - 140000,
        }
      ],

      addBalance: (amount) => {
        set((state) => ({ balance: Math.max(0, state.balance + Math.floor(amount)) }));
      },

      deductBalance: (amount) => {
        const current = get().balance;
        if (current < amount) return false;
        set({ balance: current - Math.floor(amount) });
        return true;
      },

      refillDemoBalance: (amount = 10000) => {
        set((state) => ({ balance: state.balance + amount }));
        sound.playCashout();
      },

      addToInventory: (skins) => {
        const newItems: InventoryItem[] = skins.map((skin) => ({
          ...skin,
          instanceId: `${skin.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          obtainedAt: Date.now(),
        }));

        set((state) => ({
          inventory: [...newItems, ...state.inventory],
          stats: {
            ...state.stats,
            casesOpened: state.stats.casesOpened + skins.length,
            totalWonDc: state.stats.totalWonDc + skins.reduce((acc, s) => acc + s.priceDc, 0),
          },
        }));
      },

      sellSkin: (instanceId) => {
        const item = get().inventory.find((i) => i.instanceId === instanceId);
        if (!item) return 0;

        set((state) => ({
          inventory: state.inventory.filter((i) => i.instanceId !== instanceId),
          balance: state.balance + item.priceDc,
        }));
        sound.playCashout();
        return item.priceDc;
      },

      sellAllSkins: () => {
        const total = get().inventory.reduce((acc, i) => acc + i.priceDc, 0);
        if (total <= 0) return 0;

        set((state) => ({
          inventory: [],
          balance: state.balance + total,
        }));
        sound.playCashout();
        return total;
      },

      addLiveDrop: (drop) => {
        set((state) => ({
          liveDrops: [drop, ...state.liveDrops.slice(0, 19)],
        }));
      },

      toggleSound: () => {
        const next = !get().soundEnabled;
        sound.enabled = next;
        set({ soundEnabled: next });
      },

      setRefillOpen: (open) => {
        set({ isRefillOpen: open });
      },

      recordUpgrade: (won, profitDc) => {
        set((state) => ({
          stats: {
            ...state.stats,
            upgradesWon: state.stats.upgradesWon + (won ? 1 : 0),
            upgradesLost: state.stats.upgradesLost + (won ? 0 : 1),
            totalWonDc: state.stats.totalWonDc + (won ? profitDc : 0),
          },
        }));
      },

      recordCrash: (profitDc) => {
        set((state) => ({
          stats: {
            ...state.stats,
            crashWonDc: state.stats.crashWonDc + profitDc,
          },
        }));
      },

      addToken: (tokenId, count = 1) => {
        set((state) => {
          const current = state.tokens[tokenId] || 0;
          return {
            tokens: {
              ...state.tokens,
              [tokenId]: current + count,
            },
          };
        });
      },

      useToken: (tokenId) => {
        const current = get().tokens[tokenId] || 0;
        if (current <= 0) return false;
        set((state) => {
          const updated = { ...state.tokens };
          if (updated[tokenId] <= 1) {
            delete updated[tokenId];
          } else {
            updated[tokenId] -= 1;
          }
          return { tokens: updated };
        });
        return true;
      },

      addPotion: (count = 1) => {
        set((state) => ({ potionsCount: state.potionsCount + count }));
      },

      drinkPotion: () => {
        const count = get().potionsCount;
        if (count <= 0) return false;
        set((state) => ({
          potionsCount: state.potionsCount - 1,
          activePotionCharges: state.activePotionCharges + 3,
        }));
        sound.playWin('contraband');
        return true;
      },

      consumePotionCharge: () => {
        const charges = get().activePotionCharges;
        if (charges <= 0) return false;
        set((state) => ({ activePotionCharges: Math.max(0, state.activePotionCharges - 1) }));
        return true;
      },
    }),
    {
      name: 'zalupa_drop_state_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        balance: state.balance,
        inventory: state.inventory,
        soundEnabled: state.soundEnabled,
        stats: state.stats,
        tokens: state.tokens,
        potionsCount: state.potionsCount,
        activePotionCharges: state.activePotionCharges,
      }),
    }
  )
);
