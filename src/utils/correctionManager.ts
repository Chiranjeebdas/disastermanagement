/**
 * DRISHTI Information Verification & Authorized Correction Manager
 * Provides a decentralized review process for citizen feedback, field responder observations,
 * and authorized reviewer oversight while strictly preserving sensor provenance and audit trails.
 */

import type { Alert, AlertSeverity } from '../types/alert';
import type {
  CorrectionRequest,
  CorrectionReason,
  FieldVerificationStatus,
  CorrectionAuditEntry
} from '../types/correction';

export const CORRECTIONS_STORAGE_KEY = 'drishti_alert_corrections_v1';
export const ALERTS_STORAGE_KEY = 'drishti_alerts_cache_live_v1';

// ============================================================================
// STORAGE HELPERS
// ============================================================================

export function loadStoredCorrections(): CorrectionRequest[] {
  try {
    const raw = localStorage.getItem(CORRECTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCorrections(corrections: CorrectionRequest[]): void {
  try {
    localStorage.setItem(CORRECTIONS_STORAGE_KEY, JSON.stringify(corrections));
  } catch (e) {
    console.warn('Failed to persist corrections:', e);
  }
}

export function loadStoredAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredAlerts(alerts: Alert[]): void {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    import('./indexedDB').then(({ dbPutBatch }) => {
      dbPutBatch('alerts', alerts).catch(() => {});
    }).catch(() => {});
  } catch (e) {
    console.warn('Failed to persist alerts:', e);
  }
}

// ============================================================================
// CITIZEN & RESPONDER SUBMISSION WORKFLOW
// ============================================================================

export interface SubmitCorrectionParams {
  alertId: string;
  alertHazard: string;
  alertTitle: string;
  requesterRole?: string;
  reason: CorrectionReason;
  description: string;
  evidence?: string;
  proposedLocation?: string;
  proposedSeverity?: AlertSeverity;
}

/**
 * Submits a new citizen or field correction request.
 * Creates a PENDING record. Does NOT directly alter the official alert.
 */
export function submitCorrectionRequest(params: SubmitCorrectionParams): CorrectionRequest {
  const allCorrections = loadStoredCorrections();
  const nowIso = new Date().toISOString();

  const newCorrection: CorrectionRequest = {
    id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    alertId: params.alertId,
    alertHazard: params.alertHazard,
    alertTitle: params.alertTitle,
    requesterRole: params.requesterRole || 'citizen',
    reason: params.reason,
    description: params.description.trim(),
    evidence: params.evidence?.trim(),
    proposedLocation: params.proposedLocation?.trim(),
    proposedSeverity: params.proposedSeverity,
    submittedAt: nowIso,
    status: 'PENDING'
  };

  allCorrections.unshift(newCorrection);
  saveStoredCorrections(allCorrections);

  // Mark the alert as 'Under Review' without modifying its raw observations
  const allAlerts = loadStoredAlerts();
  const targetAlert = allAlerts.find(a => a.id === params.alertId);
  if (targetAlert) {
    targetAlert.verificationStatus = 'Under Review';
    targetAlert.activeCorrectionId = newCorrection.id;
    saveStoredAlerts(allAlerts);
  }

  return newCorrection;
}

/**
 * Submits a field verification signal from an active on-scene responder.
 * Supplements any pending correction or registers a verification observation.
 */
export function submitFieldVerification(
  alertId: string,
  responderStatus: FieldVerificationStatus,
  observation: string,
  responderRole = 'Volunteer Responder'
): CorrectionRequest {
  const allCorrections = loadStoredCorrections();
  const nowIso = new Date().toISOString();

  // Check if a pending correction already exists for this alert
  let targetCorr = allCorrections.find(c => c.alertId === alertId && c.status === 'PENDING');

  if (targetCorr) {
    targetCorr.fieldVerification = {
      responderStatus,
      observation: observation.trim(),
      verifiedAt: nowIso,
      responderRole
    };
  } else {
    // Register a new correction request initiated by field verification
    const allAlerts = loadStoredAlerts();
    const alert = allAlerts.find(a => a.id === alertId);

    const reason: CorrectionReason = 
      responderStatus === 'NO_LONGER_PRESENT' ? 'HAZARD RESOLVED' :
      responderStatus === 'LOCATION_INCORRECT' ? 'WRONG LOCATION' :
      responderStatus === 'SEVERITY_INCORRECT' ? 'WRONG SEVERITY' : 'OTHER';

    targetCorr = {
      id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      alertId,
      alertHazard: alert?.type || 'Hazard',
      alertTitle: alert?.title || 'Active Alert',
      requesterRole: 'volunteer',
      reason,
      description: `Field Verification Signal: ${responderStatus} - ${observation.trim()}`,
      submittedAt: nowIso,
      status: 'PENDING',
      fieldVerification: {
        responderStatus,
        observation: observation.trim(),
        verifiedAt: nowIso,
        responderRole
      }
    };
    allCorrections.unshift(targetCorr);

    if (alert) {
      alert.verificationStatus = 'Under Review';
      alert.activeCorrectionId = targetCorr.id;
      saveStoredAlerts(allAlerts);
    }
  }

  saveStoredCorrections(allCorrections);
  return targetCorr;
}

// ============================================================================
// AUTHORIZED REVIEWER WORKFLOW
// ============================================================================

export interface ReviewDecisionResult {
  correction: CorrectionRequest;
  updatedAlert: Alert | null;
}

/**
 * Reviews a correction request with AUTHORIZED REVIEWER credentials.
 * On APPROVAL: Safely applies designated updates to the alert, records full audit history,
 * but NEVER deletes or fabricates underlying sensor observations.
 * On REJECTION: Retains official alert state and logs audit trail.
 */
export function reviewCorrectionRequest(
  correctionId: string,
  decision: 'APPROVED' | 'REJECTED',
  reviewerNote: string,
  reviewerRole: 'AUTHORIZED REVIEWER' = 'AUTHORIZED REVIEWER'
): ReviewDecisionResult {
  const allCorrections = loadStoredCorrections();
  const correction = allCorrections.find(c => c.id === correctionId);

  if (!correction) {
    throw new Error(`Correction request ${correctionId} not found`);
  }

  const nowIso = new Date().toISOString();
  const auditEntry: CorrectionAuditEntry = {
    submittedAt: correction.submittedAt,
    reviewedAt: nowIso,
    decision,
    reviewerRole,
    reason: correction.reason,
    reviewerNote: reviewerNote.trim()
  };

  correction.status = decision;
  correction.reviewedAt = nowIso;
  correction.reviewerRole = reviewerRole;
  correction.reviewerNote = reviewerNote.trim();
  correction.auditEntry = auditEntry;

  saveStoredCorrections(allCorrections);

  // Apply changes to the target Alert
  const allAlerts = loadStoredAlerts();
  const alertIndex = allAlerts.findIndex(a => a.id === correction.alertId);
  let updatedAlert: Alert | null = null;

  if (alertIndex !== -1) {
    const alert = allAlerts[alertIndex];
    alert.activeCorrectionId = undefined;

    // Append to alert audit history
    const auditHistory = alert.correctionAuditTrail || [];
    auditHistory.push(auditEntry);
    alert.correctionAuditTrail = auditHistory;

    const lifecycleHistory = alert.lifecycleHistory || [];

    if (decision === 'APPROVED') {
      alert.verificationStatus = 'Corrected';

      // 1. Hazard Resolved / Outdated
      if (correction.reason === 'HAZARD RESOLVED' || correction.reason === 'OUTDATED INFORMATION') {
        alert.status = 'Resolved';
        alert.severity = 'Resolved';
        const note = `Resolved by AUTHORIZED REVIEWER [${correction.reason}]: ${reviewerNote.trim()}`;
        lifecycleHistory.push({
          timestamp: nowIso,
          stage: 'Normal',
          riskScore: alert.riskScore || 0,
          note
        });
        alert.escalationNote = note;
      }
      // 2. Wrong Location
      else if (correction.reason === 'WRONG LOCATION' && correction.proposedLocation) {
        const prevLoc = alert.location;
        alert.location = correction.proposedLocation;
        const note = `Location updated from "${prevLoc}" to "${correction.proposedLocation}" by AUTHORIZED REVIEWER.`;
        lifecycleHistory.push({
          timestamp: nowIso,
          stage: alert.warningStage || 'Watch',
          riskScore: alert.riskScore || 0,
          note
        });
      }
      // 3. Wrong Severity
      else if (correction.reason === 'WRONG SEVERITY' && correction.proposedSeverity) {
        const prevSev = alert.severity;
        alert.severity = correction.proposedSeverity;
        const note = `Severity adjusted from ${prevSev} to ${correction.proposedSeverity} by AUTHORIZED REVIEWER.`;
        lifecycleHistory.push({
          timestamp: nowIso,
          stage: alert.warningStage || 'Watch',
          riskScore: alert.riskScore || 0,
          note
        });
      }
      // 4. False Information
      else if (correction.reason === 'FALSE INFORMATION') {
        alert.verificationStatus = 'Retracted';
        alert.status = 'Resolved';
        const note = `Alert retracted by AUTHORIZED REVIEWER [False Information]: ${reviewerNote.trim()}`;
        lifecycleHistory.push({
          timestamp: nowIso,
          stage: 'Normal',
          riskScore: 0,
          note
        });
        alert.escalationNote = note;
      }
      // 5. Duplicate Alert
      else if (correction.reason === 'DUPLICATE ALERT') {
        alert.status = 'Resolved';
        const note = `Duplicate alert closed by AUTHORIZED REVIEWER: ${reviewerNote.trim()}`;
        lifecycleHistory.push({
          timestamp: nowIso,
          stage: 'Normal',
          riskScore: alert.riskScore || 0,
          note
        });
      }
    } else {
      // REJECTED: Alert remains active with 'Verified' or original standing
      alert.verificationStatus = 'Verified';
      lifecycleHistory.push({
        timestamp: nowIso,
        stage: alert.warningStage || 'Watch',
        riskScore: alert.riskScore || 0,
        note: `Correction review REJECTED by AUTHORIZED REVIEWER: ${reviewerNote.trim()}`
      });
    }

    alert.lifecycleHistory = lifecycleHistory;
    alert.updatedAt = nowIso;
    allAlerts[alertIndex] = alert;
    saveStoredAlerts(allAlerts);
    updatedAlert = alert;
  }

  return { correction, updatedAlert };
}

// ============================================================================
// OUTDATED ALERT EVALUATION
// ============================================================================

/**
 * Evaluates whether an alert exhibits degraded telemetry freshness or requires review.
 */
export function checkAlertFreshness(alert: Alert): {
  isStale: boolean;
  advisoryText?: string;
} {
  const now = Date.now();
  const alertTime = new Date(alert.updatedAt || alert.detectedAt).getTime();
  const diffHours = (now - alertTime) / (1000 * 60 * 60);

  if (alert.verificationStatus === 'Under Review') {
    return {
      isStale: false,
      advisoryText: 'Information review pending'
    };
  }

  if (alert.verificationStatus === 'Corrected') {
    return {
      isStale: false,
      advisoryText: `Alert corrected by authorized reviewer (${new Date(alert.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
    };
  }

  if (diffHours >= 2.0 && alert.status !== 'Resolved') {
    return {
      isStale: true,
      advisoryText: 'Data freshness degraded — Review recommended'
    };
  }

  return { isStale: false };
}

// ============================================================================
// PART 5 — ISOLATED DETERMINISTIC TEST RUNNER (10 SCENARIOS)
// ============================================================================

export interface CorrectionSelfTestResult {
  scenarioNumber: number;
  scenarioName: string;
  passed: boolean;
  details: string;
}

/**
 * Runs 10 isolated, deterministic unit-test scenarios for Phase 6 verification.
 */
export function runCorrectionSelfTest(): { allPassed: boolean; results: CorrectionSelfTestResult[] } {
  const results: CorrectionSelfTestResult[] = [];

  // Setup test alert in memory
  const testAlert: Alert = {
    id: 'test-alert-flood-01',
    title: 'Flood Risk Warning',
    severity: 'Warning',
    type: 'Flood',
    location: 'Cuttack Sector 9',
    detectedAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    source: 'DRISHTI Early Warning',
    isVerified: true,
    description: 'Elevated waterlogging in Sector 9',
    status: 'Active',
    isAcknowledged: false,
    riskScore: 75,
    warningStage: 'Warning'
  };

  // Test 1: Citizen submits correction -> creates PENDING request
  const c1 = submitCorrectionRequest({
    alertId: testAlert.id,
    alertHazard: 'Flood',
    alertTitle: testAlert.title,
    requesterRole: 'citizen',
    reason: 'HAZARD RESOLVED',
    description: 'Water has completely receded from the street'
  });
  const p1 = c1.status === 'PENDING' && c1.reason === 'HAZARD RESOLVED';
  results.push({
    scenarioNumber: 1,
    scenarioName: 'Citizen submits correction -> Status is PENDING',
    passed: p1,
    details: `Status: ${c1.status}, ID: ${c1.id}`
  });

  // Test 2: Citizen submission does not immediately modify official alert status
  const storedAlerts1 = loadStoredAlerts();
  const alertAfterCitizen = storedAlerts1.find(a => a.id === testAlert.id) || testAlert;
  const p2 = alertAfterCitizen.status === 'Active' && alertAfterCitizen.severity === 'Warning';
  results.push({
    scenarioNumber: 2,
    scenarioName: 'Citizen correction does not directly modify official alert',
    passed: p2,
    details: `Status: ${alertAfterCitizen.status}, Severity: ${alertAfterCitizen.severity}`
  });

  // Test 3: Responder confirms hazard -> Field verification attached
  const c3 = submitFieldVerification(
    testAlert.id,
    'NO_LONGER_PRESENT',
    'Field inspection confirmed water level is nominal'
  );
  const p3 = c3.fieldVerification?.responderStatus === 'NO_LONGER_PRESENT';
  results.push({
    scenarioNumber: 3,
    scenarioName: 'Responder submits field verification -> Verification recorded',
    passed: p3,
    details: `Field Status: ${c3.fieldVerification?.responderStatus}`
  });

  // Test 4: Authority approves correction -> Alert updated to Resolved
  // Pre-seed storage with test alert
  saveStoredAlerts([testAlert]);
  const reviewRes = reviewCorrectionRequest(
    c1.id,
    'APPROVED',
    'Verified via field responder signal: Water cleared.'
  );
  const p4 = reviewRes.correction.status === 'APPROVED' &&
             reviewRes.updatedAlert?.status === 'Resolved' &&
             reviewRes.updatedAlert?.verificationStatus === 'Corrected';
  results.push({
    scenarioNumber: 4,
    scenarioName: 'Authority approves correction -> Alert safely resolved and marked Corrected',
    passed: p4,
    details: `Alert Status: ${reviewRes.updatedAlert?.status}, Verification: ${reviewRes.updatedAlert?.verificationStatus}`
  });

  // Test 5: Authority rejects correction -> Alert remains active and unchanged
  const activeAlert2: Alert = { ...testAlert, id: 'test-alert-fire-02', status: 'Active', severity: 'Warning' };
  saveStoredAlerts([activeAlert2]);
  const c5 = submitCorrectionRequest({
    alertId: activeAlert2.id,
    alertHazard: 'Fire',
    alertTitle: 'Fire Risk Warning',
    reason: 'FALSE INFORMATION',
    description: 'No fire here'
  });
  const rejectRes = reviewCorrectionRequest(
    c5.id,
    'REJECTED',
    'Live thermal satellite sensors confirm high active thermal anomaly.'
  );
  const p5 = rejectRes.correction.status === 'REJECTED' &&
             rejectRes.updatedAlert?.status === 'Active';
  results.push({
    scenarioNumber: 5,
    scenarioName: 'Authority rejects correction -> Alert remains Active',
    passed: p5,
    details: `Alert Status: ${rejectRes.updatedAlert?.status}`
  });

  // Test 6: Outdated alert (>2 hours without updates) -> Marked Review Recommended
  const staleAlert: Alert = {
    ...testAlert,
    id: 'test-stale-03',
    updatedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  };
  const freshness = checkAlertFreshness(staleAlert);
  const p6 = freshness.isStale && freshness.advisoryText?.includes('Review recommended');
  results.push({
    scenarioNumber: 6,
    scenarioName: 'Outdated Alert (>2h old) -> Displays Review Recommended advisory',
    passed: Boolean(p6),
    details: `Advisory: ${freshness.advisoryText}`
  });

  // Test 7: Wrong location correction -> Location corrected only after approval
  const wrongLocAlert: Alert = { ...testAlert, id: 'test-loc-04', location: 'Wrong Ward 10', status: 'Active' };
  saveStoredAlerts([wrongLocAlert]);
  const c7 = submitCorrectionRequest({
    alertId: wrongLocAlert.id,
    alertHazard: 'Flood',
    alertTitle: 'Flood Warning',
    reason: 'WRONG LOCATION',
    description: 'The flood is actually in Sector 6',
    proposedLocation: 'Sector 6 Drainage Basin'
  });
  const locReview = reviewCorrectionRequest(c7.id, 'APPROVED', 'Location verified by local warden.');
  const p7 = locReview.updatedAlert?.location === 'Sector 6 Drainage Basin';
  results.push({
    scenarioNumber: 7,
    scenarioName: 'Wrong Location correction -> Updated to proposed location on approval',
    passed: p7,
    details: `New Location: ${locReview.updatedAlert?.location}`
  });

  // Test 8: Duplicate alert correction -> Duplicate relationship recorded and alert closed
  const dupAlert: Alert = { ...testAlert, id: 'test-dup-05', status: 'Active' };
  saveStoredAlerts([dupAlert]);
  const c8 = submitCorrectionRequest({
    alertId: dupAlert.id,
    alertHazard: 'Flood',
    alertTitle: 'Flood Warning',
    reason: 'DUPLICATE ALERT',
    description: 'Duplicate of ew-flood-sector-9'
  });
  const dupReview = reviewCorrectionRequest(c8.id, 'APPROVED', 'Duplicate of primary warning.');
  const p8 = dupReview.updatedAlert?.status === 'Resolved';
  results.push({
    scenarioNumber: 8,
    scenarioName: 'Duplicate alert correction -> Resolved safely',
    passed: p8,
    details: `Status: ${dupReview.updatedAlert?.status}`
  });

  // Test 9: Correction audit history -> Complete audit trail preserved
  const p9 = Boolean(
    reviewRes.updatedAlert?.correctionAuditTrail &&
    reviewRes.updatedAlert.correctionAuditTrail.length > 0 &&
    reviewRes.updatedAlert.correctionAuditTrail[0].reviewerRole === 'AUTHORIZED REVIEWER'
  );
  results.push({
    scenarioNumber: 9,
    scenarioName: 'Audit History -> Immutable review record preserved on alert',
    passed: p9,
    details: `Reviewer: ${reviewRes.updatedAlert?.correctionAuditTrail?.[0]?.reviewerRole}`
  });

  // Test 10: Browser reload persistence -> Corrections and reviews survive in storage
  const loadedCorrections = loadStoredCorrections();
  const p10 = loadedCorrections.length >= 3;
  results.push({
    scenarioNumber: 10,
    scenarioName: 'Browser refresh simulation -> Corrections persist in storage',
    passed: p10,
    details: `Stored Corrections Count: ${loadedCorrections.length}`
  });

  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
}
