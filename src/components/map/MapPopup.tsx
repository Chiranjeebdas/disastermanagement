import React from 'react';
import { Navigation2 } from 'lucide-react';

interface MapPopupProps {
  title: string;
  type?: string;
  distance?: number;
  metadata?: { label: string; value: string }[];
  onNavigate?: () => void;
  actionLabel?: string;
}

export const MapPopup: React.FC<MapPopupProps> = ({ 
  title, 
  type,
  distance,
  metadata = [],
  onNavigate,
  actionLabel = "GET DIRECTIONS"
}) => {
  return (
    <div className="map-popup-container">
      <div className="map-popup-header">
        {type && (
          <span className="map-popup-type">{type}</span>
        )}
        <h4 className="map-popup-title">{title}</h4>
        
        {distance !== undefined && (
          <span className="map-popup-distance">{distance.toFixed(1)} km from your location</span>
        )}
      </div>

      {metadata.length > 0 && (
        <div className="map-popup-metadata">
          {metadata.map((meta, idx) => (
            <div key={idx} className="map-popup-meta-row">
              <span className="meta-label">{meta.label}</span>
              <span className="meta-value">{meta.value}</span>
            </div>
          ))}
        </div>
      )}

      {onNavigate && (
        <button onClick={onNavigate} className="map-popup-action-btn">
          <Navigation2 size={12} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
