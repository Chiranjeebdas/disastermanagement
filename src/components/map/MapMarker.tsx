import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';

interface MapMarkerProps {
  position: [number, number];
  icon: React.ReactElement;
  type?: string;
  isTarget?: boolean;
  isUser?: boolean;
  dimmed?: boolean;
  pulse?: boolean;
  children?: React.ReactNode; // Content for Popup
}

export const MapMarker: React.FC<MapMarkerProps> = ({ 
  position, 
  icon, 
  type = 'default',
  isTarget = false,
  dimmed = false,
  pulse = false,
  children
}) => {
  // Convert React Icon to Leaflet DivIcon
  const iconHtml = renderToString(
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      {React.cloneElement(icon, { size: isTarget ? 20 : dimmed ? 13 : 16, strokeWidth: isTarget ? 3 : 2.5 } as any)}
    </div>
  );

  const markerClasses = [
    'custom-marker',
    `marker-${type}`,
    dimmed ? 'marker-dimmed' : '',
    isTarget ? 'marker-target-highlight' : '',
    pulse ? 'marker-pulsing' : ''
  ].filter(Boolean).join(' ');

  const iconSize: [number, number] = isTarget ? [40, 40] : dimmed ? [24, 24] : [32, 32];
  const iconAnchor: [number, number] = [iconSize[0] / 2, iconSize[1] / 2];

  const customIcon = L.divIcon({
    html: iconHtml,
    className: markerClasses,
    iconSize,
    iconAnchor,
    popupAnchor: [0, -iconAnchor[1]]
  });

  return (
    <Marker position={position} icon={customIcon} zIndexOffset={isTarget ? 1000 : dimmed ? -100 : 0}>
      {children && (
        <Popup>
          {children}
        </Popup>
      )}
    </Marker>
  );
};

