import { useState, useEffect, useCallback } from 'react';
import type { Alert } from '../types/alert';

const STORAGE_KEY = 'drishti_alerts_cache_v2';

const INITIAL_DEMO_ALERTS: Alert[] = [
  {
    id: 'a1',
    title: 'Flash Flood Risk Detected',
    severity: 'Critical',
    type: 'Flood',
    location: 'Cuttack, Odisha',
    detectedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 min ago
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
    detectedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 min ago
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
    detectedAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(), // 32 min ago
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

  // Initialize data from localStorage or default
  useEffect(() => {
    const loadAlerts = () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setAlerts(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to parse cached alerts', e);
      }
      
      // Fallback to initial demo data
      setAlerts(INITIAL_DEMO_ALERTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ALERTS));
    };

    loadAlerts();
  }, []);

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

  // Simulate subtle live updates to timestamps (only when online)
  useEffect(() => {
    if (isOffline) return;

    const interval = setInterval(() => {
      setAlerts(prev => {
        const newAlerts = [...prev];
        // Arbitrarily "update" the first unacknowledged active alert's timestamp to show live capability
        const activeAlert = newAlerts.find(a => a.status !== 'Resolved');
        if (activeAlert) {
          activeAlert.updatedAt = new Date().toISOString();
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
        return newAlerts;
      });
      setLastSyncTime(new Date());
    }, 45000); // 45 seconds update tick

    return () => clearInterval(interval);
  }, [isOffline]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.map(alert => 
        alert.id === id ? { ...alert, isAcknowledged: true } : alert
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
