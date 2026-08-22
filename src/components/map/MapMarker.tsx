import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';

interface MapMarkerProps {
  position: [number, number];
  icon: React.ReactElement;
  type?: string;
  children?: React.ReactNode; // Content for Popup
}

export const MapMarker: React.FC<MapMarkerProps> = ({ 
  position, 
  icon, 
  type = 'default',
  children
}) => {
  // Convert React Icon to Leaflet DivIcon
  const iconHtml = renderToString(
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      {React.cloneElement(icon, { size: 16, strokeWidth: 2.5 } as any)}
    </div>
  );

  const customIcon = L.divIcon({
    html: iconHtml,
    className: `custom-marker marker-${type}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

  return (
    <Marker position={position} icon={customIcon}>
      {children && (
        <Popup>
          {children}
        </Popup>
      )}
    </Marker>
  );
};
