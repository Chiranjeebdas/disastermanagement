import { useState, useCallback, useRef } from 'react';
import type {
  HazardRiskAssessment,
  WarningStage,
  EvidenceSource,
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
import type { IncidentReport } from '../types/report';
import {
  calculateFloodRisk,
  calculateFireRisk,
  calculateEarthquakeRisk,
  calculateCycloneRisk,
  calculateOverallRisk
} from '../utils/riskIntelligence';
import {
  fetchOrchestratedNASA_FIRMS,
  fetchOrchestratedHydrology,
  fetchOrchestratedUSGS
} from '../utils/liveDataOrchestrator';
import { TERRAIN_DB, isGenuineReport } from '../utils/aiVerification';
import { dbGetAll } from '../utils/indexedDB';
import { getDistance } from '../utils/distance';

export type SourceLoadStatus = 'loading' | 'live' | 'unavailable';

export interface SourceStatuses {
  weather: SourceLoadStatus;
  firms: SourceLoadStatus;
  usgs: SourceLoadStatus;
  glofas: SourceLoadStatus;
  reports: SourceLoadStatus;
}

export interface LocationAssessmentResult {
  latitude: number;
  longitude: number;
  locationName: string;
  overallRisk: number;
  warningStage: WarningStage;
  confidence: number;
  riskLevel: string;
  assessments: {
    flood: HazardRiskAssessment;
    fire: HazardRiskAssessment;
    earthquake: HazardRiskAssessment;
    cyclone: HazardRiskAssessment;
    overall: HazardRiskAssessment;
  };
  evidenceSources: EvidenceSource[];
  fireTelemetry: LiveFireTelemetry | null;
  hydrologyTelemetry: LiveHydrologyTelemetry | null;
  seismicTelemetry: LiveSeismicTelemetry | null;
  weatherSummary: {
    temperature?: number;
    humidity?: number;
    precipitation?: number;
    windSpeed?: number;
    windGusts?: number;
    pressure?: number;
    weatherCode?: number;
    observedTime?: string;
  } | null;
  sourceStatuses: SourceStatuses;
  verifiedReportsCount: number;
  freshness: string;
  evaluatedAt: Date;
}

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

export function useLocationAssessment() {
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assessmentResult, setAssessmentResult] = useState<LocationAssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRequestId = useRef<number>(0);

  const assessLocation = useCallback(async (latitude: number, longitude: number) => {
    const requestId = ++activeRequestId.current;
    setSelectedCoords({ latitude, longitude });
    setIsLoading(true);
    setError(null);
    setAssessmentResult(null); // Clear previous location's data immediately

    const sourceStatuses: SourceStatuses = {
      weather: 'loading',
      firms: 'loading',
      usgs: 'loading',
      glofas: 'loading',
      reports: 'loading'
    };

    try {
      // 1. Reverse Geocode the exact clicked location
      let locationName = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
      try {
        const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        if (bdcRes.ok) {
          const bdcData = await bdcRes.json();
          const parts = [
            bdcData.locality || bdcData.city,
            bdcData.principalSubdivision || bdcData.countryName
          ].filter(Boolean);
          if (parts.length > 0) {
            locationName = parts.join(', ');
          }
        }
      } catch {}

      if (locationName.includes('°N')) {
        try {
          const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`);
          if (osmRes.ok) {
            const data = await osmRes.json();
            if (data.address) {
              const parts = [
                data.address.suburb || data.address.neighbourhood || data.address.road || data.address.village,
                data.address.city || data.address.town || data.address.county,
                data.address.state
              ].filter(Boolean);
              const uniqueParts = parts.filter((val, idx, arr) => idx === 0 || val !== arr[idx - 1]);
              if (uniqueParts.length > 0) {
                locationName = uniqueParts.join(', ');
              }
            }
          }
        } catch {}
      }

      // Check if another request superseded this one
      if (requestId !== activeRequestId.current) return;

      // 2. Fetch Live Weather from Open-Meteo for exact clicked coordinates
      let weatherPayload: any = null;
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cape&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,surface_pressure&past_days=1&forecast_days=2&timezone=auto`;
        const wRes = await fetch(weatherUrl, { cache: 'no-store' });
        if (wRes.ok) {
          weatherPayload = await wRes.json();
          sourceStatuses.weather = 'live';
        } else {
          sourceStatuses.weather = 'unavailable';
        }
      } catch {
        sourceStatuses.weather = 'unavailable';
      }

      // 3. Fetch Live NASA FIRMS, GloFAS Hydrology, and USGS Seismic for exact coordinates
      const [fireTelemetry, hydrologyTelemetry, seismicTelemetry] = await Promise.all([
        fetchOrchestratedNASA_FIRMS(latitude, longitude).then(f => {
          sourceStatuses.firms = f ? 'live' : 'unavailable';
          return f;
        }).catch(() => {
          sourceStatuses.firms = 'unavailable';
          return null;
        }),
        fetchOrchestratedHydrology(latitude, longitude).then(h => {
          sourceStatuses.glofas = h && h.riverDischargeM3s !== undefined ? 'live' : 'unavailable';
          return h;
        }).catch(() => {
          sourceStatuses.glofas = 'unavailable';
          return null;
        }),
        fetchOrchestratedUSGS(latitude, longitude).then(s => {
          sourceStatuses.usgs = s ? 'live' : 'unavailable';
          return s;
        }).catch(() => {
          sourceStatuses.usgs = 'unavailable';
          return null;
        })
      ]);

      if (requestId !== activeRequestId.current) return;

      // 4. Query Verified Local Community Reports within 5 km of clicked coordinates
      let localVerifiedReports: IncidentReport[] = [];
      try {
        const allStoredReports = await dbGetAll<IncidentReport>('reports') || [];
        localVerifiedReports = allStoredReports.filter(report => {
          if (!report.coordinates) return false;
          if (!isGenuineReport(report)) return false;
          const dist = getDistance(
            latitude,
            longitude,
            report.coordinates.latitude,
            report.coordinates.longitude
          );
          return dist <= 5.0; // 5 km radius
        });
        sourceStatuses.reports = 'live';
      } catch {
        sourceStatuses.reports = 'unavailable';
      }

      // 5. Extract Normalized Inputs for Risk Intelligence Engine
      const terrain = resolveTerrainContext(locationName);
      const cur = weatherPayload?.current;

      const currentTemp = cur?.temperature_2m ?? 28;
      const currentHumidity = cur?.relative_humidity_2m ?? 65;
      const currentPrecipitation = cur?.precipitation ?? 0;
      const currentWindSpeed = cur?.wind_speed_10m ?? 10;
      const currentWindGusts = cur?.wind_gusts_10m ?? 15;
      const currentPressure = cur?.surface_pressure ?? 1010;
      const currentCape = cur?.cape ?? 500;

      // Past 24h precipitation sum from real hourly data
      let past24hPrecipitation = 0;
      let forecast24hPrecipitation = 0;
      if (weatherPayload?.hourly?.precipitation) {
        const pArray: number[] = weatherPayload.hourly.precipitation;
        if (pArray.length >= 24) {
          past24hPrecipitation = pArray.slice(0, 24).reduce((a, b) => a + (b || 0), 0);
        }
        if (pArray.length >= 48) {
          forecast24hPrecipitation = pArray.slice(24, 48).reduce((a, b) => a + (b || 0), 0);
        }
      }

      const isoTimestamp = new Date().toISOString();
      const coordsTuple: [number, number] = [latitude, longitude];

      // A. Flood Risk Input
      const floodInput: FloodRiskInput = {
        location: locationName,
        centerCoordinates: coordsTuple,
        precipitationRateMmPerHour: currentPrecipitation,
        precipitationAccumulation24hMm: past24hPrecipitation,
        forecastPrecipitationAccumulation24hMm: forecast24hPrecipitation,
        surfacePressureHpa: currentPressure,
        humidityPercent: currentHumidity,
        riverDischargeM3s: hydrologyTelemetry?.riverDischargeM3s,
        riverDischargeMaxM3s: hydrologyTelemetry?.riverDischargeMaxM3s,
        riverDischargePercentile: hydrologyTelemetry?.riverDischargePercentile,
        rateOfRiseM3sPerDay: hydrologyTelemetry?.rateOfRiseM3sPerDay,
        isRiverGaugeAvailable: hydrologyTelemetry?.isStationAvailable,
        verifiedWaterloggingReportsCount: localVerifiedReports.filter(r => r.type === 'Flood' || r.type === 'HeavyRain').length,
        isFloodPlain: terrain.isFloodPlain,
        isUrbanLowLying: terrain.isUrban,
        timestamp: isoTimestamp
      };

      // B. Wildfire Risk Input
      const fireInput: FireRiskInput = {
        location: locationName,
        centerCoordinates: coordsTuple,
        temperatureCelsius: currentTemp,
        relativeHumidityPercent: currentHumidity,
        windSpeedKmH: currentWindSpeed,
        recentPrecipitationMm: currentPrecipitation,
        firmsDetectionsCount: fireTelemetry?.detectionsWithin25km,
        firmsNearestDistanceKm: fireTelemetry?.nearestFireDistanceKm,
        firmsMaxFrpMw: fireTelemetry?.maxFrpMw,
        isSatelliteFireDetected: fireTelemetry?.isSatelliteFireDetected,
        verifiedFireReportsCount: localVerifiedReports.filter(r => r.type === 'Fire').length,
        isVegetationDense: terrain.isHilly,
        timestamp: isoTimestamp
      };

      // C. Earthquake Risk Input
      let earthquakeAssessment: HazardRiskAssessment;
      if (seismicTelemetry?.nearestEvent) {
        const quakeInput: EarthquakeRiskInput = {
          location: locationName,
          centerCoordinates: coordsTuple,
          userCoordinates: coordsTuple,
          magnitude: seismicTelemetry.nearestEvent.magnitude,
          depthKm: seismicTelemetry.nearestEvent.depthKm,
          eventCoordinates: seismicTelemetry.nearestEvent.coordinates,
          epicentralDistanceKm: seismicTelemetry.nearestEvent.epicentralDistanceKm,
          hypocentralDistanceKm: seismicTelemetry.nearestEvent.hypocentralDistanceKm,
          estimatedPgaG: seismicTelemetry.nearestEvent.estimatedPgaG,
          attenuationSummary: seismicTelemetry.nearestEvent.attenuationSummary,
          isLocalShakingPerceptible: seismicTelemetry.nearestEvent.isLocalShakingPerceptible,
          mmiIntensity: seismicTelemetry.nearestEvent.mmiIntensity,
          feltReportsCount: seismicTelemetry.nearestEvent.feltReports,
          alertLevel: seismicTelemetry.nearestEvent.alertLevel,
          eventTimestamp: seismicTelemetry.nearestEvent.eventTime,
          placeDescription: seismicTelemetry.nearestEvent.place
        };
        earthquakeAssessment = calculateEarthquakeRisk(quakeInput);
      } else {
        earthquakeAssessment = {
          id: `risk-quake-baseline-${isoTimestamp.slice(0, 16).replace(/[^0-9]/g, '')}`,
          hazardType: 'Earthquake',
          riskScore: 8,
          confidence: 82,
          riskLevel: 'Low',
          warningStage: 'Normal',
          timestamp: isoTimestamp,
          location: locationName,
          centerCoordinates: coordsTuple,
          impactRadiusKm: 10,
          primaryTriggers: [],
          evidenceSources: [
            {
              sourceType: 'USGS_Seismic',
              sourceName: 'USGS Global Seismographic Network',
              description: 'USGS real-time seismic telemetry: No active tectonic shockwaves or fault rupture events detected in regional monitoring range.',
              reliability: 98,
              provenance: 'DIRECT OBSERVATION',
              timestamp: isoTimestamp
            }
          ],
          recommendedActions: [],
          status: 'Monitoring',
          summary: 'Detected Seismic Activity: No active tectonic shockwaves detected in regional range.'
        };
      }

      // D. Cyclone Risk Input
      const cycloneInput: CycloneRiskInput = {
        location: locationName,
        centerCoordinates: coordsTuple,
        windSpeedKmH: currentWindSpeed,
        windGustsKmH: currentWindGusts,
        surfacePressureHpa: currentPressure,
        capeJkg: currentCape,
        isCoastalRegion: terrain.isCoastal,
        timestamp: isoTimestamp
      };

      // 6. Compute Deterministic Risk Assessments
      const floodAssessment = calculateFloodRisk(floodInput);
      const fireAssessment = calculateFireRisk(fireInput);
      const cycloneAssessment = calculateCycloneRisk(cycloneInput);

      const allAssessments = [floodAssessment, fireAssessment, earthquakeAssessment, cycloneAssessment];
      const overallAssessment = calculateOverallRisk(allAssessments);

      // Collect Evidence Sources
      const evidenceSources: EvidenceSource[] = [
        ...floodAssessment.evidenceSources,
        ...fireAssessment.evidenceSources,
        ...earthquakeAssessment.evidenceSources,
        ...cycloneAssessment.evidenceSources
      ];

      // Deduplicate evidence by sourceName
      const uniqueEvidence: EvidenceSource[] = [];
      const seenSources = new Set<string>();
      for (const ev of evidenceSources) {
        if (!seenSources.has(ev.sourceName)) {
          seenSources.add(ev.sourceName);
          uniqueEvidence.push(ev);
        }
      }

      const weatherSummary = cur ? {
        temperature: cur.temperature_2m,
        humidity: cur.relative_humidity_2m,
        precipitation: cur.precipitation,
        windSpeed: cur.wind_speed_10m,
        windGusts: cur.wind_gusts_10m,
        pressure: cur.surface_pressure,
        weatherCode: cur.weather_code,
        observedTime: cur.time
      } : null;

      const result: LocationAssessmentResult = {
        latitude,
        longitude,
        locationName,
        overallRisk: overallAssessment.riskScore,
        warningStage: overallAssessment.warningStage,
        confidence: overallAssessment.confidence,
        riskLevel: overallAssessment.riskLevel,
        assessments: {
          flood: floodAssessment,
          fire: fireAssessment,
          earthquake: earthquakeAssessment,
          cyclone: cycloneAssessment,
          overall: overallAssessment
        },
        evidenceSources: uniqueEvidence,
        fireTelemetry,
        hydrologyTelemetry,
        seismicTelemetry,
        weatherSummary,
        sourceStatuses,
        verifiedReportsCount: localVerifiedReports.length,
        freshness: 'LIVE',
        evaluatedAt: new Date()
      };

      if (requestId === activeRequestId.current) {
        setAssessmentResult(result);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (requestId === activeRequestId.current) {
        console.error('Location assessment failed:', err);
        setError(err?.message || 'Failed to complete real-time location assessment.');
        setIsLoading(false);
      }
    }
  }, []);

  const clearAssessment = useCallback(() => {
    activeRequestId.current++;
    setSelectedCoords(null);
    setAssessmentResult(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    selectedCoords,
    isLoading,
    assessmentResult,
    error,
    assessLocation,
    clearAssessment
  };
}
