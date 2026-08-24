import React, { useEffect, useState } from 'react';
import { MapContainer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface IndiaRiskMapProps {
  // If we had real data, we'd pass it here
}

// Hardcoded risk data for demo purposes
const riskData: Record<string, 'high' | 'medium' | 'safe'> = {
  'Odisha': 'high',
  'Gujarat': 'high',
  'Maharashtra': 'medium',
  'West Bengal': 'medium',
  'Andhra Pradesh': 'medium',
  'Kerala': 'medium',
  'Tamil Nadu': 'medium'
};

const getRiskLevel = (stateName: string) => {
  return riskData[stateName] || 'safe';
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'high':
      return '#ef4444'; // Red
    case 'medium':
      return '#f97316'; // Orange
    case 'safe':
    default:
      return '#22c55e'; // Green
  }
};

export const IndiaRiskMap: React.FC<IndiaRiskMapProps> = () => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    // Fetch the geojson from public folder
    fetch('/india_states.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load India GeoJSON', err));
  }, []);

  const styleFeature = (feature: any) => {
    // The feature properties usually contain NAME_1 for state name in standard India geojson
    const stateName = feature.properties.NAME_1 || feature.properties.name || feature.properties.st_nm;
    const risk = getRiskLevel(stateName);
    
    return {
      fillColor: getRiskColor(risk),
      weight: 1,
      opacity: 1,
      color: '#1a1b1e', // Dark border
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const stateName = feature.properties.NAME_1 || feature.properties.name || feature.properties.st_nm || 'Unknown State';
    const risk = getRiskLevel(stateName);
    
    const popupContent = `
      <div style="text-align: center; font-family: sans-serif;">
        <strong>${stateName}</strong><br/>
        Risk Level: <span style="color: ${getRiskColor(risk)}; text-transform: capitalize;">${risk}</span>
      </div>
    `;
    
    layer.bindTooltip(popupContent, { sticky: true, className: 'custom-tooltip' });
    
    // Highlight on hover
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#ffffff',
          fillOpacity: 0.9
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        // Reset to default style
        const layer = e.target;
        layer.setStyle(styleFeature(feature));
      }
    });
  };

  if (!geoData) {
    return <div className="flex items-center justify-center h-full text-[#8a8f98] text-sm">Loading map data...</div>;
  }

  // Center on India
  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', background: '#1e2024' }}>
      <MapContainer 
        center={[22.5937, 78.9629]} 
        zoom={4} 
        style={{ height: '100%', width: '100%', background: 'transparent' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <GeoJSON 
          data={geoData} 
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
      
      {/* Legend overlay */}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 1000, background: 'rgba(20,21,23,0.8)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '0.6rem', color: '#8a8f98', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Risk Level</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.65rem', color: '#e2e8f0' }}>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', background: '#f97316', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.65rem', color: '#e2e8f0' }}>Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.65rem', color: '#e2e8f0' }}>Safe</span>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-tooltip {
          background-color: #18191c;
          border: 1px solid #333;
          color: #fff;
          border-radius: 4px;
        }
        .leaflet-container {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};
