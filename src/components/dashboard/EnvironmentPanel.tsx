import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { DataFreshness } from '../ui/DataFreshness';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { CloudRain, Wind, Droplets, Thermometer, Info } from 'lucide-react';
import { useWeather, getWeatherDescription } from '../../hooks/useWeather';
import '../../styles/EnvironmentPanel.css';

interface EnvironmentPanelProps {
  latitude?: number;
  longitude?: number;
}

export const EnvironmentPanel: React.FC<EnvironmentPanelProps> = ({ latitude, longitude }) => {
  const { data, loading, error, lastUpdated, forceRefresh } = useWeather(latitude, longitude);

  const headerAction = (
    <DataFreshness
      lastUpdated={lastUpdated}
      isLive={!!data}
      onRefresh={forceRefresh}
      loading={loading}
    />
  );

  return (
    <Card
      title="LIVE ENVIRONMENT"
      className="environment-card"
      headerAction={headerAction}
    >
      {loading && !data && <LoadingState text="Fetching current environmental conditions..." />}

      {error && !data && (
        <EmptyState
          title="Environmental data temporarily unavailable."
          description={error}
          variant="warning"
          action={
            <button className="btn-outline" onClick={forceRefresh}>
              Retry
            </button>
          }
        />
      )}

      {!latitude && !longitude && !loading && !data && (
        <EmptyState
          title="Location Required"
          description="Enable location access to view local environmental conditions."
        />
      )}

      {data && (
        <motion.div
          className="environment-grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="env-item">
            <Thermometer className="env-icon" size={20} />
            <div className="env-data">
              <span className="env-label">Temperature</span>
              <span className="env-value">
                <AnimatedNumber value={data.temperature} format={(v) => v.toFixed(1)} />°C
              </span>
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="env-item">
            <Thermometer className="env-icon" size={20} />
            <div className="env-data">
              <span className="env-label">Feels like</span>
              <span className="env-value">
                <AnimatedNumber value={data.feelsLike} format={(v) => v.toFixed(1)} />°C
              </span>
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="env-item">
            <Droplets className="env-icon" size={20} />
            <div className="env-data">
              <span className="env-label">Humidity</span>
              <span className="env-value">
                <AnimatedNumber value={data.humidity} />%
              </span>
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="env-item">
            <Wind className="env-icon" size={20} />
            <div className="env-data">
              <span className="env-label">Wind</span>
              <span className="env-value">
                <AnimatedNumber value={data.windSpeed} format={(v) => v.toFixed(1)} /> km/h
              </span>
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="env-item">
            <CloudRain className="env-icon" size={20} />
            <div className="env-data">
              <span className="env-label">Precipitation</span>
              <span className="env-value">
                <AnimatedNumber value={data.precipitation} format={(v) => v.toFixed(1)} /> mm
              </span>
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="env-item condition-full">
            <div className="env-data condition-row">
              <div className="condition-main">
                <span className="env-label">Condition</span>
                <span className="env-value condition-text">{getWeatherDescription(data.weatherCode)}</span>
              </div>
              <div className="env-source" title="Source: Open-Meteo">
                <Info size={14} className="source-icon" />
                <span>Open-Meteo</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </Card>
  );
};
