import React from 'react';
import { Card } from '../ui/Card';
import { DataFreshness } from '../ui/DataFreshness';
import { MapPin, MapPinOff, Navigation, ShieldCheck } from 'lucide-react';
import { useLocation } from '../../hooks/useLocation';

export const LocationCompact: React.FC = () => {
  const { location, requestLocation } = useLocation();

  const headerAction = location.lastUpdated ? (
    <DataFreshness lastUpdated={location.lastUpdated} />
  ) : null;

  return (
    <Card
      title="LOCATION TELEMETRY"
      className="location-card-compact h-full"
      headerAction={headerAction}
    >
      <div className="flex flex-col h-full justify-center p-4 sm:p-6">
        {location.status === 'granted' && location.coords ? (
          <div className="flex flex-col h-full justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-accent/10 p-3 rounded-xl border border-accent/20 text-accent">
                <Navigation size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Live Coordinates</span>
                <h4 className="text-xl sm:text-2xl font-mono text-white font-bold tracking-tight">
                  {Math.abs(location.coords.latitude).toFixed(4)}° {location.coords.latitude >= 0 ? 'N' : 'S'}
                </h4>
                <h4 className="text-xl sm:text-2xl font-mono text-white font-bold tracking-tight">
                  {Math.abs(location.coords.longitude).toFixed(4)}° {location.coords.longitude >= 0 ? 'E' : 'W'}
                </h4>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg text-success text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={14} />
                Access Granted
              </div>
              <div className="flex items-center gap-2 bg-surface-hover border border-border px-3 py-1.5 rounded-lg text-text-secondary text-xs font-bold uppercase tracking-wider">
                <MapPin size={14} />
                Acc: ~{Math.round(location.coords.accuracy)}m
              </div>
            </div>
          </div>
        ) : location.status === 'granting' ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-text-secondary">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium tracking-wide">Acquiring signal...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="bg-danger/10 p-4 rounded-full text-danger mb-2">
              <MapPinOff size={28} />
            </div>
            <p className="text-sm text-text-secondary max-w-[200px]">
              Location access is {location.status === 'denied' ? 'disabled' : 'unavailable'}
            </p>
            <button className="btn-primary mt-2" onClick={requestLocation}>
              {location.status === 'prompt' ? 'Enable Location' : 'Retry Access'}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};
