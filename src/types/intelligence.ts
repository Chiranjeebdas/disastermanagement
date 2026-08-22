export type IntelligenceSourceType = 'Official' | 'Weather' | 'News' | 'Community' | 'System';
export type IntelligenceSeverity = 'Critical' | 'Warning' | 'Advisory' | 'Normal';

export interface IntelligenceMetadata {
  label: string;
  value: string;
}

export interface IntelligenceItem {
  id: string;
  title: string;
  summary: string;
  fullDescription: string;
  sourceType: IntelligenceSourceType;
  sourceName: string;
  severity: IntelligenceSeverity;
  location: string;
  coordinates?: [number, number];
  timestamp: string;
  isVerified: boolean;
  status: 'Active' | 'Monitoring' | 'Resolved' | 'Unverified';
  metadata?: IntelligenceMetadata[];
  relatedAlertIds?: string[];
}
