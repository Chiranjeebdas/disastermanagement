import React, { useState } from 'react';
import type { HazardRiskAssessment, Audience, WarningStage } from '../../types/earlyWarning';
import { getStableAlertId, type EarlyWarningAlertEventState } from '../../utils/earlyWarningAlerts';
import { loadStoredCorrections } from '../../utils/correctionManager';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Users,
  Shield,
  Building,
  CheckCircle2,
  Volume2,
  Info,
  Compass,
  Map,
  ArrowRight
} from 'lucide-react';

interface EarlyWarningBulletinProps {
  assessment: HazardRiskAssessment;
  defaultAudience?: Audience;
  eventState?: EarlyWarningAlertEventState;
  isEscalated?: boolean;
  previousStage?: WarningStage;
  onViewOnMap?: (assessment: HazardRiskAssessment) => void;
}

export const EarlyWarningBulletin: React.FC<EarlyWarningBulletinProps> = ({
  assessment,
  defaultAudience = 'Citizen',
  eventState,
  isEscalated = false,
  previousStage,
  onViewOnMap
}) => {
  const [activeAudience, setActiveAudience] = useState<Audience>(defaultAudience);

  // Check if any correction is active for this assessment
  const stableAlertId = getStableAlertId(assessment.hazardType, assessment.location);
  const storedCorrections = loadStoredCorrections();
  const activePendingCorr = storedCorrections.find(c => (c.alertId === stableAlertId || c.alertId === assessment.id) && c.status === 'PENDING');
  const activeApprovedCorr = storedCorrections.find(c => (c.alertId === stableAlertId || c.alertId === assessment.id) && c.status === 'APPROVED');

  // Filter actions for the selected audience
  const audienceActions = (assessment.recommendedActions || []).filter(
    action => action.audience === activeAudience
  );

  const getStageHeaderInfo = (stage: WarningStage) => {
    switch (stage) {
      case 'Emergency':
        return {
          bannerClass: 'bulletin-emergency',
          icon: <AlertOctagon size={24} className="animate-pulse text-white" />,
          title: 'EMERGENCY LIFE-SAFETY WARNING',
          subtitle: 'Critical hazard event underway. Execute immediate protective actions.',
          badgeColor: '#ef4444'
        };
      case 'Warning':
        return {
          bannerClass: 'bulletin-warning',
          icon: <ShieldAlert size={24} className="text-white" />,
          title: 'ACTIVE HAZARD WARNING',
          subtitle: 'Imminent hazardous conditions detected. Action required to protect life and assets.',
          badgeColor: '#f97316'
        };
      case 'Watch':
        return {
          bannerClass: 'bulletin-watch',
          icon: <AlertTriangle size={24} className="text-white" />,
          title: 'HAZARD WATCH IN EFFECT',
          subtitle: 'Environmental conditions favorable for severe hazard emergence. Review safety readiness.',
          badgeColor: '#eab308'
        };
      case 'Advisory':
        return {
          bannerClass: 'bulletin-advisory',
          icon: <ShieldAlert size={24} className="text-white" />,
          title: 'METEOROLOGICAL & HAZARD ADVISORY',
          subtitle: 'Elevated baseline detected. Maintain situational awareness.',
          badgeColor: '#38bdf8'
        };
      case 'Normal':
      default:
        return {
          bannerClass: 'bulletin-normal',
          icon: <ShieldCheck size={24} className="text-emerald-400" />,
          title: 'ROUTINE MONITORING BASELINE',
          subtitle: 'All monitored regional parameters operating within nominal safety thresholds.',
          badgeColor: '#10b981'
        };
    }
  };

  const headerInfo = getStageHeaderInfo(assessment.warningStage);

  const getPriorityPillClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  return (
    <div className={`early-warning-bulletin ${headerInfo.bannerClass}`}>
      {/* Alarm Fatigue & Verification UX Status Strip */}
      <div className="bulletin-alarm-status-strip">
        {activePendingCorr ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded border border-amber-500/30">
            <AlertTriangle size={13} className="flex-shrink-0" />
            <span>Information review pending — Civil correction submitted for authorized review</span>
          </div>
        ) : activeApprovedCorr ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded border border-sky-500/30">
            <CheckCircle2 size={13} className="flex-shrink-0" />
            <span>Alert corrected by authorized reviewer {activeApprovedCorr.reviewedAt ? `(${new Date(activeApprovedCorr.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}</span>
          </div>
        ) : eventState?.transitionType === 'WARNING_ESCALATED' || isEscalated ? (
          <div className="alarm-status-escalated flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded border border-red-500/30">
            <Volume2 size={13} className="animate-bounce flex-shrink-0" />
            <span>{eventState?.message || `WARNING ESCALATED from ${previousStage || 'Advisory'} to ${assessment.warningStage.toUpperCase()}`}</span>
          </div>
        ) : eventState?.transitionType === 'WARNING_ISSUED' ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded border border-orange-500/30">
            <ShieldAlert size={13} className="flex-shrink-0" />
            <span>{eventState.message}</span>
          </div>
        ) : eventState?.transitionType === 'NEW_ADVISORY' ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded border border-sky-500/30">
            <Info size={13} className="flex-shrink-0" />
            <span>{eventState.message}</span>
          </div>
        ) : eventState?.transitionType === 'WARNING_DOWNGRADED' ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded border border-yellow-500/30">
            <AlertTriangle size={13} className="flex-shrink-0" />
            <span>{eventState.message}</span>
          </div>
        ) : eventState?.transitionType === 'WARNING_RESOLVED' ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30">
            <CheckCircle2 size={13} className="flex-shrink-0" />
            <span>{eventState.message}</span>
          </div>
        ) : (
          <div className="alarm-status-stable flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block flex-shrink-0" />
            <span>Monitoring active — environmental signals stable; notifications suppressed for minor telemetry drift.</span>
          </div>
        )}

        <span className="bulletin-timestamp text-[11px] text-zinc-400 flex items-center gap-1">
          <Clock size={11} />
          Evaluated: {new Date(assessment.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Main Banner Header */}
      <div className="bulletin-header">
        <div className="bulletin-header-left">
          <div className="bulletin-icon-wrapper">
            {headerInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bulletin-hazard-tag">
                {assessment.hazardType.toUpperCase()}
              </span>
              <span className="bulletin-stage-tag" style={{ color: headerInfo.badgeColor, borderColor: headerInfo.badgeColor }}>
                {assessment.warningStage.toUpperCase()}
              </span>
            </div>
            <h2 className="bulletin-title">{headerInfo.title}</h2>
            <p className="bulletin-subtitle">{headerInfo.subtitle}</p>
          </div>
        </div>

        {/* Lead-Time / Impact Pill */}
        <div className="bulletin-lead-time-card">
          <span className="lead-time-label">ESTIMATED LEAD TIME</span>
          <span className="lead-time-value">
            {assessment.leadTimeMinutes !== undefined
              ? `~${assessment.leadTimeMinutes} MIN`
              : assessment.warningStage === 'Normal'
                ? 'INACTIVE'
                : 'IMMEDIATE'}
          </span>
          <span className="lead-time-sub">Before Peak Hazard Impact</span>
        </div>
      </div>

      {/* Spatial & Radius Summary */}
      <div className="bulletin-spatial-grid">
        <div className="spatial-item">
          <Compass size={13} className="text-zinc-400" />
          <span className="spatial-label">Coordinates:</span>
          <span className="spatial-value font-mono">
            {assessment.centerCoordinates[0].toFixed(3)}°N, {assessment.centerCoordinates[1].toFixed(3)}°E
          </span>
        </div>
        <div className="spatial-item">
          <span className="spatial-label">Impact Buffer:</span>
          <span className="spatial-value">~{assessment.impactRadiusKm} km</span>
        </div>
        {onViewOnMap && (
          <button
            type="button"
            onClick={() => onViewOnMap(assessment)}
            className="bulletin-view-map-btn"
            title="Inspect estimated hazard risk zone on Disaster Map"
          >
            <Map size={13} />
            <span>View on Disaster Map</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      {/* Recommended Action Protocols Section */}
      <div className="bulletin-actions-section">
        <div className="actions-header-row">
          <h3 className="actions-section-title">ROLE-SPECIFIC ACTION PROTOCOLS</h3>

          {/* Role / Audience Switcher Tabs */}
          <div className="audience-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeAudience === 'Citizen'}
              onClick={() => setActiveAudience('Citizen')}
              className={`audience-tab ${activeAudience === 'Citizen' ? 'active' : ''}`}
            >
              <Users size={13} />
              <span>CITIZEN</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeAudience === 'Responder'}
              onClick={() => setActiveAudience('Responder')}
              className={`audience-tab ${activeAudience === 'Responder' ? 'active' : ''}`}
            >
              <Shield size={13} />
              <span>RESPONDER</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeAudience === 'Authority'}
              onClick={() => setActiveAudience('Authority')}
              className={`audience-tab ${activeAudience === 'Authority' ? 'active' : ''}`}
            >
              <Building size={13} />
              <span>AUTHORITY</span>
            </button>
          </div>
        </div>

        {/* Action Items List */}
        <div className="actions-list">
          {audienceActions.length > 0 ? (
            audienceActions.map((item, idx) => (
              <div key={idx} className="action-item-card">
                <div className="action-item-left">
                  <span className={`priority-pill ${getPriorityPillClass(item.priority)}`}>
                    {item.priority}
                  </span>
                  <p className="action-text">{item.action}</p>
                </div>
                <CheckCircle2 size={16} className="text-zinc-600 flex-shrink-0 action-check-icon" />
              </div>
            ))
          ) : (
            <div className="action-item-card">
              <span className="priority-pill priority-low">Routine</span>
              <p className="action-text">No mandatory emergency directives for {activeAudience}. Maintain standard preparedness.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
