import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapStyles.css';
import { MapControls } from './MapControls';

interface InteractiveMapProps {
  center: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  className?: string;
}

// Fix for default Leaflet icons missing in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    });

    resizeObserver.observe(map.getContainer());

    const timeout1 = setTimeout(() => map.invalidateSize(), 100);
    const timeout2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [center, zoom, map]);
  return null;
};

// Capture Map Instance
const MapEvents = ({ setMap }: { setMap: (map: L.Map) => void }) => {
  const map = useMap();
  useEffect(() => {
    if (map) setMap(map);
  }, [map, setMap]);
  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  zoom = 13,
  children,
  className = ""
}) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  return (
    <div className={`map-wrapper absolute inset-0 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#090b0c', zIndex: 1 }}
        attributionControl={false}
      >
        <MapEvents setMap={setMapInstance} />

        {mapType === 'street' ? (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />
        ) : (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            maxZoom={19}
          />
        )}

        <MapUpdater center={center} zoom={zoom} />
        {children}
      </MapContainer>

      {/* Map Type Toggle */}
      <div className="absolute top-4 right-4 z-[400] flex bg-surface/90 backdrop-blur border border-border rounded-lg overflow-hidden shadow-lg">
        <button
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${mapType === 'street' ? 'bg-accent text-bg' : 'text-text hover:bg-surface-hover'}`}
          onClick={() => setMapType('street')}
        >
          Map
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${mapType === 'satellite' ? 'bg-accent text-bg' : 'text-text hover:bg-surface-hover'}`}
          onClick={() => setMapType('satellite')}
        >
          Satellite
        </button>
      </div>

      {/* Render DOM overlays completely outside MapContainer to avoid React-Leaflet DOM exceptions */}
      {mapInstance && <MapControls map={mapInstance} />}
    </div>
  );
};
