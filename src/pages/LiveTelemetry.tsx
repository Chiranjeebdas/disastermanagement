import React, { useEffect } from 'react';
import { useLocation } from '../hooks/useLocation';
import { LiveReadingsCard } from '../components/dashboard/LiveReadingsCard';
import { DisasterProbabilityChart } from '../components/dashboard/DisasterProbabilityChart';
import { ConfidenceRadarChart } from '../components/dashboard/ConfidenceRadarChart';
import { ClimateNewsFeed } from '../components/dashboard/ClimateNewsFeed';
import '../styles/LiveTelemetry.css';

export const LiveTelemetry: React.FC = () => {
  const { location, requestLocation } = useLocation();

  useEffect(() => {
    if (location.status === 'prompt') {
      requestLocation();
    }
  }, [location.status, requestLocation]);

  return (
    <div className="telemetry-container max-w-[1400px] mx-auto p-4 md:p-8">
      {/* Main Grid: Left side (Readings & Risk), Right side (News & Confidence) */}
      <div className="telemetry-dashboard-grid">
        
        {/* Left Column (Spans 2 columns) */}
        <div className="telemetry-left-col">
          <div className="telemetry-panel-small">
            <LiveReadingsCard 
              latitude={location.coords?.latitude}
              longitude={location.coords?.longitude}
            />
          </div>
          <div className="telemetry-panel-large">
            <DisasterProbabilityChart 
              latitude={location.coords?.latitude}
              longitude={location.coords?.longitude}
            />
          </div>
        </div>

        {/* Right Column (Spans 1 column) */}
        <div className="telemetry-right-col">
          <div className="telemetry-panel-small">
            <ClimateNewsFeed />
          </div>
          <div className="telemetry-panel-large">
            <ConfidenceRadarChart 
              latitude={location.coords?.latitude}
              longitude={location.coords?.longitude}
            />
          </div>
        </div>
        
      </div>
    </div>
  );
};

