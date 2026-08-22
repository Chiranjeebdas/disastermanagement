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

export type ReportStatus = 'Draft' | 'PendingSync' | 'Submitted' | 'UnderReview' | 'Verified' | 'Resolved';

export type ResponseStatus = 'Unassigned' | 'ResponderAssigned' | 'EnRoute' | 'OnScene' | 'AssistanceProvided' | 'Resolved';

export type VerificationStatus = 'Unverified' | 'UnderReview' | 'Verified' | 'Rejected';

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
}
