/**
 * DRISHTI Multi-Hazard Real-Time Telemetry Data Models
 * Supports Open-Meteo, USGS Seismology, NASA FIRMS Thermal Sensing,
 * GloFAS Hydrology, and OpenStreetMap Infrastructure.
 */

export type TelemetrySource = 
  | 'OPEN_METEO'
  | 'USGS_SEISMIC'
  | 'NASA_FIRMS'
  | 'GLOFAS_HYDROLOGY'
  | 'CWC_RIVER_GAUGE'
  | 'OSM_OVERPASS'
  | 'DRISHTI_COMMUNITY_MESH';

export type TelemetryFreshness = 
  | 'LIVE'       // < 15-30m depending on source
  | 'RECENT'     // < 1-2h
  | 'AGING'      // < 6-12h
  | 'STALE'      // > 12h or cached
  | 'UNAVAILABLE'; // Sensor unreachable or not present for coordinates

export type TelemetryProvenance =
  | 'DIRECT OBSERVATION'
  | 'DERIVED ASSESSMENT'
  | 'ESTIMATED'
  | 'VERIFIED COMMUNITY REPORT'
  | 'UNAVAILABLE';

export interface TelemetryReading<T = number | string | boolean> {
  parameter: string;
  value: T;
  unit: string;
  source: TelemetrySource;
  observedAt: string; // ISO string
  receivedAt: string; // ISO string
  coordinates?: [number, number];
  freshness: TelemetryFreshness;
  provenance: TelemetryProvenance;
  reliability: number; // 0-100 configuration weight
  description?: string;
}

export interface LiveWeatherTelemetry {
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  relativeHumidityPercent: number;
  windSpeedKmH: number;
  windDirectionDegrees: number;
  windGustsKmH?: number;
  precipitationRateMmPerHour: number;
  precipitationAccumulation24hMm?: number; // Calculated from real past 24 hourly observations
  forecastPrecipitationAccumulation24hMm?: number; // Calculated from real 24 hourly forecast
  precipitationProbabilityPercent?: number;
  surfacePressureHpa?: number;
  pressureMslHpa?: number;
  cloudCoverPercent?: number;
  visibilityMeters?: number;
  weatherCode: number;
  capeJkg?: number;
  isDay: boolean;
  observedTimestamp: string;
  freshness: TelemetryFreshness;
  coordinates: [number, number];
}

export interface LiveSeismicEvent {
  id: string;
  magnitude: number;
  depthKm: number;
  eventTime: string;
  updatedTime: string;
  place: string;
  coordinates: [number, number]; // [lat, lon]
  epicentralDistanceKm: number;
  hypocentralDistanceKm: number;
  estimatedPgaG: number; // Joyner-Boore / Campbell attenuation Peak Ground Acceleration
  isLocalShakingPerceptible: boolean;
  attenuationSummary: string;
  mmiIntensity?: number;
  feltReports?: number;
  alertLevel?: 'green' | 'yellow' | 'orange' | 'red';
  significance?: number;
  freshness: TelemetryFreshness;
}

export interface LiveSeismicTelemetry {
  events: LiveSeismicEvent[];
  nearestEvent: LiveSeismicEvent | null;
  observedTimestamp: string;
  freshness: TelemetryFreshness;
  isRegionalAnomalyDetected: boolean;
}

export interface LiveFirmsDetection {
  latitude: number;
  longitude: number;
  distanceKm: number;
  acquisitionDate: string;
  acquisitionTime: string;
  satellite: string;
  sensor: string;
  confidence: string | number; // 'nominal' | 'low' | 'high' or percentage
  brightnessKelvin?: number;
  frpMw?: number; // Fire Radiative Power in Megawatts
  dayNight: 'D' | 'N';
}

export interface LiveFireTelemetry {
  activeDetections: LiveFirmsDetection[];
  detectionsWithin5km: number;
  detectionsWithin10km: number;
  detectionsWithin25km: number;
  nearestFireDistanceKm?: number;
  maxFrpMw?: number;
  sourceType: 'NASA_FIRMS_VIIRS' | 'NASA_FIRMS_MODIS' | 'OPEN_FIRE_DANGER_INDEX';
  observedTimestamp: string;
  freshness: TelemetryFreshness;
  isSatelliteFireDetected: boolean;
  summary: string;
}

export interface LiveHydrologyTelemetry {
  isStationAvailable: boolean;
  stationName?: string;
  distanceToStationKm?: number;
  riverDischargeM3s?: number; // Real ECMWF GloFAS streamflow discharge
  riverDischargeMeanM3s?: number;
  riverDischargeMedianM3s?: number;
  riverDischargeMaxM3s?: number; // Flood threshold percentile
  riverDischargePercentile?: number;
  rateOfRiseM3sPerDay?: number;
  waterLevelMeters?: number; // CWC / Station gauge height if available
  dangerLevelMeters?: number;
  rateOfRiseCmPerHour?: number;
  observedTimestamp: string;
  freshness: TelemetryFreshness;
  summary: string;
}

export interface LiveInfrastructureTelemetry {
  hospitalsCount: number;
  policeCount: number;
  fireStationsCount: number;
  sheltersCount: number;
  totalFacilitiesCount: number;
  cacheTimestamp: string;
  source: 'OpenStreetMap Overpass Geospatial Database (Cached)';
  freshness: TelemetryFreshness;
}

export interface UnifiedTelemetrySnapshot {
  weather: LiveWeatherTelemetry | null;
  seismic: LiveSeismicTelemetry;
  fire: LiveFireTelemetry;
  hydrology: LiveHydrologyTelemetry;
  infrastructure: LiveInfrastructureTelemetry | null;
  observedCoordinates: [number, number];
  locationName: string;
  overallFreshness: TelemetryFreshness;
  lastUpdated: string;
}
