export type AlertSeverity = 'Critical' | 'Warning' | 'Advisory' | 'Resolved';
export type AlertType = 'Flood' | 'Cyclone' | 'Earthquake' | 'Landslide' | 'Fire' | 'Extreme Weather' | 'Other';

export interface Alert {
  id: string;
  title: string;
  severity: AlertSeverity;
  type: AlertType;
  location: string;
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
}
