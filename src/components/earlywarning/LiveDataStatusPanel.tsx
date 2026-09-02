import React from 'react';
import { CloudSun, Flame, Activity, Waves, Users } from 'lucide-react';
import type { DataQualityReport } from '../../hooks/useEarlyWarning';
import type { LiveFireTelemetry, LiveHydrologyTelemetry, LiveSeismicTelemetry } from '../../types/telemetry';
import type { WeatherData } from '../../hooks/useWeather';

interface LiveDataStatusPanelProps {
  dataQuality: DataQualityReport;
  weatherData: WeatherData | null;
  fireTelemetry: LiveFireTelemetry | null;
  hydrologyTelemetry: LiveHydrologyTelemetry | null;
  seismicTelemetry: LiveSeismicTelemetry | null;
  lastUpdated?: Date | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const LiveDataStatusPanel: React.FC<LiveDataStatusPanelProps> = ({
  dataQuality,
  weatherData,
  fireTelemetry,
  hydrologyTelemetry,
  seismicTelemetry
}) => {
  const sources = [
    {
      id: 'weather',
      name: 'Open-Meteo',
      icon: <CloudSun size={13} className="text-sky-400" />,
      detail: weatherData ? `${weatherData.temperature.toFixed(1)}°C • ${weatherData.humidity}% RH • ${weatherData.windSpeed.toFixed(0)} km/h` : 'Offline'
    },
    {
      id: 'firms',
      name: 'NASA FIRMS',
      icon: <Flame size={13} className="text-rose-400" />,
      detail: fireTelemetry ? (fireTelemetry.detectionsWithin25km > 0 ? `${fireTelemetry.detectionsWithin25km} Active Fire(s)` : '0 Fires (25km)') : 'Offline'
    },
    {
      id: 'usgs',
      name: 'USGS GSN',
      icon: <Activity size={13} className="text-amber-400" />,
      detail: seismicTelemetry ? (seismicTelemetry.nearestEvent ? `M${seismicTelemetry.nearestEvent.magnitude.toFixed(1)} (${seismicTelemetry.nearestEvent.epicentralDistanceKm}km)` : '0 Events (30km)') : 'Offline'
    },
    {
      id: 'glofas',
      name: 'GloFAS River',
      icon: <Waves size={13} className="text-cyan-400" />,
      detail: (hydrologyTelemetry?.isStationAvailable && typeof hydrologyTelemetry.riverDischargeM3s === 'number')
        ? `${hydrologyTelemetry.riverDischargeM3s.toFixed(0)} m³/s`
        : 'Catchment Baseline'
    },
    {
      id: 'community',
      name: 'Ground Reports',
      icon: <Users size={13} className="text-emerald-400" />,
      detail: `${dataQuality.localReportsCount} Verified`
    }
  ];

  return (
    <div className="ew-live-status-bar-compact">
      <div className="flex items-center gap-2 mr-1 flex-shrink-0">
        <span className="live-dot" />
        <span className="text-[11px] font-extrabold text-zinc-300 uppercase tracking-wider whitespace-nowrap">
          LIVE SENSORS:
        </span>
      </div>
      <div className="ew-status-bar-chips">
        {sources.map(src => (
          <div key={src.id} className="ew-status-chip">
            <span className="flex-shrink-0">{src.icon}</span>
            <span className="font-bold text-zinc-200">{src.name}:</span>
            <span className="text-zinc-400 truncate">{src.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveDataStatusPanel;
