import { useState, useEffect } from 'react';

const SETTINGS_STORAGE_KEY = 'drishti_settings_v1';

export type UserRole = 'citizen' | 'volunteer';

export interface AlertPreferences {
  critical: boolean;
  weather: boolean;
  flood: boolean;
  cyclone: boolean;
  updates: boolean;
  nearby: boolean;
}

export interface UserSettings {
  role: UserRole;
  alertRadiusKm: number;
  alertPreferences: AlertPreferences;
}

const DEFAULT_SETTINGS: UserSettings = {
  role: 'citizen',
  alertRadiusKm: 25,
  alertPreferences: {
    critical: true,
    weather: true,
    flood: true,
    cyclone: true,
    updates: false,
    nearby: true
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Load from local storage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (cached) {
        setSettings(JSON.parse(cached));
      }
    } catch (e) {
      console.warn('Failed to parse cached settings', e);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateRole = (role: UserRole) => {
    setSettings(prev => ({ ...prev, role }));
  };

  const updateAlertRadius = (radius: number) => {
    setSettings(prev => ({ ...prev, alertRadiusKm: radius }));
  };

  const toggleAlertPreference = (key: keyof AlertPreferences) => {
    setSettings(prev => ({
      ...prev,
      alertPreferences: {
        ...prev.alertPreferences,
        [key]: !prev.alertPreferences[key]
      }
    }));
  };

  const clearAllData = () => {
    localStorage.clear();
    // In a real app we might preserve some auth tokens or just clear specific DRISHTI keys
    window.location.reload();
  };

  return {
    settings,
    updateRole,
    updateAlertRadius,
    toggleAlertPreference,
    clearAllData
  };
};
