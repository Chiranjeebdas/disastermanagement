import React, { useEffect } from 'react';
import { 
  Activity, 
  Wind, 
  Droplets, 
  Thermometer, 
  CloudRain,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { useWeather } from '../hooks/useWeather';
import { DisasterProbabilityChart } from '../components/dashboard/DisasterProbabilityChart';
import { ConfidenceRadarChart } from '../components/dashboard/ConfidenceRadarChart';
import { EnvironmentPanel } from '../components/dashboard/EnvironmentPanel';
import { ClimateNewsFeed } from '../components/dashboard/ClimateNewsFeed';
import '../styles/LiveTelemetry.css';

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
  const { data: weather } = useWeather(
    location.coords?.latitude,
    location.coords?.longitude
  );

  // Auto-request location on mount if not prompted
  useEffect(() => {
    if (location.status === 'prompt') {
      requestLocation();
    }
  }, [location.status, requestLocation]);

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



  return (
    <div className="telemetry-container">
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
        </div>

        {/* Right Column */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <ClimateNewsFeed />
          </div>
        </div>
      </div>
    </div>
  );
};
