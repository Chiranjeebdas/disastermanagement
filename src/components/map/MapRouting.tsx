import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Compass, ExternalLink, CheckCircle, X } from 'lucide-react';
import { getOfflineTacticalRoute } from '../../utils/offlineData';

interface MapRoutingProps {
  start: [number, number] | null;
  end: [number, number] | null;
  destinationTitle?: string;
  urgency?: string;
  onArrived?: () => void;
  onClose?: () => void;
}

interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  instructions: string[];
}

export const MapRouting: React.FC<MapRoutingProps> = ({ 
  start, 
  end, 
  destinationTitle,
  urgency,
  onArrived,
  onClose 
}) => {
  const map = useMap();
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTacticalOffline, setIsTacticalOffline] = useState(false);

  useEffect(() => {
    if (!start || !end) {
      setRouteCoordinates(null);
      setRouteInfo(null);
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      setIsTacticalOffline(false);

      if (!navigator.onLine) {
        // Instant offline tactical route calculation
        const offlineRoute = getOfflineTacticalRoute(start, end, destinationTitle);
        setRouteCoordinates(offlineRoute.coordinates);
        setRouteInfo({
          distanceKm: offlineRoute.distanceKm,
          durationMinutes: offlineRoute.durationMinutes,
          instructions: offlineRoute.instructions
        });
        setIsTacticalOffline(true);
        const bounds = L.latLngBounds(offlineRoute.coordinates);
        map.flyToBounds(bounds, { padding: [60, 60], animate: true, duration: 0.8 });
        setLoading(false);
        return;
      }

      try {
        // OSRM expects longitude, latitude order
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`,
          { signal: AbortSignal.timeout(4000) }
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // OSRM returns GeoJSON coordinates as [lon, lat], Leaflet wants [lat, lon]
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          setRouteCoordinates(coords);
          
          const distanceKm = route.distance ? route.distance / 1000 : 0;
          const durationMinutes = route.duration ? Math.ceil(route.duration / 60) : 1;
          
          const instructions: string[] = [];
          if (route.legs && route.legs[0] && route.legs[0].steps) {
            route.legs[0].steps.forEach((step: any) => {
              if (step.maneuver && step.name) {
                const type = step.maneuver.type || 'Proceed';
                const modifier = step.maneuver.modifier ? ` (${step.maneuver.modifier})` : '';
                instructions.push(`${type}${modifier} on ${step.name}`);
              }
            });
          }
          if (instructions.length === 0) {
            instructions.push(`Follow the highlighted emergency route towards ${destinationTitle || 'target coordinate'}.`);
          }

          setRouteInfo({
            distanceKm,
            durationMinutes,
            instructions
          });

          const bounds = L.latLngBounds(coords);
          map.flyToBounds(bounds, { padding: [60, 60], animate: true, duration: 1.2 });
        } else {
          // Fallback to tactical geodesic vector
          const offlineRoute = getOfflineTacticalRoute(start, end, destinationTitle);
          setRouteCoordinates(offlineRoute.coordinates);
          setRouteInfo({
            distanceKm: offlineRoute.distanceKm,
            durationMinutes: offlineRoute.durationMinutes,
            instructions: offlineRoute.instructions
          });
          setIsTacticalOffline(true);
          const bounds = L.latLngBounds(offlineRoute.coordinates);
          map.flyToBounds(bounds, { padding: [60, 60], animate: true, duration: 1 });
        }
      } catch (err) {
        console.warn("OSRM routing server unreachable, generating offline tactical route:", err);
        const offlineRoute = getOfflineTacticalRoute(start, end, destinationTitle);
        setRouteCoordinates(offlineRoute.coordinates);
        setRouteInfo({
          distanceKm: offlineRoute.distanceKm,
          durationMinutes: offlineRoute.durationMinutes,
          instructions: offlineRoute.instructions
        });
        setIsTacticalOffline(true);
        const bounds = L.latLngBounds(offlineRoute.coordinates);
        map.flyToBounds(bounds, { padding: [60, 60], animate: true, duration: 1 });
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [start, end, destinationTitle, map]);

  if (!start || !end) return null;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start[0]},${start[1]}&destination=${end[0]},${end[1]}&travelmode=driving`;

  return (
    <>
      {/* Route ambient luminous aura */}
      {routeCoordinates && (
        <Polyline 
          positions={routeCoordinates} 
          pathOptions={{ color: '#0ea5e9', weight: 14, opacity: 0.28, lineCap: 'round', lineJoin: 'round' }} 
        />
      )}
      {/* Route mid glow beam */}
      {routeCoordinates && (
        <Polyline 
          positions={routeCoordinates} 
          pathOptions={{ color: '#0284c7', weight: 7, opacity: 0.75, lineCap: 'round', lineJoin: 'round' }} 
        />
      )}
      {/* Route center neon laser line */}
      {routeCoordinates && (
        <Polyline 
          positions={routeCoordinates} 
          pathOptions={{ color: '#e0f2fe', weight: 3, opacity: 1, dashArray: '8, 8', lineCap: 'round', lineJoin: 'round' }} 
        />
      )}

      {/* Portal the UI outside the MapContainer */}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto max-w-sm w-full animate-in fade-in slide-in-from-bottom duration-300">
          <div className="bg-[#0b0f14]/95 backdrop-blur-xl border border-accent/40 rounded-xl shadow-2xl p-4 flex flex-col gap-3 text-white overflow-hidden relative">
            
            {/* Ambient top glowing line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent via-cyan-400 to-emerald-400 animate-pulse" />

            {/* Navigation Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-accent tracking-widest uppercase flex items-center gap-1">
                  <Navigation size={12} className="animate-pulse" /> {isTacticalOffline ? 'TACTICAL OFFLINE ROUTE' : 'LIVE GPS ROUTE'}
                </span>
              </div>
              {urgency && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  urgency === 'Critical' ? 'bg-danger/20 text-danger border border-danger/40' :
                  urgency === 'Medium' ? 'bg-warning/20 text-warning border border-warning/40' :
                  'bg-success/20 text-success border border-success/40'
                }`}>
                  {urgency}
                </span>
              )}
            </div>

            {/* Destination & ETA Display */}
            <div>
              <div className="text-xs text-text-secondary">Destination Target</div>
              <div className="text-sm font-bold text-white truncate">
                {destinationTitle || 'Incident Coordinate'}
              </div>
            </div>

            {/* Distance & ETA Stats */}
            <div className="grid grid-cols-2 gap-2 bg-surface/60 border border-border/40 p-2.5 rounded-lg">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Distance</span>
                <span className="text-base font-bold text-accent">
                  {loading ? '...' : routeInfo ? `${routeInfo.distanceKm.toFixed(1)} km` : '--'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Est. Arrival (ETA)</span>
                <span className="text-base font-bold text-emerald-400">
                  {loading ? '...' : routeInfo ? `~${routeInfo.durationMinutes} mins` : '--'}
                </span>
              </div>
            </div>

            {/* Live Navigation Step Guidance */}
            {routeInfo && routeInfo.instructions.length > 0 && (
              <div className="flex items-start gap-2 bg-black/40 border border-white/10 p-2 rounded text-xs text-text-secondary">
                <Compass size={14} className="text-accent shrink-0 mt-0.5" />
                <span className="line-clamp-2">{routeInfo.instructions[0]}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
              <div className="flex items-center gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold rounded-lg border border-accent/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink size={13} />
                  Google Maps GPS
                </a>
                
                {onArrived && (
                  <button
                    onClick={onArrived}
                    className="flex-1 py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle size={13} />
                    Arrived On Scene
                  </button>
                )}
              </div>

              <button 
                onClick={onClose}
                className="w-full py-1.5 text-text-muted hover:text-white text-xs font-medium text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <X size={12} />
                Exit Active Route
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

