import React from 'react';

interface MapLegendItem {
  label: string;
  type: string;
}

const legendItems: MapLegendItem[] = [
  { label: 'Hospital', type: 'hospital' },
  { label: 'Police Station', type: 'police' },
  { label: 'Fire Station', type: 'fire' },
  { label: 'Relief Shelter', type: 'shelter' },
  { label: '24/7 Medical Store', type: 'pharmacy' },
  { label: 'Critical Incident', type: 'alert-critical' },
  { label: 'Your Location', type: 'user' }
];

export const MapLegend: React.FC = () => {
  return (
    <div className="map-legend-container">
      <h4 className="map-legend-title">EMERGENCY MAP LEGEND</h4>
      <div className="map-legend-list">
        {legendItems.map((item, idx) => (
          <div key={idx} className="map-legend-item">
            <div className={`map-legend-dot legend-${item.type}`} />
            <span className="map-legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
