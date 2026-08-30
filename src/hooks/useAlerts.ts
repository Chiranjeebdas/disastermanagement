import { useState, useEffect, useCallback } from 'react';
import type { Alert } from '../types/alert';
import { dbGetAll, dbPutBatch } from '../utils/indexedDB';

const STORAGE_KEY = 'drishti_alerts_cache_v3';

const INITIAL_DEMO_ALERTS: Alert[] = [
  {
    id: 'a1',
    title: 'Flash Flood Risk Detected',
    severity: 'Critical',
    type: 'Flood',
    location: 'Cuttack, Odisha',
    latitude: 20.4625,
    longitude: 85.8828,
    detectedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    source: 'Verified environmental signal',
    isVerified: true,
    description: 'Rapid rainfall accumulation indicates elevated flash-flood potential in low-lying areas.',
    status: 'Active',
    measurements: [
      { label: 'Rainfall', value: '82 mm / 3h' },
      { label: 'Humidity', value: '91%' },
      { label: 'Wind', value: '18 km/h' }
    ],
    affectedRadiusKm: 12.5,
    recommendedAction: 'Avoid low-lying areas. Monitor evacuation guidance. Keep emergency communication available.',
    isAcknowledged: false
  },
  {
    id: 'a2',
    title: 'Heavy Rainfall Advisory',
    severity: 'Warning',
    type: 'Extreme Weather',
    location: 'Bhubaneswar, Odisha',
    latitude: 20.2961,
    longitude: 85.8245,
    detectedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    source: 'Weather intelligence',
    isVerified: true,
    description: 'Heavy rainfall conditions may affect visibility, roads and drainage systems.',
    status: 'Monitoring',
    measurements: [],
    affectedRadiusKm: 25,
    recommendedAction: 'Stay indoors. Move vehicles to higher ground.',
    isAcknowledged: false
  },
  {
    id: 'a3',
    title: 'Strong Wind Advisory',
    severity: 'Advisory',
    type: 'Extreme Weather',
    location: 'Khordha, Odisha',
    latitude: 20.1816,
    longitude: 85.6197,
    detectedAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    source: 'Environmental monitoring',
    isVerified: true,
    description: 'Elevated wind conditions detected. Continue monitoring local conditions.',
    status: 'Active',
    measurements: [],
    affectedRadiusKm: 40,
    recommendedAction: 'Secure loose outdoor objects. Stay away from large trees.',
    isAcknowledged: true
  }
];

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize data from IndexedDB with localStorage/demo fallback
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const idbAlerts = await dbGetAll<Alert>('alerts');
        if (idbAlerts && idbAlerts.length > 0) {
          setAlerts(idbAlerts);
          setIsInitialized(true);
          return;
        }

        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setAlerts(parsed);
            await dbPutBatch('alerts', parsed);
            setIsInitialized(true);
            return;
          }
        }

        setAlerts(INITIAL_DEMO_ALERTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ALERTS));
        await dbPutBatch('alerts', INITIAL_DEMO_ALERTS);
      } catch (e) {
        console.warn('Failed to parse alerts from IDB, using seed', e);
        setAlerts(INITIAL_DEMO_ALERTS);
      } finally {
        setIsInitialized(true);
      }
    };

    loadAlerts();
  }, []);

  // Persist alerts to IndexedDB & localStorage
  useEffect(() => {
    if (isInitialized && alerts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
      dbPutBatch('alerts', alerts).catch(e => console.warn('IDB alerts save error:', e));
    }
  }, [alerts, isInitialized]);

  // Handle Online/Offline Status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simulate subtle live telemetry updates
  useEffect(() => {
    if (isOffline) return;

    const interval = setInterval(() => {
      setAlerts(prev => {
        const newAlerts = [...prev];
        const activeAlert = newAlerts.find(a => a.status !== 'Resolved');
        if (activeAlert) {
          activeAlert.updatedAt = new Date().toISOString();
        }
        return newAlerts;
      });
      setLastSyncTime(new Date());
    }, 45000);

    return () => clearInterval(interval);
  }, [isOffline]);

  // Acknowledge an alert (persists offline too)
  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.map(alert =>
        alert.id === id ? { ...alert, isAcknowledged: true } : alert
      );
      return updated;
    });
  }, []);

  return {
    alerts,
    isOffline,
    lastSyncTime,
    acknowledgeAlert
  };
};
