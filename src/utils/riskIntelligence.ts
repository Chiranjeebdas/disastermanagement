/**
 * DRISHTI Risk Intelligence & Early Warning Engine (v1.0)
 * 
 * DESIGN PHILOSOPHY & SCIENTIFIC INTEGRITY:
 * 1. Pure, deterministic, transparent calculation functions without opaque black-box assumptions.
 * 2. Multi-source evidence fusion: Integrates real-time meteorological sensors, verified crowd reports,
 *    regional terrain vulnerability, and USGS seismic network telemetry.
 * 3. Honest Hazard Modeling: DRISHTI distinguishes between "detected seismic shockwaves" and "earthquake prediction".
 *    The engine evaluates detected physical events and shockwave impact radii rather than predicting unannounced quakes.
 * 4. Alarm Fatigue Mitigation: State-aware hysteresis filtering prevents alert spamming for minor telemetry noise.
 */

import type {
  RiskLevel,
  WarningStage,
  HazardType,
  PrimaryTrigger,
  EvidenceSource,
  RecommendedAction,
  HazardRiskAssessment,
  FloodRiskInput,
  FireRiskInput,
  EarthquakeRiskInput,
  CycloneRiskInput
} from '../types/earlyWarning';
import { getDistance } from './distance';

// ============================================================================
// CENTRALIZED THRESHOLD CONSTANTS
// ============================================================================

export const RISK_THRESHOLDS = {
  LOW_MAX: 29,
  MODERATE_MAX: 49,
  HIGH_MAX: 69,
  SEVERE_MAX: 84,
  EXTREME_MAX: 100
} as const;

/**
 * Maps a numeric risk score (0-100) to standard RiskLevel category
 */
export function getRiskLevel(riskScore: number): RiskLevel {
  const score = Math.max(0, Math.min(100, Math.round(riskScore)));
  if (score <= RISK_THRESHOLDS.LOW_MAX) return 'Low';
  if (score <= RISK_THRESHOLDS.MODERATE_MAX) return 'Moderate';
  if (score <= RISK_THRESHOLDS.HIGH_MAX) return 'High';
  if (score <= RISK_THRESHOLDS.SEVERE_MAX) return 'Severe';
  return 'Extreme';
}

/**
 * Maps a numeric risk score (0-100) to standard WarningStage
 */
export function getWarningStage(riskScore: number): WarningStage {
  const score = Math.max(0, Math.min(100, Math.round(riskScore)));
  if (score <= RISK_THRESHOLDS.LOW_MAX) return 'Normal';
  if (score <= RISK_THRESHOLDS.MODERATE_MAX) return 'Advisory';
  if (score <= RISK_THRESHOLDS.HIGH_MAX) return 'Watch';
  if (score <= RISK_THRESHOLDS.SEVERE_MAX) return 'Warning';
  return 'Emergency';
}

// ============================================================================
// CONFIDENCE SCORING ENGINE
// ============================================================================

/**
 * Calculates evidence confidence (0-100) independently of risk score.
 * Evaluates:
 *  - Dynamic Live Observation Stream Count (Open_Meteo, USGS_Seismic, Community_Report, Telemetry)
 *  - Static Topographic Context Baseline
 *  - Average Engineering Reliability Weight (0-100)
 *  - Observation Latency / Freshness (recent observations score higher)
 */
export function calculateConfidence(evidenceSources: EvidenceSource[]): number {
  if (!evidenceSources || evidenceSources.length === 0) {
    return 20; // Baseline low confidence when zero verifiable sources present
  }

  // 1. Dynamic Live Observation Stream Count (Open_Meteo, USGS_Seismic, NASA_FIRMS, GloFAS_Hydrology, CWC_River_Gauge, Community_Report, Telemetry)
  let liveScore = 0;
  const uniqueLiveTypes = new Set(
    evidenceSources
      .filter(s => s.sourceType !== 'Historical_Terrain' && s.provenance !== 'UNAVAILABLE')
      .map(s => s.sourceType)
  );

  if (uniqueLiveTypes.size === 1) liveScore = 38;
  else if (uniqueLiveTypes.size === 2) liveScore = 54;
  else if (uniqueLiveTypes.size === 3) liveScore = 65;
  else if (uniqueLiveTypes.size >= 4) liveScore = 72;
  else liveScore = 15; // only static context / unavailable signals

  // 2. Terrain / Prior context bonus (up to 6 pts)
  const hasTerrainContext = evidenceSources.some(s => s.sourceType === 'Historical_Terrain');
  const terrainBonus = hasTerrainContext ? 6 : 0;

  // 3. Average Engineering Reliability Weight (up to 12 pts)
  const avgReliability = evidenceSources.reduce((acc, s) => acc + (s.reliability || 50), 0) / evidenceSources.length;
  const reliabilityScore = (avgReliability / 100) * 12;

  // 4. Freshness / Latency Score (up to 10 pts)
  let freshnessScore = 6;
  const now = Date.now();
  const mostRecentTimestamp = evidenceSources.reduce((latest, s) => {
    const t = new Date(s.timestamp).getTime();
    return !isNaN(t) && t > latest ? t : latest;
  }, 0);

  if (mostRecentTimestamp > 0) {
    const ageMinutes = (now - mostRecentTimestamp) / (1000 * 60);
    if (ageMinutes <= 30) freshnessScore = 10;
    else if (ageMinutes <= 120) freshnessScore = 8;
    else if (ageMinutes <= 360) freshnessScore = 5;
    else freshnessScore = 2;
  }

  const totalConfidence = Math.round(liveScore + terrainBonus + reliabilityScore + freshnessScore);
  return Math.max(15, Math.min(94, totalConfidence));
}

// ============================================================================
// RECOMMENDED ACTIONS GENERATOR
// ============================================================================

/**
 * Generates role-specific proportional actions for Citizen, Responder, and Authority.
 */
export function generateRecommendedActions(
  hazardType: HazardType,
  warningStage: WarningStage,
  _riskLevel?: RiskLevel
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  switch (hazardType) {
    case 'Flood':
      if (warningStage === 'Emergency' || warningStage === 'Warning') {
        actions.push(
          { audience: 'Citizen', action: 'Move immediately to higher ground. Avoid low-lying roads, basements, and drainage canals.', priority: 'Critical' },
          { audience: 'Citizen', action: 'Do NOT attempt to walk, swim, or drive through moving flood waters ("Turn Around, Don\'t Drown").', priority: 'Critical' },
          { audience: 'Citizen', action: 'Charge mobile phones and prepare emergency go-bag (drinking water, medicines, torch).', priority: 'High' },
          { audience: 'Responder', action: 'Deploy swift-water rescue teams to designated vulnerable sectors; verify safe boat launch sites.', priority: 'Critical' },
          { audience: 'Responder', action: 'Stage evacuation staging posts outside predicted 100-year inundation buffer.', priority: 'High' },
          { audience: 'Authority', action: 'Issue localized Siren Broadcast & SMS Cell Broadcast for flood evacuation.', priority: 'Critical' },
          { audience: 'Authority', action: 'Activate emergency shelter operations and inspect sluice gates / drainage pumping stations.', priority: 'High' }
        );
      } else if (warningStage === 'Watch') {
        actions.push(
          { audience: 'Citizen', action: 'Inspect local stormwater drains around property. Relocate essential assets off ground level.', priority: 'Medium' },
          { audience: 'Citizen', action: 'Monitor DRISHTI real-time telemetry updates and verify nearest safe shelter on Disaster Map.', priority: 'Medium' },
          { audience: 'Responder', action: 'Place rapid-response teams on 30-minute standby; verify satellite communication units.', priority: 'High' },
          { audience: 'Authority', action: 'Review hydrological catchment flow rates; coordinate with municipal sanitation teams to clear blockages.', priority: 'High' }
        );
      } else {
        actions.push(
          { audience: 'Citizen', action: 'Normal conditions. Maintain standard emergency kit readiness.', priority: 'Low' },
          { audience: 'Responder', action: 'Routine monitoring of regional telemetry nodes.', priority: 'Low' },
          { audience: 'Authority', action: 'Log baseline rainfall and drainage sensor telemetry.', priority: 'Low' }
        );
      }
      break;

    case 'Fire':
      if (warningStage === 'Emergency' || warningStage === 'Warning') {
        actions.push(
          { audience: 'Citizen', action: 'Evacuate immediately if instructed by civil authorities or if dense smoke approaches.', priority: 'Critical' },
          { audience: 'Citizen', action: 'Close all windows and vents. Wear N95/damp cloth masks to protect against particulate smoke.', priority: 'Critical' },
          { audience: 'Responder', action: 'Establish fire containment perimeter; secure municipal water hydrants and high-capacity tenders.', priority: 'Critical' },
          { audience: 'Authority', action: 'Declare fire exclusion zone; shut off natural gas distribution grids in affected sector.', priority: 'Critical' }
        );
      } else if (warningStage === 'Watch') {
        actions.push(
          { audience: 'Citizen', action: 'Strictly prohibit open outdoor burning or discarded combustible materials.', priority: 'High' },
          { audience: 'Citizen', action: 'Clear dry vegetation and combustible debris within 10 meters of structures.', priority: 'Medium' },
          { audience: 'Responder', action: 'Inspect high-risk industrial & wildland-urban interface sectors; check foam supply.', priority: 'High' },
          { audience: 'Authority', action: 'Issue red-flag fire weather advisory; place aerial firefighting units on standby.', priority: 'High' }
        );
      } else {
        actions.push(
          { audience: 'Citizen', action: 'Observe standard electrical and fire safety precautions.', priority: 'Low' },
          { audience: 'Responder', action: 'Standard fire station readiness.', priority: 'Low' },
          { audience: 'Authority', action: 'Maintain routine meteorological fire danger monitoring.', priority: 'Low' }
        );
      }
      break;

    case 'Earthquake':
      if (warningStage === 'Emergency' || warningStage === 'Warning') {
        actions.push(
          { audience: 'Citizen', action: 'Drop, Cover, and Hold On! Protect head and neck beneath sturdy furniture or interior wall.', priority: 'Critical' },
          { audience: 'Citizen', action: 'Stay clear of glass windows, unreinforced brick facades, and overhead electrical lines.', priority: 'Critical' },
          { audience: 'Citizen', action: 'Expect and prepare for aftershocks. Do NOT use elevators after shaking stops.', priority: 'High' },
          { audience: 'Responder', action: 'Mobilize Urban Search & Rescue (USAR) teams with structural acoustic sensing equipment.', priority: 'Critical' },
          { audience: 'Responder', action: 'Conduct immediate safety triage of hospitals, bridges, and critical arterial transit corridors.', priority: 'Critical' },
          { audience: 'Authority', action: 'Trigger automated gas line shutoff & railway deceleration protocols.', priority: 'Critical' },
          { audience: 'Authority', action: 'Open public parks and open stadiums as emergency gathering assembly zones.', priority: 'High' }
        );
      } else if (warningStage === 'Watch' || warningStage === 'Advisory') {
        actions.push(
          { audience: 'Citizen', action: 'Recent regional seismic tremor detected. Inspect residence for structural fissures or gas odors.', priority: 'High' },
          { audience: 'Citizen', action: 'Fasten tall heavy furniture to walls; ensure exit doorways remain unblocked.', priority: 'Medium' },
          { audience: 'Responder', action: 'Verify seismic sensor mesh node connectivity; test emergency communication repeaters.', priority: 'Medium' },
          { audience: 'Authority', action: 'Review structural integrity reports of public bridges and multi-storey complexes.', priority: 'High' }
        );
      } else {
        actions.push(
          { audience: 'Citizen', action: 'Know your local earthquake safe spots and emergency rally points.', priority: 'Low' },
          { audience: 'Responder', action: 'Maintain USAR gear calibration.', priority: 'Low' },
          { audience: 'Authority', action: 'Log continuous accelerometer and seismograph telemetry feeds.', priority: 'Low' }
        );
      }
      break;

    case 'Cyclone':
    case 'Extreme Weather':
      if (warningStage === 'Emergency' || warningStage === 'Warning') {
        actions.push(
          { audience: 'Citizen', action: 'Remain indoors in the strongest reinforced interior room away from windows and roof structures.', priority: 'Critical' },
          { audience: 'Citizen', action: 'Fishermen and coastal vessels must return to port immediately and secure marine moorings.', priority: 'Critical' },
          { audience: 'Responder', action: 'Pre-position debris-clearing heavy machinery and power saw teams along primary corridors.', priority: 'Critical' },
          { audience: 'Authority', action: 'Order mandatory evacuation of low-lying coastal zones within 5km of coastline.', priority: 'Critical' }
        );
      } else if (warningStage === 'Watch') {
        actions.push(
          { audience: 'Citizen', action: 'Secure rooftop solar panels, tin sheets, outdoor furniture, and antennas.', priority: 'High' },
          { audience: 'Citizen', action: 'Store at least 72 hours of drinking water, non-perishable food, and power banks.', priority: 'High' },
          { audience: 'Responder', action: 'Check diesel generator fuel reserves at all emergency hospitals and relief shelters.', priority: 'High' },
          { audience: 'Authority', action: 'Suspend all maritime and port operations; prepare cyclone shelters with food rations.', priority: 'High' }
        );
      } else {
        actions.push(
          { audience: 'Citizen', action: 'Monitor coastal weather bulletins for track updates.', priority: 'Low' },
          { audience: 'Responder', action: 'Standard storm preparedness checklist.', priority: 'Low' },
          { audience: 'Authority', action: 'Track meteorological radar and satellite atmospheric pressure gradients.', priority: 'Low' }
        );
      }
      break;

    default:
      actions.push(
        { audience: 'Citizen', action: `Maintain awareness of ${hazardType} advisories via DRISHTI portal.`, priority: 'Medium' },
        { audience: 'Responder', action: 'Monitor incident reports in local operational sector.', priority: 'Medium' },
        { audience: 'Authority', action: 'Log environmental telemetry signals for regional sector.', priority: 'Low' }
      );
      break;
  }

  return actions;
}

// ============================================================================
// PART C — FLOOD RISK CALCULATION ENGINE
// ============================================================================

/**
 * Calculates Flood Hazard Risk using transparent multi-source evidence fusion.
 * 
 * WEIGHT DISTRIBUTION:
 *  - When river level/discharge data IS available:
 *      1. Rainfall Intensity & Accumulation: 35%
 *      2. River / GloFAS Streamflow & Rate of Rise: 25%
 *      3. Verified Crowd & Waterlogging Reports: 15%
 *      4. Terrain & Catchment Vulnerability: 15%
 *      5. Barometric Pressure & Saturation: 10%
 *  - When river gauge data is NOT available (pure meteorological & community telemetry):
 *      1. Rainfall Intensity & Real 24h Accumulation: 45%
 *      2. Verified Crowd Reports: 25%
 *      3. Terrain Vulnerability: 20%
 *      4. Barometric Pressure & Saturation: 10%
 */
export function calculateFloodRisk(input: FloodRiskInput): HazardRiskAssessment {
  const timestamp = input.timestamp || new Date().toISOString();
  const triggers: PrimaryTrigger[] = [];
  const evidenceSources: EvidenceSource[] = [];

  const hasRiverData = Boolean(
    input.isRiverGaugeAvailable ||
    typeof input.riverDischargeM3s === 'number' ||
    typeof input.waterLevelMeters === 'number'
  );

  // 1. Rainfall Component (0 - 100 sub-score)
  let rainScore = 0;
  const rate = input.precipitationRateMmPerHour || 0;
  if (rate <= 0.5) rainScore = 5;
  else if (rate <= 5) rainScore = 10 + (rate / 5) * 25;
  else if (rate <= 15) rainScore = 35 + ((rate - 5) / 10) * 30;
  else if (rate <= 35) rainScore = 65 + ((rate - 15) / 20) * 25;
  else rainScore = Math.min(100, 90 + ((rate - 35) / 25) * 10);

  // Real 24h rolling accumulation bonus
  if (input.precipitationAccumulation24hMm && input.precipitationAccumulation24hMm > 30) {
    rainScore = Math.min(100, rainScore + Math.min(25, (input.precipitationAccumulation24hMm - 30) * 0.5));
  }

  // 24h forecast precipitation bonus (saturated catchment forecast)
  if (input.forecastPrecipitationAccumulation24hMm && input.forecastPrecipitationAccumulation24hMm > 40) {
    rainScore = Math.min(100, rainScore + Math.min(15, (input.forecastPrecipitationAccumulation24hMm - 40) * 0.3));
  }

  if (rate >= 2.0 || (input.precipitationAccumulation24hMm && input.precipitationAccumulation24hMm >= 25)) {
    triggers.push({
      parameter: 'Observed Precipitation',
      observedValue: `${rate.toFixed(1)} mm/h (24h Past: ${input.precipitationAccumulation24hMm !== undefined ? `${input.precipitationAccumulation24hMm.toFixed(1)} mm` : 'N/A'})`,
      threshold: '5.0 mm/h (Advisory) / 15.0 mm/h (Warning)',
      contribution: Math.round(hasRiverData ? rainScore * 0.35 : rainScore * 0.45)
    });
  }

  const precip24hDesc = input.precipitationAccumulation24hMm !== undefined 
    ? `24h rolling accumulation: ${input.precipitationAccumulation24hMm.toFixed(1)} mm (observed).` 
    : '24h accumulation: unavailable.';
  const forecastDesc = input.forecastPrecipitationAccumulation24hMm !== undefined
    ? `24h forecast rain: ${input.forecastPrecipitationAccumulation24hMm.toFixed(1)} mm (forecast-derived).`
    : '';

  evidenceSources.push({
    sourceType: 'Open_Meteo',
    sourceName: 'Open-Meteo Meteorological Telemetry',
    description: `Precipitation rate: ${rate.toFixed(1)} mm/h (observed). ${precip24hDesc} ${forecastDesc}`,
    reliability: 92,
    provenance: 'DIRECT OBSERVATION',
    timestamp
  });

  // 2. River Hydrology / Water Level Gauge Component (0 - 100 sub-score)
  let riverScore = 0;
  if (hasRiverData) {
    if (typeof input.riverDischargeM3s === 'number') {
      // GloFAS Streamflow Discharge Model
      const curDischarge = input.riverDischargeM3s;
      const maxThreshold = input.riverDischargeMaxM3s || 500;
      const dischargeRatio = curDischarge / maxThreshold;

      if (dischargeRatio < 0.4) riverScore = 15;
      else if (dischargeRatio < 0.75) riverScore = 30 + ((dischargeRatio - 0.4) / 0.35) * 35;
      else if (dischargeRatio < 1.0) riverScore = 65 + ((dischargeRatio - 0.75) / 0.25) * 25;
      else riverScore = Math.min(100, 90 + (dischargeRatio - 1.0) * 20);

      if (input.rateOfRiseM3sPerDay && input.rateOfRiseM3sPerDay > 10) {
        riverScore = Math.min(100, riverScore + Math.min(15, input.rateOfRiseM3sPerDay * 0.3));
      }

      if (dischargeRatio >= 0.5) {
        triggers.push({
          parameter: 'GloFAS River Discharge',
          observedValue: `${curDischarge.toFixed(1)} m³/s (${input.rateOfRiseM3sPerDay ? `${input.rateOfRiseM3sPerDay > 0 ? `+${input.rateOfRiseM3sPerDay}` : input.rateOfRiseM3sPerDay} m³/s/day` : 'steady'})`,
          threshold: `${maxThreshold.toFixed(1)} m³/s (Flood Stage)`,
          contribution: Math.round(riverScore * 0.25)
        });
      }

      evidenceSources.push({
        sourceType: 'GloFAS_Hydrology',
        sourceName: 'GloFAS / ECMWF River Streamflow Network',
        description: `Discharge: ${curDischarge.toFixed(1)} m³/s (Threshold capacity: ${maxThreshold.toFixed(1)} m³/s). 24h trend: ${input.rateOfRiseM3sPerDay || 0} m³/s/day.`,
        reliability: 94,
        provenance: 'DIRECT OBSERVATION',
        timestamp
      });
    } else if (typeof input.waterLevelMeters === 'number') {
      // Physical Water Level Gauge
      const curLevel = input.waterLevelMeters;
      const threshold = input.floodStageThresholdMeters || 5.0;
      const ratio = curLevel / threshold;

      if (ratio < 0.6) riverScore = 10;
      else if (ratio < 0.85) riverScore = 25 + ((ratio - 0.6) / 0.25) * 35;
      else if (ratio < 1.0) riverScore = 60 + ((ratio - 0.85) / 0.15) * 25;
      else riverScore = Math.min(100, 85 + (ratio - 1.0) * 30);

      if (input.rateOfRiseCmPerHour && input.rateOfRiseCmPerHour > 10) {
        riverScore = Math.min(100, riverScore + Math.min(20, input.rateOfRiseCmPerHour * 0.5));
      }

      if (ratio >= 0.7) {
        triggers.push({
          parameter: 'River / Canal Hydrological Level',
          observedValue: `${curLevel.toFixed(2)} m (${input.rateOfRiseCmPerHour ? `+${input.rateOfRiseCmPerHour} cm/h` : 'steady'})`,
          threshold: `${threshold.toFixed(2)} m (Flood Stage)`,
          contribution: Math.round(riverScore * 0.25)
        });
      }

      evidenceSources.push({
        sourceType: 'CWC_River_Gauge',
        sourceName: 'Hydrological River Gauge Sensor',
        description: `Water level measured at ${curLevel.toFixed(2)}m (Danger mark: ${threshold.toFixed(2)}m). Rate of rise: ${input.rateOfRiseCmPerHour || 0} cm/h.`,
        reliability: 95,
        provenance: 'DIRECT OBSERVATION',
        timestamp
      });
    }
  } else {
    // Explicitly record that river gauge is unavailable for this location
    evidenceSources.push({
      sourceType: 'GloFAS_Hydrology',
      sourceName: 'Hydrological Gauge Station Network',
      description: 'River gauge data unavailable for this location (Meteorological-only flood assessment).',
      reliability: 40,
      provenance: 'UNAVAILABLE',
      timestamp
    });
  }

  // 3. Crowd & Community Verified Reports Component (0 - 100 sub-score)
  const reportCount = input.verifiedWaterloggingReportsCount || 0;
  let crowdScore = 0;
  if (reportCount === 0) crowdScore = 0;
  else if (reportCount === 1) crowdScore = 40;
  else if (reportCount === 2) crowdScore = 65;
  else if (reportCount <= 5) crowdScore = 85;
  else crowdScore = 100;

  if (reportCount > 0) {
    triggers.push({
      parameter: 'AI-Verified Waterlogging Incidents',
      observedValue: `${reportCount} genuine reports in sector`,
      threshold: '1 report (Verification) / 3 reports (Cluster)',
      contribution: Math.round(hasRiverData ? crowdScore * 0.15 : crowdScore * 0.25)
    });

    evidenceSources.push({
      sourceType: 'Community_Report',
      sourceName: 'DRISHTI AI-Verified Incident Reports',
      description: `${reportCount} corroborating genuine crowd/responder waterlogging incident reports logged in vicinity.`,
      reliability: 88,
      provenance: 'VERIFIED COMMUNITY REPORT',
      timestamp
    });
  }

  // 4. Terrain & Catchment Vulnerability Component (0 - 100 sub-score)
  let terrainScore = 20;
  if (input.isFloodPlain) terrainScore += 45;
  if (input.isUrbanLowLying) terrainScore += 35;
  terrainScore = Math.min(100, terrainScore);

  if (input.isFloodPlain || input.isUrbanLowLying) {
    triggers.push({
      parameter: 'Catchment Topography & Low-Lying Vulnerability',
      observedValue: input.isFloodPlain && input.isUrbanLowLying ? 'Riverine Floodplain + Dense Urban Basin' : input.isFloodPlain ? 'Riverine Floodplain' : 'Urban Low-Lying Sector',
      threshold: 'Vulnerable Topographic Classification',
      contribution: Math.round(hasRiverData ? terrainScore * 0.15 : terrainScore * 0.20)
    });

    evidenceSources.push({
      sourceType: 'Historical_Terrain',
      sourceName: 'Geospatial Topographic Knowledge Base',
      description: 'Sector classified within historical riverine alluvial floodplain and low-lying urban depression contour.',
      reliability: 85,
      provenance: 'ESTIMATED',
      timestamp
    });
  }

  // 5. Atmospheric & Pressure Saturation Component (0 - 100 sub-score)
  let atmosphericScore = 10;
  const humidity = input.humidityPercent || 75;
  const pressure = input.surfacePressureHpa || 1010;

  if (humidity > 85) atmosphericScore += (humidity - 85) * 3;
  if (pressure < 1005) atmosphericScore += (1005 - pressure) * 3.5;
  atmosphericScore = Math.min(100, atmosphericScore);

  if (pressure < 1000 || humidity > 92) {
    triggers.push({
      parameter: 'Atmospheric Pressure & Humidity Saturation',
      observedValue: `${pressure.toFixed(1)} hPa / ${humidity}% RH`,
      threshold: '< 1005 hPa / > 85% RH',
      contribution: Math.round(atmosphericScore * 0.10)
    });
  }

  // Final Composite Risk Calculation
  let compositeRisk = 0;
  if (hasRiverData) {
    compositeRisk = (rainScore * 0.35) + (riverScore * 0.25) + (crowdScore * 0.15) + (terrainScore * 0.15) + (atmosphericScore * 0.10);
  } else {
    compositeRisk = (rainScore * 0.45) + (crowdScore * 0.25) + (terrainScore * 0.20) + (atmosphericScore * 0.10);
  }

  const finalRiskScore = Math.max(0, Math.min(100, Math.round(compositeRisk)));
  const riskLevel = getRiskLevel(finalRiskScore);
  const warningStage = getWarningStage(finalRiskScore);
  const confidence = calculateConfidence(evidenceSources);
  const recommendedActions = generateRecommendedActions('Flood', warningStage, riskLevel);

  let leadTimeMinutes: number | undefined;
  if (finalRiskScore >= 70) {
    leadTimeMinutes = rate >= 30 ? 45 : 90;
  } else if (finalRiskScore >= 45) {
    leadTimeMinutes = 180;
  } else if (finalRiskScore >= 25) {
    leadTimeMinutes = 360;
  }

  const impactRadiusKm = Math.min(45, Math.max(3, Math.round(5 + (finalRiskScore / 100) * 25 + (input.isFloodPlain ? 8 : 0))));

  const assessmentModeText = hasRiverData 
    ? 'Multi-sensor river & meteorological assessment'
    : 'Meteorological-only flood assessment (River gauge data unavailable for this location)';

  return {
    id: `risk-flood-${timestamp.slice(0, 16).replace(/[^0-9]/g, '')}`,
    hazardType: 'Flood',
    riskScore: finalRiskScore,
    confidence,
    riskLevel,
    warningStage,
    timestamp,
    location: input.location,
    centerCoordinates: input.centerCoordinates,
    impactRadiusKm,
    leadTimeMinutes,
    primaryTriggers: triggers,
    evidenceSources,
    recommendedActions,
    affectedPopulation: finalRiskScore >= 70 ? 'High density residential & commercial corridor' : 'Local monitoring area',
    status: finalRiskScore >= 50 ? 'Active' : 'Monitoring',
    summary: `Flood early warning assessment score ${finalRiskScore}/100 (${riskLevel} risk, ${warningStage} stage). ${assessmentModeText}. Rainfall: ${rate.toFixed(1)} mm/h.`
  };
}

// ============================================================================
// PART D — FIRE RISK CALCULATION ENGINE
// ============================================================================

/**
 * Calculates Wildfire & Urban Fire Hazard Risk using real NASA FIRMS detections
 * and meteorological fire danger indices.
 * 
 * Clearly distinguishes between:
 *  - "Satellite fire detection" (NASA FIRMS active thermal anomalies)
 *  - "Weather-based fire danger" (temperature, humidity, wind spread factors)
 */
export function calculateFireRisk(input: FireRiskInput): HazardRiskAssessment {
  const timestamp = input.timestamp || new Date().toISOString();
  const triggers: PrimaryTrigger[] = [];
  const evidenceSources: EvidenceSource[] = [];

  const temp = input.temperatureCelsius;
  const rh = input.relativeHumidityPercent;
  const wind = input.windSpeedKmH;
  const precip = input.recentPrecipitationMm ?? 0;
  const dryDays = input.consecutiveDryDays !== undefined 
    ? input.consecutiveDryDays 
    : (precip === 0 ? 3 : 0);
  const fireReports = input.verifiedFireReportsCount ?? 0;
  const firmsDetections = input.firmsDetectionsCount ?? 0;

  // 1. Temperature Sub-score (25% weight)
  let tempScore = 10;
  if (temp > 25) {
    tempScore = Math.min(100, 20 + ((temp - 25) / 20) * 80);
  }

  // 2. Relative Humidity Sub-score (20% weight) (Inversely proportional)
  let rhScore = 10;
  if (rh < 60) {
    rhScore = Math.min(100, Math.max(10, 10 + ((60 - rh) / 45) * 85));
  }

  // 3. Wind Speed Sub-score (15% weight)
  let windScore = 10;
  if (wind > 8) {
    windScore = Math.min(100, 15 + ((wind - 8) / 42) * 85);
  }

  // 4. Dry Spell Sub-score (10% weight)
  let dryScore = 10;
  if (precip === 0) {
    dryScore = Math.min(100, 25 + Math.min(15, dryDays) * 5);
  } else if (precip < 2) {
    dryScore = 30;
  } else {
    dryScore = 5;
  }

  // 5. NASA FIRMS Satellite Active Thermal Detection Sub-score (20% weight)
  let satelliteScore = 0;
  if (firmsDetections > 0) {
    satelliteScore = Math.min(100, 50 + firmsDetections * 20);
    if (input.firmsNearestDistanceKm && input.firmsNearestDistanceKm <= 5) {
      satelliteScore = Math.min(100, satelliteScore + 20);
    }
  }

  // 6. Ground Fire Reports & Fuel Sub-score (10% weight)
  let fuelReportScore = input.isVegetationDense ? 40 : 15;
  if (fireReports > 0) {
    fuelReportScore = Math.min(100, fuelReportScore + fireReports * 30);
  }

  // Composite Calculation
  let compositeRisk = 0;
  if (firmsDetections > 0) {
    compositeRisk = (tempScore * 0.20) + (rhScore * 0.15) + (windScore * 0.15) + (dryScore * 0.10) + (satelliteScore * 0.25) + (fuelReportScore * 0.15);
  } else {
    // Weather-based fire danger calculation
    compositeRisk = (tempScore * 0.35) + (rhScore * 0.25) + (windScore * 0.20) + (dryScore * 0.10) + (fuelReportScore * 0.10);
  }

  const finalRiskScore = Math.max(0, Math.min(100, Math.round(compositeRisk)));
  const riskLevel = getRiskLevel(finalRiskScore);
  const warningStage = getWarningStage(finalRiskScore);

  // Triggers
  if (firmsDetections > 0) {
    triggers.push({
      parameter: 'NASA FIRMS Satellite Active Fire Detections',
      observedValue: `${firmsDetections} thermal anomaly/anomalies within 25 km (Nearest: ${input.firmsNearestDistanceKm ?? 'N/A'} km)`,
      threshold: '>= 1 Satellite Detection',
      contribution: Math.round(satelliteScore * 0.25)
    });
  }

  if (temp >= 36) {
    triggers.push({
      parameter: 'Ambient Temperature',
      observedValue: `${temp.toFixed(1)}°C`,
      threshold: '> 35.0°C (Elevated Fire Weather)',
      contribution: Math.round(tempScore * 0.20)
    });
  }

  if (rh <= 35) {
    triggers.push({
      parameter: 'Relative Humidity',
      observedValue: `${rh}%`,
      threshold: '< 35% (Dry Tinderbox Threshold)',
      contribution: Math.round(rhScore * 0.15)
    });
  }

  if (wind >= 20) {
    triggers.push({
      parameter: 'Surface Wind Speed',
      observedValue: `${wind.toFixed(1)} km/h`,
      threshold: '> 20.0 km/h (Accelerated Spread Risk)',
      contribution: Math.round(windScore * 0.15)
    });
  }

  if (fireReports > 0) {
    triggers.push({
      parameter: 'Verified Ground Smoke/Fire Reports',
      observedValue: `${fireReports} confirmed incident reports`,
      threshold: '>= 1 Confirmed Fire',
      contribution: Math.round(fuelReportScore * 0.10)
    });
  }

  // Evidence Sources
  if (firmsDetections > 0) {
    evidenceSources.push({
      sourceType: 'NASA_FIRMS',
      sourceName: 'NASA FIRMS VIIRS Active Fire Sensing',
      description: `Satellite pass detected ${firmsDetections} active thermal anomaly / fire source(s) within 25 km radius (Nearest: ${input.firmsNearestDistanceKm ?? 'N/A'} km, Max FRP: ${input.firmsMaxFrpMw ? `${input.firmsMaxFrpMw} MW` : 'N/A'}).`,
      reliability: 96,
      provenance: 'DIRECT OBSERVATION',
      timestamp
    });
  } else {
    evidenceSources.push({
      sourceType: 'NASA_FIRMS',
      sourceName: 'NASA FIRMS VIIRS Active Fire Sensing',
      description: 'No recent satellite thermal anomalies or active fire detections located within 25 km assessment radius.',
      reliability: 92,
      provenance: 'DIRECT OBSERVATION',
      timestamp
    });
  }

  evidenceSources.push({
    sourceType: 'Open_Meteo',
    sourceName: 'Meteorological Surface Observations',
    description: `Temperature: ${temp}°C, Humidity: ${rh}%, Wind: ${wind} km/h (observed). Weather-based fire spread index: ${tempScore > 60 && rhScore > 60 ? 'High' : 'Moderate'}.`,
    reliability: 90,
    provenance: 'DIRECT OBSERVATION',
    timestamp
  });

  if (fireReports > 0) {
    evidenceSources.push({
      sourceType: 'Community_Report',
      sourceName: 'DRISHTI Verified Smoke & Fire Reports',
      description: `${fireReports} active flame/smoke incidents verified in operational sector.`,
      reliability: 88,
      provenance: 'VERIFIED COMMUNITY REPORT',
      timestamp
    });
  }

  const confidence = calculateConfidence(evidenceSources);
  const recommendedActions = generateRecommendedActions('Fire', warningStage, riskLevel);

  const summaryText = firmsDetections > 0
    ? `Active fire hazard: ${firmsDetections} satellite detection(s) confirmed by NASA FIRMS with ${temp}°C ambient temperature.`
    : `Weather-based fire danger score ${finalRiskScore}/100 (${riskLevel}). No active satellite fire detections in radius.`;

  return {
    id: `risk-fire-${timestamp.slice(0, 16).replace(/[^0-9]/g, '')}`,
    hazardType: 'Fire',
    riskScore: finalRiskScore,
    confidence,
    riskLevel,
    warningStage,
    timestamp,
    location: input.location,
    centerCoordinates: input.centerCoordinates,
    impactRadiusKm: Math.min(30, Math.max(2, Math.round(3 + (finalRiskScore / 100) * 20))),
    leadTimeMinutes: finalRiskScore >= 70 ? 60 : 240,
    primaryTriggers: triggers,
    evidenceSources,
    recommendedActions,
    status: finalRiskScore >= 50 ? 'Active' : 'Monitoring',
    summary: summaryText
  };
}

// ============================================================================
// PART E — EARTHQUAKE SEISMIC SHOCKWAVE RISK ENGINE
// ============================================================================

/**
 * Calculates Seismic Shaking Hazard Risk from USGS detected earthquake telemetry.
 * 
 * SCIENTIFIC CLARIFICATION & SAFETY PRINCIPLE:
 * This model assesses ground motion attenuation and structural shaking from
 * a DETECTED tectonic event from the USGS Global Seismographic Network.
 * DRISHTI NEVER claims to predict an earthquake before it happens.
 */
export function calculateEarthquakeRisk(input: EarthquakeRiskInput): HazardRiskAssessment {
  const timestamp = input.eventTimestamp || new Date().toISOString();
  const triggers: PrimaryTrigger[] = [];
  const evidenceSources: EvidenceSource[] = [];

  const targetCoords = input.userCoordinates || input.centerCoordinates;
  const distKm = input.epicentralDistanceKm ?? Math.round(getDistance(
    targetCoords[0],
    targetCoords[1],
    input.eventCoordinates[0],
    input.eventCoordinates[1]
  ));

  const mag = input.magnitude;
  const depth = Math.max(1, input.depthKm);
  const hypocentralDist = input.hypocentralDistanceKm ?? Math.round(Math.sqrt(distKm * distKm + depth * depth));

  // Joyner-Boore / Campbell attenuation Peak Ground Acceleration (PGA in g)
  const pgaEstimatedG = input.estimatedPgaG ?? parseFloat(((Math.pow(10, 0.5 * mag - 1.25) / Math.pow(hypocentralDist + 15, 1.15))).toFixed(4));
  
  // Calculate local seismic risk score (0 to 100)
  let seismicScore = 0;

  if (distKm > 800 && mag < 7.5) {
    seismicScore = 5; // Distant event with negligible local ground motion
  } else if (distKm > 400 && mag < 6.5) {
    seismicScore = 12;
  } else {
    // Proximity + Magnitude + Depth attenuation
    const baseEnergyScore = Math.min(100, Math.max(10, (mag / 8.5) * 85));
    const distanceAttenuation = Math.max(0.05, Math.exp(-distKm / (mag * 35)));
    const depthPenalty = depth < 20 ? 1.2 : depth > 70 ? 0.75 : 1.0;

    seismicScore = Math.min(100, baseEnergyScore * distanceAttenuation * depthPenalty);
  }

  const finalRiskScore = Math.max(0, Math.min(100, Math.round(seismicScore)));
  const riskLevel = getRiskLevel(finalRiskScore);
  const warningStage = getWarningStage(finalRiskScore);

  // Populate triggers
  triggers.push({
    parameter: 'Detected Seismic Magnitude',
    observedValue: `M ${mag.toFixed(1)} (USGS)`,
    threshold: 'M 4.0 (Noticeable) / M 6.0 (Destructive)',
    contribution: Math.round((mag / 9.0) * 50)
  });

  triggers.push({
    parameter: 'Epicentral Proximity & Attenuation',
    observedValue: `${distKm.toLocaleString()} km from user location (${distKm > 800 ? 'Distant' : distKm > 300 ? 'Regional' : 'Near-Source'})`,
    threshold: '< 100 km (High Impact Proximity)',
    contribution: Math.round(Math.max(5, 50 - (distKm / 10)))
  });

  triggers.push({
    parameter: 'Focal Hypocentral Depth',
    observedValue: `${depth.toFixed(1)} km depth (${depth < 20 ? 'Shallow Crustal' : 'Intermediate'})`,
    threshold: '< 30 km (Shallow High Energy Focus)',
    contribution: depth < 20 ? 20 : 10
  });

  let attenuationText = '';
  if (distKm > 800) {
    attenuationText = `Distant seismic event (${distKm.toLocaleString()} km away). Shockwave energy attenuated to imperceptible baseline at user location.`;
  } else if (distKm > 300) {
    attenuationText = `Regional seismic event (${distKm} km away). Ground motion strongly attenuated (Estimated PGA: ${pgaEstimatedG}g).`;
  } else if (pgaEstimatedG >= 0.005) {
    attenuationText = `Near-source event (${distKm} km, depth ${depth} km). Estimated PGA: ${pgaEstimatedG}g. Perceptible shaking likely.`;
  } else {
    attenuationText = `Intermediate distance (${distKm} km). Estimated local PGA: ${pgaEstimatedG}g.`;
  }

  evidenceSources.push({
    sourceType: 'USGS_Seismic',
    sourceName: 'USGS Global Seismographic Network (GSN)',
    description: `Detected Seismic Activity: M${mag.toFixed(1)} event at ${input.placeDescription || 'Regional Epicenter'}. Focal depth: ${depth.toFixed(1)} km. ${attenuationText}`,
    reliability: 98,
    provenance: 'DIRECT OBSERVATION',
    timestamp
  });

  const impactRadiusKm = Math.max(15, Math.round(Math.pow(10, 0.43 * mag - 0.9)));
  const confidence = calculateConfidence(evidenceSources);
  const recommendedActions = generateRecommendedActions('Earthquake', warningStage, riskLevel);

  return {
    id: `risk-quake-${timestamp.slice(0, 16).replace(/[^0-9]/g, '')}`,
    hazardType: 'Earthquake',
    riskScore: finalRiskScore,
    confidence,
    riskLevel,
    warningStage,
    timestamp,
    location: input.location,
    centerCoordinates: input.centerCoordinates,
    impactRadiusKm,
    leadTimeMinutes: 0,
    primaryTriggers: triggers,
    evidenceSources,
    recommendedActions,
    affectedPopulation: finalRiskScore >= 50 ? 'Immediate structural shockwave impact zone' : 'Perceptible shaking zone',
    status: finalRiskScore >= 50 ? 'Active' : 'Monitoring',
    summary: distKm > 500
      ? `Detected Seismic Activity: M${mag.toFixed(1)} event approximately ${distKm.toLocaleString()} km away. Local shaking risk is reduced because of distance attenuation.`
      : `Detected Seismic Activity: M${mag.toFixed(1)} event ${distKm}km away at ${depth}km focal depth. Local risk score: ${finalRiskScore}/100 (${riskLevel}).`
  };
}

// ============================================================================
// PART F — CYCLONE / SEVERE WIND RISK ENGINE
// ============================================================================

/**
 * Calculates Cyclone & Extreme Wind Storm Risk from meteorological barometric & anemometer feeds.
 */
export function calculateCycloneRisk(input: CycloneRiskInput): HazardRiskAssessment {
  const timestamp = input.timestamp || new Date().toISOString();
  const triggers: PrimaryTrigger[] = [];
  const evidenceSources: EvidenceSource[] = [];

  const wind = input.windSpeedKmH;
  const gusts = input.windGustsKmH || wind * 1.35;
  const hasPressure = typeof input.surfacePressureHpa === 'number';
  const pressure = input.surfacePressureHpa;
  const isCoastal = input.isCoastalRegion ?? true;
  const cape = input.capeJkg;

  // IMD / WMO Cyclone Scale Approximation:
  let windScore = 10;
  if (wind >= 120 || gusts >= 150) windScore = 100;
  else if (wind >= 90 || gusts >= 115) windScore = 85;
  else if (wind >= 62 || gusts >= 85) windScore = 65;
  else if (wind >= 40) windScore = 40;
  else windScore = Math.min(30, (wind / 40) * 30);

  let pressureScore = 15;
  if (hasPressure && pressure !== undefined) {
    if (pressure < 980) pressureScore = 100;
    else if (pressure < 995) pressureScore = 80;
    else if (pressure < 1005) pressureScore = 45;
    else pressureScore = 15;
  }

  // CAPE atmospheric instability bonus
  let capeBonus = 0;
  if (cape !== undefined && cape > 1500) {
    capeBonus = Math.min(15, ((cape - 1500) / 1500) * 15);
  }

  const coastalMultiplier = isCoastal ? 1.15 : 0.85;
  let compositeRisk = 0;
  if (hasPressure) {
    compositeRisk = ((windScore * 0.65) + (pressureScore * 0.35) + capeBonus) * coastalMultiplier;
  } else {
    compositeRisk = (windScore + capeBonus) * coastalMultiplier;
  }

  const finalRiskScore = Math.max(0, Math.min(100, Math.round(Math.min(100, compositeRisk))));
  const riskLevel = getRiskLevel(finalRiskScore);
  const warningStage = getWarningStage(finalRiskScore);

  if (wind >= 40) {
    triggers.push({
      parameter: 'Sustained Wind Speed & Gusts',
      observedValue: `${wind.toFixed(1)} km/h (Gusts: ${gusts.toFixed(1)} km/h)`,
      threshold: '62 km/h (Gale Storm) / 90 km/h (Severe Cyclonic Storm)',
      contribution: Math.round(windScore * 0.65)
    });
  }

  if (hasPressure && pressure !== undefined && pressure <= 1005) {
    triggers.push({
      parameter: 'Central Barometric Pressure Drop',
      observedValue: `${pressure.toFixed(1)} hPa`,
      threshold: '< 1000 hPa (Depression / Storm Center)',
      contribution: Math.round(pressureScore * 0.35)
    });
  }

  if (cape !== undefined && cape > 1500) {
    triggers.push({
      parameter: 'Convective Instability (CAPE)',
      observedValue: `${Math.round(cape)} J/kg`,
      threshold: '> 1500 J/kg (Severe Convection Potential)',
      contribution: Math.round(capeBonus)
    });
  }

  const pressureDesc = hasPressure && pressure !== undefined
    ? `Surface pressure: ${pressure.toFixed(1)} hPa (observed).`
    : 'Surface pressure: unavailable.';
  const capeDesc = cape !== undefined ? `CAPE: ${Math.round(cape)} J/kg (convective energy).` : '';

  evidenceSources.push({
    sourceType: 'Open_Meteo',
    sourceName: 'Open-Meteo Anemometer & Atmospheric Feed',
    description: `Sustained wind: ${wind.toFixed(1)} km/h, Gusts: ${gusts.toFixed(1)} km/h (observed). ${pressureDesc} ${capeDesc}`,
    reliability: 92,
    provenance: 'DIRECT OBSERVATION',
    timestamp
  });

  const confidence = calculateConfidence(evidenceSources);
  const recommendedActions = generateRecommendedActions('Cyclone', warningStage, riskLevel);

  return {
    id: `risk-cyclone-${timestamp.slice(0, 16).replace(/[^0-9]/g, '')}`,
    hazardType: 'Cyclone',
    riskScore: finalRiskScore,
    confidence,
    riskLevel,
    warningStage,
    timestamp,
    location: input.location,
    centerCoordinates: input.centerCoordinates,
    impactRadiusKm: Math.min(100, Math.max(15, Math.round(20 + (finalRiskScore / 100) * 60))),
    leadTimeMinutes: finalRiskScore >= 70 ? 120 : 360,
    primaryTriggers: triggers,
    evidenceSources,
    recommendedActions,
    status: finalRiskScore >= 50 ? 'Active' : 'Monitoring',
    summary: `Cyclone / Storm risk ${finalRiskScore}/100 (${riskLevel}) calculated from ${wind.toFixed(1)} km/h sustained wind and observed meteorological indicators.`
  };
}

// ============================================================================
// PART G — COMPOSITE OVERALL RISK ENGINE
// ============================================================================

/**
 * Synthesizes multiple individual hazard assessments into an overall unified assessment.
 */
export function calculateOverallRisk(assessments: HazardRiskAssessment[]): HazardRiskAssessment {
  if (!assessments || assessments.length === 0) {
    const now = new Date().toISOString();
    return {
      id: `risk-overall-nominal-${Date.now()}`,
      hazardType: 'Extreme Weather',
      riskScore: 12,
      confidence: 90,
      riskLevel: 'Low',
      warningStage: 'Normal',
      timestamp: now,
      location: 'Local Region',
      centerCoordinates: [20.4625, 85.8828],
      impactRadiusKm: 10,
      primaryTriggers: [],
      evidenceSources: [],
      recommendedActions: generateRecommendedActions('Extreme Weather', 'Normal', 'Low'),
      status: 'Monitoring',
      summary: 'All monitored environmental, meteorological, and seismic parameters within normal baseline thresholds.'
    };
  }

  // Sort assessments by descending risk score
  const sorted = [...assessments].sort((a, b) => b.riskScore - a.riskScore);
  const dominant = sorted[0];

  // If multiple high-risk hazards exist simultaneously (compound disaster), calculate composite multi-hazard score
  let compositeScore = dominant.riskScore;
  if (sorted.length > 1) {
    const secondarySum = sorted.slice(1).reduce((sum, item) => sum + (item.riskScore * 0.15), 0);
    compositeScore = Math.min(100, Math.round(dominant.riskScore + secondarySum));
  }

  const overallLevel = getRiskLevel(compositeScore);
  const overallStage = getWarningStage(compositeScore);

  // Combine primary triggers from all active hazards
  const allTriggers: PrimaryTrigger[] = [];
  const allSources: EvidenceSource[] = [];
  const sourceIds = new Set<string>();

  sorted.forEach(a => {
    allTriggers.push(...a.primaryTriggers);
    a.evidenceSources.forEach(s => {
      if (!sourceIds.has(s.sourceName)) {
        sourceIds.add(s.sourceName);
        allSources.push(s);
      }
    });
  });

  const overallConfidence = calculateConfidence(allSources);

  return {
    id: `risk-composite-${Date.now()}`,
    hazardType: dominant.hazardType,
    riskScore: compositeScore,
    confidence: overallConfidence,
    riskLevel: overallLevel,
    warningStage: overallStage,
    timestamp: new Date().toISOString(),
    location: dominant.location,
    centerCoordinates: dominant.centerCoordinates,
    impactRadiusKm: dominant.impactRadiusKm,
    leadTimeMinutes: dominant.leadTimeMinutes,
    primaryTriggers: allTriggers.slice(0, 6),
    evidenceSources: allSources,
    recommendedActions: dominant.recommendedActions,
    affectedPopulation: dominant.affectedPopulation,
    status: compositeScore >= 50 ? 'Active' : 'Monitoring',
    summary: `Unified multi-hazard risk assessment: Primary threat is ${dominant.hazardType} (${dominant.riskScore}/100), composite risk index ${compositeScore}/100 (${overallLevel}).`
  };
}

// ============================================================================
// PART H — ALARM FATIGUE MITIGATION ENGINE
// ============================================================================

/**
 * Determines whether a newly calculated assessment warrants creating a public/responder warning event.
 * 
 * ALARM FATIGUE SUPPRESSION RULES:
 *  1. If no previous assessment existed and current stage is NOT Normal -> TRUE
 *  2. If WarningStage escalates (e.g. Watch -> Warning) -> TRUE (Immediate Escalation)
 *  3. If WarningStage downgrades (e.g. Warning -> Watch) -> TRUE (Safe All-Clear / Downgrade Update)
 *  4. If HazardType changes -> TRUE
 *  5. If riskScore fluctuates by >= thresholdDelta (default 10 points) within same stage -> TRUE
 *  6. Minor fluctuations (e.g. 62 -> 63 or 62 -> 64) -> FALSE (Noise Filtered)
 *  7. Repeated identical telemetry -> FALSE (Duplicate Filtered)
 */
export function shouldIssueWarning(
  previousAssessment: HazardRiskAssessment | null,
  currentAssessment: HazardRiskAssessment,
  thresholdDelta = 10
): boolean {
  if (!previousAssessment) {
    // Initial evaluation: only issue if beyond nominal baseline
    return currentAssessment.warningStage !== 'Normal';
  }

  // 1. Stage change (Escalation or De-escalation)
  if (previousAssessment.warningStage !== currentAssessment.warningStage) {
    return true;
  }

  // 2. Hazard Type transition
  if (previousAssessment.hazardType !== currentAssessment.hazardType) {
    return true;
  }

  // 3. Significant numerical change beyond noise threshold
  const delta = Math.abs(currentAssessment.riskScore - previousAssessment.riskScore);
  if (delta >= thresholdDelta && currentAssessment.warningStage !== 'Normal') {
    return true;
  }

  // 4. Minor fluctuation within same stage -> Suppress to avoid alarm fatigue
  return false;
}

// ============================================================================
// PART K — VALIDATION & SELF-TEST SUITE
// ============================================================================

export interface SelfTestResult {
  scenarioNumber: number;
  scenarioName: string;
  passed: boolean;
  details: string;
}

/**
 * Runs deterministic self-validation tests covering all 6 mandatory requirements.
 * Can be executed without any external test runner.
 */
export function runRiskIntelligenceSelfTest(): { allPassed: boolean; results: SelfTestResult[] } {
  const results: SelfTestResult[] = [];
  const coords: [number, number] = [20.4625, 85.8828];

  // Test 1: Normal weather -> Low risk / Normal stage
  const test1 = calculateFloodRisk({
    location: 'Cuttack Urban Center',
    centerCoordinates: coords,
    precipitationRateMmPerHour: 0.2,
    precipitationAccumulation24hMm: 1.0,
    surfacePressureHpa: 1012,
    humidityPercent: 65,
    verifiedWaterloggingReportsCount: 0,
    isFloodPlain: false
  });
  const t1Passed = test1.riskScore <= RISK_THRESHOLDS.LOW_MAX && test1.warningStage === 'Normal';
  results.push({
    scenarioNumber: 1,
    scenarioName: 'Normal Weather Conditions -> Low Risk / Normal Stage',
    passed: t1Passed,
    details: `Score: ${test1.riskScore}, Level: ${test1.riskLevel}, Stage: ${test1.warningStage}`
  });

  // Test 2: Heavy rainfall + verified waterlogging reports -> High/Severe Flood Risk
  const test2 = calculateFloodRisk({
    location: 'Khapuria Low-Lying Drainage Sector',
    centerCoordinates: coords,
    precipitationRateMmPerHour: 38.5,
    precipitationAccumulation24hMm: 95.0,
    surfacePressureHpa: 998,
    humidityPercent: 96,
    verifiedWaterloggingReportsCount: 4,
    isFloodPlain: true,
    isUrbanLowLying: true
  });
  const t2Passed = test2.riskScore >= 70 && (test2.warningStage === 'Warning' || test2.warningStage === 'Emergency');
  results.push({
    scenarioNumber: 2,
    scenarioName: 'Heavy Rainfall (38.5mm/h) + 4 Verified Reports -> High/Severe Flood Risk',
    passed: t2Passed,
    details: `Score: ${test2.riskScore}, Level: ${test2.riskLevel}, Stage: ${test2.warningStage}, LeadTime: ${test2.leadTimeMinutes}min`
  });

  // Test 3: High temperature + low humidity + strong wind -> Elevated Fire Risk
  const test3 = calculateFireRisk({
    location: 'Dry Shrub & Industrial Sector',
    centerCoordinates: coords,
    temperatureCelsius: 43.5,
    relativeHumidityPercent: 18,
    windSpeedKmH: 34,
    consecutiveDryDays: 14,
    recentPrecipitationMm: 0,
    verifiedFireReportsCount: 2
  });
  const t3Passed = test3.riskScore >= 70 && test3.hazardType === 'Fire';
  results.push({
    scenarioNumber: 3,
    scenarioName: 'High Temp (43.5°C) + Low Humidity (18%) + Wind (34km/h) -> Elevated Fire Risk',
    passed: t3Passed,
    details: `Score: ${test3.riskScore}, Level: ${test3.riskLevel}, Stage: ${test3.warningStage}`
  });

  // Test 4: Significant nearby USGS earthquake -> Elevated Seismic Shockwave Risk
  const test4 = calculateEarthquakeRisk({
    location: 'Coastal Subduction Fault Sector',
    centerCoordinates: coords,
    userCoordinates: coords,
    magnitude: 6.4,
    depthKm: 12.0,
    eventCoordinates: [20.65, 86.05], // ~25km away
    eventTimestamp: new Date().toISOString(),
    placeDescription: '25km NE of Cuttack'
  });
  const t4Passed = test4.riskScore >= 60 && test4.hazardType === 'Earthquake';
  results.push({
    scenarioNumber: 4,
    scenarioName: 'Nearby Significant USGS Earthquake (M6.4, 25km away) -> Elevated Seismic Risk',
    passed: t4Passed,
    details: `Score: ${test4.riskScore}, Level: ${test4.riskLevel}, Stage: ${test4.warningStage}, ImpactRadius: ${test4.impactRadiusKm}km`
  });

  // Test 5: Same risk repeated (small delta 62 -> 64) -> shouldIssueWarning = false
  const prevAssess: HazardRiskAssessment = {
    ...test2,
    riskScore: 62,
    riskLevel: 'High',
    warningStage: 'Watch'
  };
  const currAssessSame: HazardRiskAssessment = {
    ...test2,
    riskScore: 64,
    riskLevel: 'High',
    warningStage: 'Watch'
  };
  const shouldAlertMinor = shouldIssueWarning(prevAssess, currAssessSame, 10);
  const t5Passed = shouldAlertMinor === false;
  results.push({
    scenarioNumber: 5,
    scenarioName: 'Minor Noise Delta (62 -> 64 within Watch stage) -> No Duplicate Alert Spam',
    passed: t5Passed,
    details: `shouldIssueWarning returned ${shouldAlertMinor} (Correctly suppressed alarm fatigue)`
  });

  // Test 6: Large risk increase (62 -> 76, Watch -> Warning) -> shouldIssueWarning = true
  const currAssessEscalated: HazardRiskAssessment = {
    ...test2,
    riskScore: 76,
    riskLevel: 'Severe',
    warningStage: 'Warning'
  };
  const shouldAlertEscalation = shouldIssueWarning(prevAssess, currAssessEscalated, 10);
  const t6Passed = shouldAlertEscalation === true;
  results.push({
    scenarioNumber: 6,
    scenarioName: 'Large Risk Increase (62 -> 76, Watch -> Warning) -> Warning Escalation Triggered',
    passed: t6Passed,
    details: `shouldIssueWarning returned ${shouldAlertEscalation} (Correctly escalated)`
  });

  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
}
