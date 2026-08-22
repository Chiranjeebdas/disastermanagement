import React from 'react';
import { MapPin, MapPinOff } from 'lucide-react';
import { useLocation } from '../../hooks/useLocation';
import { InteractiveMap } from '../map/InteractiveMap';
import { MapMarker } from '../map/MapMarker';

export const LocationStatus: React.FC = () => {
  const { location, requestLocation } = useLocation();
  const [zoomLevel, setZoomLevel] = React.useState(14);

  return (
    <div className="drishti-card relative h-[300px] w-full overflow-hidden p-0 border border-border rounded-lg">
      {location.status === 'granted' && location.coords ? (
        <div 
          className="absolute inset-0 cursor-pointer" 
          onClick={() => setZoomLevel(prev => prev === 14 ? 18 : 14)}
        >
          <InteractiveMap 
            center={[location.coords.latitude, location.coords.longitude]} 
            zoom={zoomLevel}
          >
            <MapMarker 
              position={[location.coords.latitude, location.coords.longitude]} 
              icon={<MapPin />} 
              type="user" 
            />
          </InteractiveMap>
          
          {/* A small overlay badge showing it's the live location */}
          <div className="absolute top-3 left-3 z-[1000] bg-surface border border-border px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 pointer-events-none" style={{ backgroundColor: 'rgba(13, 17, 18, 0.9)' }}>
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white m-0 leading-none" style={{ fontFamily: 'system-ui, sans-serif' }}>Live Location</span>
          </div>
        </div>
      ) : location.status === 'granting' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/50 text-text-secondary z-10 text-sm">
          Acquiring location data...
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/50 text-text-secondary z-10 p-4 text-center">
          <MapPinOff size={24} className="mb-2 text-danger" />
          <p className="text-sm mb-4">Location access is {location.status === 'denied' ? 'disabled' : 'unavailable'}</p>
          <button className="btn-primary" onClick={requestLocation}>
            {location.status === 'prompt' ? 'Enable Location' : 'Retry Location Access'}
          </button>
        </div>
      )}
    </div>
  );
};
