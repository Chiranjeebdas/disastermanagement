import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  X,
  RefreshCw,
  Waves,
  Flame,
  Activity,
  Wind,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Clock,
  Radio,
  Satellite,
  Navigation
} from 'lucide-react';
import type { LocationAssessmentResult } from '../../hooks/useLocationAssessment';
import type { WarningStage } from '../../types/earlyWarning';
import './LocationAssessmentPanel.css';

interface LocationAssessmentPanelProps {
  isLoading: boolean;
  assessmentResult: LocationAssessmentResult | null;
  error: string | null;
  onClose: () => void;
  onRefresh?: () => void;
  onNavigate?: (latitude: number, longitude: number, locationName: string) => void;
}

export const LocationAssessmentPanel: React.FC<LocationAssessmentPanelProps> = ({
  isLoading,
  assessmentResult,
  error,
  onClose,
  onRefresh,
  onNavigate
}) => {
  const navigate = useNavigate();

  if (!isLoading && !assessmentResult && !error) {
    return null;
  }

  const getStageBadgeStyle = (stage: WarningStage) => {
    switch (stage) {
      case 'Emergency': return 'stage-emergency';
      case 'Warning': return 'stage-warning';
      case 'Watch': return 'stage-watch';
      case 'Advisory': return 'stage-advisory';
      case 'Normal':
      default: return 'stage-normal';
    }
  };

  const handleViewFullEarlyWarning = () => {
    if (!assessmentResult) return;
    navigate('/app/early-warning', {
      state: {
        assessmentLocation: [assessmentResult.latitude, assessmentResult.longitude],
        locationName: assessmentResult.locationName,
        assessmentResult: assessmentResult
      }
    });
  };

  return (
    <div className="location-assessment-panel" role="region" aria-label="Location Assessment Panel">
      {/* 1. Header Bar */}
      <div className="lap-header">
        <div className="lap-header-title-group">
          <div className="lap-pin-badge">
            <MapPin size={14} className="text-orange-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="lap-subtitle">LOCATION ASSESSMENT</div>
            <h3 className="lap-coordinates">
              {assessmentResult
                ? `${assessmentResult.latitude.toFixed(6)}° N, ${assessmentResult.longitude.toFixed(6)}° E`
                : 'Selected Map Point'}
            </h3>
            <p className="lap-address" title={assessmentResult?.locationName}>
              {assessmentResult?.locationName || 'Resolving locality...'}
            </p>
          </div>
        </div>

        <div className="lap-header-actions">
          {onRefresh && (
            <button
              type="button"
              className="lap-btn-icon"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh live telemetry for this location"
              aria-label="Refresh telemetry"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin text-orange-400' : 'text-zinc-400'} />
            </button>
          )}
          <button
            type="button"
            className="lap-btn-icon"
            onClick={onClose}
            title="Close assessment panel"
            aria-label="Close panel"
          >
            <X size={14} className="text-zinc-400 hover:text-white" />
          </button>
        </div>
      </div>

      <div className="lap-divider" />

      {/* 2. Loading State */}
      {isLoading && (
        <div className="lap-loading-state">
          <div className="lap-loading-pulse">
            <Radio size={16} className="text-orange-400 animate-spin" />
            <span>ASSESSING LOCATION...</span>
          </div>
          <p className="lap-loading-sub">
            Fetching real-time atmospheric, satellite, seismic, and hydrological telemetry...
          </p>

          <div className="lap-source-loading-grid">
            <div className="lap-source-chip">
              <span className="chip-dot-loading" />
              <span>Open-Meteo Weather: Querying...</span>
            </div>
            <div className="lap-source-chip">
              <span className="chip-dot-loading" />
              <span>NASA FIRMS Satellites: Querying...</span>
            </div>
            <div className="lap-source-chip">
              <span className="chip-dot-loading" />
              <span>USGS Seismology: Calculating...</span>
            </div>
            <div className="lap-source-chip">
              <span className="chip-dot-loading" />
              <span>GloFAS River Discharge: Querying...</span>
            </div>
            <div className="lap-source-chip">
              <span className="chip-dot-loading" />
              <span>Community Ground Reports: Filtering...</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Error State */}
      {error && !isLoading && (
        <div className="lap-error-banner">
          <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. Loaded Assessment Results */}
      {assessmentResult && !isLoading && (
        <div className="lap-body">
          {/* Overall Warning Banner */}
          <div className={`lap-warning-banner ${getStageBadgeStyle(assessmentResult.warningStage)}`}>
            <div className="lap-stage-tag">
              <span className="lap-stage-dot" />
              <span>{assessmentResult.warningStage.toUpperCase()}</span>
            </div>
            <div className="lap-risk-score-wrap">
              <span className="lap-risk-label">Overall Risk:</span>
              <span className="lap-risk-val">{assessmentResult.overallRisk} / 100</span>
              <span className="lap-risk-badge">{assessmentResult.riskLevel}</span>
            </div>
            <div className="lap-conf-wrap">
              <span className="lap-conf-label">Confidence:</span>
              <span className="lap-conf-val">{assessmentResult.confidence}%</span>
            </div>
          </div>

          {/* Hazard Status Breakdown */}
          <div className="lap-section-title">HAZARD STATUS BREAKDOWN</div>
          <div className="lap-hazards-grid">
            <div className={`lap-hazard-item ${getStageBadgeStyle(assessmentResult.assessments.flood.warningStage)}`}>
              <div className="lap-hazard-name">
                <Waves size={12} className="text-sky-400" />
                <span>Flood</span>
              </div>
              <span className="lap-hazard-score">{assessmentResult.assessments.flood.riskScore}/100</span>
              <span className="lap-hazard-stage">{assessmentResult.assessments.flood.warningStage}</span>
            </div>

            <div className={`lap-hazard-item ${getStageBadgeStyle(assessmentResult.assessments.fire.warningStage)}`}>
              <div className="lap-hazard-name">
                <Flame size={12} className="text-rose-400" />
                <span>Wildfire</span>
              </div>
              <span className="lap-hazard-score">{assessmentResult.assessments.fire.riskScore}/100</span>
              <span className="lap-hazard-stage">{assessmentResult.assessments.fire.warningStage}</span>
            </div>

            <div className={`lap-hazard-item ${getStageBadgeStyle(assessmentResult.assessments.earthquake.warningStage)}`}>
              <div className="lap-hazard-name">
                <Activity size={12} className="text-amber-400" />
                <span>Seismic</span>
              </div>
              <span className="lap-hazard-score">{assessmentResult.assessments.earthquake.riskScore}/100</span>
              <span className="lap-hazard-stage">{assessmentResult.assessments.earthquake.warningStage}</span>
            </div>

            <div className={`lap-hazard-item ${getStageBadgeStyle(assessmentResult.assessments.cyclone.warningStage)}`}>
              <div className="lap-hazard-name">
                <Wind size={12} className="text-cyan-400" />
                <span>Cyclone</span>
              </div>
              <span className="lap-hazard-score">{assessmentResult.assessments.cyclone.riskScore}/100</span>
              <span className="lap-hazard-stage">{assessmentResult.assessments.cyclone.warningStage}</span>
            </div>
          </div>

          {/* Live Evidence Checklist */}
          <div className="lap-section-title">LIVE EVIDENCE & PROVENANCE</div>
          <div className="lap-evidence-list">
            {/* Weather */}
            <div className="lap-evidence-row">
              <div className="lap-evidence-meta">
                <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                <span className="lap-evidence-name">Open-Meteo Atmospheric Sensors</span>
              </div>
              <div className="lap-evidence-detail">
                {assessmentResult.weatherSummary ? (
                  <span>
                    {assessmentResult.weatherSummary.temperature?.toFixed(1)}°C • {assessmentResult.weatherSummary.humidity}% RH • {assessmentResult.weatherSummary.windSpeed?.toFixed(1)} km/h • {assessmentResult.weatherSummary.precipitation?.toFixed(1)} mm/h
                  </span>
                ) : (
                  <span className="text-zinc-500 italic">Data unavailable</span>
                )}
                <span className="lap-provenance-tag">DIRECT OBSERVATION</span>
              </div>
            </div>

            {/* NASA FIRMS */}
            <div className="lap-evidence-row">
              <div className="lap-evidence-meta">
                <Satellite size={12} className="text-amber-400 flex-shrink-0" />
                <span className="lap-evidence-name">NASA FIRMS VIIRS Satellites</span>
              </div>
              <div className="lap-evidence-detail">
                <span>
                  {assessmentResult.fireTelemetry && assessmentResult.fireTelemetry.activeDetections.length > 0
                    ? `${assessmentResult.fireTelemetry.activeDetections.length} active detection(s) within 10 km (nearest ${assessmentResult.fireTelemetry.nearestFireDistanceKm} km)`
                    : 'No satellite active-fire detections within 10 km'}
                </span>
                <span className="lap-provenance-tag">DIRECT SATELLITE OBSERVATION</span>
              </div>
            </div>

            {/* USGS Seismic */}
            <div className="lap-evidence-row">
              <div className="lap-evidence-meta">
                <Activity size={12} className="text-purple-400 flex-shrink-0" />
                <span className="lap-evidence-name">USGS Global Seismographic Network</span>
              </div>
              <div className="lap-evidence-detail">
                <span>
                  {assessmentResult.seismicTelemetry?.nearestEvent
                    ? `M${assessmentResult.seismicTelemetry.nearestEvent.magnitude.toFixed(1)} event at ${assessmentResult.seismicTelemetry.nearestEvent.epicentralDistanceKm} km (${assessmentResult.seismicTelemetry.nearestEvent.attenuationSummary || 'Attenuated PGA'})`
                    : 'No significant seismic activity detected within threshold'}
                </span>
                <span className="lap-provenance-tag">DIRECT OBSERVATION</span>
              </div>
            </div>

            {/* GloFAS Hydrology */}
            <div className="lap-evidence-row">
              <div className="lap-evidence-meta">
                <Waves size={12} className="text-sky-400 flex-shrink-0" />
                <span className="lap-evidence-name">GloFAS / ECMWF River Discharge</span>
              </div>
              <div className="lap-evidence-detail">
                <span>
                  {assessmentResult.hydrologyTelemetry?.riverDischargeM3s !== undefined
                    ? `Discharge: ${assessmentResult.hydrologyTelemetry.riverDischargeM3s.toFixed(1)} m³/s (${assessmentResult.hydrologyTelemetry.summary || 'Live streamflow'})`
                    : 'River discharge gauge data unavailable for this location'}
                </span>
                <span className="lap-provenance-tag">
                  {assessmentResult.hydrologyTelemetry?.riverDischargeM3s !== undefined ? 'DIRECT OBSERVATION' : 'UNAVAILABLE'}
                </span>
              </div>
            </div>

            {/* Verified Community Reports */}
            <div className="lap-evidence-row">
              <div className="lap-evidence-meta">
                <ShieldCheck size={12} className="text-cyan-400 flex-shrink-0" />
                <span className="lap-evidence-name">DRISHTI Verified Community Reports</span>
              </div>
              <div className="lap-evidence-detail">
                <span>
                  {assessmentResult.verifiedReportsCount > 0
                    ? `${assessmentResult.verifiedReportsCount} verified incident report(s) within 5 km`
                    : '0 ground incident reports filed within 5 km radius'}
                </span>
                <span className="lap-provenance-tag">VERIFIED GROUND TELEMETRY</span>
              </div>
            </div>
          </div>

          {/* Data Freshness & Timestamps */}
          <div className="lap-freshness-bar">
            <Clock size={11} className="text-zinc-500 flex-shrink-0" />
            <span className="lap-freshness-text">
              Evaluated at {assessmentResult.evaluatedAt.toLocaleTimeString()} IST • Live Feeds Active
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-2">
            {onNavigate && assessmentResult && (
              <button
                type="button"
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                  letterSpacing: '0.05em'
                }}
                onClick={() => {
                  onNavigate(
                    assessmentResult.latitude,
                    assessmentResult.longitude,
                    assessmentResult.locationName || `${assessmentResult.latitude.toFixed(4)}°N, ${assessmentResult.longitude.toFixed(4)}°E`
                  );
                }}
                className="hover:opacity-95 active:scale-98 transition-all"
                title="Calculate and follow live GPS road navigation to this pinpointed coordinate"
              >
                <Navigation size={14} className="text-white" />
                <span>NAVIGATE TO PINPOINT</span>
              </button>
            )}

            {/* Action Button: View Full Early Warning */}
            <button
              type="button"
              className="lap-action-btn"
              onClick={handleViewFullEarlyWarning}
              title="Open comprehensive Early Warning Center for these coordinates"
            >
              <span>VIEW FULL EARLY WARNING</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAssessmentPanel;
