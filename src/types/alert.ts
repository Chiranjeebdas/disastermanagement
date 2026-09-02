export type AlertSeverity = 'Critical' | 'Warning' | 'Advisory' | 'Resolved';
export type AlertType = 'Flood' | 'Cyclone' | 'Earthquake' | 'Landslide' | 'Fire' | 'Extreme Weather' | 'Other';

export interface AlertLifecycleEvent {
  timestamp: string;
  stage: string;
  riskScore: number;
  note: string;
}

export interface Alert {
  id: string;
  title: string;
  severity: AlertSeverity;
  type: AlertType;
  location: string;
  latitude?: number;
  longitude?: number;
  detectedAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  source: string;
  isVerified: boolean;
  description: string;
  status: 'Active' | 'Monitoring' | 'Resolved';
  measurements?: { label: string; value: string }[];
  affectedRadiusKm?: number;
  recommendedAction?: string;
  isAcknowledged: boolean;
  // Early Warning & Risk Intelligence Extensions
  riskScore?: number;
  confidence?: number;
  warningStage?: 'Normal' | 'Advisory' | 'Watch' | 'Warning' | 'Emergency';
  roleActions?: {
    citizen?: string[];
    responder?: string[];
    authority?: string[];
  };
  evidenceSources?: {
    sourceType: string;
    sourceName: string;
    description: string;
    reliability: number;
    provenance?: string;
  }[];
  lifecycleHistory?: AlertLifecycleEvent[];
  escalationNote?: string;
  // Phase 6 Authorized Information Correction & Verification
  verificationStatus?: 'Verified' | 'Under Review' | 'Corrected' | 'Retracted';
  activeCorrectionId?: string;
  correctionAuditTrail?: {
    submittedAt: string;
    reviewedAt: string;
    decision: 'APPROVED' | 'REJECTED';
    reviewerRole: 'AUTHORIZED REVIEWER';
    reason: string;
    reviewerNote: string;
  }[];
  dataFreshnessAdvisory?: 'Fresh' | 'Review Recommended' | 'Degraded';
}

