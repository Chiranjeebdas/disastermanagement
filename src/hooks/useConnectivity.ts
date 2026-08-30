import { useState, useEffect, useCallback } from 'react';
import { offlineSyncManager } from '../utils/offlineSyncManager';

export type ConnectivityStatus = 'ONLINE' | 'LIMITED' | 'OFFLINE' | 'SYNCING';

export const useConnectivity = () => {
  const [status, setStatus] = useState<ConnectivityStatus>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE'
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isPWA, setIsPWA] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      setIsPWA(isStandalone);
    }

    const handleOnline = () => {
      setStatus('SYNCING');
      offlineSyncManager.processSyncQueue().then(() => {
        setStatus('ONLINE');
      }).catch(() => {
        setStatus('ONLINE');
      });
    };

    const handleOffline = () => {
      setStatus('OFFLINE');
    };

    const unsubscribeSync = offlineSyncManager.subscribe((count) => {
      setPendingSyncCount(count);
    });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (typeof navigator !== 'undefined') {
      setStatus(navigator.onLine ? 'ONLINE' : 'OFFLINE');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
    };
  }, []);

  const triggerSync = useCallback(async () => {
    if (navigator.onLine) {
      setStatus('SYNCING');
      await offlineSyncManager.processSyncQueue();
      setStatus('ONLINE');
    }
  }, []);

  return {
    status,
    isOffline: status === 'OFFLINE',
    pendingSyncCount,
    isPWA,
    triggerSync
  };
};
