/**
 * DRISHTI Citizen Smart Notifications & Alarm Fatigue Suppression
 * 
 * DESIGN PRINCIPLES:
 * 1. Reuses existing shouldIssueWarning() and risk intelligence stage transitions.
 * 2. Suppresses notifications for minor telemetry drifts, score fluctuations < 10, routine refreshes, and duplicate alerts.
 * 3. Notifies only on meaningful stage escalations, first-time active hazards, verified critical alerts, and official all-clears.
 * 4. Delivers clear, 5-part citizen information (What happened, How serious, What to do, Affected area, Update timestamp).
 */

import { shouldIssueWarning } from './riskIntelligence';
import type { HazardRiskAssessment, WarningStage } from '../types/earlyWarning';
import type { Alert } from '../types/alert';

export interface CitizenNotification {
  id: string;
  hazardType: string;
  headline: string;
  severityStage: WarningStage | 'Resolved';
  severityBadge: string;
  severityClass: 'emergency' | 'warning' | 'watch' | 'advisory' | 'resolved';
  recommendedAction: string;
  affectedArea: string;
  updateTime: string;
  targetUrl?: string;
  timestamp: number;
}

const CITIZEN_NOTIF_SESSION_KEY = 'drishti_citizen_notif_state_v1';

interface StoredNotifState {
  lastAssessment: {
    hazardType: string;
    warningStage: WarningStage;
    riskScore: number;
    timestamp: number;
  } | null;
  notifiedAlertIds: string[];
  lastNotifiedAt: number;
}

function loadNotifState(): StoredNotifState {
  try {
    const raw = sessionStorage.getItem(CITIZEN_NOTIF_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Fallback to empty state
  }
  return {
    lastAssessment: null,
    notifiedAlertIds: [],
    lastNotifiedAt: 0
  };
}

function saveNotifState(state: StoredNotifState): void {
  try {
    sessionStorage.setItem(CITIZEN_NOTIF_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Storage quota or private browsing fallback
  }
}

/**
 * Translate hazard type and warning stage into clear, life-saving citizen guidance
 */
function getCitizenGuidance(hazardType: string, stage: WarningStage): { headline: string; action: string; badge: string; severityClass: CitizenNotification['severityClass'] } {
  const type = hazardType || 'Hazard';

  switch (stage) {
    case 'Emergency':
      return {
        headline: `Urgent: Dangerous ${type} Conditions Active`,
        action: type === 'Flood'
          ? 'Move immediately to higher ground and avoid low-lying roads.'
          : type === 'Fire'
            ? 'Evacuate immediately if ordered. Close windows to block dense smoke.'
            : type === 'Cyclone'
              ? 'Stay in the strongest interior room away from glass windows.'
              : 'DROP, COVER, and HOLD ON under a sturdy table.',
        badge: 'TAKE ACTION NOW',
        severityClass: 'emergency'
      };

    case 'Warning':
      return {
        headline: `High Hazard Warning: Elevated ${type} Activity`,
        action: type === 'Flood'
          ? 'Avoid flooded underpasses and drainage canals. Never drive through water.'
          : type === 'Fire'
            ? 'Stay clear of the affected zone and keep doors closed.'
            : type === 'Cyclone'
              ? 'Secure outdoor loose items and prepare emergency power lights.'
              : 'Stay away from tall furniture and exterior glass walls.',
        badge: 'TAKE ACTION',
        severityClass: 'warning'
      };

    case 'Watch':
      return {
        headline: `Safety Advisory: ${type} Conditions Being Monitored`,
        action: type === 'Flood'
          ? 'Inspect property drains and move valuables off the floor.'
          : type === 'Fire'
            ? 'Strictly avoid outdoor open burning or combustible materials.'
            : type === 'Cyclone'
              ? 'Stock drinking water, dry food, and charge mobile devices.'
              : 'Review family emergency spots and keep shoes nearby.',
        badge: 'BE ALERT',
        severityClass: 'watch'
      };

    case 'Advisory':
      return {
        headline: `Advisory: Environmental Monitoring for ${type}`,
        action: 'Stay updated on local civil bulletins and maintain normal readiness.',
        badge: 'MONITOR CONDITIONS',
        severityClass: 'advisory'
      };

    case 'Normal':
    default:
      return {
        headline: `All Clear: ${type} Conditions Returned to Safe Baseline`,
        action: 'Threat normalized. Resume regular activities and follow weather updates.',
        badge: 'ALL CLEAR / RESOLVED',
        severityClass: 'resolved'
      };
  }
}

/**
 * Evaluate whether an assessment or alert warrants a citizen notification
 * Uses existing shouldIssueWarning() and alarm fatigue rules.
 */
export function evaluateCitizenNotification(
  currentAssessment: HazardRiskAssessment | null,
  alerts: Alert[],
  userLocationName: string
): CitizenNotification | null {
  const state = loadNotifState();
  const now = Date.now();

  // 1. Check for newly retracted or resolved important alerts
  const resolvedImportantAlert = alerts.find(a => 
    (a.status === 'Resolved' || a.severity === 'Resolved' || (a as any).verificationStatus === 'Retracted') &&
    state.notifiedAlertIds.includes(a.id)
  );

  if (resolvedImportantAlert) {
    // Remove from notified IDs so we don't repeat
    state.notifiedAlertIds = state.notifiedAlertIds.filter(id => id !== resolvedImportantAlert.id);
    saveNotifState(state);

    const retractionNote = (resolvedImportantAlert as any).escalationNote || 'Hazard conditions have normalized.';
    return {
      id: `resolved-${resolvedImportantAlert.id}-${now}`,
      hazardType: resolvedImportantAlert.type,
      headline: `All Clear: ${resolvedImportantAlert.type} Threat Resolved`,
      severityStage: 'Resolved',
      severityBadge: 'ALL CLEAR / RESOLVED',
      severityClass: 'resolved',
      recommendedAction: retractionNote,
      affectedArea: resolvedImportantAlert.location || userLocationName,
      updateTime: 'Updated just now • Official Bulletin',
      targetUrl: '/user/alerts',
      timestamp: now
    };
  }

  // 2. Check for new verified critical/warning alert
  const newCriticalAlert = alerts.find(a => 
    (a.severity === 'Critical' || a.severity === 'Warning') &&
    a.status !== 'Resolved' &&
    !state.notifiedAlertIds.includes(a.id)
  );

  if (newCriticalAlert) {
    state.notifiedAlertIds.push(newCriticalAlert.id);
    saveNotifState(state);

    const isCritical = newCriticalAlert.severity === 'Critical';
    return {
      id: `alert-${newCriticalAlert.id}-${now}`,
      hazardType: newCriticalAlert.type,
      headline: isCritical
        ? `Urgent Safety Alert: ${newCriticalAlert.type}`
        : `Hazard Notice: ${newCriticalAlert.type}`,
      severityStage: isCritical ? 'Emergency' : 'Warning',
      severityBadge: isCritical ? 'TAKE ACTION NOW' : 'TAKE ACTION',
      severityClass: isCritical ? 'emergency' : 'warning',
      recommendedAction: newCriticalAlert.recommendedAction || 'Follow instructions from emergency coordinators.',
      affectedArea: newCriticalAlert.location || userLocationName,
      updateTime: 'Updated just now • Verified Sensor Network',
      targetUrl: '/user/alerts',
      timestamp: now
    };
  }

  // 3. Early Warning Assessment State Transition Check
  if (!currentAssessment) {
    return null;
  }

  const prev = state.lastAssessment
    ? ({
        hazardType: state.lastAssessment.hazardType as any,
        warningStage: state.lastAssessment.warningStage,
        riskScore: state.lastAssessment.riskScore
      } as HazardRiskAssessment)
    : null;

  // Use existing alarm fatigue suppression logic
  const warrantsWarning = shouldIssueWarning(prev, currentAssessment, 10);

  if (!warrantsWarning) {
    // Suppressed due to minor fluctuation or unchanged nominal state
    return null;
  }

  // A meaningful escalation, new active hazard, or all-clear occurred!
  // Update stored state
  state.lastAssessment = {
    hazardType: currentAssessment.hazardType,
    warningStage: currentAssessment.warningStage,
    riskScore: currentAssessment.riskScore,
    timestamp: now
  };
  state.lastNotifiedAt = now;
  saveNotifState(state);

  const guidance = getCitizenGuidance(currentAssessment.hazardType, currentAssessment.warningStage);

  return {
    id: `ew-${currentAssessment.hazardType}-${currentAssessment.warningStage}-${now}`,
    hazardType: currentAssessment.hazardType,
    headline: guidance.headline,
    severityStage: currentAssessment.warningStage,
    severityBadge: guidance.badge,
    severityClass: guidance.severityClass,
    recommendedAction: guidance.action,
    affectedArea: `${userLocationName} (Local Corridor)`,
    updateTime: 'Updated just now • Multi-Source Live Telemetry',
    targetUrl: '/user/map',
    timestamp: now
  };
}

/**
 * Trigger native browser push notification if permitted
 */
export function dispatchBrowserNotification(notif: CitizenNotification): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const n = new Notification(notif.headline, {
      body: `${notif.severityBadge}: ${notif.recommendedAction}\nArea: ${notif.affectedArea}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `drishti-${notif.hazardType}`
    });

    n.onclick = () => {
      window.focus();
      if (notif.targetUrl) {
        window.location.href = notif.targetUrl;
      }
    };
  } catch (e) {
    console.warn('Native notification delivery failed:', e);
  }
}
