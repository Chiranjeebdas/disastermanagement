import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Wind, 
  Droplets, 
  Thermometer, 
  CloudRain, 
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Radio,
  ServerCrash,
  BarChart2
} from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { useWeather } from '../hooks/useWeather';
import { DisasterProbabilityChart } from '../components/dashboard/DisasterProbabilityChart';
import { ConfidenceRadarChart } from '../components/dashboard/ConfidenceRadarChart';
import { EnvironmentPanel } from '../components/dashboard/EnvironmentPanel';
import '../styles/LiveTelemetry.css';

// Helper for formatting time difference
const getRelativeTime = (date: Date | null) => {
  if (!date) return 'Waiting for data...';
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return `Updated ${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  return `Updated ${diffInMinutes}m ago`;
};

// Types for signals
type AnomalyStatus = 'NORMAL' | 'MONITORING' | 'ELEVATED' | 'ANOMALY' | 'CRITICAL';

interface Signal {
  id: string;
  name: string;
  value: string;
  icon: React.ReactNode;
  status: AnomalyStatus;
  source: string;
}

export const LiveTelemetry: React.FC = () => {
  const { location, requestLocation } = useLocation();
  const { data: weather, loading: weatherLoading, lastUpdated, error, forceRefresh } = useWeather(
    location.coords?.latitude,
    location.coords?.longitude
  );

  const [timeAgo, setTimeAgo] = useState('Waiting for data...');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-request location on mount if not prompted
  useEffect(() => {
    if (location.status === 'prompt') {
      requestLocation();
    }
  }, [location.status, requestLocation]);

  // Update "time ago" string every second
  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => {
      setTimeAgo(getRelativeTime(lastUpdated));
    }, 1000);
    setTimeAgo(getRelativeTime(lastUpdated));
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    forceRefresh();
    setTimeout(() => setIsRefreshing(false), 800); // minimum visual spin time
  };

  // Compute Anomaly Statuses based on simple rules
  const getTempStatus = (temp: number): AnomalyStatus => {
    if (temp > 40 || temp < -10) return 'CRITICAL';
    if (temp > 35 || temp < 0) return 'ELEVATED';
    return 'MONITORING';
  };

  const getWindStatus = (wind: number): AnomalyStatus => {
    if (wind > 100) return 'CRITICAL';
    if (wind > 60) return 'ANOMALY';
    if (wind > 40) return 'ELEVATED';
    return 'MONITORING';
  };

  const getPrecipStatus = (precip: number): AnomalyStatus => {
    if (precip > 50) return 'CRITICAL';
    if (precip > 20) return 'ANOMALY';
    if (precip > 5) return 'ELEVATED';
    return 'NORMAL'; // precip is often normal if low
  };

  // Compile Signals array
  const signals: Signal[] = weather ? [
    {
      id: 'temp',
      name: 'Temperature',
      value: `${weather.temperature}°C`,
      icon: <Thermometer size={18} />,
      status: getTempStatus(weather.temperature),
      source: 'Open-Meteo'
    },
    {
      id: 'wind',
      name: 'Wind Speed',
      value: `${weather.windSpeed} km/h`,
      icon: <Wind size={18} />,
      status: getWindStatus(weather.windSpeed),
      source: 'Open-Meteo'
    },
    {
      id: 'precip',
      name: 'Precipitation',
      value: `${weather.precipitation} mm`,
      icon: <CloudRain size={18} />,
      status: getPrecipStatus(weather.precipitation),
      source: 'Open-Meteo'
    },
    {
      id: 'hum',
      name: 'Humidity',
      value: `${weather.humidity}%`,
      icon: <Droplets size={18} />,
      status: 'MONITORING',
      source: 'Open-Meteo'
    }
  ] : [];

  const getStatusBadgeClass = (status: AnomalyStatus) => {
    switch (status) {
      case 'NORMAL': return 'badge-normal';
      case 'MONITORING': return 'badge-monitoring';
      case 'ELEVATED': return 'badge-elevated';
      case 'ANOMALY': return 'badge-anomaly';
      case 'CRITICAL': return 'badge-anomaly';
      default: return 'badge-monitoring';
    }
  };

  const getStatusIcon = (status: AnomalyStatus) => {
    switch (status) {
      case 'NORMAL': return <ShieldCheck size={14} />;
      case 'MONITORING': return <Activity size={14} />;
      case 'ELEVATED': return <AlertTriangle size={14} />;
      case 'ANOMALY': return <AlertTriangle size={14} />;
      case 'CRITICAL': return <AlertTriangle size={14} />;
      default: return <Activity size={14} />;
    }
  };

  // Determine global anomaly state
  const globalStatus = signals.reduce((acc, curr) => {
    if (curr.status === 'CRITICAL' || acc === 'CRITICAL') return 'CRITICAL';
    if (curr.status === 'ANOMALY' || acc === 'ANOMALY') return 'ANOMALY';
    if (curr.status === 'ELEVATED' || acc === 'ELEVATED') return 'ELEVATED';
    return 'MONITORING';
  }, 'MONITORING' as AnomalyStatus);

  return (
    <div className="telemetry-container">
      {/* Header */}
      <header className="telemetry-header justify-end">
        <div className="telemetry-status-group">
          <div className="telemetry-live-badge">
            <div className="live-pulse" />
            LIVE
          </div>
          <span className="text-xs text-text-secondary">{timeAgo}</span>
          <button 
            className="telemetry-refresh-btn" 
            onClick={handleRefresh}
            disabled={isRefreshing || weatherLoading}
          >
            <RefreshCw size={14} className={isRefreshing || weatherLoading ? 'animate-spin' : ''} />
            REFRESH
          </button>
        </div>
      </header>

      {/* Dashboard Widgets */}
      <div className="telemetry-widgets-grid">
        <div className="telemetry-widget-container">
          <DisasterProbabilityChart 
            latitude={location.coords?.latitude}
            longitude={location.coords?.longitude}
          />
        </div>
        <div className="telemetry-widget-container">
          <ConfidenceRadarChart 
            latitude={location.coords?.latitude}
            longitude={location.coords?.longitude}
          />
        </div>
        <div className="telemetry-widget-container">
          <EnvironmentPanel
            latitude={location.coords?.latitude}
            longitude={location.coords?.longitude}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="telemetry-kpi-grid">
        <div className="telemetry-kpi-card">
          <div className="kpi-header">
            <Thermometer size={16} />
            <span className="kpi-label">TEMPERATURE</span>
          </div>
          <div className="kpi-value-group">
            <span className="kpi-value">{weather ? weather.temperature : '--'}</span>
            <span className="kpi-unit">°C</span>
          </div>
          <span className={`kpi-status ${weather ? (getTempStatus(weather.temperature) === 'MONITORING' ? 'status-normal' : 'status-elevated') : ''}`}>
            {weather ? (getTempStatus(weather.temperature) === 'MONITORING' ? 'Normal range' : 'Abnormal range') : 'Waiting...'}
          </span>
        </div>

        <div className="telemetry-kpi-card">
          <div className="kpi-header">
            <Activity size={16} />
            <span className="kpi-label">FEELS LIKE</span>
          </div>
          <div className="kpi-value-group">
            <span className="kpi-value">{weather ? weather.feelsLike : '--'}</span>
            <span className="kpi-unit">°C</span>
          </div>
          <span className="kpi-status status-normal">
            {weather ? 'Calculated index' : 'Waiting...'}
          </span>
        </div>

        <div className="telemetry-kpi-card">
          <div className="kpi-header">
            <Droplets size={16} />
            <span className="kpi-label">HUMIDITY</span>
          </div>
          <div className="kpi-value-group">
            <span className="kpi-value">{weather ? weather.humidity : '--'}</span>
            <span className="kpi-unit">%</span>
          </div>
          <span className="kpi-status status-normal">
            {weather ? 'Relative' : 'Waiting...'}
          </span>
        </div>

        <div className="telemetry-kpi-card">
          <div className="kpi-header">
            <Wind size={16} />
            <span className="kpi-label">WIND</span>
          </div>
          <div className="kpi-value-group">
            <span className="kpi-value">{weather ? weather.windSpeed : '--'}</span>
            <span className="kpi-unit">km/h</span>
          </div>
          <span className={`kpi-status ${weather ? (getWindStatus(weather.windSpeed) === 'MONITORING' ? 'status-normal' : 'status-elevated') : ''}`}>
             {weather ? `${weather.windDirection}° Direction` : 'Waiting...'}
          </span>
        </div>

        <div className="telemetry-kpi-card">
          <div className="kpi-header">
            <CloudRain size={16} />
            <span className="kpi-label">PRECIPITATION</span>
          </div>
          <div className="kpi-value-group">
            <span className="kpi-value">{weather ? weather.precipitation : '--'}</span>
            <span className="kpi-unit">mm</span>
          </div>
          <span className="kpi-status status-normal">
             {weather ? 'Current hourly rate' : 'Waiting...'}
          </span>
        </div>
      </div>

      <div className="telemetry-main-grid">
        {/* Left Column */}
        <div className="flex flex-col gap-[var(--spacing-xl)]">
          {/* Real-Time Signals */}
          <section className="telemetry-section">
            <header>
              <h2 className="section-title">ENVIRONMENTAL SIGNALS</h2>
              <p className="section-subtitle">Continuous monitoring for abnormal environmental changes</p>
            </header>
            
            <div className="signal-list">
              {weather ? signals.map(signal => (
                <div key={signal.id} className="signal-row">
                  <div className="signal-name">
                    <span className="text-accent">{signal.icon}</span>
                    {signal.name}
                  </div>
                  <div className="signal-value">{signal.value}</div>
                  <div>
                    <span className={`signal-badge ${getStatusBadgeClass(signal.status)}`}>
                      {getStatusIcon(signal.status)}
                      {signal.status}
                    </span>
                  </div>
                  <div className="signal-meta">
                    <span>{timeAgo}</span>
                    <span>{signal.source}</span>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center text-sm text-text-secondary font-medium">
                  Initializing sensor arrays...
                </div>
              )}
            </div>
          </section>

          {/* Trend Charts - Empty State */}
          <section className="telemetry-section flex-1 min-h-[300px]">
            <header>
              <h2 className="section-title">TREND CHARTS</h2>
              <p className="section-subtitle">Time-series environmental analysis</p>
            </header>
            
            <div className="telemetry-empty-state flex-1">
              <BarChart2 size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">Historical Data Unavailable</h3>
              <p className="empty-state-desc">
                DRISHTI is currently receiving live point-in-time measurements only. Historical trend processing module is offline.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="side-panels">
          {/* Anomaly Monitor */}
          <section className="telemetry-section">
            <header>
              <h2 className="section-title text-danger">ANOMALY MONITOR</h2>
              <p className="section-subtitle">Automated threat detection</p>
            </header>
            
            <div className="flex flex-col items-center justify-center py-6 gap-4 border border-dashed border-border rounded-lg mt-2">
              <span className={`signal-badge ${getStatusBadgeClass(globalStatus)} !text-sm !px-4 !py-2 !gap-2`}>
                {getStatusIcon(globalStatus)}
                SYSTEM {globalStatus}
              </span>
              <p className="text-xs text-text-secondary text-center px-4">
                {globalStatus === 'MONITORING' 
                  ? 'All environmental telemetry channels are operating within expected safe baseline thresholds.'
                  : 'Anomalous environmental signals detected. Please review signal panel for specifics.'}
              </p>
            </div>
          </section>

          {/* Signal Health */}
          <section className="telemetry-section">
            <header>
              <h2 className="section-title">DATA HEALTH</h2>
              <p className="section-subtitle">Telemetry source connectivity</p>
            </header>
            
            <div className="flex flex-col mt-2">
              <div className="health-item">
                <span className="health-name flex items-center gap-2">
                  <Radio size={14} className="text-accent" />
                  Weather Service
                </span>
                <span className="health-status">
                  <div className={`health-dot ${weather && !error ? 'online' : 'offline'}`} />
                  {weather && !error ? 'Online' : 'Unavailable'}
                </span>
              </div>
              
              <div className="health-item">
                <span className="health-name flex items-center gap-2">
                  <Activity size={14} className="text-accent" />
                  Env. Signals
                </span>
                <span className="health-status">
                  <div className={`health-dot ${weather && !error ? 'online' : 'offline'}`} />
                  {weather && !error ? 'Online' : 'Unavailable'}
                </span>
              </div>

              <div className="health-item">
                <span className="health-name flex items-center gap-2">
                  <ShieldCheck size={14} className="text-accent" />
                  GPS Tracking
                </span>
                <span className="health-status">
                  <div className={`health-dot ${location.coords ? 'online' : 'offline'}`} />
                  {location.coords ? 'Online' : 'Unavailable'}
                </span>
              </div>
              
              <div className="health-item">
                <span className="health-name flex items-center gap-2 text-text-muted">
                  <ServerCrash size={14} />
                  Historical DB
                </span>
                <span className="health-status">
                  <div className="health-dot offline opacity-50" />
                  Offline
                </span>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-md text-xs text-danger text-center">
                CONNECTION ERROR: {error}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
