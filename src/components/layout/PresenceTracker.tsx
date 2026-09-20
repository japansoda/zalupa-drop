'use client';

import { useEffect } from 'react';

export const PresenceTracker: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Persistent session ID for this browser tab
    let sessionId = sessionStorage.getItem('zalupa_presence_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem('zalupa_presence_id', sessionId);
    }

    const sendHeartbeat = () => {
      // Server-side presence tracking
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});

      // Local BroadcastChannel for same-device tabs
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('zalupa_presence_v3');
          bc.postMessage({ sessionId, timestamp: Date.now() });
          bc.close();
        } catch (_) {}
      }
    };

    // Send immediately on mount
    sendHeartbeat();

    // Heartbeat every 12 seconds
    const interval = setInterval(sendHeartbeat, 12000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return null;
};
