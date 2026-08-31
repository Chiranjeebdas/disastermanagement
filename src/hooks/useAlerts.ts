import { useState, useEffect, useCallback } from 'react';
import type { Alert } from '../types/alert';
import { dbGetAll, dbPutBatch } from '../utils/indexedDB';
import { fetchAllLiveAlerts } from '../utils/liveIngestion';

const STORAGE_KEY = 'drishti_alerts_cache_live_v1';

export const useAlerts = (userLat = 20.4625, userLon = 85.8828) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch live real-time hazard alerts directly from USGS Seismic & Open-Meteo APIs
  const fetchLiveAlertsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch live multi-source data
      const liveData = await fetchAllLiveAlerts(userLat, userLon);

      if (liveData && liveData.length > 0) {
        setAlerts(liveData);
        setLastSyncTime(new Date());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(liveData));
        await dbPutBatch('alerts', liveData);
      } else {
        // Fallback to local cache if offline or API empty
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          setAlerts(JSON.parse(cached));
        } else {
          const idbAlerts = await dbGetAll<Alert>('alerts');
          if (idbAlerts && idbAlerts.length > 0) {
            setAlerts(idbAlerts);
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching live hazard data, loading cached buffer:', err);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setAlerts(JSON.parse(cached));
      }
      setError('Using cached live telemetry');
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
