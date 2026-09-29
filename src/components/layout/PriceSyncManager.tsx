'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { useLanguage } from '../../lib/i18n';

const PRICE_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours daily update (synced with Vercel Edge Cache)

export const PriceSyncManager: React.FC = () => {
  const syncLivePrices = useGameStore((state) => state.syncLivePrices);
  const { locale } = useLanguage();
  const isRu = locale === 'ru';

  const [toastState, setToastState] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [showToast, setShowToast] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSync = useCallback(async () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    setToastState('syncing');
    setShowToast(true);

    const startTime = Date.now();
    try {
      await syncLivePrices();
    } catch (_) {
      // Ignore network errors gracefully
    }

    // Keep active animation visible for at least 2000ms for smooth visual feedback
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(0, 2000 - elapsed);

    setTimeout(() => {
      setToastState('synced');

      hideTimerRef.current = setTimeout(() => {
        setShowToast(false);
        setTimeout(() => setToastState('idle'), 300);
      }, 1800);
    }, remainingDelay);
  }, [syncLivePrices]);

  useEffect(() => {
    // Initial sync notification appears after 2.5 seconds so user immediately notices live pricing
    const initialTimer = setTimeout(() => {
      performSync();
    }, 2500);

    // Live price sync every 24 hours
    const interval = setInterval(() => {
      performSync();
    }, PRICE_SYNC_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastSync = useGameStore.getState().lastPriceSyncTime || 0;
        // If more than 24 hours elapsed since last sync, trigger refresh
        if (Date.now() - lastSync > 24 * 60 * 60 * 1000) {
          performSync();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [performSync]);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.94 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="fixed bottom-20 md:bottom-5 right-4 md:right-5 z-50 select-none cursor-pointer"
          onClick={() => setShowToast(false)}
          title={isRu ? 'Нажмите, чтобы скрыть' : 'Click to dismiss'}
        >
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#091528]/95 border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.35)] backdrop-blur-md transition-all hover:border-blue-400/60">
            {toastState === 'syncing' ? (
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="absolute w-2 h-2 rounded-full bg-blue-400/40 animate-ping" />
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
                {toastState === 'syncing'
                  ? (isRu ? 'Цены обновляются...' : 'Updating live prices...')
                  : (isRu ? 'Цены актуальны' : 'Prices up to date')}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
