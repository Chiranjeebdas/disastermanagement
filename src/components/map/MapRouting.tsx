import React, { useEffect, useState } from 'react';
import { useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

interface MapRoutingProps {
  start: [number, number] | null;
  end: [number, number] | null;
  onClose?: () => void;
}

export const MapRouting: React.FC<MapRoutingProps> = ({ start, end, onClose }) => {
  const map = useMap();
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!start || !end) {
      setRouteCoordinates(null);
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      try {
        // OSRM requires coordinates in longitude, latitude order
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          // OSRM returns GeoJSON coordinates as [lon, lat], Leaflet wants [lat, lon]
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          setRouteCoordinates(coords);
          
          // Fit map bounds to the route
          const bounds = L.latLngBounds(coords);
          map.flyToBounds(bounds, { padding: [50, 50], animate: true, duration: 1 });
        }
      } catch (err) {
        console.error("Failed to fetch route:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [start, end, map]);

  if (!start || !end) return null;

  return (
    <>
      {routeCoordinates && (
        <Polyline 
          positions={routeCoordinates} 
          pathOptions={{ color: '#00e5ff', weight: 6, opacity: 0.8 }} 
        />
      )}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto">
        <div className="bg-surface/95 backdrop-blur-md border border-accent/30 p-4 rounded-xl shadow-2xl flex flex-col items-center gap-3 w-72">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Active Navigation</span>
            <span className="text-sm font-semibold text-text">
              {loading ? 'Calculating Route...' : 'Routing to Destination'}
            </span>
            <span className="text-xs text-text-secondary mt-1">Real-time GPS tracking enabled</span>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-2 bg-danger/20 hover:bg-danger/30 text-danger text-xs font-bold rounded-lg border border-danger/30 transition-colors uppercase tracking-wider cursor-pointer pointer-events-auto"
          >
            Cancel Navigation
          </button>
        </div>
      </div>
    </>
  );
};
