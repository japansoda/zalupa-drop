'use client';

import { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';

const PRICE_SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes live update

export const PriceSyncManager: React.FC = () => {
  const syncLivePrices = useGameStore((state) => state.syncLivePrices);

  useEffect(() => {
    // Initial sync after 3 seconds so initial page paint is instantaneous
    const initialTimer = setTimeout(() => {
      syncLivePrices().catch(() => {});
    }, 3000);

    // Live price sync every 10 minutes
    const interval = setInterval(() => {
      syncLivePrices().catch(() => {});
    }, PRICE_SYNC_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [syncLivePrices]);

  return null;
};
