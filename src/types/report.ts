export type ReportType = 
  | 'Flood'
  | 'Cyclone'
  | 'Fire'
  | 'Landslide'
  | 'HeavyRain'
  | 'Earthquake'
  | 'ExtremeHeat'
  | 'InfrastructureDamage'
  | 'RoadBlockage'
  | 'Other';

export type ReportUrgency = 'Low' | 'Medium' | 'Critical';

export type ReportStatus = 'Draft' | 'PendingSync' | 'Submitted' | 'UnderReview' | 'Verified' | 'Resolved' | 'Avoid';

export type ResponseStatus = 'Unassigned' | 'ResponderAssigned' | 'EnRoute' | 'OnScene' | 'AssistanceProvided' | 'Resolved';

export type VerificationStatus = 'Unverified' | 'UnderReview' | 'Verified' | 'Rejected';

export type AIConfidenceLevel = 'High' | 'Medium' | 'Low';

export type AIVerdict = 'Genuine' | 'Needs Review' | 'Avoid';

export type ReportPlatform = 
  | 'DRISHTI Web App' 
  | 'Twitter / X' 
  | 'Telegram Alert' 
  | 'Reddit Emergency' 
  | 'GDACS Global Alert' 
  | 'News Wire' 
  | 'ReliefWeb';

export interface ReportSourceInfo {
  platform: ReportPlatform;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  sourceUrl?: string;
  verifiedUser?: boolean;
  engagementStats?: {
    shares?: number;
    corroborations?: number;
  };
}

export interface AIReportAnalysis {
  verdict: AIVerdict;
  confidenceScore: number; // 0 to 100
  confidenceLevel: AIConfidenceLevel;
  reasoning: string[];
  crossReferenceTelemetry?: string;
  sensorCorrelation?: string;
  satelliteValidation?: string;
  crowdConsensus?: string;
  computerVisionAudit?: string;
  reviewedAt: string;
}

export interface IncidentReport {
  id: string;
  type: ReportType;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  description: string;
  mediaBase64: string | null;
  urgency: ReportUrgency;
  peopleAffected: string;
  tags: string[];
  status: ReportStatus;
  verificationStatus: VerificationStatus;
  responseStatus?: ResponseStatus;
  assignedResponder?: string;
  timestamp: string;
  sourceInfo?: ReportSourceInfo;
  aiAnalysis?: AIReportAnalysis;
}
