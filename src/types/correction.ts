/**
 * DRISHTI Authorized Information Correction & Verification Model
 * Supports civil correction submissions, field responder ground truth,
 * and authorized reviewer governance without tampering with raw sensor proof.
 */

import type { AlertSeverity } from './alert';
import type { UserRole } from '../hooks/useSettings';

export type CorrectionReason =
  | 'FALSE INFORMATION'
  | 'OUTDATED INFORMATION'
  | 'WRONG LOCATION'
  | 'WRONG SEVERITY'
  | 'DUPLICATE ALERT'
  | 'HAZARD RESOLVED'
  | 'OTHER';

export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type FieldVerificationStatus = 
  | 'CONFIRMED'
  | 'NO_LONGER_PRESENT'
  | 'LOCATION_INCORRECT'
  | 'SEVERITY_INCORRECT';

export interface FieldVerification {
  responderStatus: FieldVerificationStatus;
  observation: string;
  verifiedAt: string; // ISO string
  responderRole: string;
}

export interface CorrectionAuditEntry {
  submittedAt: string;
  reviewedAt: string;
  decision: 'APPROVED' | 'REJECTED';
  reviewerRole: 'AUTHORIZED REVIEWER';
  reason: CorrectionReason;
  reviewerNote: string;
}

export interface CorrectionRequest {
  id: string;
  alertId: string;
  alertHazard: string;
  alertTitle: string;
  requesterRole: UserRole | string;
  reason: CorrectionReason;
  description: string;
  evidence?: string;
  proposedLocation?: string;
  proposedSeverity?: AlertSeverity;
  submittedAt: string; // ISO string
  status: CorrectionStatus;
  fieldVerification?: FieldVerification;
  reviewedAt?: string; // ISO string
  reviewerRole?: 'AUTHORIZED REVIEWER';
  reviewerNote?: string;
  auditEntry?: CorrectionAuditEntry;
}
