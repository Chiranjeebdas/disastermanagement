import React from 'react';
import type { HazardRiskAssessment, WarningStage } from '../../types/earlyWarning';
import { Waves, Flame, Activity, Wind, AlertTriangle, Radio, ChevronRight } from 'lucide-react';

interface HazardRiskCardProps {
  assessment: HazardRiskAssessment;
  isSelected?: boolean;
  onSelect?: (assessment: HazardRiskAssessment) => void;
}

export const HazardRiskCard: React.FC<HazardRiskCardProps> = ({
  assessment,
  isSelected = false,
  onSelect
}) => {
  const getHazardIcon = () => {
    switch (assessment.hazardType) {
      case 'Flood': return <Waves size={18} className="text-sky-400" />;
      case 'Fire': return <Flame size={18} className="text-rose-400" />;
      case 'Earthquake': return <Activity size={18} className="text-amber-400" />;
      case 'Cyclone': return <Wind size={18} className="text-cyan-400" />;
      default: return <AlertTriangle size={18} className="text-yellow-400" />;
    }
  };

  const getHazardDisplayTitle = () => {
    switch (assessment.hazardType) {
      case 'Flood': return 'Flood & Inundation';
      case 'Fire': return 'Wildfire & Urban Fire';
      case 'Earthquake': return 'Detected Seismic Activity';
      case 'Cyclone': return 'Cyclone & Gale Storm';
      default: return assessment.hazardType;
    }
  };

  const getStageBadgeStyle = (stage: WarningStage) => {
    switch (stage) {
      case 'Emergency': return 'badge-emergency';
      case 'Warning': return 'badge-warning';
      case 'Watch': return 'badge-watch';
      case 'Advisory': return 'badge-advisory';
      case 'Normal':
      default: return 'badge-normal';
    }
  };

  return (
    <div
      className={`hazard-risk-card ${isSelected ? 'selected' : ''} ${getStageBadgeStyle(assessment.warningStage)}`}
      onClick={() => onSelect && onSelect(assessment)}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      {/* 1. Top Header Row: Icon on Left, Warning Stage Badge on Right */}
      <div className="hazard-card-header">
        <div className="hazard-icon-wrapper">
          {getHazardIcon()}
        </div>
        <span className={`hazard-stage-badge ${getStageBadgeStyle(assessment.warningStage)}`}>
          {assessment.warningStage}
        </span>
      </div>

      {/* 2. Hazard Title (Clean, no repeated location string) */}
      <div className="hazard-title-container">
        <h4 className="hazard-card-title" title={getHazardDisplayTitle()}>
          {getHazardDisplayTitle()}
        </h4>
      </div>

      <div className="hazard-card-divider" />

      {/* 3. Main Metrics Grid: Risk Score, Confidence, Impact Radius, Lead Time */}
      <div className="hazard-card-metrics">
        <div className="hazard-metric-cell">
          <span className="hazard-metric-title">RISK SCORE</span>
          <div className="hazard-score-wrapper">
            <span className="hazard-score-number">{assessment.riskScore}</span>
            <span className="hazard-score-max">/ 100</span>
          </div>
          <span className="hazard-level-label">{assessment.riskLevel} Risk</span>
        </div>

        <div className="hazard-metric-cell hazard-metric-right">
          <span className="hazard-metric-title">CONFIDENCE</span>
          <span className="hazard-confidence-value">{assessment.confidence}%</span>
          <span className="hazard-sub-caption">
            {assessment.confidence >= 70 ? 'High Proof' : assessment.confidence >= 45 ? 'Moderate' : 'Low Proof'}
          </span>
        </div>
      </div>

      <div className="hazard-secondary-metrics">
        <div className="hazard-secondary-row">
          <span>Impact Radius</span>
          <span className="hazard-secondary-val">{assessment.impactRadiusKm} km</span>
        </div>
        {assessment.leadTimeMinutes !== undefined && (
          <div className="hazard-secondary-row">
            <span>Lead Time</span>
            <span className="hazard-leadtime-val">{assessment.leadTimeMinutes} min</span>
          </div>
        )}
      </div>

      <div className="hazard-card-divider" />

      {/* 4. Short Summary */}
      <div className="hazard-card-body">
        <p className="hazard-card-summary" title={assessment.summary}>
          {assessment.summary || `Live observations indicate ${assessment.riskLevel.toLowerCase()} risk potential.`}
        </p>
      </div>

      <div className="hazard-card-divider" />

      {/* 5. Footer */}
      <div className="hazard-card-footer">
        <span className="hazard-card-status">
          <Radio size={10} className={assessment.status === 'Active' ? 'hazard-status-live' : 'hazard-status-normal'} />
          <span className="hazard-status-text">Status: {assessment.status}</span>
        </span>
        <div className="view-details-link">
          <span>{isSelected ? 'Inspecting' : 'View Details'}</span>
          <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
};

export default HazardRiskCard;
