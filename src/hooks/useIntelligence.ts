import { useState, useMemo } from 'react';
import { useAlerts } from './useAlerts';
import { useWeather } from './useWeather';
import { useLocation } from './useLocation';
import type { IntelligenceItem, IntelligenceSourceType, IntelligenceSeverity } from '../types/intelligence';

export interface IntelligenceFilter {
  search: string;
  type: 'All' | IntelligenceSourceType;
  severity: 'All' | IntelligenceSeverity;
  timeRange: 'All' | 'LastHour' | '24Hours' | '7Days';
}

export const useIntelligence = () => {
  const { alerts, isOffline } = useAlerts();
  const { location } = useLocation();
  const { data: weather } = useWeather(location.coords?.latitude, location.coords?.longitude);

  const [filter, setFilter] = useState<IntelligenceFilter>({
    search: '',
    type: 'All',
    severity: 'All',
    timeRange: 'All'
  });

  // Aggregate Data
  const aggregatedData = useMemo(() => {
    const items: IntelligenceItem[] = [];

    // 1. Process Alerts -> Official Intelligence
    alerts.forEach(alert => {
      items.push({
        id: `alert-${alert.id}`,
        title: alert.title,
        summary: alert.description.length > 80 ? alert.description.substring(0, 80) + '...' : alert.description,
        fullDescription: alert.description,
        sourceType: 'Official',
        sourceName: alert.source,
        severity: alert.severity as IntelligenceSeverity,
        location: alert.location,
        coordinates: undefined, // Alerts currently don't have lat/lon in this mock
        timestamp: alert.detectedAt,
        isVerified: alert.isVerified,
        status: alert.status as any,
        metadata: alert.measurements,
        relatedAlertIds: [alert.id]
      });
    });

    // 2. Process Weather Anomalies -> Weather Intelligence
    if (weather) {
      let isWeatherAnomaly = false;
      let weatherTitle = '';
      let weatherDesc = '';
      let weatherSeverity: IntelligenceSeverity = 'Normal';

      if (weather.temperature > 40 || weather.temperature < -10) {
        isWeatherAnomaly = true;
        weatherTitle = 'Extreme Temperature Detected';
        weatherDesc = `Temperature has reached critical levels (${weather.temperature}°C). Prolonged exposure may be dangerous.`;
        weatherSeverity = 'Critical';
      } else if (weather.windSpeed > 60) {
        isWeatherAnomaly = true;
        weatherTitle = 'Severe Wind Conditions';
        weatherDesc = `High wind speeds detected (${weather.windSpeed} km/h). Secure loose objects and avoid coastal areas.`;
        weatherSeverity = 'Warning';
      } else if (weather.precipitation > 20) {
        isWeatherAnomaly = true;
        weatherTitle = 'Heavy Precipitation Alert';
        weatherDesc = `High rainfall rate (${weather.precipitation} mm). Potential for localized flooding.`;
        weatherSeverity = 'Warning';
      }

      if (isWeatherAnomaly) {
        items.push({
          id: `weather-anomaly-${Date.now()}`,
          title: weatherTitle,
          summary: weatherDesc,
          fullDescription: `${weatherDesc} Current environmental signals indicate a sustained anomaly in the area.`,
          sourceType: 'Weather',
          sourceName: 'Open-Meteo',
          severity: weatherSeverity,
          location: 'Current Location',
          coordinates: location.coords ? [location.coords.latitude, location.coords.longitude] : undefined,
          timestamp: new Date().toISOString(),
          isVerified: true,
          status: 'Active',
          metadata: [
            { label: 'Temperature', value: `${weather.temperature}°C` },
            { label: 'Wind', value: `${weather.windSpeed} km/h` },
            { label: 'Precipitation', value: `${weather.precipitation} mm` },
          ]
        });
      }
    }

    // Sort by timestamp descending
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [alerts, weather, location.coords]);

  // Apply Filters
  const filteredData = useMemo(() => {
    return aggregatedData.filter(item => {
      // Search
      if (filter.search && !item.title.toLowerCase().includes(filter.search.toLowerCase()) && !item.summary.toLowerCase().includes(filter.search.toLowerCase())) {
        return false;
      }
      
      // Type
      if (filter.type !== 'All' && item.sourceType !== filter.type) {
        return false;
      }

      // Severity
      if (filter.severity !== 'All' && item.severity !== filter.severity) {
        return false;
      }

      // Time Range
      if (filter.timeRange !== 'All') {
        const itemTime = new Date(item.timestamp).getTime();
        const now = Date.now();
        const diffHours = (now - itemTime) / (1000 * 60 * 60);

        if (filter.timeRange === 'LastHour' && diffHours > 1) return false;
        if (filter.timeRange === '24Hours' && diffHours > 24) return false;
        if (filter.timeRange === '7Days' && diffHours > 24 * 7) return false;
      }

      return true;
    });
  }, [aggregatedData, filter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      activeEvents: aggregatedData.filter(i => i.status === 'Active').length,
      watching: aggregatedData.filter(i => i.status === 'Monitoring').length,
      officialUpdates: aggregatedData.filter(i => i.sourceType === 'Official').length,
      communityReports: aggregatedData.filter(i => i.sourceType === 'Community').length
    };
  }, [aggregatedData]);

  // Priority Item (first Critical or Warning active item)
  const priorityItem = useMemo(() => {
    return aggregatedData.find(i => 
      i.status === 'Active' && 
      (i.severity === 'Critical' || i.severity === 'Warning')
    ) || null;
  }, [aggregatedData]);

  return {
    data: filteredData,
    stats,
    priorityItem,
    isOffline,
    filter,
    setFilter
  };
};
