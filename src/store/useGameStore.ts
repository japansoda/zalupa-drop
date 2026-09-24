import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { InventoryItem, LiveDrop, SkinEntity, UserStats } from '../lib/types';
import { sound } from '../lib/sound';
import { SKINS_DATABASE } from '../data/skins';
import { getSteamMarketHashName } from '../lib/steam';
import {
  FarmSlot,
  ChickenEntity,
  INCUBATION_DURATION_MS,
  EGG_PRODUCTION_DURATION_MS,
  rollHatchedChickenBreed,
  rollIsStatTrakChicken,
  rollEggSkinDrop,
  CHICKEN_BREEDS,
} from '../lib/farm';

interface GameState {
  balance: number;
  inventory: InventoryItem[];
  soundEnabled: boolean;
  liveDrops: LiveDrop[];
  stats: UserStats;
  isRefillOpen: boolean;

  // Consumables (save tokens, zeus, luck potion, grappling hook)
  saveTokensCount: number;
  zeusCount: number;
  potionsCount: number;
  hookCount: number;
  activePotionCharges: number;

  // Chicken Farm
  farmSlots: FarmSlot[];
  farmEggTokens: number;
  depositSkinsForEgg: (skinInstanceIds: string[], targetSlotIndex?: number) => boolean;
  addEggToken: (count?: number) => void;
  placeEggToken: (slotIndex: number) => boolean;
  hatchEgg: (slotIndex: number) => ChickenEntity | null;
  feedChicken: (slotIndex: number) => boolean;
  feedAllChickens: () => void;
  claimEggDrop: (slotIndex: number) => SkinEntity | null;
  speedUpIncubation: (slotIndex: number) => boolean;
  speedUpEggProduction: (slotIndex: number) => boolean;

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
  fakeDropsEnabled: boolean;
  setFakeDropsEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  setRefillOpen: (open: boolean) => void;
  recordUpgrade: (won: boolean, profitDc: number) => void;
  recordCrash: (profitDc: number) => void;
  addSaveToken: (count?: number) => void;
  useSaveToken: () => boolean;
  addZeus: (count?: number) => void;
  useZeus: () => boolean;
  addHook: (count?: number) => void;
  useHook: () => boolean;
  addPotion: (count?: number) => void;
  drinkPotion: () => boolean;
  consumePotionCharge: () => boolean;
  syncLivePrices: () => Promise<void>;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      balance: 10000,
      inventory: [],
      soundEnabled: true,
      isRefillOpen: false,
      caseOpenCounts: {},
      saveTokensCount: 0,
      zeusCount: 0,
      potionsCount: 0,
      hookCount: 0,
      activePotionCharges: 0,
      farmSlots: [
        { index: 0, status: 'empty' },
        { index: 1, status: 'empty' },
        { index: 2, status: 'empty' },
        { index: 3, status: 'empty' },
        { index: 4, status: 'empty' },
      ],
      farmEggTokens: 0,
      stats: {
        casesOpened: 0,
        totalWonDc: 0,
        upgradesWon: 0,
        upgradesLost: 0,
        crashWonDc: 0,
      },
      liveDrops: [],
      fakeDropsEnabled: typeof window !== 'undefined' ? localStorage.getItem('zalupa_fake_drops_enabled') !== 'false' : true,

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
        const safeSkins = skins.filter((skin) => {
          const img = skin?.image || '';
          return !img.startsWith('file:') && !img.includes('file://') && !img.includes('C:/') && !img.includes('C:\\');
        });
        const newItems: InventoryItem[] = safeSkins.map((skin) => ({
          ...skin,
          instanceId: `${skin.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          obtainedAt: Date.now(),
        }));

        set((state) => ({
          inventory: [...newItems, ...state.inventory],
          stats: {
            ...state.stats,
            casesOpened: state.stats.casesOpened + skins.length,
            totalWonDc: state.stats.totalWonDc + safeSkins.reduce((acc, s) => acc + s.priceDc, 0),
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

        const img = drop.skin.image;
        if (img.startsWith('file:') || img.includes('file://') || img.includes('C:/') || img.includes('C:\\')) return;

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

      setFakeDropsEnabled: (enabled) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('zalupa_fake_drops_enabled', String(enabled));
          } catch (e) {}
        }
        set({ fakeDropsEnabled: enabled });
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

      addSaveToken: (count = 1) => {
        set((state) => ({ saveTokensCount: state.saveTokensCount + count }));
      },

      useSaveToken: () => {
        const current = get().saveTokensCount;
        if (current <= 0) return false;
        set((state) => ({ saveTokensCount: state.saveTokensCount - 1 }));
        return true;
      },

      addZeus: (count = 1) => {
        set((state) => ({ zeusCount: state.zeusCount + count }));
      },

      useZeus: () => {
        const current = get().zeusCount;
        if (current <= 0) return false;
        set((state) => ({ zeusCount: state.zeusCount - 1 }));
        return true;
      },

      addHook: (count = 1) => {
        set((state) => ({ hookCount: state.hookCount + count }));
      },

      useHook: () => {
        const current = get().hookCount;
        if (current <= 0) return false;
        set((state) => ({ hookCount: state.hookCount - 1 }));
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

      depositSkinsForEgg: (skinInstanceIds, targetSlotIndex) => {
        if (skinInstanceIds.length !== 10) return false;
        const currentInv = get().inventory;
        const depositSkins = currentInv.filter((item) => skinInstanceIds.includes(item.instanceId));
        if (depositSkins.length !== 10) return false;

        const allEligible = depositSkins.every((item) => item.priceDc >= 1000);
        if (!allEligible) return false;

        const slots = [...get().farmSlots];
        let slotIdx = -1;
        if (typeof targetSlotIndex === 'number' && slots[targetSlotIndex]?.status === 'empty') {
          slotIdx = targetSlotIndex;
        } else {
          slotIdx = slots.findIndex((s) => s.status === 'empty');
        }

        if (slotIdx === -1) return false;

        get().removeFromInventory(skinInstanceIds);

        slots[slotIdx] = {
          index: slotIdx,
          status: 'incubating',
          incubationStartedAt: Date.now(),
          incubatingUntil: Date.now() + INCUBATION_DURATION_MS,
        };

        set({ farmSlots: slots });
        sound.playCashout();
        return true;
      },

      addEggToken: (count = 1) => {
        set((state) => {
          const slots = [...state.farmSlots];
          let remaining = count;
          for (let i = 0; i < slots.length && remaining > 0; i++) {
            if (slots[i].status === 'empty') {
              slots[i] = {
                index: i,
                status: 'incubating',
                incubationStartedAt: Date.now(),
                incubatingUntil: Date.now() + INCUBATION_DURATION_MS,
              };
              remaining--;
            }
          }
          return {
            farmSlots: slots,
            farmEggTokens: state.farmEggTokens + remaining,
          };
        });
      },

      placeEggToken: (slotIndex) => {
        const state = get();
        if (state.farmEggTokens <= 0) return false;
        const slots = [...state.farmSlots];
        if (!slots[slotIndex] || slots[slotIndex].status !== 'empty') return false;

        slots[slotIndex] = {
          index: slotIndex,
          status: 'incubating',
          incubationStartedAt: Date.now(),
          incubatingUntil: Date.now() + INCUBATION_DURATION_MS,
        };

        set({
          farmSlots: slots,
          farmEggTokens: state.farmEggTokens - 1,
        });
        sound.playClick();
        return true;
      },

      hatchEgg: (slotIndex) => {
        const slots = [...get().farmSlots];
        const slot = slots[slotIndex];
        if (!slot) return null;

        const breedId = rollHatchedChickenBreed();
        const breed = CHICKEN_BREEDS[breedId];
        const isSt = rollIsStatTrakChicken();
        const chicken: ChickenEntity = {
          id: `chicken_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          breedId,
          name: isSt ? `StatTrak™ ${breed.name}` : breed.name,
          nameEn: isSt ? `StatTrak™ ${breed.nameEn}` : breed.nameEn,
          hatchedAt: Date.now(),
          eggsLaidCount: 0,
          isStatTrak: isSt,
        };

        slots[slotIndex] = {
          index: slotIndex,
          status: 'chicken',
          chicken,
          feedStatus: 'hungry',
        };

        set({ farmSlots: slots });
        sound.playEggHatch();
        return chicken;
      },

      feedChicken: (slotIndex) => {
        const slots = [...get().farmSlots];
        const slot = slots[slotIndex];
        if (!slot || slot.status !== 'chicken' || slot.feedStatus !== 'hungry') return false;

        slots[slotIndex] = {
          ...slot,
          feedStatus: 'producing',
          eggReadyUntil: Date.now() + EGG_PRODUCTION_DURATION_MS,
        };

        set({ farmSlots: slots });
        sound.playFeedGrain();
        setTimeout(() => {
          sound.playChickenCluck();
        }, 220);
        return true;
      },

      feedAllChickens: () => {
        const slots = [...get().farmSlots];
        let fedCount = 0;
        for (let i = 0; i < slots.length; i++) {
          if (slots[i].status === 'chicken' && slots[i].feedStatus === 'hungry') {
            slots[i] = {
              ...slots[i],
              feedStatus: 'producing',
              eggReadyUntil: Date.now() + EGG_PRODUCTION_DURATION_MS,
            };
            fedCount++;
          }
        }
        if (fedCount > 0) {
          set({ farmSlots: slots });
          sound.playFeedGrain();
          setTimeout(() => {
            sound.playChickenCluck();
          }, 220);
        }
      },

      claimEggDrop: (slotIndex) => {
        const slots = [...get().farmSlots];
        const slot = slots[slotIndex];
        if (!slot) return null;

        const isReady =
          slot.status === 'egg_ready' ||
          (slot.status === 'chicken' && !!slot.eggReadyUntil && slot.eggReadyUntil <= Date.now());
        if (!isReady || !slot.chicken) return null;

        const breedId = slot.readyEggBreed || slot.chicken.breedId;
        const droppedSkin = rollEggSkinDrop(breedId);

        get().addToInventory([droppedSkin]);

        slots[slotIndex] = {
          index: slotIndex,
          status: 'chicken',
          chicken: {
            ...slot.chicken,
            eggsLaidCount: (slot.chicken.eggsLaidCount || 0) + 1,
          },
          feedStatus: 'hungry',
          eggReadyUntil: undefined,
          readyEggBreed: undefined,
        };

        set({ farmSlots: slots });
        sound.playWin(droppedSkin.rarity);
        return droppedSkin;
      },

      speedUpIncubation: (slotIndex) => {
        const slots = [...get().farmSlots];
        const currentBalance = get().balance;
        const COST = 100_000;
        if (currentBalance < COST) {
          sound.playError();
          return false;
        }
        if (slots[slotIndex]?.status === 'incubating') {
          slots[slotIndex] = {
            ...slots[slotIndex],
            status: 'hatch_ready',
            incubatingUntil: Date.now() - 1000,
          };
          set({
            farmSlots: slots,
            balance: currentBalance - COST,
          });
          sound.playBuy();
          return true;
        }
        return false;
      },

      speedUpEggProduction: (slotIndex) => {
        const slots = [...get().farmSlots];
        const currentBalance = get().balance;
        const COST = 10_000;
        if (currentBalance < COST) {
          sound.playError();
          return false;
        }
        if (slots[slotIndex]?.status === 'chicken' && slots[slotIndex]?.feedStatus === 'producing') {
          slots[slotIndex] = {
            ...slots[slotIndex],
            status: 'egg_ready',
            eggReadyUntil: Date.now() - 1000,
            readyEggBreed: slots[slotIndex].chicken?.breedId,
          };
          set({
            farmSlots: slots,
            balance: currentBalance - COST,
          });
          sound.playBuy();
          return true;
        }
        return false;
      },

      recordCaseOpen: (caseId: string, count = 1) => {
        set((state) => ({
          caseOpenCounts: {
            ...state.caseOpenCounts,
            [caseId]: (state.caseOpenCounts[caseId] || 0) + count,
          },
        }));
      },

      syncLivePrices: async () => {
        const inv = get().inventory;
        if (!inv || inv.length === 0) return;

        const names = Array.from(new Set(inv.map((item) => getSteamMarketHashName(item)).filter(Boolean)));
        if (names.length === 0) return;

        try {
          const res = await fetch('/api/steam-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ names }),
          });
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.prices && Object.keys(data.prices).length > 0) {
            set((state) => ({
              inventory: state.inventory.map((item) => {
                const hashName = getSteamMarketHashName(item);
                const live = data.prices[hashName];
                if (live && typeof live.priceDc === 'number' && live.priceDc > 0) {
                  return { ...item, priceDc: live.priceDc };
                }
                return item;
              }),
            }));
          }
        } catch (_) {}
      },
    }),
    {
      name: 'zalupa_drop_state_v3',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (Array.isArray(state.inventory)) {
          state.inventory = state.inventory.filter((item) => {
            const img = item?.image || '';
            return !img.startsWith('file:') && !img.includes('file://') && !img.includes('C:/') && !img.includes('C:\\');
          });
        }
        if (Array.isArray(state.liveDrops)) {
          state.liveDrops = state.liveDrops.filter((d) => {
            const img = d?.skin?.image || '';
            return !img.startsWith('file:') && !img.includes('file://') && !img.includes('C:/') && !img.includes('C:\\');
          });
        }
        if (!Array.isArray(state.farmSlots) || state.farmSlots.length !== 5) {
          state.farmSlots = [
            { index: 0, status: 'empty' },
            { index: 1, status: 'empty' },
            { index: 2, status: 'empty' },
            { index: 3, status: 'empty' },
            { index: 4, status: 'empty' },
          ];
        }
      },
      partialize: (state) => ({
        balance: state.balance,
        inventory: state.inventory,
        soundEnabled: state.soundEnabled,
        stats: state.stats,
        saveTokensCount: state.saveTokensCount,
        zeusCount: state.zeusCount,
        hookCount: state.hookCount,
        potionsCount: state.potionsCount,
        activePotionCharges: state.activePotionCharges,
        caseOpenCounts: state.caseOpenCounts,
        fakeDropsEnabled: state.fakeDropsEnabled,
        farmSlots: state.farmSlots,
        farmEggTokens: state.farmEggTokens,
      }),
    }
  )
);
