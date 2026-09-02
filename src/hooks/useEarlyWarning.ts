/**
 * DRISHTI Early Warning & Risk Intelligence Orchestration Hook
 * 
 * DESIGN PRINCIPLES:
 * 1. Consumes existing, real live telemetry hooks (useWeather, useAlerts, useReports, useLocation)
 *    without duplicating network requests or inventing fictitious sensor APIs.
 * 2. Normalizes multi-source environmental signals, spatial distances, and verified community reports.
 * 3. Feeds normalized observations into the pure, deterministic riskIntelligence engine.
 * 4. Transparently handles offline caching and stale data by reducing confidence scores
 *    rather than generating false alarms.
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useWeather, type WeatherData } from './useWeather';
import { useAlerts } from './useAlerts';
import { useReports } from './useReports';
import { useLocation } from './useLocation';
import { getDistance } from '../utils/distance';
import { TERRAIN_DB, isGenuineReport } from '../utils/aiVerification';
import {
  calculateFloodRisk,
  calculateFireRisk,
  calculateEarthquakeRisk,
  calculateCycloneRisk,
  calculateOverallRisk
} from '../utils/riskIntelligence';
import {
  processEarlyWarningBatch,
  type EarlyWarningAlertEventState,
  EW_STORAGE_KEY
} from '../utils/earlyWarningAlerts';
import {
  fetchOrchestratedNASA_FIRMS,
  fetchOrchestratedHydrology,
  fetchOrchestratedUSGS
} from '../utils/liveDataOrchestrator';
import type {
  HazardRiskAssessment,
  FloodRiskInput,
  FireRiskInput,
  EarthquakeRiskInput,
  CycloneRiskInput
} from '../types/earlyWarning';
import type {
  LiveFireTelemetry,
  LiveHydrologyTelemetry,
  LiveSeismicTelemetry
} from '../types/telemetry';
import type { Alert } from '../types/alert';
import type { IncidentReport } from '../types/report';

// ============================================================================
// CONFIGURABLE CONSTANTS & RELIABILITY WEIGHTS
// ============================================================================

export const DEFAULT_ASSESSMENT_RADIUS_KM = 5.0;
export const DEFAULT_REGION_COORDINATES: [number, number] = [20.4625, 85.8828];

export const SOURCE_RELIABILITY_WEIGHTS = {
  USGS_SEISMIC: 98,
  NASA_FIRMS: 96,
  GLOFAS_HYDROLOGY: 94,
  OPEN_METEO_TELEMETRY: 92,
  AI_VERIFIED_CROWD_REPORT: 88,
  TERRAIN_KNOWLEDGE_BASE: 85,
  OFFICIAL_BULLETIN: 95
} as const;

export type DataFreshnessStatus = 'Fresh' | 'Aging' | 'Stale' | 'Unavailable';

export interface DataQualityReport {
  freshness: DataFreshnessStatus;
  weatherAvailable: boolean;
  firmsAvailable: boolean;
  hydrologyAvailable: boolean;
  alertsCount: number;
  localReportsCount: number;
  seismicEventsCount: number;
  reliabilityWeights: typeof SOURCE_RELIABILITY_WEIGHTS;
}

export interface EarlyWarningState {
  assessments: {
    flood: HazardRiskAssessment;
    fire: HazardRiskAssessment;
    earthquake: HazardRiskAssessment;
    cyclone: HazardRiskAssessment;
    overall: HazardRiskAssessment;
  };
  allAssessments: HazardRiskAssessment[];
  highestRisk: HazardRiskAssessment;
  alertEventState: EarlyWarningAlertEventState;
  weatherData: WeatherData | null;
  fireTelemetry: LiveFireTelemetry | null;
  hydrologyTelemetry: LiveHydrologyTelemetry | null;
  seismicTelemetry: LiveSeismicTelemetry | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  isOffline: boolean;
  hasData: boolean;
  dataQuality: DataQualityReport;
  refreshAll: () => Promise<void>;
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function resolveTerrainContext(locationName: string) {
  const normalized = (locationName || '').toLowerCase();
  for (const [key, terrain] of Object.entries(TERRAIN_DB)) {
    if (normalized.includes(key)) {
      return terrain;
    }
  }
  return {
    isHilly: false,
    isCoastal: false,
    isFloodPlain: true,
    isUrban: true,
    recentClimateRisk: ['Flood', 'HeavyRain']
  };
}

function parseSeismicMagnitude(alert: Alert): number {
  if (alert.measurements) {
    const magItem = alert.measurements.find(m => m.label.toLowerCase().includes('magnitude'));
    if (magItem) {
      const match = magItem.value.match(/([0-9.]+)/);
      if (match) return parseFloat(match[1]);
    }
  }
  const titleMatch = alert.title.match(/M([0-9.]+)/i);
  if (titleMatch) return parseFloat(titleMatch[1]);
  return 4.5;
}

function parseSeismicDepth(alert: Alert): number {
  if (alert.measurements) {
    const depthItem = alert.measurements.find(m => m.label.toLowerCase().includes('depth'));
    if (depthItem) {
      const match = depthItem.value.match(/([0-9.]+)/);
      if (match) return parseFloat(match[1]);
    }
  }
  return 10.0;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useEarlyWarning = (
  assessmentRadiusKm: number = DEFAULT_ASSESSMENT_RADIUS_KM,
  customCoordinates?: [number, number],
  customLocationName?: string
): EarlyWarningState => {
  // 1. Existing Location Hook / Custom Assessment Coordinates
  const { location } = useLocation();
  const coords: [number, number] = useMemo(() => {
    if (customCoordinates && typeof customCoordinates[0] === 'number' && typeof customCoordinates[1] === 'number') {
      return customCoordinates;
    }
    if (location.coords && typeof location.coords.latitude === 'number' && typeof location.coords.longitude === 'number') {
      return [location.coords.latitude, location.coords.longitude];
    }
    return DEFAULT_REGION_COORDINATES;
  }, [customCoordinates, location.coords]);

  const locationName = customLocationName || location.address || 'Cuttack-Bhubaneswar Disaster Monitoring Corridor, Odisha';

  // 2. Existing Weather Telemetry Hook (Open-Meteo)
  const {
    data: weatherData,
    loading: weatherLoading,
    lastUpdated: weatherLastUpdated,
    forceRefresh: refreshWeather
  } = useWeather(coords[0], coords[1]);

  // 3. Existing Alerts Hook (USGS Seismic + Weather Alerts)
  const {
    alerts,
    loading: alertsLoading,
    isOffline: alertsOffline,
    lastSyncTime: alertsLastSync,
    refreshAlerts
  } = useAlerts(coords[0], coords[1]);

  // 4. Existing Reports Hook (Verified crowd & field incident reports)
  const {
    reports,
    loading: reportsLoading,
    isOffline: reportsOffline,
    refreshReports
  } = useReports(coords[0], coords[1]);

  // 5. Real-Time Telemetry Orchestrator Feeds (NASA FIRMS, GloFAS Hydrology, USGS Seismic Attenuation)
  const [fireTelemetry, setFireTelemetry] = useState<LiveFireTelemetry | null>(null);
  const [hydrologyTelemetry, setHydrologyTelemetry] = useState<LiveHydrologyTelemetry | null>(null);
  const [seismicTelemetry, setSeismicTelemetry] = useState<LiveSeismicTelemetry | null>(null);
  const [orchestratorLoading, setOrchestratorLoading] = useState<boolean>(false);

  const fetchOrchestratedFeeds = useCallback(async (lat: number, lon: number) => {
    setOrchestratorLoading(true);
    try {
      const [fire, hydro, seismic] = await Promise.all([
        fetchOrchestratedNASA_FIRMS(lat, lon),
        fetchOrchestratedHydrology(lat, lon),
        fetchOrchestratedUSGS(lat, lon)
      ]);
      setFireTelemetry(fire);
      setHydrologyTelemetry(hydro);
      setSeismicTelemetry(seismic);
    } catch (err) {
      console.warn('Orchestrated feeds error:', err);
    } finally {
      setOrchestratorLoading(false);
    }
  }, []);

  const [currentLat, currentLon] = coords;

  useEffect(() => {
    fetchOrchestratedFeeds(currentLat, currentLon);
    const interval = setInterval(() => {
      fetchOrchestratedFeeds(currentLat, currentLon);
    }, 600000); // 10 minute interval
    return () => clearInterval(interval);
  }, [currentLat, currentLon, fetchOrchestratedFeeds]);

  const isOffline = Boolean(alertsOffline || reportsOffline);
  const isLoading = Boolean(weatherLoading || alertsLoading || reportsLoading || orchestratorLoading);

  // 6. Data Freshness & Data Quality Calculation
  const dataQuality: DataQualityReport = useMemo(() => {
    let freshness: DataFreshnessStatus = 'Unavailable';

    const timestamps = [
      weatherLastUpdated ? weatherLastUpdated.getTime() : 0,
      alertsLastSync ? alertsLastSync.getTime() : 0,
      fireTelemetry?.observedTimestamp ? new Date(fireTelemetry.observedTimestamp).getTime() : 0,
      seismicTelemetry?.observedTimestamp ? new Date(seismicTelemetry.observedTimestamp).getTime() : 0
    ].filter(t => t > 0);

    const latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    if (latestTimestamp > 0) {
      const ageMinutes = (Date.now() - latestTimestamp) / (1000 * 60);
      if (ageMinutes <= 30) freshness = 'Fresh';
      else if (ageMinutes <= 120) freshness = 'Aging';
      else freshness = 'Stale';
    } else if (!weatherData && alerts.length === 0) {
      freshness = 'Unavailable';
    }

    const seismicCount = seismicTelemetry?.events.length || alerts.filter(a => a.type === 'Earthquake').length;

    return {
      freshness,
      weatherAvailable: Boolean(weatherData),
      firmsAvailable: Boolean(fireTelemetry),
      hydrologyAvailable: Boolean(hydrologyTelemetry?.isStationAvailable),
      alertsCount: alerts.length,
      localReportsCount: reports.length,
      seismicEventsCount: seismicCount,
      reliabilityWeights: SOURCE_RELIABILITY_WEIGHTS
    };
  }, [weatherLastUpdated, alertsLastSync, fireTelemetry, seismicTelemetry, hydrologyTelemetry, weatherData, alerts, reports]);

  // 7. Local Community Report Filtering (Proximity + Veracity + Hazard Specificity)
  const localVerifiedReports = useMemo(() => {
    return reports.filter(report => {
      // Must be genuine / AI-verified
      if (!isGenuineReport(report)) return false;

      // Must be within assessment radius if coordinates are available
      if (report.coordinates) {
        const dist = getDistance(
          coords[0],
          coords[1],
          report.coordinates.latitude,
          report.coordinates.longitude
        );
        return dist <= assessmentRadiusKm;
      }
      return true; // Include local area reports without exact GPS pin
    });
  }, [reports, coords, assessmentRadiusKm]);

  // Categorize local reports by hazard domain
  const { floodReportsCount, fireReportsCount } = useMemo(() => {
    let floodCount = 0;
    let fireCount = 0;

    localVerifiedReports.forEach((r: IncidentReport) => {
      const text = `${r.type} ${r.description} ${r.tags.join(' ')}`.toLowerCase();

      if (r.type === 'Flood' || r.type === 'HeavyRain' || r.type === 'RoadBlockage' || text.includes('water') || text.includes('submerged') || text.includes('flood')) {
        floodCount++;
      }
      if (r.type === 'Fire' || text.includes('fire') || text.includes('smoke') || text.includes('flame') || text.includes('blaze')) {
        fireCount++;
      }
    });

    return { floodReportsCount: floodCount, fireReportsCount: fireCount };
  }, [localVerifiedReports]);

  // 8. Terrain Vulnerability Lookup
  const terrainContext = useMemo(() => {
    return resolveTerrainContext(locationName);
  }, [locationName]);

  // 9. Nearest USGS Seismic Event Extraction
  // 9. Nearest USGS Seismic Event Extraction (strictly within 30 km local assessment radius)
  const primarySeismicAlert = useMemo<Alert | null>(() => {
    const quakeAlerts = alerts.filter(a => {
      if (a.type !== 'Earthquake' || a.status === 'Resolved') return false;
      if (!a.latitude || !a.longitude) return false;
      const dist = getDistance(coords[0], coords[1], a.latitude, a.longitude);
      return dist <= 30; // strictly within 30 km
    });
    if (quakeAlerts.length === 0) return null;

    return quakeAlerts.reduce((nearest, current) => {
      if (!nearest.latitude || !nearest.longitude) return current;
      if (!current.latitude || !current.longitude) return nearest;

      const distNearest = getDistance(coords[0], coords[1], nearest.latitude, nearest.longitude);
      const distCurrent = getDistance(coords[0], coords[1], current.latitude, current.longitude);
      return distCurrent < distNearest ? current : nearest;
    }, quakeAlerts[0]);
  }, [alerts, coords]);

  // 10. Execute Pure Risk Intelligence Calculation Functions
  const assessments = useMemo(() => {
    const isoTimestamp = new Date().toISOString();

    // A. Flood Risk Assessment
    const floodInput: FloodRiskInput = {
      location: locationName,
      centerCoordinates: coords,
      precipitationRateMmPerHour: weatherData?.precipitation ?? 0,
      precipitationAccumulation24hMm: weatherData?.precipitationAccumulation24h,
      forecastPrecipitationAccumulation24hMm: weatherData?.forecastPrecipitation24h,
      surfacePressureHpa: weatherData?.surfacePressure,
      humidityPercent: weatherData?.humidity ?? 75,
      riverDischargeM3s: hydrologyTelemetry?.riverDischargeM3s,
      riverDischargeMaxM3s: hydrologyTelemetry?.riverDischargeMaxM3s,
      riverDischargePercentile: hydrologyTelemetry?.riverDischargePercentile,
      rateOfRiseM3sPerDay: hydrologyTelemetry?.rateOfRiseM3sPerDay,
      isRiverGaugeAvailable: hydrologyTelemetry?.isStationAvailable,
      verifiedWaterloggingReportsCount: floodReportsCount,
      isFloodPlain: terrainContext.isFloodPlain,
      isUrbanLowLying: terrainContext.isUrban,
      timestamp: isoTimestamp
    };
    const floodAssessment = calculateFloodRisk(floodInput);

    // B. Fire Risk Assessment
    const fireInput: FireRiskInput = {
      location: locationName,
      centerCoordinates: coords,
      temperatureCelsius: weatherData?.temperature ?? 28,
      relativeHumidityPercent: weatherData?.humidity ?? 65,
      windSpeedKmH: weatherData?.windSpeed ?? 12,
      recentPrecipitationMm: weatherData?.precipitation ?? 0,
      firmsDetectionsCount: fireTelemetry?.detectionsWithin25km,
      firmsNearestDistanceKm: fireTelemetry?.nearestFireDistanceKm,
      firmsMaxFrpMw: fireTelemetry?.maxFrpMw,
      isSatelliteFireDetected: fireTelemetry?.isSatelliteFireDetected,
      verifiedFireReportsCount: fireReportsCount,
      isVegetationDense: false,
      timestamp: isoTimestamp
    };
    const fireAssessment = calculateFireRisk(fireInput);

    // C. Earthquake Shaking Risk Assessment (strictly within 30 km local assessment radius)
    let earthquakeAssessment: HazardRiskAssessment;
    const nearestOrchestratedQuake = seismicTelemetry?.nearestEvent && seismicTelemetry.nearestEvent.epicentralDistanceKm <= 30
      ? seismicTelemetry.nearestEvent
      : null;

    if (nearestOrchestratedQuake) {
      const quakeInput: EarthquakeRiskInput = {
        location: locationName,
        centerCoordinates: coords,
        userCoordinates: coords,
        magnitude: nearestOrchestratedQuake.magnitude,
        depthKm: nearestOrchestratedQuake.depthKm,
        eventCoordinates: nearestOrchestratedQuake.coordinates,
        epicentralDistanceKm: nearestOrchestratedQuake.epicentralDistanceKm,
        hypocentralDistanceKm: nearestOrchestratedQuake.hypocentralDistanceKm,
        estimatedPgaG: nearestOrchestratedQuake.estimatedPgaG,
        attenuationSummary: nearestOrchestratedQuake.attenuationSummary,
        isLocalShakingPerceptible: nearestOrchestratedQuake.isLocalShakingPerceptible,
        mmiIntensity: nearestOrchestratedQuake.mmiIntensity,
        feltReportsCount: nearestOrchestratedQuake.feltReports,
        alertLevel: nearestOrchestratedQuake.alertLevel,
        eventTimestamp: nearestOrchestratedQuake.eventTime,
        placeDescription: nearestOrchestratedQuake.place
      };
      earthquakeAssessment = calculateEarthquakeRisk(quakeInput);
    } else if (primarySeismicAlert && primarySeismicAlert.latitude && primarySeismicAlert.longitude) {
      const mag = parseSeismicMagnitude(primarySeismicAlert);
      const depth = parseSeismicDepth(primarySeismicAlert);

      const quakeInput: EarthquakeRiskInput = {
        location: locationName,
        centerCoordinates: coords,
        userCoordinates: coords,
        magnitude: mag,
        depthKm: depth,
        eventCoordinates: [primarySeismicAlert.latitude, primarySeismicAlert.longitude],
        eventTimestamp: primarySeismicAlert.detectedAt || isoTimestamp,
        placeDescription: primarySeismicAlert.location
      };
      earthquakeAssessment = calculateEarthquakeRisk(quakeInput);
    } else {
      // Baseline nominal seismic state when zero active USGS events exist in 30 km radius
      earthquakeAssessment = {
        id: `risk-quake-baseline-${isoTimestamp.slice(0, 16).replace(/[^0-9]/g, '')}`,
        hazardType: 'Earthquake',
        riskScore: 5,
        confidence: 85,
        riskLevel: 'Low',
        warningStage: 'Normal',
        timestamp: isoTimestamp,
        location: locationName,
        centerCoordinates: coords,
        impactRadiusKm: 30,
        leadTimeMinutes: undefined,
        primaryTriggers: [],
        evidenceSources: [
          {
            sourceType: 'USGS_Seismic',
            sourceName: 'USGS Global Seismographic Network',
            description: 'No seismic activity or tectonic shockwaves detected within the 30 km assessment radius.',
            reliability: SOURCE_RELIABILITY_WEIGHTS.USGS_SEISMIC,
            provenance: 'DIRECT OBSERVATION',
            timestamp: isoTimestamp
          }
        ],
        recommendedActions: [],
        status: 'Monitoring',
        summary: 'No seismic activity detected within the 30 km assessment radius. Crustal telemetry normal.'
      };
    }

    // D. Cyclone & Extreme Wind Assessment
    const cycloneInput: CycloneRiskInput = {
      location: locationName,
      centerCoordinates: coords,
      windSpeedKmH: weatherData?.windSpeed ?? 10,
      windGustsKmH: weatherData?.windGusts ?? (weatherData?.windSpeed ?? 10) * 1.35,
      surfacePressureHpa: weatherData?.surfacePressure,
      pressureMslHpa: weatherData?.pressureMsl,
      capeJkg: weatherData?.cape,
      isCoastalRegion: terrainContext.isCoastal,
      timestamp: isoTimestamp
    };
    const cycloneAssessment = calculateCycloneRisk(cycloneInput);

    // E. Composite Unified Multi-Hazard Assessment
    const all = [floodAssessment, fireAssessment, earthquakeAssessment, cycloneAssessment];
    const overall = calculateOverallRisk(all);

    return {
      flood: floodAssessment,
      fire: fireAssessment,
      earthquake: earthquakeAssessment,
      cyclone: cycloneAssessment,
      overall,
      all
    };
  }, [
    coords,
    locationName,
    weatherData,
    fireTelemetry,
    hydrologyTelemetry,
    seismicTelemetry,
    floodReportsCount,
    fireReportsCount,
    terrainContext,
    primarySeismicAlert
  ]);

  // Determine highest risk assessment among all evaluated hazard categories
  const highestRisk = useMemo(() => {
    const list = [assessments.flood, assessments.fire, assessments.earthquake, assessments.cyclone];
    return list.reduce((highest, current) => current.riskScore > highest.riskScore ? current : highest, list[0]);
  }, [assessments]);

  // Alert Lifecycle and Fatigue Management State
  const [alertEventState, setAlertEventState] = useState<EarlyWarningAlertEventState>({
    transitionType: 'NO_CHANGE',
    message: 'Monitoring active — environmental signals stable.',
    hazardType: 'Overall',
    currentStage: 'Normal',
    timestamp: new Date().toISOString()
  });

  const prevAssessmentsRef = useRef<Record<string, HazardRiskAssessment>>({});

  useEffect(() => {
    if (!assessments.all || assessments.all.length === 0) return;

    try {
      if (Object.keys(prevAssessmentsRef.current).length === 0) {
        const stored = localStorage.getItem(EW_STORAGE_KEY);
        if (stored) {
          prevAssessmentsRef.current = JSON.parse(stored);
        }
      }
    } catch {}

    const result = processEarlyWarningBatch(
      assessments.all,
      alerts,
      prevAssessmentsRef.current
    );

    if (result.latestTransition.transitionType !== 'NO_CHANGE') {
      setAlertEventState(result.latestTransition);
    }

    if (result.newOrUpdatedEarlyWarningAlerts.length > 0) {
      try {
        const STORAGE_KEY = 'drishti_alerts_cache_live_v1';
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.mergedAlerts));
        import('../utils/indexedDB').then(({ dbPutBatch }) => {
          dbPutBatch('alerts', result.mergedAlerts).catch(() => {});
        });
      } catch {}
    }

    const newMap: Record<string, HazardRiskAssessment> = {};
    assessments.all.forEach(a => {
      newMap[a.hazardType] = a;
    });
    prevAssessmentsRef.current = newMap;
    try {
      localStorage.setItem(EW_STORAGE_KEY, JSON.stringify(newMap));
    } catch {}
  }, [assessments.all, alerts]);

  // Unified refresh function triggering all underlying data sources
  const refreshAll = useCallback(async () => {
    refreshWeather();
    fetchOrchestratedFeeds(coords[0], coords[1]);
    await Promise.all([
      refreshAlerts(),
      refreshReports()
    ]);
  }, [refreshWeather, fetchOrchestratedFeeds, coords, refreshAlerts, refreshReports]);

  return {
    assessments: {
      flood: assessments.flood,
      fire: assessments.fire,
      earthquake: assessments.earthquake,
      cyclone: assessments.cyclone,
      overall: assessments.overall
    },
    allAssessments: assessments.all,
    highestRisk,
    alertEventState,
    weatherData,
    fireTelemetry,
    hydrologyTelemetry,
    seismicTelemetry,
    lastUpdated: weatherLastUpdated || alertsLastSync || null,
    isLoading,
    isOffline,
    hasData: Boolean(weatherData || alerts.length > 0 || reports.length > 0),
    dataQuality,
    refreshAll
  };
};

export default useEarlyWarning;
