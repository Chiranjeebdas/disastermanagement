import type { AlertType } from './alert';

/**
 * Categorical Risk Classification
 * 0-29: Low | 30-49: Moderate | 50-69: High | 70-84: Severe | 85-100: Extreme
 */
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe' | 'Extreme';

/**
 * Standard Multi-Tier Early Warning Stages (aligned with international disaster protocols)
 * Normal (Routine) -> Advisory (Awareness) -> Watch (Readiness) -> Warning (Action) -> Emergency (Life Safety)
 */
export type WarningStage = 'Normal' | 'Advisory' | 'Watch' | 'Warning' | 'Emergency';

/**
 * Reuses the existing DRISHTI AlertType to prevent conflicting duplicate hazard models
 */
export type HazardType = AlertType;

/**
 * Target audiences for tailored emergency actions
 */
export type Audience = 'Citizen' | 'Responder' | 'Authority';

/**
 * Key trigger contributing to a hazard risk calculation
 */
export interface PrimaryTrigger {
  parameter: string;
  observedValue: string | number;
  threshold: string | number;
  contribution: number; // percentage or weighted score point contribution (0-100)
}

/**
 * Provenance classification for evidence honesty & verification
 */
export type EvidenceProvenance =
  | 'DIRECT OBSERVATION'
  | 'DERIVED ASSESSMENT'
  | 'ESTIMATED'
  | 'VERIFIED COMMUNITY REPORT'
  | 'UNAVAILABLE';

/**
 * Evidence item from sensor mesh, satellite, USGS, community reports, or terrain database
 */
export interface EvidenceSource {
  sourceType: 
    | 'Telemetry' 
    | 'USGS_Seismic' 
    | 'Open_Meteo' 
    | 'NASA_FIRMS' 
    | 'GloFAS_Hydrology' 
    | 'CWC_River_Gauge' 
    | 'Community_Report' 
    | 'Historical_Terrain' 
    | 'Official_Bulletin';
  sourceName: string;
  description: string;
  reliability: number; // 0 to 100 (engineering configuration weight)
  timestamp: string;
  provenance?: EvidenceProvenance;
}

/**
 * Action guidance tailored by audience and warning stage
 */
export interface RecommendedAction {
  audience: Audience;
  action: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

/**
 * Complete Early Warning & Risk Intelligence Assessment for a geographic location & hazard
 */
export interface HazardRiskAssessment {
  id: string;
  hazardType: HazardType;
  riskScore: number; // 0 to 100
  confidence: number; // 0 to 100
  riskLevel: RiskLevel;
  warningStage: WarningStage;
  timestamp: string;
  location: string;
  centerCoordinates: [number, number];
  impactRadiusKm: number;
  leadTimeMinutes?: number; // Estimated time before critical impact
  primaryTriggers: PrimaryTrigger[];
  evidenceSources: EvidenceSource[];
  recommendedActions: RecommendedAction[];
  affectedPopulation?: string;
  status: 'Active' | 'Monitoring' | 'Resolved';
  summary?: string;
}

/**
 * Environmental and community telemetry inputs for Flood Risk calculation
 */
export interface FloodRiskInput {
  location: string;
  centerCoordinates: [number, number];
  precipitationRateMmPerHour: number;
  precipitationAccumulation24hMm?: number;
  forecastPrecipitationAccumulation24hMm?: number;
  surfacePressureHpa?: number;
  humidityPercent?: number;
  riverDischargeM3s?: number;
  riverDischargeMaxM3s?: number;
  riverDischargePercentile?: number;
  rateOfRiseM3sPerDay?: number;
  waterLevelMeters?: number; // Optional river or canal gauge reading
  floodStageThresholdMeters?: number; // Optional reference threshold
  rateOfRiseCmPerHour?: number; // Optional hydrological rate of rise
  isRiverGaugeAvailable?: boolean;
  verifiedWaterloggingReportsCount?: number;
  isFloodPlain?: boolean;
  isUrbanLowLying?: boolean;
  timestamp?: string;
}

/**
 * Environmental telemetry inputs for Wildfire / Urban Fire Risk calculation
 */
export interface FireRiskInput {
  location: string;
  centerCoordinates: [number, number];
  temperatureCelsius: number;
  relativeHumidityPercent: number;
  windSpeedKmH: number;
  consecutiveDryDays?: number;
  recentPrecipitationMm?: number;
  firmsDetectionsCount?: number;
  firmsNearestDistanceKm?: number;
  firmsMaxFrpMw?: number;
  isSatelliteFireDetected?: boolean;
  verifiedFireReportsCount?: number;
  isVegetationDense?: boolean;
  timestamp?: string;
}

/**
 * USGS & Accelerometer telemetry inputs for Seismic Hazard calculation
 */
export interface EarthquakeRiskInput {
  location: string;
  centerCoordinates: [number, number];
  magnitude: number;
  depthKm: number;
  eventCoordinates: [number, number];
  userCoordinates?: [number, number];
  epicentralDistanceKm?: number;
  hypocentralDistanceKm?: number;
  estimatedPgaG?: number;
  attenuationSummary?: string;
  isLocalShakingPerceptible?: boolean;
  mmiIntensity?: number;
  feltReportsCount?: number;
  alertLevel?: string;
  eventTimestamp: string;
  placeDescription?: string;
}

/**
 * Cyclone / Gale Storm telemetry inputs for Cyclone Early Warning calculation
 */
export interface CycloneRiskInput {
  location: string;
  centerCoordinates: [number, number];
  windSpeedKmH: number;
  windGustsKmH?: number;
  surfacePressureHpa?: number;
  pressureMslHpa?: number;
  capeJkg?: number;
  isCoastalRegion?: boolean;
  stormCenterCoordinates?: [number, number];
  estimatedTrackDistanceKm?: number;
  timestamp?: string;
}
