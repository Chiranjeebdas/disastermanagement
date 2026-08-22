import React from 'react';
import { Plus, Minus, Crosshair, Layers } from 'lucide-react';
import L from 'leaflet';

interface MapControlsProps {
  map: L.Map;
}

export const MapControls: React.FC<MapControlsProps> = ({ map }) => {

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 16 });
  };

  return (
    <div className="map-custom-controls">
      <div className="map-control-group">
        <button className="map-control-btn" onClick={handleZoomIn} aria-label="Zoom In">
          <Plus size={16} />
        </button>
        <button className="map-control-btn" onClick={handleZoomOut} aria-label="Zoom Out">
          <Minus size={16} />
        </button>
      </div>

      <div className="map-control-group">
        <button className="map-control-btn" onClick={handleLocate} aria-label="Locate Me">
          <Crosshair size={16} />
        </button>
      </div>
      
      <div className="map-control-group">
        <button className="map-control-btn" aria-label="Map Layers">
          <Layers size={16} />
        </button>
      </div>
    </div>
  );
};
