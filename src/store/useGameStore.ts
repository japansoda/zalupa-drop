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

  // Case open popularity tracking
  caseOpenCounts: Record<string, number>;
  recordCaseOpen: (caseId: string, count?: number) => void;

  // Actions
  addBalance: (amount: number) => void;
  deductBalance: (amount: number) => boolean;
  refillDemoBalance: (amount?: number) => void;
  addToInventory: (skins: SkinEntity[]) => void;
  removeFromInventory: (instanceIds: string[]) => void;
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

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      balance: 10000,
      inventory: [],
      soundEnabled: true,
      isRefillOpen: false,
      caseOpenCounts: {},
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
      liveDrops: [],

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

      removeFromInventory: (instanceIds) => {
        const idSet = new Set(instanceIds);
        set((state) => ({
          inventory: state.inventory.filter((i) => !idSet.has(i.instanceId)),
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
        // Strictly only valid drops >= 25,000 DC can enter live drop ticker
        if (!drop || !drop.skin || !drop.skin.image || !drop.skin.name || (drop.skin.priceDc || 0) < 25000) return;

        set((state) => {
          const isDuplicate = state.liveDrops.some(
            (d) => d.id === drop.id || d.id === `net_${drop.id}` || `net_${d.id}` === drop.id
          );
          if (isDuplicate) return state;
          return {
            liveDrops: [drop, ...state.liveDrops.slice(0, 19)],
          };
        });

        // Broadcast real player drops to the world (other tabs and devices on Vercel)
        const isLocalRealDrop =
          drop.id.startsWith('real_') ||
          drop.id.startsWith('contract_') ||
          drop.id.startsWith('upgrade_');

        if (isLocalRealDrop && typeof window !== 'undefined') {
          // 1. Same-device local tabs
          if ('BroadcastChannel' in window) {
            try {
              const bc = new BroadcastChannel('zalupa_live_drops_v3');
              bc.postMessage(drop);
              bc.close();
            } catch (_) {}
          }

          // 2. Vercel Backend storage & persistence
          fetch('/api/live-drops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(drop),
          }).catch(() => {});

          // 3. Direct pub/sub for instant SSE multicast
          fetch('https://ntfy.sh/zalupa_live_drops_v3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(drop),
          }).catch(() => {});
        }
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

      recordCaseOpen: (caseId: string, count = 1) => {
        set((state) => ({
          caseOpenCounts: {
            ...state.caseOpenCounts,
            [caseId]: (state.caseOpenCounts[caseId] || 0) + count,
          },
        }));
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
        caseOpenCounts: state.caseOpenCounts,
      }),
    }
  )
);
