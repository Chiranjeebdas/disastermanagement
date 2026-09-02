import React, { useState, useEffect, useMemo } from 'react';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { MapMarker } from '../components/map/MapMarker';
import { MapPopup } from '../components/map/MapPopup';
import { MapLegend } from '../components/map/MapLegend';
import { MapRouting } from '../components/map/MapRouting';
import { HazardZoneOverlay } from '../components/earlywarning/HazardZoneOverlay';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useLocation } from '../hooks/useLocation';
import { useNearbyFacilities } from '../hooks/useNearbyFacilities';
import { useReports } from '../hooks/useReports';
import { useAlerts } from '../hooks/useAlerts';
import { fetchOrchestratedNASA_FIRMS } from '../utils/liveDataOrchestrator';
import { useLocationAssessment } from '../hooks/useLocationAssessment';
import { LocationAssessmentPanel } from '../components/map/LocationAssessmentPanel';
import { isGenuineReport } from '../utils/aiVerification';
import { getDistance } from '../utils/distance';
import type { IncidentReport } from '../types/report';
import type { HazardRiskAssessment } from '../types/earlyWarning';
import type { LiveFirmsDetection } from '../types/telemetry';
import { MapPin, Activity, ShieldAlert, Cross, Flame, Info, Home, AlertTriangle, X, Navigation as NavigationIcon, Flag } from 'lucide-react';

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

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
  
  // Click-to-Assess Location State & Hook
  const {
    selectedCoords,
    isLoading: assessmentLoading,
    assessmentResult,
    error: assessmentError,
    assessLocation,
    clearAssessment
  } = useLocationAssessment();
  const [internalRouteDestination, setInternalRouteDestination] = useState<[number, number] | null>(null);
  const [internalDestinationTitle, setInternalDestinationTitle] = useState<string | undefined>(undefined);
  const [internalUrgency, setInternalUrgency] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Early Warning hazard zone integration state
  const [earlyWarningZone, setEarlyWarningZone] = useState<HazardRiskAssessment | null>(null);
  const [showEarlyWarningZone, setShowEarlyWarningZone] = useState<boolean>(false);
  const [firmsDetections, setFirmsDetections] = useState<LiveFirmsDetection[]>([]);

  // Safe defaults if location isn't active
  const coords: [number, number] = location.coords 
    ? [location.coords.latitude, location.coords.longitude] 
    : [20.4625, 85.8830]; // Fallback coordinates

  const [mapCenter, setMapCenter] = useState<[number, number]>(coords);
  const [mapZoom, setMapZoom] = useState<number>(13);

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
    window.dispatchEvent(new CustomEvent('map-navigation-state', {
      detail: { isNavigating: false }
    }));
  };

  // Sync active navigation state to TopBar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('map-navigation-state', {
      detail: {
        isNavigating: Boolean(activeRouteDestination),
        destinationTitle: activeDestinationTitle
      }
    }));
  }, [activeRouteDestination, activeDestinationTitle]);

  // Listen for cancel route from TopBar
  useEffect(() => {
    const handleCancel = () => {
      handleCloseRoute();
    };
    window.addEventListener('map-cancel-route', handleCancel);
    return () => window.removeEventListener('map-cancel-route', handleCancel);
  }, []);

  // Set destination or Early Warning hazard zone from router state if provided
  useEffect(() => {
    if (routerLocation.state) {
      if (routerLocation.state.earlyWarningZone) {
        const zone = routerLocation.state.earlyWarningZone as HazardRiskAssessment;
        setEarlyWarningZone(zone);
        setShowEarlyWarningZone(true);
        if (zone.centerCoordinates && Array.isArray(zone.centerCoordinates)) {
          setMapCenter(zone.centerCoordinates);
        }
      } else if (routerLocation.state.center) {
        setInternalRouteDestination(routerLocation.state.center as [number, number]);
        setMapCenter(routerLocation.state.center as [number, number]);
      }
      if (typeof routerLocation.state.zoom === 'number') {
        setMapZoom(routerLocation.state.zoom);
      }
      // clear the state so it doesn't re-trigger on hot reloads unnecessarily
      window.history.replaceState({}, document.title);
    }
  }, [routerLocation.state]);

  // Keep map centered on user location if not explicitly focused on a route or hazard zone
  useEffect(() => {
    if (location.coords && !earlyWarningZone && !activeRouteDestination) {
      setMapCenter([location.coords.latitude, location.coords.longitude]);
    }
  }, [location.coords, earlyWarningZone, activeRouteDestination]);

  const [centerLat, centerLon] = coords;

  // Fetch real NASA FIRMS active fire telemetry for current coordinates
  useEffect(() => {
    let isMounted = true;
    const stateTele = routerLocation.state as any;
    if (stateTele?.fireTelemetry?.activeDetections) {
      setFirmsDetections(stateTele.fireTelemetry.activeDetections);
    } else {
      fetchOrchestratedNASA_FIRMS(centerLat, centerLon).then(tel => {
        if (isMounted && tel?.activeDetections) {
          setFirmsDetections(tel.activeDetections);
        }
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [centerLat, centerLon, routerLocation.state]);
  
  // Listen for filter changes from TopBar
  useEffect(() => {
    const handleFilterChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveFilter(customEvent.detail);
    };
    window.addEventListener('map-filter-change', handleFilterChange);
    return () => window.removeEventListener('map-filter-change', handleFilterChange);
  }, []);

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

  // Reference coordinates for per-marker real distance calculation
  // Dynamically uses selected assessment coordinate if active, otherwise user's current GPS location, with safe fallback coordinates.
  const referenceLat = selectedCoords ? selectedCoords.latitude : (location.coords ? location.coords.latitude : coords[0]);
  const referenceLon = selectedCoords ? selectedCoords.longitude : (location.coords ? location.coords.longitude : coords[1]);

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

        {/* Floating Early Warning Zone Tactical Badge & Control */}
        {earlyWarningZone && (
          <div className="absolute top-4 left-4 z-[450] flex items-center gap-2.5 bg-[#0d0f12]/95 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-2xl">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className={earlyWarningZone.warningStage === 'Emergency' ? 'text-red-400 animate-pulse' : 'text-orange-400'} />
              <div className="flex flex-col">
                <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">
                  {earlyWarningZone.hazardType} Assessment ({earlyWarningZone.warningStage})
                </span>
                <span className="text-[9px] text-zinc-400">
                  Score: {earlyWarningZone.riskScore}/100 • Radius: ~{earlyWarningZone.impactRadiusKm}km
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEarlyWarningZone(prev => !prev)}
              className={`ml-2 text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
                showEarlyWarningZone
                  ? 'bg-accent text-[#090b0c]'
                  : 'bg-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {showEarlyWarningZone ? 'Hide Zone' : 'Show Zone'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEarlyWarningZone(null);
                setShowEarlyWarningZone(false);
              }}
              className="text-zinc-500 hover:text-white p-1 cursor-pointer"
              title="Dismiss Early Warning Overlay"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Floating Active Navigation Banner & Control */}
        {activeRouteDestination && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-[#0b0f14]/95 backdrop-blur-md border border-rose-500/60 rounded-xl px-4 py-2 shadow-2xl animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">
                  Active Emergency Route
                </span>
                <span className="text-[10px] text-cyan-300 font-semibold truncate max-w-[240px]">
                  {activeDestinationTitle || 'Target Destination'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseRoute}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-lg hover:scale-105"
              title="Cancel Navigation Route"
            >
              <X size={14} />
              Cancel Route
            </button>
          </div>
        )}

        {/* Floating Quick Hint Badge */}
        {!selectedCoords && !earlyWarningZone && !activeRouteDestination && (
          <div className="absolute top-4 left-4 z-[450] flex items-center gap-2 bg-[#0d0f12]/90 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2 shadow-2xl pointer-events-none animate-in fade-in duration-300">
            <span className="text-orange-400 font-bold text-xs">💡</span>
            <span className="text-[11px] font-semibold text-zinc-200">
              <span className="text-orange-400 font-extrabold">Double-click</span> anywhere on the map to pinpoint & assess live risk
            </span>
          </div>
        )}

        <InteractiveMap
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full"
          onMapDoubleClick={(lat, lng) => assessLocation(lat, lng)}
        >
          {/* Early Warning Hazard Zone Overlay */}
          <HazardZoneOverlay assessment={earlyWarningZone} isVisible={showEarlyWarningZone} />
          
          {/* Selected Assessment Location Marker */}
          {selectedCoords && (
            <MapMarker
              position={[selectedCoords.latitude, selectedCoords.longitude]}
              icon={<MapPin size={22} className="text-white drop-shadow-md" />}
              type="assessment-selected"
              pulse={true}
              isTarget={true}
            >
              <MapPopup
                title="SELECTED ASSESSMENT LOCATION"
                type="Live Risk Assessment"
                distance={getDistance(coords[0], coords[1], selectedCoords.latitude, selectedCoords.longitude)}
                metadata={[
                  { label: 'Coordinates', value: `${selectedCoords.latitude.toFixed(6)}° N, ${selectedCoords.longitude.toFixed(6)}° E` },
                  { label: 'Locality', value: assessmentResult?.locationName || (assessmentLoading ? 'Querying...' : 'Selected Location') },
                  { label: 'Warning Stage', value: assessmentResult ? assessmentResult.warningStage.toUpperCase() : (assessmentLoading ? 'Calculating...' : 'Pending') },
                  { label: 'Risk Score', value: assessmentResult ? `${assessmentResult.overallRisk} / 100` : (assessmentLoading ? 'Calculating...' : 'Pending') },
                  { label: 'Confidence', value: assessmentResult ? `${assessmentResult.confidence}%` : (assessmentLoading ? 'Calculating...' : 'Pending') }
                ]}
                actionLabel="NAVIGATE TO PINPOINT"
                onNavigate={() => {
                  setInternalRouteDestination([selectedCoords.latitude, selectedCoords.longitude]);
                  setInternalDestinationTitle(`Pinpoint: ${assessmentResult?.locationName || `${selectedCoords.latitude.toFixed(4)}°N, ${selectedCoords.longitude.toFixed(4)}°E`}`);
                  setInternalUrgency('Medium');
                  clearAssessment();
                }}
              />
            </MapMarker>
          )}

          {/* User Location: Live Directional Navigation Arrow when moving, GPS Pin when stationary */}
          {location.coords && (
            <MapMarker 
              position={coords} 
              icon={
                activeRouteDestination ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    transform: `rotate(${calculateBearing(coords[0], coords[1], activeRouteDestination[0], activeRouteDestination[1])}deg)`
                  }}>
                    <NavigationIcon size={20} className="text-white drop-shadow-md fill-white" />
                  </div>
                ) : (
                  <MapPin size={18} className="text-white drop-shadow-md" />
                )
              } 
              type="user" 
              isUser={true} 
              pulse={Boolean(activeRouteDestination)}
            >
               <MapPopup title={activeRouteDestination ? "Your Live GPS Position (Moving)" : "Your Current GPS Location"} type="You Are Here" />
            </MapMarker>
          )}

          {/* Active Navigation Destination Target Flag Pin */}
          {activeRouteDestination && (
            <MapMarker
              position={activeRouteDestination}
              icon={<Flag size={18} className="text-white drop-shadow-md fill-white" />}
              type="destination"
              isTarget={true}
              pulse={true}
            >
              <MapPopup
                title={activeDestinationTitle || "Navigation Target"}
                type="DESTINATION TARGET"
              />
            </MapMarker>
          )}

          {/* Real Facilities from Overpass / Verified Dataset (Displayed when not navigating) */}
          {!activeRouteDestination && facilities
            .filter(f => typeof f.lat === 'number' && typeof f.lon === 'number' && !isNaN(f.lat) && !isNaN(f.lon) && Math.abs(f.lat) <= 90 && Math.abs(f.lon) <= 180)
            .filter(f => {
              if (activeFilter === 'all') return true;
              if (activeFilter === 'hospital') return f.type === 'hospital' || f.type === 'pharmacy';
              return f.type === activeFilter;
            })
            .map(f => {
              const hasValidCoords = typeof f.lat === 'number' && typeof f.lon === 'number' && !isNaN(f.lat) && !isNaN(f.lon);
              const facilityDistanceKm = hasValidCoords
                ? getDistance(referenceLat, referenceLon, f.lat, f.lon)
                : undefined;

              return (
                <MapMarker 
                  key={f.id} 
                  position={[f.lat, f.lon]} 
                  icon={getIconForType(f.type)}
                  type={f.type === 'hospital' ? 'hospital' : f.type === 'police' ? 'police' : f.type === 'fire' ? 'fire' : f.type === 'shelter' ? 'shelter' : 'pharmacy'}
                >
                  <MapPopup 
                    title={f.name} 
                    type={f.type.toUpperCase()} 
                    distance={facilityDistanceKm} 
                    metadata={[
                      { label: 'Distance', value: facilityDistanceKm !== undefined ? `${facilityDistanceKm.toFixed(1)} km` : 'Distance unavailable' },
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
              );
            })
          }

          {/* Real NASA FIRMS Active Fire Satellite Detections (Displayed when not navigating) */}
          {!activeRouteDestination && (activeFilter === 'all' || activeFilter === 'fire') && firmsDetections.map((d, idx) => {
            const hasValidCoords = typeof d.latitude === 'number' && typeof d.longitude === 'number' && !isNaN(d.latitude) && !isNaN(d.longitude);
            const fireDistanceKm = hasValidCoords
              ? getDistance(referenceLat, referenceLon, d.latitude, d.longitude)
              : undefined;

            return (
              <MapMarker
                key={`firms-${idx}-${d.latitude}-${d.longitude}`}
                position={[d.latitude, d.longitude]}
                icon={<Flame size={20} className="text-rose-500 animate-pulse" />}
                type="fire"
              >
                <MapPopup
                  title="NASA FIRMS ACTIVE FIRE"
                  type="Satellite Thermal Anomaly"
                  distance={fireDistanceKm}
                  metadata={[
                    { label: 'Distance', value: fireDistanceKm !== undefined ? `${fireDistanceKm.toFixed(1)} km` : 'Distance unavailable' },
                    { label: 'Satellite', value: `${d.satellite} (${d.sensor})` },
                    { label: 'Observed', value: `${d.acquisitionDate} ${d.acquisitionTime} UTC` },
                    { label: 'Confidence', value: `${d.confidence}` },
                    { label: 'FRP', value: d.frpMw !== undefined ? `${d.frpMw} MW` : 'N/A' },
                    { label: 'Coordinates', value: `${d.latitude.toFixed(4)}°N, ${d.longitude.toFixed(4)}°E` },
                    { label: 'Detection Status', value: 'Live Satellite Observation' }
                  ]}
                  actionLabel="NAVIGATE TO THERMAL PERIMETER"
                  onNavigate={() => {
                    setInternalRouteDestination([d.latitude, d.longitude]);
                    setInternalDestinationTitle(`NASA FIRMS Fire Detection (${fireDistanceKm !== undefined ? `${fireDistanceKm.toFixed(1)} km away` : 'Active'})`);
                    setInternalUrgency('Critical');
                  }}
                />
              </MapMarker>
            );
          })}

          {/* Real Geographic Hazard Alerts (USGS Earthquakes, Floods, Fires) */}
          {!activeRouteDestination && !onlyGenuineReports && activeFilter === 'all' && alerts
            .filter((alert: any) => 
              alert.status !== 'Resolved' && 
              typeof alert.latitude === 'number' && 
              typeof alert.longitude === 'number' && 
              !isNaN(alert.latitude) && 
              !isNaN(alert.longitude) &&
              alert.severity === 'Critical' &&
              (alert.type === 'Earthquake' || alert.type === 'Flood' || alert.type === 'Fire' || alert.type === 'Cyclone')
            )
            .map((alert: any) => {
              const alertLat = alert.latitude;
              const alertLon = alert.longitude;
              const hasValidCoords = typeof alertLat === 'number' && typeof alertLon === 'number' && !isNaN(alertLat) && !isNaN(alertLon);
              const alertDistanceKm = hasValidCoords
                ? getDistance(referenceLat, referenceLon, alertLat, alertLon)
                : undefined;
              
              let icon = <ShieldAlert size={18} />;
              if (alert.type === 'Earthquake') icon = <Activity size={18} />;

              return (
                <MapMarker 
                  key={alert.id} 
                  position={[alertLat, alertLon]} 
                  icon={icon}
                  dimmed={Boolean(activeRouteDestination)}
                  type="alert-critical"
                >
                  <MapPopup 
                    title={alert.title} 
                    type={`CRITICAL ALERT • ${alert.type.toUpperCase()}`}
                    distance={alertDistanceKm}
                    metadata={[
                      { label: alert.type === 'Earthquake' ? 'Epicenter Distance' : 'Event Distance', value: alertDistanceKm !== undefined ? `${alertDistanceKm.toFixed(1)} km` : 'Distance unavailable' },
                      { label: 'Location', value: alert.location },
                      { label: 'Detected', value: new Date(alert.detectedAt).toLocaleTimeString() },
                      { label: 'Source', value: alert.source },
                      { label: 'Status', value: alert.status },
                      ...(alert.measurements ? alert.measurements : [])
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

          {/* Community Reports (Displayed when not navigating) */}
          {!activeRouteDestination && activeFilter === 'all' && visibleReports.map(report => {
            const reportLat = report.coordinates?.latitude;
            const reportLon = report.coordinates?.longitude;
            const hasValidCoords = typeof reportLat === 'number' && typeof reportLon === 'number' && !isNaN(reportLat) && !isNaN(reportLon);
            const reportDistanceKm = hasValidCoords
              ? getDistance(referenceLat, referenceLon, reportLat, reportLon)
              : undefined;

            let icon = <Info size={18} />;
            if (report.urgency === 'Critical') icon = <ShieldAlert size={18} />;
            if (report.urgency === 'Medium') icon = <AlertTriangle size={18} />;

            const isNavigating = Boolean(activeRouteDestination);
            const isTarget = Boolean(
              isNavigating && 
              activeRouteDestination && 
              hasValidCoords &&
              Math.abs(reportLat - activeRouteDestination[0]) < 0.0001 && 
              Math.abs(reportLon - activeRouteDestination[1]) < 0.0001
            );
            const isSelected = selectedIncidentId === report.id;

            if (!hasValidCoords) return null;

            return (
              <MapMarker 
                key={report.id} 
                position={[reportLat, reportLon]} 
                icon={icon}
                isTarget={isTarget}
                pulse={isTarget}
                dimmed={isNavigating && !isTarget}
                type={isTarget || isSelected ? 'alert-critical' : `alert-${report.urgency === 'Critical' ? 'critical' : report.urgency === 'Medium' ? 'warning' : 'info'}`}
              >
                <MapPopup 
                  title={report.type} 
                  type={`AI-VERIFIED GENUINE • ${report.urgency.toUpperCase()}`}
                  distance={reportDistanceKm}
                  metadata={[
                    { label: 'Distance', value: reportDistanceKm !== undefined ? `${reportDistanceKm.toFixed(1)} km` : 'Distance unavailable' },
                    { label: 'Incident ID', value: report.id },
                    { label: 'Location', value: report.locationName },
                    { label: 'Reported', value: new Date(report.timestamp).toLocaleTimeString() },
                    { label: 'Veracity', value: report.aiAnalysis ? `${report.aiAnalysis.confidenceScore}% (Genuine)` : 'Certified Genuine' },
                    { label: 'Status', value: report.responseStatus || report.status }
                  ]}
                  actionLabel="NAVIGATE TO INCIDENT"
                  onNavigate={() => {
                    const dest: [number, number] = [reportLat, reportLon];
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

        {/* Floating Location Assessment Panel */}
        <LocationAssessmentPanel
          isLoading={assessmentLoading}
          assessmentResult={assessmentResult}
          error={assessmentError}
          onClose={() => clearAssessment()}
          onRefresh={() => {
            if (selectedCoords) {
              assessLocation(selectedCoords.latitude, selectedCoords.longitude);
            }
          }}
          onNavigate={(lat, lon, title) => {
            setInternalRouteDestination([lat, lon]);
            setInternalDestinationTitle(`Pinpoint: ${title}`);
            setInternalUrgency('Medium');
            clearAssessment();
          }}
        />
        
        {!embedded && <MapLegend />}
      </div>
    </div>
  );
};

