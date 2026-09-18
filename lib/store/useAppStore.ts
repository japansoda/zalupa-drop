import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { InventoryItem, LiveDrop, Skin } from "../types";
import { sound } from "../sound";
import { SKINS_DATABASE } from "../data/skins";

interface AppStats {
  casesOpened: number;
  upgradesAttempted: number;
  upgradesWon: number;
  totalEarnedDC: number;
  totalSpentDC: number;
  bestDrop: Skin | null;
}

interface AppState {
  balance: number;
  inventory: InventoryItem[];
  liveFeed: LiveDrop[];
  stats: AppStats;
  isSoundMuted: boolean;
  isRefillModalOpen: boolean;

  // Actions
  setRefillModalOpen: (open: boolean) => void;
  toggleSound: () => boolean;
  refillBalance: (amount: number) => void;
  resetBalanceToDemo: () => void;
  deductBalance: (amount: number) => boolean;
  addBalance: (amount: number) => void;
  addDropToInventory: (skin: Skin, source: InventoryItem["source"]) => InventoryItem;
  sellItem: (instanceId: string) => number;
  sellAllItems: () => number;
  recordCaseOpen: (costDC: number, skin: Skin) => void;
  recordUpgrade: (betDC: number, wonSkin: Skin | null) => void;
  recordMiniGame: (betDC: number, wonDC: number) => void;
  pushLiveDrop: (drop: LiveDrop) => void;
  removeInventoryItem: (instanceId: string) => void;
}

const INITIAL_BALANCE = 10000;

const BOT_NAMES = [
  "s1mple_fan",
  "ZywOo_peek",
  "m0NESY_flick",
  "Donk_rush",
  "b1t_headshot",
  "NiKo_deagle",
  "ropz_lurk",
  "Jame_save",
  "sh1ro_clutch",
  "electronic_cs",
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      balance: INITIAL_BALANCE,
      inventory: [],
      liveFeed: [],
      isSoundMuted: false,
      isRefillModalOpen: false,
      stats: {
        casesOpened: 0,
        upgradesAttempted: 0,
        upgradesWon: 0,
        totalEarnedDC: 0,
        totalSpentDC: 0,
        bestDrop: null,
      },

      setRefillModalOpen: (open) => set({ isRefillModalOpen: open }),

      toggleSound: () => {
        const nextMuted = sound.toggleMute();
        set({ isSoundMuted: nextMuted });
        return nextMuted;
      },

      refillBalance: (amount) => {
        set((state) => ({ balance: state.balance + amount }));
        sound.playCashout();
      },

      resetBalanceToDemo: () => {
        set({ balance: INITIAL_BALANCE });
        sound.playCashout();
      },

      deductBalance: (amount) => {
        const current = get().balance;
        if (current < amount) return false;
        set((state) => ({
          balance: state.balance - amount,
          stats: { ...state.stats, totalSpentDC: state.stats.totalSpentDC + amount },
        }));
        return true;
      },

      addBalance: (amount) => {
        set((state) => ({
          balance: state.balance + amount,
          stats: { ...state.stats, totalEarnedDC: state.stats.totalEarnedDC + amount },
        }));
      },

      addDropToInventory: (skin, source) => {
        const newItem: InventoryItem = {
          ...skin,
          instanceId: `${skin.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          acquiredAt: Date.now(),
          source,
        };

        set((state) => {
          const currentBest = state.stats.bestDrop;
          const newBest =
            !currentBest || skin.priceDC > currentBest.priceDC ? skin : currentBest;

          return {
            inventory: [newItem, ...state.inventory],
            stats: {
              ...state.stats,
              bestDrop: newBest,
            },
          };
        });

        // Also push to live feed
        get().pushLiveDrop({
          id: newItem.instanceId,
          userName: "Вы (Игрок)",
          avatarUrl: "https://avatars.githubusercontent.com/u/133962585?v=4",
          skin,
          timestamp: Date.now(),
        });

        return newItem;
      },

      sellItem: (instanceId) => {
        const item = get().inventory.find((i) => i.instanceId === instanceId);
        if (!item) return 0;

        sound.playCashout();
        set((state) => ({
          balance: state.balance + item.priceDC,
          inventory: state.inventory.filter((i) => i.instanceId !== instanceId),
          stats: {
            ...state.stats,
            totalEarnedDC: state.stats.totalEarnedDC + item.priceDC,
          },
        }));

        return item.priceDC;
      },

      removeInventoryItem: (instanceId) => {
        set((state) => ({
          inventory: state.inventory.filter((i) => i.instanceId !== instanceId),
        }));
      },

      sellAllItems: () => {
        const total = get().inventory.reduce((sum, i) => sum + i.priceDC, 0);
        if (total === 0) return 0;

        sound.playCashout();
        set((state) => ({
          balance: state.balance + total,
          inventory: [],
          stats: {
            ...state.stats,
            totalEarnedDC: state.stats.totalEarnedDC + total,
          },
        }));

        return total;
      },

      recordCaseOpen: (costDC, skin) => {
        set((state) => {
          const isBetter =
            !state.stats.bestDrop || skin.priceDC > state.stats.bestDrop.priceDC;
          return {
            stats: {
              ...state.stats,
              casesOpened: state.stats.casesOpened + 1,
              bestDrop: isBetter ? skin : state.stats.bestDrop,
            },
          };
        });
      },

      recordUpgrade: (betDC, wonSkin) => {
        set((state) => ({
          stats: {
            ...state.stats,
            upgradesAttempted: state.stats.upgradesAttempted + 1,
            upgradesWon: wonSkin ? state.stats.upgradesWon + 1 : state.stats.upgradesWon,
            totalSpentDC: state.stats.totalSpentDC + betDC,
          },
        }));
      },

      recordMiniGame: (betDC, wonDC) => {
        set((state) => ({
          balance: state.balance - betDC + wonDC,
          stats: {
            ...state.stats,
            totalSpentDC: state.stats.totalSpentDC + betDC,
            totalEarnedDC: state.stats.totalEarnedDC + wonDC,
          },
        }));
      },

      pushLiveDrop: (drop) => {
        set((state) => ({
          liveFeed: [drop, ...state.liveFeed.slice(0, 19)],
        }));
      },
    }),
    {
      name: "zalupa_drop_storage_v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        balance: state.balance,
        inventory: state.inventory,
        stats: state.stats,
        isSoundMuted: state.isSoundMuted,
      }),
    }
  )
);

// Simulated live activity in background
if (typeof window !== "undefined") {
  setInterval(() => {
    const store = useAppStore.getState();
    const randomSkin = SKINS_DATABASE[Math.floor(Math.random() * SKINS_DATABASE.length)];
    const randomBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    
    // Only post occasionally
    if (Math.random() > 0.4) {
      store.pushLiveDrop({
        id: `sim_${Date.now()}_${Math.random()}`,
        userName: randomBot,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomBot}`,
        skin: randomSkin,
        timestamp: Date.now(),
      });
    }
  }, 4500);
}
