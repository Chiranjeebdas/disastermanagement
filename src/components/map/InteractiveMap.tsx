import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapStyles.css';
import { MapControls } from './MapControls';
import { Map as MapIcon, Globe, Moon } from 'lucide-react';

interface InteractiveMapProps {
  center: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  className?: string;
}

export type MapLayerType = 'street' | 'satellite' | 'dark';

// Fix for default Leaflet icons missing in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TILE_LAYERS: Record<MapLayerType, { url: string; attribution: string; maxZoom: number; subdomains?: string[] }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  satellite: {
    // High-resolution Google Hybrid satellite imagery with roads & landmarks
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: 'Imagery &copy; Google Maps',
    maxZoom: 22
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd']
  }
};

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
  const [mapType, setMapType] = useState<MapLayerType>('street');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Directly toggles between Street and Satellite on one click
  const toggleSatellite = () => {
    setMapType(prev => (prev === 'satellite' ? 'street' : 'satellite'));
  };

  const selectLayerType = (type: MapLayerType) => {
    setMapType(type);
    setShowLayerMenu(false);
  };

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
        
        {/* Native React-Leaflet TileLayer with dynamic key for instantaneous clean layer replacement */}
        <TileLayer
          key={mapType}
          url={TILE_LAYERS[mapType].url}
          attribution={TILE_LAYERS[mapType].attribution}
          maxZoom={TILE_LAYERS[mapType].maxZoom}
          subdomains={TILE_LAYERS[mapType].subdomains || ['a', 'b', 'c']}
        />

        <MapUpdater center={center} zoom={zoom} />
        {children}
      </MapContainer>

      {/* Floating Tactical Layer Mode Switcher at top-right */}
      <div className="absolute top-4 right-16 z-[450] flex items-center bg-[#0d0f12]/90 backdrop-blur-md border border-white/20 rounded-xl p-1 shadow-2xl">
        <button
          type="button"
          onClick={() => selectLayerType('street')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mapType === 'street'
              ? 'bg-accent text-[#090b0c] shadow-md font-extrabold'
              : 'text-text-secondary hover:text-white hover:bg-white/10'
          }`}
          title="Standard Vector Street Map"
        >
          <MapIcon size={13} />
          <span>Street</span>
        </button>

        <button
          type="button"
          onClick={() => selectLayerType('satellite')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mapType === 'satellite'
              ? 'bg-accent text-[#090b0c] shadow-md font-extrabold ring-2 ring-accent/50'
              : 'text-text-secondary hover:text-white hover:bg-white/10'
          }`}
          title="High-Resolution Satellite & Aerial Imagery"
        >
          <Globe size={13} />
          <span>Satellite</span>
        </button>

        <button
          type="button"
          onClick={() => selectLayerType('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mapType === 'dark'
              ? 'bg-accent text-[#090b0c] shadow-md font-extrabold'
              : 'text-text-secondary hover:text-white hover:bg-white/10'
          }`}
          title="Tactical Night Dark Mode"
        >
          <Moon size={13} />
          <span>Dark</span>
        </button>
      </div>

      {/* Map Zoom / Locate / Layer Toggle Controls on right sidebar */}
      {mapInstance && (
        <MapControls 
          map={mapInstance} 
          currentLayer={mapType}
          onToggleSatellite={toggleSatellite}
          onToggleLayerMenu={() => setShowLayerMenu(prev => !prev)}
        />
      )}

      {/* Layer quick flyout dropdown menu beside the layers button */}
      {showLayerMenu && (
        <div className="absolute top-36 right-16 z-[450] bg-[#0d0f12]/95 backdrop-blur-xl border border-white/20 rounded-xl p-2 shadow-2xl flex flex-col gap-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary px-2 py-1">
            Map Mode
          </div>
          <button
            onClick={() => selectLayerType('street')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
              mapType === 'street' ? 'bg-accent/20 text-accent font-bold' : 'text-text hover:bg-white/10'
            }`}
          >
            <MapIcon size={14} /> Street Map
          </button>
          <button
            onClick={() => selectLayerType('satellite')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
              mapType === 'satellite' ? 'bg-accent/20 text-accent font-bold' : 'text-text hover:bg-white/10'
            }`}
          >
            <Globe size={14} /> Satellite Imagery
          </button>
          <button
            onClick={() => selectLayerType('dark')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
              mapType === 'dark' ? 'bg-accent/20 text-accent font-bold' : 'text-text hover:bg-white/10'
            }`}
          >
            <Moon size={14} /> Tactical Dark
          </button>
        </div>
      )}
    </div>
  );
};
