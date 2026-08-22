import React from 'react';

interface MapLegendItem {
  label: string;
  type: string;
}

const legendItems: MapLegendItem[] = [
  { label: 'Critical Alert', type: 'alert-critical' },
  { label: 'Warning Alert', type: 'alert-warning' },
  { label: 'Advisory', type: 'alert-advisory' },
  { label: 'Emergency Facility', type: 'police' },
  { label: 'Your Location', type: 'user' }
];

export const MapLegend: React.FC = () => {
  return (
    <div className="map-legend-container">
      <h4 className="map-legend-title">LEGEND</h4>
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
