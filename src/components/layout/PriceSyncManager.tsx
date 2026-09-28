'use client';

import { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';

const PRICE_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes live update

export const PriceSyncManager: React.FC = () => {
  const syncLivePrices = useGameStore((state) => state.syncLivePrices);

  useEffect(() => {
    // Initial sync after 3 seconds so initial page paint is instantaneous
    const initialTimer = setTimeout(() => {
      syncLivePrices().catch(() => {});
    }, 3000);

    // Live price sync every 5 minutes
    const interval = setInterval(() => {
      syncLivePrices().catch(() => {});
    }, PRICE_SYNC_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncLivePrices().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncLivePrices]);

  return null;
};
