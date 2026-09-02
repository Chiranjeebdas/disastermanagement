import { useState, useEffect, useCallback } from 'react';
import type { Alert } from '../types/alert';
import { dbGetAll, dbPutBatch } from '../utils/indexedDB';
import { fetchAllLiveAlerts } from '../utils/liveIngestion';
import { OFFLINE_VERIFIED_ALERTS } from '../utils/offlineData';
import { offlineSyncManager } from '../utils/offlineSyncManager';

const STORAGE_KEY = 'drishti_alerts_cache_live_v1';

export const useAlerts = (userLat = 20.4625, userLon = 85.8828) => {
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return OFFLINE_VERIFIED_ALERTS;
  });
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch live real-time hazard alerts directly from USGS Seismic & Open-Meteo APIs
  const fetchLiveAlertsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (navigator.onLine) {
        // 1. Fetch live multi-source data
        const liveData = await fetchAllLiveAlerts(userLat, userLon);

        if (liveData && liveData.length > 0) {
          setAlerts(liveData);
          setLastSyncTime(new Date());
          localStorage.setItem(STORAGE_KEY, JSON.stringify(liveData));
          await dbPutBatch('alerts', liveData);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to local IndexedDB or localStorage cache when offline or API empty
      const idbAlerts = await dbGetAll<Alert>('alerts');
      if (idbAlerts && idbAlerts.length > 0) {
        setAlerts(idbAlerts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(idbAlerts));
      } else {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          setAlerts(JSON.parse(cached));
        } else {
          // Pre-seed with verified core regional alerts
          setAlerts(OFFLINE_VERIFIED_ALERTS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(OFFLINE_VERIFIED_ALERTS));
          await dbPutBatch('alerts', OFFLINE_VERIFIED_ALERTS);
        }
      }
    } catch (err) {
      console.warn('Network unreachable, serving cached offline hazard data:', err);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setAlerts(JSON.parse(cached));
      } else {
        setAlerts(OFFLINE_VERIFIED_ALERTS);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userLat, userLon]);

  // Initial fetch and automatic 60-second real-time polling
  useEffect(() => {
    fetchLiveAlertsData();

    // Poll live feeds every 60 seconds for real-time disaster detection
    const pollInterval = setInterval(() => {
      if (navigator.onLine) {
        fetchLiveAlertsData();
      }
    }, 60000);

    return () => clearInterval(pollInterval);
  }, [fetchLiveAlertsData]);

  // Network connectivity listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchLiveAlertsData();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchLiveAlertsData]);

  // Mark alert as acknowledged
  const acknowledgeAlert = useCallback(async (id: string) => {
    setAlerts(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, isAcknowledged: true } : a);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      dbPutBatch('alerts', updated).catch(console.warn);
      return updated;
    });

    if (!navigator.onLine) {
      await offlineSyncManager.enqueueAction('ACKNOWLEDGE_ALERT', { id });
    }
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback(async (id: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      dbPutBatch('alerts', updated).catch(console.warn);
      return updated;
    });
  }, []);

  return {
    alerts,
    loading: isLoading,
    error,
    isOffline,
    lastSyncTime,
    refreshAlerts: fetchLiveAlertsData,
    acknowledgeAlert,
    dismissAlert
  };
};

export default useAlerts;
