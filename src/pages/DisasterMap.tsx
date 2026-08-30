import React, { useState, useEffect, useMemo } from 'react';
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
import { isGenuineReport } from '../utils/aiVerification';
import type { IncidentReport } from '../types/report';
import { MapPin, Activity, ShieldAlert, Cross, Flame, Info, Home, AlertTriangle } from 'lucide-react';

interface DisasterMapProps {
  embedded?: boolean;
  selectedIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
  onlyGenuineReports?: boolean;
  activeRouteDestination?: [number, number] | null;
  destinationTitle?: string;
  urgency?: string;
  onArrived?: () => void;
  onCloseRoute?: () => void;
  onNavigateToIncident?: (report: IncidentReport) => void;
}

export const DisasterMap: React.FC<DisasterMapProps> = ({ 
  embedded = false,
  selectedIncidentId,
  onSelectIncident,
  onlyGenuineReports = false,
  activeRouteDestination: externalRouteDestination,
  destinationTitle: externalDestinationTitle,
  urgency: externalUrgency,
  onArrived,
  onCloseRoute,
  onNavigateToIncident
}) => {
  const routerLocation = useRouterLocation();
  const { location } = useLocation();
  const { alerts } = useAlerts();
  const { reports } = useReports();
  const [internalRouteDestination, setInternalRouteDestination] = useState<[number, number] | null>(null);
  const [internalDestinationTitle, setInternalDestinationTitle] = useState<string | undefined>(undefined);
  const [internalUrgency, setInternalUrgency] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const activeRouteDestination = externalRouteDestination !== undefined ? externalRouteDestination : internalRouteDestination;
  const activeDestinationTitle = externalDestinationTitle !== undefined ? externalDestinationTitle : internalDestinationTitle;
  const activeUrgency = externalUrgency !== undefined ? externalUrgency : internalUrgency;

  const handleCloseRoute = () => {
    if (onCloseRoute) {
      onCloseRoute();
    }
    setInternalRouteDestination(null);
    setInternalDestinationTitle(undefined);
    setInternalUrgency(undefined);
  };

  // Set destination from router state if provided (e.g., from EmergencyHelp page)
  useEffect(() => {
    if (routerLocation.state && routerLocation.state.center) {
      setInternalRouteDestination(routerLocation.state.center as [number, number]);
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
    coords[0], 
    coords[1], 
    15 // 15km radius for the main map
  );

  const getIconForType = (type: string) => {
    switch (type) {
      case 'hospital': return <Activity size={18} />;
      case 'police': return <ShieldAlert size={18} />;
      case 'fire': return <Flame size={18} />;
      case 'pharmacy': return <Cross size={18} />;
      case 'shelter': return <Home size={18} />;
      default: return <MapPin size={18} />;
    }
  };

  // Filter reports according to onlyGenuineReports setting
  const visibleReports = useMemo(() => {
    let filtered = reports.filter(r => Boolean(r.coordinates));
    if (onlyGenuineReports) {
      filtered = filtered.filter(r => isGenuineReport(r) && r.responseStatus !== 'Resolved');
    }
    return filtered;
  }, [reports, onlyGenuineReports]);

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
            <MapMarker position={coords} icon={<MapPin />} type="user" isUser pulse={Boolean(activeRouteDestination)}>
               <MapPopup title="Your Current Location" type="You are here" />
            </MapMarker>
          )}

          {/* Real Facilities from Overpass / Verified Dataset (dimmed when navigating to avoid visual clutter) */}
          {facilities
            .filter(f => typeof f.lat === 'number' && typeof f.lon === 'number' && !isNaN(f.lat) && !isNaN(f.lon) && Math.abs(f.lat) <= 90 && Math.abs(f.lon) <= 180)
            .filter(f => {
              if (activeFilter === 'all') return true;
              if (activeFilter === 'hospital') return f.type === 'hospital' || f.type === 'pharmacy';
              return f.type === activeFilter;
            })
            .map(f => (
            <MapMarker 
              key={f.id} 
              position={[f.lat, f.lon]} 
              icon={getIconForType(f.type)}
              dimmed={Boolean(activeRouteDestination)}
              type={f.type === 'hospital' ? 'hospital' : f.type === 'police' ? 'police' : f.type === 'fire' ? 'fire' : f.type === 'shelter' ? 'shelter' : 'pharmacy'}
            >
              <MapPopup 
                title={f.name} 
                type={f.type.toUpperCase()} 
                distance={f.distance} 
                metadata={[
                  ...(f.address ? [{ label: 'Location', value: f.address }] : []),
                  ...(f.phone ? [{ label: 'Emergency Contact', value: f.phone }] : []),
                  ...(f.capacity ? [{ label: 'Capacity & Units', value: f.capacity }] : []),
                  { label: 'Status', value: f.status || 'Verified Operational' }
                ]}
                actionLabel="NAVIGATE TO FACILITY"
                onNavigate={() => {
                  setInternalRouteDestination([f.lat, f.lon]);
                  setInternalDestinationTitle(f.name);
                  setInternalUrgency(f.type === 'hospital' || f.type === 'fire' ? 'Critical' : 'Medium');
                }}
              />
            </MapMarker>
          ))}

          {/* Active Alerts (dimmed when navigating) */}
          {!onlyGenuineReports && activeFilter === 'all' && alerts
            .filter((a: any) => a.status !== 'Resolved')
            .map((alert: any, idx: number) => {
              const angle = (idx * Math.PI * 2) / alerts.length;
              const radius = (alert.affectedRadiusKm || 10) * 0.005;
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
                  dimmed={Boolean(activeRouteDestination)}
                  type={`alert-${alert.severity.toLowerCase()}`}
                >
                  <MapPopup 
                    title={alert.title} 
                    type={`SEVERITY: ${alert.severity}`}
                    metadata={[
                      { label: 'Location', value: alert.location },
                      { label: 'Detected', value: new Date(alert.detectedAt).toLocaleTimeString() },
                      { label: 'Source', value: alert.source },
                      { label: 'Status', value: alert.status }
                    ]}
                    onNavigate={() => {
                      setInternalRouteDestination([alertLat, alertLon]);
                      setInternalDestinationTitle(alert.title);
                      setInternalUrgency(alert.severity);
                    }}
                  />
                </MapMarker>
              );
            })
          }

          {/* Community Reports (Strictly Genuine when in volunteer/genuine mode; target is intensely highlighted) */}
          {activeFilter === 'all' && visibleReports.map(report => {
            let icon = <Info size={18} />;
            if (report.urgency === 'Critical') icon = <ShieldAlert size={18} />;
            if (report.urgency === 'Medium') icon = <AlertTriangle size={18} />;

            const isNavigating = Boolean(activeRouteDestination);
            const isTarget = Boolean(
              isNavigating && 
              activeRouteDestination && 
              Math.abs(report.coordinates!.latitude - activeRouteDestination[0]) < 0.0001 && 
              Math.abs(report.coordinates!.longitude - activeRouteDestination[1]) < 0.0001
            );
            const isSelected = selectedIncidentId === report.id;

            return (
              <MapMarker 
                key={report.id} 
                position={[report.coordinates!.latitude, report.coordinates!.longitude]} 
                icon={icon}
                isTarget={isTarget}
                pulse={isTarget}
                dimmed={isNavigating && !isTarget}
                type={isTarget || isSelected ? 'alert-critical' : `alert-${report.urgency === 'Critical' ? 'critical' : report.urgency === 'Medium' ? 'warning' : 'info'}`}
              >
                <MapPopup 
                  title={report.type} 
                  type={`AI-VERIFIED GENUINE • ${report.urgency.toUpperCase()}`}
                  metadata={[
                    { label: 'Incident ID', value: report.id },
                    { label: 'Location', value: report.locationName },
                    { label: 'Reported', value: new Date(report.timestamp).toLocaleTimeString() },
                    { label: 'Veracity', value: report.aiAnalysis ? `${report.aiAnalysis.confidenceScore}% (Genuine)` : 'Certified Genuine' },
                    { label: 'Status', value: report.responseStatus || report.status }
                  ]}
                  actionLabel="NAVIGATE TO INCIDENT"
                  onNavigate={() => {
                    const dest: [number, number] = [report.coordinates!.latitude, report.coordinates!.longitude];
                    if (onNavigateToIncident) {
                      onNavigateToIncident(report);
                    } else {
                      setInternalRouteDestination(dest);
                      setInternalDestinationTitle(`${report.type} - ${report.locationName}`);
                      setInternalUrgency(report.urgency);
                    }
                    if (onSelectIncident) {
                      onSelectIncident(report.id);
                    }
                  }}
                />
              </MapMarker>
            );
          })}

          <MapRouting 
            start={coords} 
            end={activeRouteDestination} 
            destinationTitle={activeDestinationTitle}
            urgency={activeUrgency}
            onArrived={onArrived}
            onClose={handleCloseRoute} 
          />
        </InteractiveMap>
        
        {!embedded && <MapLegend />}
      </div>
    </div>
  );
};

