import React from 'react';
import { Card } from '../ui/Card';
import { InteractiveMap } from './InteractiveMap';
import { MapMarker } from './MapMarker';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyFacilities } from '../../hooks/useNearbyFacilities';
import { MapPin, Activity, ShieldAlert, Cross } from 'lucide-react';
import { MapPopup } from './MapPopup';

export const LocalMapCard: React.FC = () => {
  const { location } = useLocation();
  
  // Safe defaults if location isn't active
  const coords: [number, number] = location.coords 
    ? [location.coords.latitude, location.coords.longitude] 
    : [20.4625, 85.8830]; // Fallback coordinates

  const { facilities } = useNearbyFacilities(
    location.coords?.latitude, 
    location.coords?.longitude, 
    2 // 2km radius for local map
  );

  const getIconForType = (type: string) => {
    switch (type) {
      case 'hospital': return <Activity />;
      case 'police': return <ShieldAlert />;
      case 'fire': return <ShieldAlert />;
      case 'pharmacy': return <Cross />;
      default: return <MapPin />;
    }
  };

  return (
    <Card 
      title="LOCAL AREA MAP" 
      className="h-[350px] p-0 overflow-hidden flex flex-col relative"
    >
      <div className="absolute inset-0 top-[60px] bottom-[30px] p-0">
        {location.status === 'granting' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50 text-text-secondary z-10 text-sm">
            Acquiring location data...
          </div>
        ) : location.status === 'denied' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50 text-text-secondary z-10 text-sm">
            Location access denied. Map unavailable.
          </div>
        ) : null}

        <InteractiveMap center={coords} zoom={14}>
          {/* User Location */}
          {location.coords && (
            <MapMarker position={coords} icon={<MapPin />} type="user">
               <MapPopup title="Your Current Location" type="You are here" />
            </MapMarker>
          )}

          {/* Nearby Facilities */}
          {facilities
            .filter(f => typeof f.lat === 'number' && typeof f.lon === 'number' && !isNaN(f.lat) && !isNaN(f.lon) && Math.abs(f.lat) <= 90 && Math.abs(f.lon) <= 180)
            .slice(0, 5)
            .map(f => (
            <MapMarker 
              key={f.id} 
              position={[f.lat, f.lon]} 
              icon={getIconForType(f.type)}
              type={f.type === 'hospital' || f.type === 'pharmacy' ? 'hospital' : 'police'}
            >
              <MapPopup 
                title={f.name} 
                type={f.type} 
                distance={f.distance} 
                metadata={[{ label: 'Verified', value: 'OpenStreetMap' }]}
              />
            </MapMarker>
          ))}
        </InteractiveMap>
      </div>
      <div className="p-3 bg-surface border-t border-border/40 text-[0.65rem] text-text-secondary flex justify-between items-center">
        <span>Displaying {facilities.length} verified facilities nearby</span>
        <span className="uppercase tracking-widest">Radius: 2km</span>
      </div>
    </Card>
  );
};
