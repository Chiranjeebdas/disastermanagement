import React, { useState, useEffect } from 'react';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { MapMarker } from '../components/map/MapMarker';
import { MapPopup } from '../components/map/MapPopup';
import { MapLegend } from '../components/map/MapLegend';
import { MapRouting } from '../components/map/MapRouting';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useLocation } from '../hooks/useLocation';
import { useNearbyFacilities } from '../hooks/useNearbyFacilities';
import { useReports } from '../hooks/useReports';
import { useAlerts } from '../hooks/useAlerts';
import { MapPin, Activity, ShieldAlert, Cross, AlertTriangle, Info, Home } from 'lucide-react';

interface DisasterMapProps {
  embedded?: boolean;
  selectedIncidentId?: string;
  onSelectIncident?: (id: string) => void;
}

export const DisasterMap: React.FC<DisasterMapProps> = ({ onSelectIncident }) => {
  const routerLocation = useRouterLocation();
  const { location } = useLocation();
  const { alerts } = useAlerts();
  const { reports } = useReports();
  const [activeRouteDestination, setActiveRouteDestination] = useState<[number, number] | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Set destination from router state if provided (e.g., from EmergencyHelp page)
  useEffect(() => {
    if (routerLocation.state && routerLocation.state.center) {
      setActiveRouteDestination(routerLocation.state.center as [number, number]);
      // clear the state so it doesn't re-trigger on hot reloads unnecessarily
      window.history.replaceState({}, document.title);
    }
  }, [routerLocation.state]);
  
  // Listen for filter changes from TopBar
  useEffect(() => {
    const handleFilterChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveFilter(customEvent.detail);
    };
    window.addEventListener('map-filter-change', handleFilterChange);
    return () => window.removeEventListener('map-filter-change', handleFilterChange);
  }, []);

  // Safe defaults if location isn't active
  const coords: [number, number] = location.coords 
    ? [location.coords.latitude, location.coords.longitude] 
    : [20.4625, 85.8830]; // Fallback coordinates

  const { facilities, loading, error } = useNearbyFacilities(
    location.coords?.latitude, 
    location.coords?.longitude, 
    15 // 15km radius for the main map
  );

  const getIconForType = (type: string) => {
    switch (type) {
      case 'hospital': return <Activity size={18} />;
      case 'police': return <ShieldAlert size={18} />;
      case 'fire': return <AlertTriangle size={18} />;
      case 'pharmacy': return <Cross size={18} />;
      case 'shelter': return <Home size={18} />;
      default: return <MapPin size={18} />;
    }
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col relative z-0 bg-bg" style={{ height: '100%', minHeight: 0 }}>
      <div className="flex-1 w-full relative bg-surface min-h-0" style={{ height: '100%' }}>
        {loading && !facilities.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[500] text-accent font-bold tracking-widest uppercase">
            Loading Map Data...
          </div>
        )}
        
        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-danger/90 text-white px-4 py-2 rounded-lg z-[500] text-sm shadow-lg backdrop-blur">
            {error}
          </div>
        )}

        <InteractiveMap center={coords} zoom={13} className="w-full h-full">
          
          {/* User Location */}
          {location.coords && (
            <MapMarker position={coords} icon={<MapPin />} type="user">
               <MapPopup title="Your Current Location" type="You are here" />
            </MapMarker>
          )}

          {/* Real Facilities from Overpass */}
          {facilities
            .filter(f => typeof f.lat === 'number' && typeof f.lon === 'number' && !isNaN(f.lat) && !isNaN(f.lon) && Math.abs(f.lat) <= 90 && Math.abs(f.lon) <= 180)
            .filter(f => activeFilter === 'all' || f.type === activeFilter)
            .map(f => (
            <MapMarker 
              key={f.id} 
              position={[f.lat, f.lon]} 
              icon={getIconForType(f.type)}
              type={f.type === 'hospital' || f.type === 'pharmacy' ? 'hospital' : f.type === 'shelter' ? 'safe' : 'police'}
            >
              <MapPopup 
                title={f.name} 
                type={f.type} 
                distance={f.distance} 
                metadata={[
                  { label: 'Source', value: 'OpenStreetMap' },
                  { label: 'Status', value: 'Verified' }
                ]}
                onNavigate={() => {
                  console.log(`Navigating to ${f.name}`);
                  setActiveRouteDestination([f.lat, f.lon]);
                }}
              />
            </MapMarker>
          ))}
          {/* Active Alerts */}
          {activeFilter === 'all' && alerts
            .filter((a: any) => a.status !== 'Resolved')
            .map((alert: any, idx: number) => {
              // Generate pseudo-coordinates around the center for demo since Alert type lacks lat/lon
              // In production, real alerts would have precise geometries.
              const angle = (idx * Math.PI * 2) / alerts.length;
              const radius = (alert.affectedRadiusKm || 10) * 0.005; // rough km to deg conversion
              const alertLat = coords[0] + Math.cos(angle) * radius;
              const alertLon = coords[1] + Math.sin(angle) * radius;
              
              let icon = <Info size={18} />;
              if (alert.severity === 'Critical') icon = <ShieldAlert size={18} />;
              if (alert.severity === 'Warning') icon = <AlertTriangle size={18} />;

              return (
                <MapMarker 
                  key={alert.id} 
                  position={[alertLat, alertLon]} 
                  icon={icon}
                  type={`alert-${alert.severity.toLowerCase()}`}
                >
                  <MapPopup 
                    title={alert.title} 
                    type={`SEVERITY: ${alert.severity}`}
                    distance={undefined} 
                    metadata={[
                      { label: 'Location', value: alert.location },
                      { label: 'Detected', value: new Date(alert.detectedAt).toLocaleTimeString() },
                      { label: 'Source', value: alert.source },
                      { label: 'Status', value: alert.status }
                    ]}
                    onNavigate={() => setActiveRouteDestination([alertLat, alertLon])}
                  />
                </MapMarker>
              );
            })
          }

          {/* Community Reports */}
          {activeFilter === 'all' && reports.filter(r => r.coordinates).map(report => {
            let icon = <Info size={18} />;
            if (report.urgency === 'Critical') icon = <ShieldAlert size={18} />;
            if (report.urgency === 'Medium') icon = <AlertTriangle size={18} />;

            return (
              <MapMarker 
                key={report.id} 
                position={[report.coordinates!.latitude, report.coordinates!.longitude]} 
                icon={icon}
                type={`alert-${report.urgency === 'Critical' ? 'critical' : report.urgency === 'Medium' ? 'warning' : 'info'}`}
              >
                <MapPopup 
                  title={report.type} 
                  type={`COMMUNITY REPORT • ${report.urgency}`}
                  metadata={[
                    { label: 'Location', value: report.locationName },
                    { label: 'Reported', value: new Date(report.timestamp).toLocaleTimeString() },
                    { label: 'Status', value: report.responseStatus || report.status }
                  ]}
                  onNavigate={() => {
                    setActiveRouteDestination([report.coordinates!.latitude, report.coordinates!.longitude]);
                    if (onSelectIncident) onSelectIncident(report.id);
                  }}
                />
              </MapMarker>
            );
          })}

          <MapRouting 
            start={coords} 
            end={activeRouteDestination} 
            onClose={() => setActiveRouteDestination(null)} 
          />
        </InteractiveMap>
        
        <MapLegend />
      </div>
    </div>
  );
};
