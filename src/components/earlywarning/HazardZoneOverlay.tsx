import React from 'react';
import { Circle, CircleMarker, Popup } from 'react-leaflet';
import type { HazardRiskAssessment, WarningStage } from '../../types/earlyWarning';

interface HazardZoneOverlayProps {
  assessment: HazardRiskAssessment | null;
  isVisible?: boolean;
}

/**
 * Stage-specific color & opacity styling for the multi-ring hazard zone
 */
function getStageZoneStyle(stage: WarningStage) {
  switch (stage) {
    case 'Emergency':
      return {
        strokeColor: '#ef4444',
        fillColor: '#ef4444',
        innerOpacity: 0.35,
        middleOpacity: 0.18,
        outerOpacity: 0.08,
        dashArray: '6, 6'
      };
    case 'Warning':
      return {
        strokeColor: '#f97316',
        fillColor: '#f97316',
        innerOpacity: 0.28,
        middleOpacity: 0.14,
        outerOpacity: 0.06,
        dashArray: '5, 5'
      };
    case 'Watch':
      return {
        strokeColor: '#eab308',
        fillColor: '#eab308',
        innerOpacity: 0.22,
        middleOpacity: 0.10,
        outerOpacity: 0.04,
        dashArray: '4, 4'
      };
    case 'Advisory':
      return {
        strokeColor: '#38bdf8',
        fillColor: '#38bdf8',
        innerOpacity: 0.16,
        middleOpacity: 0.08,
        outerOpacity: 0.03,
        dashArray: '3, 3'
      };
    case 'Normal':
    default:
      return {
        strokeColor: '#10b981',
        fillColor: '#10b981',
        innerOpacity: 0.10,
        middleOpacity: 0.05,
        outerOpacity: 0.02,
        dashArray: '2, 4'
      };
  }
}

/**
 * Renders an estimated multi-ring hazard risk zone for an active Early Warning assessment.
 * 
 * MULTI-RING DERIVATION:
 * 1. Inner Core (0.4 * impactRadiusKm): Immediate high-risk focal impact zone.
 * 2. Middle Ring (1.0 * impactRadiusKm): Model-derived warning & response zone.
 * 3. Outer Buffer (1.6 * impactRadiusKm): Situational monitoring & civil advisory perimeter.
 * 
 * DATA HONESTY NOTE:
 * Uses estimated circular zones. Does NOT fabricate speculative complex inundation polygons.
 */
export const HazardZoneOverlay: React.FC<HazardZoneOverlayProps> = ({
  assessment,
  isVisible = true
}) => {
  if (!assessment || !isVisible) return null;

  const [lat, lon] = assessment.centerCoordinates;
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  const baseRadiusMeters = (assessment.impactRadiusKm || 5.0) * 1000;
  const innerRadiusMeters = baseRadiusMeters * 0.4;
  const outerRadiusMeters = baseRadiusMeters * 1.6;

  const style = getStageZoneStyle(assessment.warningStage);

  return (
    <>
      {/* 1. Outer Perimeter: Monitoring Buffer Ring */}
      <Circle
        center={[lat, lon]}
        radius={outerRadiusMeters}
        pathOptions={{
          color: style.strokeColor,
          weight: 1,
          dashArray: '8, 8',
          fillColor: style.fillColor,
          fillOpacity: style.outerOpacity
        }}
      />

      {/* 2. Middle Ring: Primary Estimated Impact Radius */}
      <Circle
        center={[lat, lon]}
        radius={baseRadiusMeters}
        pathOptions={{
          color: style.strokeColor,
          weight: 2,
          dashArray: style.dashArray,
          fillColor: style.fillColor,
          fillOpacity: style.middleOpacity
        }}
      >
        <Popup className="hazard-zone-popup">
          <div className="p-2 min-w-[220px] text-zinc-100 font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                {assessment.hazardType} RISK ZONE
              </span>
              <span
                className="text-[10px] font-black uppercase px-2 py-0.5 rounded"
                style={{ backgroundColor: `${style.strokeColor}25`, color: style.strokeColor }}
              >
                {assessment.warningStage}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Derived Risk Score:</span>
                <span className="font-bold font-mono" style={{ color: style.strokeColor }}>
                  {assessment.riskScore} / 100 ({assessment.riskLevel})
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Evidence Confidence:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {assessment.confidence}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Impact Radius:</span>
                <span className="font-bold text-zinc-200">
                  ~{assessment.impactRadiusKm} km
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Location:</span>
                <span className="font-medium text-zinc-300 text-right max-w-[130px] truncate">
                  {assessment.location}
                </span>
              </div>

              {assessment.leadTimeMinutes !== undefined && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Estimated Lead Time:</span>
                  <span className="font-bold text-orange-400 font-mono">
                    ~{assessment.leadTimeMinutes} min
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-zinc-400 leading-tight">
              {assessment.summary || 'Estimated multi-source hazard risk footprint.'}
            </div>

            <div className="mt-1.5 text-[9px] text-zinc-500 font-mono text-right">
              Evaluated: {new Date(assessment.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </Popup>
      </Circle>

      {/* 3. Inner Core: Focal High-Impact Zone */}
      <Circle
        center={[lat, lon]}
        radius={innerRadiusMeters}
        pathOptions={{
          color: style.strokeColor,
          weight: 2,
          fillColor: style.fillColor,
          fillOpacity: style.innerOpacity
        }}
      />

      {/* 4. Center Epicenter / Assessment Anchor Marker */}
      <CircleMarker
        center={[lat, lon]}
        radius={6}
        pathOptions={{
          color: '#ffffff',
          weight: 2,
          fillColor: style.strokeColor,
          fillOpacity: 1.0
        }}
      />
    </>
  );
};
