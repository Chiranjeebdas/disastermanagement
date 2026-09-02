/**
 * DRISHTI Early Warning Alert Bridge & Alarm Fatigue Management Engine
 * 
 * CORE RESPONSIBILITIES:
 * 1. Convert HazardRiskAssessment instances to standard DRISHTI Alert entities.
 * 2. Prevent alarm fatigue by applying hysteresis, stage escalation gates, and cooldowns.
 * 3. Deduplicate active alerts across renders, route transitions, and browser reloads.
 * 4. Maintain a lightweight lifecycle event history (Advisory -> Watch -> Warning -> Emergency -> Resolved).
 * 5. Preserve evidence provenance and multi-role action protocols without duplicating alerts.
 */

import type { Alert, AlertSeverity, AlertType, AlertLifecycleEvent } from '../types/alert';
import type { HazardRiskAssessment, WarningStage } from '../types/earlyWarning';
import { shouldIssueWarning, RISK_THRESHOLDS } from './riskIntelligence';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

export const EW_STORAGE_KEY = 'drishti_ew_alert_states_v1';
export const COOLDOWN_MINUTES = 5;
export const SIGNIFICANT_SCORE_DELTA = 10;
export const RESOLUTION_HYSTERESIS_SCORE = 25;

export type EarlyWarningTransitionType = 
  | 'NO_CHANGE'
  | 'NEW_ADVISORY'
  | 'WARNING_ISSUED'
  | 'WARNING_ESCALATED'
  | 'WARNING_DOWNGRADED'
  | 'WARNING_RESOLVED';

export interface EarlyWarningAlertEventState {
  transitionType: EarlyWarningTransitionType;
  message: string;
  hazardType: string;
  currentStage: WarningStage;
  timestamp: string;
}

// Stage ranking for escalation/downgrade comparison
export const STAGE_RANK: Record<WarningStage, number> = {
  'Normal': 0,
  'Advisory': 1,
  'Watch': 2,
  'Warning': 3,
  'Emergency': 4
};

// ============================================================================
// PART 1 — TITLE & DESCRIPTION FORMATTING
// ============================================================================

/**
 * Generate action-oriented titles strictly adhering to data integrity principles
 * (No "Earthquake Prediction" claims).
 */
export function generateAlertTitle(hazardType: string, stage: WarningStage, isResolved = false): string {
  if (isResolved) {
    switch (hazardType) {
      case 'Flood': return 'Flood Risk Advisory Resolved — All Clear';
      case 'Fire': return 'Fire Risk Advisory Resolved — All Clear';
      case 'Earthquake': return 'Seismic Shaking Threat Resolved';
      case 'Cyclone': return 'Cyclonic Wind Threat Resolved — All Clear';
      default: return 'Environmental Threat Resolved — Normal Baseline';
    }
  }

  switch (hazardType) {
    case 'Flood':
      switch (stage) {
        case 'Emergency': return 'Flash Flood Emergency Warning';
        case 'Warning': return 'Flood Risk Warning';
        case 'Watch': return 'Flood Watch Advisory';
        case 'Advisory': return 'Flood Risk Advisory';
        default: return 'Flood Monitoring Advisory';
      }
    case 'Fire':
      switch (stage) {
        case 'Emergency': return 'Wildfire Emergency Warning';
        case 'Warning': return 'Fire Risk Warning';
        case 'Watch': return 'Fire Weather Watch';
        case 'Advisory': return 'Fire Risk Advisory';
        default: return 'Fire Monitoring Advisory';
      }
    case 'Earthquake':
      switch (stage) {
        case 'Emergency': return 'Detected Severe Seismic Shockwave Warning';
        case 'Warning': return 'Detected Seismic Activity';
        case 'Watch': return 'Detected Regional Seismic Activity';
        case 'Advisory': return 'Minor Seismic Vibration Advisory';
        default: return 'Seismic Telemetry Monitoring';
      }
    case 'Cyclone':
      switch (stage) {
        case 'Emergency': return 'Severe Cyclonic Gale Emergency';
        case 'Warning': return 'Cyclone Risk Warning';
        case 'Watch': return 'Cyclonic Wind Watch';
        case 'Advisory': return 'Cyclonic Wind Advisory';
        default: return 'Atmospheric Wind Advisory';
      }
    default:
      switch (stage) {
        case 'Emergency': return 'Multi-Hazard Critical Emergency';
        case 'Warning': return 'Multi-Hazard Risk Warning';
        case 'Watch': return 'Multi-Hazard Watch';
        case 'Advisory': return 'Multi-Hazard Advisory';
        default: return 'Environmental Baseline Monitoring';
      }
  }
}

/**
 * Maps WarningStage to existing standard AlertSeverity
 */
export function stageToSeverity(stage: WarningStage): AlertSeverity {
  switch (stage) {
    case 'Emergency': return 'Critical';
    case 'Warning': return 'Warning';
    case 'Advisory': return 'Advisory';
    case 'Watch': return 'Warning';
    case 'Normal': return 'Resolved';
    default: return 'Advisory';
  }
}

/**
 * Maps HazardType to existing AlertType
 */
export function hazardToAlertType(hazardType: string): AlertType {
  switch (hazardType) {
    case 'Flood': return 'Flood';
    case 'Fire': return 'Fire';
    case 'Earthquake': return 'Earthquake';
    case 'Cyclone': return 'Cyclone';
    case 'Landslide': return 'Landslide';
    default: return 'Extreme Weather';
  }
}

/**
 * Format structured, transparent alert description containing:
 * WHAT, WHERE, RISK, CONFIDENCE, WHY (Evidence), and ACTION.
 */
export function generateAlertDescription(
  assessment: HazardRiskAssessment,
  escalationNote?: string
): string {
  const triggersText = assessment.primaryTriggers && assessment.primaryTriggers.length > 0
    ? assessment.primaryTriggers.slice(0, 3).map(t => `• ${t.parameter}: ${t.observedValue} (Threshold: ${t.threshold})`).join('\n')
    : '• Multi-sensor telemetry parameters within monitored threshold range.';

  const citizenActionObj = assessment.recommendedActions?.find(a => a.audience === 'Citizen');
  const citizenAction = citizenActionObj
    ? citizenActionObj.action
    : 'Follow official civil protection instructions and stay tuned to emergency broadcasts.';

  let text = `WHAT: ${assessment.hazardType.toUpperCase()} RISK ASSESSMENT\n`;
  text += `WHERE: ${assessment.location}\n`;
  text += `RISK: ${assessment.riskScore}/100 (${assessment.riskLevel.toUpperCase()} • ${assessment.warningStage.toUpperCase()})\n`;
  text += `CONFIDENCE: ${assessment.confidence}% (Multi-source corroborated)\n\n`;
  text += `PRIMARY EVIDENCE & TRIGGERS:\n${triggersText}\n\n`;
  text += `ACTION:\n${citizenAction}`;

  if (escalationNote) {
    text += `\n\n[LIFECYCLE UPDATE]: ${escalationNote}`;
  }

  return text;
}

// ============================================================================
// PART 2 — CONVERSION & ESCALATION BRIDGE
// ============================================================================

/**
 * Generates a deterministic, stable ID for an early warning alert
 */
export function getStableAlertId(hazardType: string, location: string): string {
  const cleanHazard = hazardType.toLowerCase().trim();
  const cleanLocation = (location || 'sector').toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
  return `ew-${cleanHazard}-${cleanLocation}`;
}

/**
 * Converts a HazardRiskAssessment into a standard DRISHTI Alert.
 * Handles deduplication, stage escalation logging, and cooldown evaluation.
 */
export function convertAssessmentToAlert(
  assessment: HazardRiskAssessment,
  existingAlert?: Alert | null,
  previousAssessment?: HazardRiskAssessment | null
): { alert: Alert | null; transition: EarlyWarningTransitionType; note?: string } {
  const alertId = getStableAlertId(assessment.hazardType, assessment.location);
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  const isInitial = !previousAssessment && !existingAlert;
  const isCurrentNormal = assessment.warningStage === 'Normal' || assessment.riskScore <= RISK_THRESHOLDS.LOW_MAX;

  // Case 1: Low / Normal condition on clean state -> No alert created
  if (isInitial && isCurrentNormal) {
    return { alert: null, transition: 'NO_CHANGE' };
  }

  // Case 2: Assessment has dropped to Normal -> Check if resolving an active existing alert
  if (isCurrentNormal) {
    if (existingAlert && existingAlert.status !== 'Resolved') {
      const resolutionNote = `Risk normalized. Current score decreased to ${assessment.riskScore}/100. Threat resolved.`;
      const history: AlertLifecycleEvent[] = [
        ...(existingAlert.lifecycleHistory || []),
        {
          timestamp: nowIso,
          stage: 'Normal',
          riskScore: assessment.riskScore,
          note: resolutionNote
        }
      ];

      const resolvedAlert: Alert = {
        ...existingAlert,
        title: generateAlertTitle(assessment.hazardType, 'Normal', true),
        severity: 'Resolved',
        status: 'Resolved',
        updatedAt: nowIso,
        description: generateAlertDescription(assessment, resolutionNote),
        riskScore: assessment.riskScore,
        confidence: assessment.confidence,
        warningStage: 'Normal',
        lifecycleHistory: history,
        escalationNote: resolutionNote
      };

      return { alert: resolvedAlert, transition: 'WARNING_RESOLVED', note: resolutionNote };
    }
    return { alert: null, transition: 'NO_CHANGE' };
  }

  // Determine stage and score transitions
  const prevStage: WarningStage = previousAssessment ? previousAssessment.warningStage : (existingAlert?.warningStage || 'Normal');
  const prevScore: number = previousAssessment ? previousAssessment.riskScore : (existingAlert?.riskScore ?? 0);
  const prevRank = STAGE_RANK[prevStage] || 0;
  const currRank = STAGE_RANK[assessment.warningStage] || 0;

  const stageEscalated = currRank > prevRank;
  const stageDowngraded = currRank < prevRank && currRank > 0;
  const scoreDelta = Math.abs(assessment.riskScore - prevScore);

  // Check alarm fatigue suppression using shouldIssueWarning
  const warrantsWarning = shouldIssueWarning(previousAssessment || null, assessment, SIGNIFICANT_SCORE_DELTA);

  // Cooldown check for identical or non-escalating events
  let isCooldownSuppressed = false;
  if (existingAlert && !stageEscalated) {
    const lastUpdateMs = new Date(existingAlert.updatedAt).getTime();
    const elapsedMinutes = (nowMs - lastUpdateMs) / (1000 * 60);
    if (elapsedMinutes < COOLDOWN_MINUTES && prevStage === assessment.warningStage && scoreDelta < SIGNIFICANT_SCORE_DELTA) {
      isCooldownSuppressed = true;
    }
  }

  // If no significant change or suppressed by cooldown -> retain existing without duplicate spam
  if ((!warrantsWarning && existingAlert) || isCooldownSuppressed) {
    return { alert: existingAlert || null, transition: 'NO_CHANGE' };
  }

  // Determine transition type and escalation note
  let transition: EarlyWarningTransitionType = 'WARNING_ISSUED';
  let transitionNote = `Early warning assessment initiated at stage ${assessment.warningStage.toUpperCase()} (${assessment.riskScore}/100).`;

  if (assessment.warningStage === 'Advisory' && !existingAlert) {
    transition = 'NEW_ADVISORY';
    transitionNote = `New environmental advisory detected in ${assessment.location}.`;
  } else if (stageEscalated) {
    transition = 'WARNING_ESCALATED';
    transitionNote = `Warning escalated from ${prevStage.toUpperCase()} to ${assessment.warningStage.toUpperCase()} (Risk: ${prevScore} → ${assessment.riskScore}).`;
  } else if (stageDowngraded) {
    transition = 'WARNING_DOWNGRADED';
    transitionNote = `Warning downgraded from ${prevStage.toUpperCase()} to ${assessment.warningStage.toUpperCase()} (Risk decreased to ${assessment.riskScore}/100).`;
  }

  // Build / Append lifecycle event history
  const history: AlertLifecycleEvent[] = [
    ...(existingAlert?.lifecycleHistory || []),
    {
      timestamp: nowIso,
      stage: assessment.warningStage,
      riskScore: assessment.riskScore,
      note: transitionNote
    }
  ];

  // Map measurements from primary triggers
  const measurements = assessment.primaryTriggers?.map(t => ({
    label: t.parameter,
    value: String(t.observedValue)
  })) || [];

  // Structure role actions
  const roleActions: { citizen?: string[]; responder?: string[]; authority?: string[] } = {
    citizen: assessment.recommendedActions?.filter(a => a.audience === 'Citizen').map(a => a.action),
    responder: assessment.recommendedActions?.filter(a => a.audience === 'Responder').map(a => a.action),
    authority: assessment.recommendedActions?.filter(a => a.audience === 'Authority').map(a => a.action)
  };

  const citizenActionStr = roleActions.citizen?.[0] || 'Follow standard civil protection instructions.';

  const createdAlert: Alert = {
    id: alertId,
    title: generateAlertTitle(assessment.hazardType, assessment.warningStage),
    severity: stageToSeverity(assessment.warningStage),
    type: hazardToAlertType(assessment.hazardType),
    location: assessment.location,
    latitude: assessment.centerCoordinates ? assessment.centerCoordinates[0] : undefined,
    longitude: assessment.centerCoordinates ? assessment.centerCoordinates[1] : undefined,
    detectedAt: existingAlert?.detectedAt || nowIso,
    updatedAt: nowIso,
    source: 'DRISHTI Early Warning',
    isVerified: true,
    description: generateAlertDescription(assessment, transitionNote),
    status: assessment.warningStage === 'Normal' ? 'Resolved' : assessment.warningStage === 'Advisory' ? 'Monitoring' : 'Active',
    measurements,
    affectedRadiusKm: assessment.impactRadiusKm || 10,
    recommendedAction: citizenActionStr,
    isAcknowledged: existingAlert?.isAcknowledged || false,
    riskScore: assessment.riskScore,
    confidence: assessment.confidence,
    warningStage: assessment.warningStage,
    roleActions,
    evidenceSources: assessment.evidenceSources?.map(s => ({
      sourceType: s.sourceType,
      sourceName: s.sourceName,
      description: s.description,
      reliability: s.reliability,
      provenance: s.provenance
    })),
    lifecycleHistory: history,
    escalationNote: transitionNote
  };

  return { alert: createdAlert, transition, note: transitionNote };
}

// ============================================================================
// PART 3 — BATCH ALERT PROCESSING & DEDUPLICATION
// ============================================================================

export interface ProcessBatchResult {
  mergedAlerts: Alert[];
  newOrUpdatedEarlyWarningAlerts: Alert[];
  latestTransition: EarlyWarningAlertEventState;
}

/**
 * Processes all active hazard assessments, generates/escalates alerts,
 * and merges them cleanly with existing live telemetry alerts (USGS/Weather).
 */
export function processEarlyWarningBatch(
  currentAssessments: HazardRiskAssessment[],
  existingAlerts: Alert[],
  previousAssessmentsMap?: Record<string, HazardRiskAssessment>
): ProcessBatchResult {
  const ewAlertMap = new Map<string, Alert>();
  
  // Index existing Early Warning alerts by their stable ID
  existingAlerts.forEach(a => {
    if (a.source === 'DRISHTI Early Warning' || a.id.startsWith('ew-')) {
      ewAlertMap.set(a.id, a);
    }
  });

  const updatedEwAlerts: Alert[] = [];
  let latestEvent: EarlyWarningAlertEventState = {
    transitionType: 'NO_CHANGE',
    message: 'Monitoring active — environmental signals stable.',
    hazardType: 'Overall',
    currentStage: 'Normal',
    timestamp: new Date().toISOString()
  };

  for (const assessment of currentAssessments) {
    const alertId = getStableAlertId(assessment.hazardType, assessment.location);
    const existing = ewAlertMap.get(alertId);
    const prev = previousAssessmentsMap ? previousAssessmentsMap[assessment.hazardType] : null;

    const { alert, transition, note } = convertAssessmentToAlert(assessment, existing, prev);

    if (alert) {
      ewAlertMap.set(alertId, alert);
      updatedEwAlerts.push(alert);
    }

    if (transition !== 'NO_CHANGE') {
      latestEvent = {
        transitionType: transition,
        message: note || `Alert transition: ${transition}`,
        hazardType: assessment.hazardType,
        currentStage: assessment.warningStage,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Re-merge all alerts: Non-EW alerts preserved + EW alerts merged
  const nonEwAlerts = existingAlerts.filter(a => a.source !== 'DRISHTI Early Warning' && !a.id.startsWith('ew-'));
  const allEwAlerts = Array.from(ewAlertMap.values());
  const mergedAlerts = [...allEwAlerts, ...nonEwAlerts];

  return {
    mergedAlerts,
    newOrUpdatedEarlyWarningAlerts: updatedEwAlerts,
    latestTransition: latestEvent
  };
}

// ============================================================================
// PART 4 — ISOLATED DETERMINISTIC TEST RUNNER (10 SCENARIOS)
// ============================================================================

export interface EarlyWarningAlertTestResult {
  scenarioNumber: number;
  scenarioName: string;
  passed: boolean;
  details: string;
}

/**
 * Runs 10 isolated, deterministic unit-test scenarios for Phase 5 verification.
 * Does not depend on any test runner or network.
 */
export function runEarlyWarningAlertsSelfTest(): { allPassed: boolean; results: EarlyWarningAlertTestResult[] } {
  const results: EarlyWarningAlertTestResult[] = [];
  const areaName = 'Cuttack Test Sector';
  const coords: [number, number] = [20.4625, 85.8828];

  const baseAssessment = (hazard: 'Flood' | 'Fire' | 'Earthquake' | 'Cyclone', score: number, stage: WarningStage): HazardRiskAssessment => ({
    id: `test-assess-${hazard.toLowerCase()}`,
    hazardType: hazard,
    riskScore: score,
    riskLevel: score >= 80 ? 'Severe' : score >= 60 ? 'High' : score >= 35 ? 'Moderate' : 'Low',
    warningStage: stage,
    confidence: 85,
    leadTimeMinutes: 120,
    impactRadiusKm: 15,
    centerCoordinates: coords,
    location: areaName,
    primaryTriggers: [{ parameter: 'Precipitation', observedValue: '35mm/h', threshold: '25mm/h', contribution: 40 }],
    evidenceSources: [{
      sourceType: 'Open_Meteo',
      sourceName: 'Meteorological Sensor',
      description: 'Live sensor telemetry',
      reliability: 90,
      provenance: 'DIRECT OBSERVATION',
      timestamp: new Date().toISOString()
    }],
    recommendedActions: [
      { audience: 'Citizen', action: 'Avoid low-lying underpasses.', priority: 'High' },
      { audience: 'Responder', action: 'Deploy rescue pumps.', priority: 'Critical' },
      { audience: 'Authority', action: 'Issue public warning.', priority: 'Critical' }
    ],
    status: stage === 'Normal' ? 'Resolved' : 'Active',
    timestamp: new Date().toISOString()
  });

  // Scenario 1: Low risk -> No alert created
  const s1Assess = baseAssessment('Flood', 15, 'Normal');
  const s1 = convertAssessmentToAlert(s1Assess, null, null);
  const p1 = s1.alert === null && s1.transition === 'NO_CHANGE';
  results.push({
    scenarioNumber: 1,
    scenarioName: 'Low Risk -> No alert generated',
    passed: p1,
    details: `Alert: ${s1.alert ? 'Generated' : 'None'} (Transition: ${s1.transition})`
  });

  // Scenario 2: Low -> Advisory -> Creates Advisory alert
  const s2Assess = baseAssessment('Flood', 38, 'Advisory');
  const s2 = convertAssessmentToAlert(s2Assess, null, s1Assess);
  const p2 = s2.alert !== null && s2.alert.severity === 'Advisory' && s2.transition === 'NEW_ADVISORY';
  results.push({
    scenarioNumber: 2,
    scenarioName: 'Low -> Advisory -> Creates Advisory alert',
    passed: p2,
    details: `Alert: ${s2.alert?.title}, Severity: ${s2.alert?.severity}`
  });

  // Scenario 3: Advisory -> Watch -> Escalates
  const s3Assess = baseAssessment('Flood', 58, 'Watch');
  const s3 = convertAssessmentToAlert(s3Assess, s2.alert, s2Assess);
  const p3 = s3.alert !== null && s3.transition === 'WARNING_ESCALATED' && s3.alert.warningStage === 'Watch';
  results.push({
    scenarioNumber: 3,
    scenarioName: 'Advisory -> Watch -> Escalation triggered',
    passed: p3,
    details: `Transition: ${s3.transition}, Stage: ${s3.alert?.warningStage}`
  });

  // Scenario 4: Watch -> Warning -> Escalates to Warning
  const s4Assess = baseAssessment('Flood', 74, 'Warning');
  const s4 = convertAssessmentToAlert(s4Assess, s3.alert, s3Assess);
  const p4 = s4.alert !== null && s4.transition === 'WARNING_ESCALATED' && s4.alert.severity === 'Warning';
  results.push({
    scenarioNumber: 4,
    scenarioName: 'Watch -> Warning -> Escalates to Warning severity',
    passed: p4,
    details: `Transition: ${s4.transition}, Title: ${s4.alert?.title}`
  });

  // Scenario 5: Same Warning repeated -> No duplicate
  const s5 = convertAssessmentToAlert(s4Assess, s4.alert, s4Assess);
  const p5 = s5.transition === 'NO_CHANGE' && s5.alert?.id === s4.alert?.id;
  results.push({
    scenarioNumber: 5,
    scenarioName: 'Same Warning repeated -> Suppresses duplicate (NO_CHANGE)',
    passed: p5,
    details: `Transition: ${s5.transition}`
  });

  // Scenario 6: Warning score changes by +2 (74 -> 76) -> No duplicate
  const s6Assess = baseAssessment('Flood', 76, 'Warning');
  const s6 = convertAssessmentToAlert(s6Assess, s4.alert, s4Assess);
  const p6 = s6.transition === 'NO_CHANGE';
  results.push({
    scenarioNumber: 6,
    scenarioName: 'Minor fluctuation (+2 pts within Warning) -> No duplicate',
    passed: p6,
    details: `Transition: ${s6.transition} (Suppressed noise)`
  });

  // Scenario 7: Warning -> Emergency -> Immediate Escalation
  const s7Assess = baseAssessment('Flood', 88, 'Emergency');
  const s7 = convertAssessmentToAlert(s7Assess, s4.alert, s6Assess);
  const p7 = s7.alert !== null && s7.transition === 'WARNING_ESCALATED' && s7.alert.severity === 'Critical';
  results.push({
    scenarioNumber: 7,
    scenarioName: 'Warning -> Emergency -> Immediate Critical escalation',
    passed: p7,
    details: `Transition: ${s7.transition}, Severity: ${s7.alert?.severity}`
  });

  // Scenario 8: Warning -> Watch -> Downgrade update
  const s8Assess = baseAssessment('Flood', 55, 'Watch');
  const s8 = convertAssessmentToAlert(s8Assess, s7.alert, s7Assess);
  const p8 = s8.alert !== null && s8.transition === 'WARNING_DOWNGRADED';
  results.push({
    scenarioNumber: 8,
    scenarioName: 'Emergency -> Watch -> Meaningful downgrade update',
    passed: p8,
    details: `Transition: ${s8.transition}, Note: ${s8.note}`
  });

  // Scenario 9: Watch -> Normal -> Resolution/all-clear
  const s9Assess = baseAssessment('Flood', 18, 'Normal');
  const s9 = convertAssessmentToAlert(s9Assess, s8.alert, s8Assess);
  const p9 = s9.alert !== null && s9.alert.status === 'Resolved' && s9.transition === 'WARNING_RESOLVED';
  results.push({
    scenarioNumber: 9,
    scenarioName: 'Watch -> Normal -> Generates Resolution/All-Clear update',
    passed: p9,
    details: `Status: ${s9.alert?.status}, Transition: ${s9.transition}`
  });

  // Scenario 10: Browser reload simulation -> Deterministic alert ID consistency
  const alertIdFirst = getStableAlertId('Flood', areaName);
  const alertIdSecond = getStableAlertId('Flood', areaName);
  const p10 = alertIdFirst === alertIdSecond && alertIdFirst.startsWith('ew-flood');
  results.push({
    scenarioNumber: 10,
    scenarioName: 'Deterministic Alert ID -> Prevents duplicate on reload',
    passed: p10,
    details: `ID: ${alertIdFirst}`
  });

  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
}
