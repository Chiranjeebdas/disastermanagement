import { useState, useEffect, useCallback } from 'react';
import type { Alert } from '../types/alert';
import { dbPutBatch } from '../utils/indexedDB';
import { fetchAllLiveAlerts } from '../utils/liveIngestion';
import { getDistance } from '../utils/distance';

const STORAGE_KEY = 'drishti_alerts_cache_live_v1';

export const useAlerts = (userLat = 20.4625, userLon = 85.8828) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch live real-time hazard alerts directly from USGS Seismic & Open-Meteo APIs (within local radius)
  const fetchLiveAlertsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch live multi-source data (filtered strictly to 30km)
      const liveData = await fetchAllLiveAlerts(userLat, userLon);

      // 2. Retrieve existing Early Warning and official alerts from cache (filter out any old distant quakes)
      const cachedRaw = localStorage.getItem(STORAGE_KEY);
      const existingCached: Alert[] = cachedRaw ? JSON.parse(cachedRaw) : [];
      const validCached = existingCached.filter(a => {
        if (a.id.startsWith('meteo-base-')) return false;
        if (a.type === 'Earthquake' && a.latitude && a.longitude) {
          const dist = getDistance(userLat, userLon, a.latitude, a.longitude);
          if (dist > 30) return false;
        }
        return (a.source === 'DRISHTI Early Warning' || a.id.startsWith('ew-'));
      });

      // 3. Merge: EW alerts + Live USGS / Weather telemetry alerts
      const combinedAlerts = [...validCached];
      const seenIds = new Set(validCached.map(a => a.id));
      for (const liveAlert of (liveData || [])) {
        if (!seenIds.has(liveAlert.id)) {
          seenIds.add(liveAlert.id);
          combinedAlerts.push(liveAlert);
        }
      }

      setAlerts(combinedAlerts);
      setLastSyncTime(new Date());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(combinedAlerts));
      await dbPutBatch('alerts', combinedAlerts);
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

  // Update single alert
  const updateAlert = useCallback((updatedAlert: Alert) => {
    setAlerts(prev => {
      const updated = prev.map(a => a.id === updatedAlert.id ? updatedAlert : a);
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
    updateAlert,
    acknowledgeAlert,
    dismissAlert
  };
};

export default useAlerts;
