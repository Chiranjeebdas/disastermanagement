import { useState, useEffect } from 'react';
import { getOfflineWeatherData } from '../utils/offlineData';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
}

interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Map WMO weather codes to descriptions (subset)
export const getWeatherDescription = (code: number) => {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2 || code === 3) return 'Mainly clear, partly cloudy, and overcast';
  if (code === 45 || code === 48) return 'Fog and depositing rime fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 75) return 'Snow fall';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Unknown';
};

export const useWeather = (latitude?: number, longitude?: number) => {
  const [weather, setWeather] = useState<WeatherState>(() => {
    const lat = latitude ?? 20.4625;
    const lon = longitude ?? 85.8828;
    const cacheKey = `drishti_weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        return {
          data: cachedData,
          loading: false,
          error: null,
          lastUpdated: new Date(timestamp),
        };
      }
    } catch {}
    const offlineFallback = getOfflineWeatherData(lat, lon);
    return {
      data: offlineFallback,
      loading: false,
      error: null,
      lastUpdated: new Date(),
    };
  });

  const fetchWeather = async (lat: number, lon: number) => {
    setWeather(prev => ({ ...prev, loading: true, error: null }));
    const cacheKey = `drishti_weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;

    try {
      if (!navigator.onLine) {
        throw new Error('Device is offline');
      }

      // Using Open-Meteo free API
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      const current = data.current;

      const weatherData: WeatherData = {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        precipitation: current.precipitation,
        weatherCode: current.weather_code,
        isDay: current.is_day === 1,
      };

      // Cache to localStorage for offline use
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data: weatherData, timestamp: Date.now() }));
      } catch {}

      setWeather({
        data: weatherData,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch {
      // Load from localStorage cache or calibrated offline meteorological model
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          setWeather({
            data: cachedData,
            loading: false,
            error: null,
            lastUpdated: new Date(timestamp),
          });
          return;
        }
      } catch {}

      const offlineFallback = getOfflineWeatherData(lat, lon);
      setWeather({
        data: offlineFallback,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    }
  };

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchWeather(latitude, longitude);

      // Poll every 15 minutes (900000 ms) - reasonable for weather
      const interval = setInterval(() => {
        fetchWeather(latitude, longitude);
      }, 900000);

      return () => clearInterval(interval);
    } else {
        setWeather(prev => ({ ...prev, data: null, error: null }));
    }
  }, [latitude, longitude]);

  const forceRefresh = () => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchWeather(latitude, longitude);
    }
  };

  return { ...weather, forceRefresh };
};
