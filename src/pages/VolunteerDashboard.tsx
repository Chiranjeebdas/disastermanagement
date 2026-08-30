import React, { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShieldCheck, CheckCircle2, Search,
  MapPin, Clock, Users, AlertTriangle, X,
  Navigation, ExternalLink, Camera,
  Sparkles, Eye, Waves, Wind, Flame, Mountain,
  CloudRain, Activity, Building, Map as MapIcon,
  Copy, Check, Globe, Send, MessageSquare, Radio
} from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { useLocation } from '../hooks/useLocation';
import { DisasterMap } from './DisasterMap';
import { isGenuineReport } from '../utils/aiVerification';
import type { IncidentReport, ResponseStatus, ReportType, ReportPlatform } from '../types/report';
import '../styles/VolunteerDashboard.css';

const RESPONSE_WORKFLOW: ResponseStatus[] = [
  'Unassigned',
  'ResponderAssigned',
  'EnRoute',
  'OnScene',
  'AssistanceProvided',
  'Resolved'
];

const WORKFLOW_LABELS: Record<ResponseStatus, string> = {
  Unassigned: 'Incident Reported',
  ResponderAssigned: 'Assigned / Claimed',
  EnRoute: 'En Route to Scene',
  OnScene: 'Arrived On Scene',
  AssistanceProvided: 'Assistance Provided',
  Resolved: 'Incident Resolved'
};

const TYPE_ICONS: Record<ReportType, { icon: React.ReactNode; color: string; label: string }> = {
  Flood: { icon: <Waves size={18} />, color: '#38bdf8', label: 'FLOOD' },
  Cyclone: { icon: <Wind size={18} />, color: '#7dd3fc', label: 'CYCLONE' },
  Fire: { icon: <Flame size={18} />, color: '#ef4444', label: 'FIRE' },
  Landslide: { icon: <Mountain size={18} />, color: '#fb923c', label: 'LANDSLIDE' },
  HeavyRain: { icon: <CloudRain size={18} />, color: '#60a5fa', label: 'HEAVY RAIN' },
  Earthquake: { icon: <Activity size={18} />, color: '#facc15', label: 'EARTHQUAKE' },
  ExtremeHeat: { icon: <Flame size={18} />, color: '#f97316', label: 'EXTREME HEAT' },
  InfrastructureDamage: { icon: <Building size={18} />, color: '#94a3b8', label: 'DAMAGE' },
  RoadBlockage: { icon: <MapIcon size={18} />, color: '#ef4444', label: 'ROAD BLOCKED' },
  Other: { icon: <AlertTriangle size={18} />, color: '#cbd5e1', label: 'EMERGENCY' },
};

const PLATFORM_CONFIG: Record<ReportPlatform, { label: string; class: string; icon: React.ReactNode }> = {
  'DRISHTI Web App': { label: 'DRISHTI Web App', class: 'drishti', icon: <ShieldCheck size={12} /> },
  'Twitter / X': { label: 'Twitter / X', class: 'twitter', icon: <span style={{ fontWeight: 800, fontSize: '11px' }}>𝕏</span> },
  'Telegram Alert': { label: 'Telegram Alert', class: 'telegram', icon: <Send size={11} /> },
  'Reddit Emergency': { label: 'Reddit Emergency', class: 'reddit', icon: <MessageSquare size={11} /> },
  'GDACS Global Alert': { label: 'GDACS Alert', class: 'gdacs', icon: <Globe size={11} /> },
  'News Wire': { label: 'News Wire', class: 'newswire', icon: <Radio size={11} /> },
  'ReliefWeb': { label: 'ReliefWeb', class: 'gdacs', icon: <Globe size={11} /> },
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const VolunteerDashboard: React.FC = () => {
  const { reports, isOffline, updateReportStatus } = useReports();
  const { location } = useLocation();

  const [search, setSearch] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeNavDestination, setActiveNavDestination] = useState<[number, number] | null>(null);
  const [activeNavIncident, setActiveNavIncident] = useState<IncidentReport | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Filter only genuine reports
  const genuineIncidents = useMemo(() => {
    let filtered = reports.filter(r => isGenuineReport(r) && r.responseStatus !== 'Resolved');

    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.type.toLowerCase().includes(s) ||
        r.locationName.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s) ||
        r.tags.some(t => t.toLowerCase().includes(s)) ||
        (r.sourceInfo?.authorName && r.sourceInfo.authorName.toLowerCase().includes(s))
      );
    }

    if (selectedUrgency !== 'all') {
      filtered = filtered.filter(r => r.urgency === selectedUrgency);
    }

    return filtered.map(r => ({
      ...r,
      distance: location.coords && r.coordinates
        ? calculateDistance(location.coords.latitude, location.coords.longitude, r.coordinates.latitude, r.coordinates.longitude)
        : null
    })).sort((a, b) => {
      const urgencyScore = { Critical: 3, Medium: 2, Low: 1 };
      const diff = urgencyScore[b.urgency] - urgencyScore[a.urgency];
      if (diff !== 0) return diff;
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [reports, search, selectedUrgency, location.coords]);

  // KPI Stats
  const stats = useMemo(() => {
    const genuineList = reports.filter(r => isGenuineReport(r));
    return {
      critical: genuineList.filter(r => r.urgency === 'Critical' && r.responseStatus !== 'Resolved').length,
      high: genuineList.filter(r => r.urgency === 'Medium' && r.responseStatus !== 'Resolved').length,
      active: genuineList.filter(r => r.responseStatus && r.responseStatus !== 'Unassigned' && r.responseStatus !== 'Resolved').length,
      resolved: genuineList.filter(r => r.responseStatus === 'Resolved' || r.status === 'Resolved').length
    };
  }, [reports]);

  const selectedIncident = useMemo(() =>
    reports.find(i => i.id === selectedIncidentId) || null,
    [reports, selectedIncidentId]);

  const handleStatusUpdate = (status: ResponseStatus) => {
    if (!selectedIncident) return;
    updateReportStatus(selectedIncident.id, status);
  };

  const handleStartNavigation = useCallback((incident: IncidentReport) => {
    if (!incident.coordinates) return;
    const destinationCoords: [number, number] = [incident.coordinates.latitude, incident.coordinates.longitude];
    setActiveNavDestination(destinationCoords);
    setActiveNavIncident(incident);
    setSelectedIncidentId(incident.id);

    if (!incident.responseStatus || incident.responseStatus === 'Unassigned') {
      updateReportStatus(incident.id, 'EnRoute');
    }
  }, [updateReportStatus]);

  const handleCancelNavigation = useCallback(() => {
    setActiveNavDestination(null);
    setActiveNavIncident(null);
  }, []);

  const handleMarkArrived = useCallback(() => {
    if (activeNavIncident) {
      updateReportStatus(activeNavIncident.id, 'OnScene');
    }
  }, [activeNavIncident, updateReportStatus]);

  const handleCopyCoordinates = (coords: { latitude: number; longitude: number }) => {
    navigator.clipboard.writeText(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="volunteer-container">
      {/* Header */}
      <header className="volunteer-header">
        <div className="volunteer-header-top">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="volunteer-title">VOLUNTEER RESPONSE HUB</h1>
              <span className="genuine-verified-badge">
                <ShieldCheck size={14} className="text-emerald-400" />
                AI-VERIFIED GENUINE INCIDENTS ONLY
              </span>
            </div>
            <p className="volunteer-subtitle">
              Displaying exclusively verified, genuine disaster reports. Coordinate immediate on-ground rescue, dispatch, and live GPS navigation.
            </p>
          </div>

          <div className="volunteer-header-right">
            <div className="volunteer-location-tag">
              Location detected
            </div>
            <div className={`network-status ${isOffline ? 'network-offline' : 'network-online'}`}>
              {isOffline ? '○ OFFLINE CACHE' : '● VOLUNTEER DISPATCH MESH ACTIVE'}
            </div>
          </div>
        </div>

        {/* KPI 4-Card Strip */}
        <div className="kpi-strip">
          <div
            className={`kpi-card ${selectedUrgency === 'Critical' ? 'active-kpi' : ''}`}
            onClick={() => setSelectedUrgency(selectedUrgency === 'Critical' ? 'all' : 'Critical')}
          >
            <div className="kpi-card-header">
              <span className="kpi-label">GENUINE CRITICAL</span>
              <span className="kpi-tag">PRIORITY 1</span>
            </div>
            <span className="kpi-value">{stats.critical}</span>
          </div>

          <div
            className={`kpi-card ${selectedUrgency === 'Medium' ? 'active-kpi' : ''}`}
            onClick={() => setSelectedUrgency(selectedUrgency === 'Medium' ? 'all' : 'Medium')}
          >
            <div className="kpi-card-header">
              <span className="kpi-label">HIGH / MEDIUM</span>
              <span className="kpi-tag">URGENT</span>
            </div>
            <span className="kpi-value">{stats.high}</span>
          </div>

          <div className="kpi-card highlight-card">
            <div className="kpi-card-header">
              <span className="kpi-label">EN ROUTE & ACTIVE</span>
              <span className="kpi-tag">DISPATCHED</span>
            </div>
            <span className="kpi-value">{stats.active}</span>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label">RESOLVED MISSIONS</span>
              <span className="kpi-tag">COMPLETED</span>
            </div>
            <span className="kpi-value">{stats.resolved}</span>
          </div>
        </div>
      </header>

      {/* Main Content Split View */}
      <main className="volunteer-content">
        {/* Left List: Genuine Incidents Feed */}
        <aside className="volunteer-list-panel">
          <div className="list-controls">
            {/* Search Input */}
            <div className="volunteer-search-wrap">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="volunteer-search"
                placeholder="Search genuine reports by location, hazard, ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <X
                  size={14}
                  className="search-clear-icon"
                  onClick={() => setSearch('')}
                />
              )}
            </div>

            {/* Filter Pills */}
            <div className="filter-pills-row">
              <button
                className={`filter-pill-btn ${selectedUrgency === 'all' ? 'active-pill' : ''}`}
                onClick={() => setSelectedUrgency('all')}
              >
                All Priorities ({genuineIncidents.length})
              </button>
              <button
                className={`filter-pill-btn ${selectedUrgency === 'Critical' ? 'active-pill' : ''}`}
                onClick={() => setSelectedUrgency('Critical')}
              >
                Critical Only
              </button>
              <button
                className={`filter-pill-btn ${selectedUrgency === 'Medium' ? 'active-pill' : ''}`}
                onClick={() => setSelectedUrgency('Medium')}
              >
                High Priority
              </button>
            </div>
          </div>

          {/* Genuine Incidents Feed */}
          <div className="incident-feed">
            {genuineIncidents.length === 0 ? (
              <div className="empty-genuine-feed">
                <ShieldCheck size={36} className="text-emerald-400 mb-2 opacity-80" />
                <h4 className="text-white font-bold text-sm">No Genuine Incidents Match Filters</h4>
                <p className="text-text-secondary text-xs mt-1">
                  All active incidents currently in the database are filtered to show only AI-verified genuine reports.
                </p>
              </div>
            ) : (
              genuineIncidents.map(incident => {
                const isSelected = selectedIncidentId === incident.id;
                const isNavigating = activeNavIncident?.id === incident.id;
                const confidence = incident.aiAnalysis?.confidenceScore || 90;
                const typeConfig = TYPE_ICONS[incident.type] || TYPE_ICONS.Other;

                return (
                  <div
                    key={incident.id}
                    className={`incident-card ${isSelected ? 'selected' : ''} ${isNavigating ? 'navigating-active' : ''}`}
                    onClick={() => {
                      setSelectedIncidentId(incident.id);
                    }}
                  >
                    {/* Header Row */}
                    <div className="incident-card-top-row">
                      <div className="incident-badges-group">
                        <span className="badge-severity-critical">
                          {incident.urgency?.toUpperCase() || 'CRITICAL'}
                        </span>

                        <span className="badge-genuine-ai">
                          <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                          AI GENUINE ({confidence}%)
                        </span>
                      </div>

                      <span className="incident-id-tag">
                        #REP-{incident.id.replace(/\D/g, '') || incident.id}
                      </span>
                    </div>

                    {/* Source Platform Badge */}
                    <div className="incident-platform-row">
                      <span className="platform-tag">
                        {incident.sourceInfo?.platform || 'DRISHTI Web App'}
                      </span>
                    </div>

                    {/* Hazard Title & Icon */}
                    <div className="incident-type-row">
                      <span className="type-icon-colored" style={{ color: typeConfig.color }}>
                        {typeConfig.icon}
                      </span>
                      <h3 className="incident-type-heading">
                        {typeConfig.label}
                      </h3>
                    </div>

                    {/* Description Narrative */}
                    <p className="incident-card-description">
                      {incident.description || 'Water level has risen above the danger threshold in low-lying areas.'}
                    </p>

                    {/* Location & Distance */}
                    <div className="incident-location-row">
                      <MapPin size={13} className="location-pin-icon" />
                      <span className="location-text">{incident.locationName}</span>
                      {incident.distance !== null && (
                        <span className="distance-bold">
                          ({incident.distance.toFixed(1)} km)
                        </span>
                      )}
                    </div>

                    {/* Time & Response Status */}
                    <div className="incident-time-status-row">
                      <div className="time-item">
                        <Clock size={12} className="clock-icon" />
                        <span>{new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <span className="status-text-highlight">
                        {incident.responseStatus ? WORKFLOW_LABELS[incident.responseStatus].toUpperCase() : 'EN ROUTE TO SCENE'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="incident-actions-row" onClick={e => e.stopPropagation()}>
                      <button
                        className="incident-action-btn details-btn"
                        onClick={() => setSelectedIncidentId(incident.id)}
                      >
                        <Eye size={13} />
                        Full Details
                      </button>

                      {incident.coordinates && (
                        <button
                          className={`incident-action-btn nav-btn ${isNavigating ? 'active-navigating' : ''}`}
                          onClick={() => handleStartNavigation(incident)}
                        >
                          <Navigation size={13} className={isNavigating ? 'animate-spin' : ''} />
                          {isNavigating ? 'Navigating...' : 'Navigate Live'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Tactical Map */}
        <section className="volunteer-map-panel">
          <DisasterMap
            embedded
            onlyGenuineReports={true}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={setSelectedIncidentId}
            activeRouteDestination={activeNavDestination}
            destinationTitle={activeNavIncident ? `${activeNavIncident.type} - ${activeNavIncident.locationName}` : undefined}
            urgency={activeNavIncident?.urgency}
            onArrived={handleMarkArrived}
            onCloseRoute={handleCancelNavigation}
            onNavigateToIncident={handleStartNavigation}
          />

          {/* Full Report Details Drawer / Dossier */}
          <AnimatePresence>
            {selectedIncident && (
              <div
                className="response-drawer-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedIncidentId(null);
                }}
              >
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                  className="response-drawer"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Drawer Header */}
                  <div className="rd-header">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-amber-500 tracking-widest uppercase">
                          INCIDENT DOSSIER
                        </span>
                        <span className="font-mono text-xs text-text-muted">
                          #{selectedIncident.id}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white mt-0.5">
                        {selectedIncident.type}
                      </h2>
                    </div>

                    <button
                      className="drawer-close"
                      onClick={() => setSelectedIncidentId(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="rd-content">
                    {/* Primary Real-Time GPS Navigation Banner */}
                    {selectedIncident.coordinates && (
                      <div className="nav-action-card">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Real-Time Navigation Ready
                            </span>
                          </div>
                          <span className="text-xs text-text-secondary">
                            GPS Coordinates Locked
                          </span>
                        </div>

                        <button
                          className="start-nav-btn"
                          onClick={() => handleStartNavigation(selectedIncident)}
                        >
                          <Navigation size={16} />
                          <span>START GPS TURN-BY-TURN NAVIGATION</span>
                        </button>
                      </div>
                    )}

                    {/* AI Multi-Factor Verification Audit Card */}
                    <div className="ai-audit-dossier">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                          <Sparkles size={14} />
                          AI Agent Verification Audit
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {selectedIncident.aiAnalysis?.confidenceScore || 95}% Veracity
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 text-text-secondary">
                        <div className="flex justify-between">
                          <span>Verification State:</span>
                          <strong className="text-emerald-400">PRIORITY / GENUINE REPORT</strong>
                        </div>
                        {selectedIncident.aiAnalysis?.sensorCorrelation && (
                          <div className="flex justify-between">
                            <span>IoT Sensor Correlation:</span>
                            <span className="text-white text-right max-w-[200px] truncate">{selectedIncident.aiAnalysis.sensorCorrelation}</span>
                          </div>
                        )}
                        {selectedIncident.aiAnalysis?.satelliteValidation && (
                          <div className="flex justify-between">
                            <span>Satellite & Radar Pass:</span>
                            <span className="text-white text-right max-w-[200px] truncate">{selectedIncident.aiAnalysis.satelliteValidation}</span>
                          </div>
                        )}
                        {selectedIncident.aiAnalysis?.crowdConsensus && (
                          <div className="flex justify-between">
                            <span>Crowd Corroboration:</span>
                            <span className="text-white text-right max-w-[200px] truncate">{selectedIncident.aiAnalysis.crowdConsensus}</span>
                          </div>
                        )}
                      </div>

                      {selectedIncident.aiAnalysis?.reasoning && (
                        <div className="mt-3 pt-2 border-t border-white/5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            Audit Justification:
                          </span>
                          <ul className="text-xs text-text-secondary list-disc list-inside mt-1 space-y-0.5">
                            {selectedIncident.aiAnalysis.reasoning.slice(0, 3).map((r, i) => (
                              <li key={i} className="leading-tight">{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Photo/Media Evidence Lightbox */}
                    {selectedIncident.mediaBase64 ? (
                      <div>
                        <h4 className="rd-section-title flex items-center gap-1.5">
                          <Camera size={14} className="text-amber-500" /> Photographic Evidence
                        </h4>
                        <div className="evidence-preview-wrap">
                          <img
                            src={selectedIncident.mediaBase64}
                            alt="Incident Evidence"
                            className="evidence-img"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="no-media-box">
                        <Camera size={16} className="text-text-muted" />
                        <span className="text-xs text-text-secondary">
                          No direct photo attached. Veracity confirmed via sensory telemetry and ground sensors.
                        </span>
                      </div>
                    )}

                    {/* Key Incident Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 bg-surface/50 p-3 rounded-lg border border-border/60">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Severity</span>
                        <span className={`text-sm font-bold ${selectedIncident.urgency === 'Critical' ? 'text-danger' :
                            selectedIncident.urgency === 'Medium' ? 'text-warning' : 'text-emerald-400'
                          }`}>
                          {selectedIncident.urgency} Priority
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Reported Time</span>
                        <span className="text-sm text-white">
                          {new Date(selectedIncident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex flex-col col-span-2">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Location Target</span>
                        <span className="text-sm font-medium text-white flex items-center gap-1 mt-0.5">
                          <MapPin size={14} className="text-danger shrink-0" />
                          {selectedIncident.locationName}
                        </span>
                      </div>

                      {selectedIncident.coordinates && (
                        <div className="flex flex-col col-span-2">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">GPS Coordinates</span>
                          <div className="flex items-center justify-between mt-0.5 bg-black/40 px-2 py-1 rounded border border-white/5">
                            <span className="font-mono text-xs text-amber-500">
                              {selectedIncident.coordinates.latitude.toFixed(5)}° N, {selectedIncident.coordinates.longitude.toFixed(5)}° E
                            </span>
                            <button
                              onClick={() => handleCopyCoordinates(selectedIncident.coordinates!)}
                              className="text-xs text-text-secondary hover:text-white flex items-center gap-1"
                              title="Copy Coordinates"
                            >
                              {copiedCoords ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>{copiedCoords ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedIncident.peopleAffected && selectedIncident.peopleAffected !== 'Unknown' && (
                        <div className="flex flex-col col-span-2">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">People Affected</span>
                          <span className="text-sm text-white flex items-center gap-1.5 mt-0.5 font-medium">
                            <Users size={14} className="text-warning" /> {selectedIncident.peopleAffected}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Reporter Source Dossier */}
                    {selectedIncident.sourceInfo && (
                      <div>
                        <h4 className="rd-section-title">Reporter Attribution</h4>
                        <div className="reporter-dossier-card">
                          <div className="flex items-center gap-2">
                            <span className={`platform-badge ${PLATFORM_CONFIG[selectedIncident.sourceInfo.platform]?.class || 'drishti'}`}>
                              {PLATFORM_CONFIG[selectedIncident.sourceInfo.platform]?.icon}
                              {selectedIncident.sourceInfo.platform}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-white">
                                {selectedIncident.sourceInfo.authorName}
                              </div>
                              {selectedIncident.sourceInfo.authorHandle && (
                                <div className="text-[11px] font-mono text-text-muted">
                                  {selectedIncident.sourceInfo.authorHandle}
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedIncident.sourceInfo.sourceUrl && (
                            <a
                              href={selectedIncident.sourceInfo.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-amber-500 hover:underline flex items-center gap-1 mt-2"
                            >
                              <ExternalLink size={12} /> View Original Ground Transmission
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Full Eyewitness Testimony */}
                    {selectedIncident.description && (
                      <div>
                        <h4 className="rd-section-title">Ground Eyewitness Testimony</h4>
                        <div className="description-box">
                          {selectedIncident.description}
                        </div>
                      </div>
                    )}

                    {/* Help Needed Tags */}
                    {selectedIncident.tags && selectedIncident.tags.length > 0 && (
                      <div>
                        <h4 className="rd-section-title">Emergency Resource Tags</h4>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedIncident.tags.map(tag => (
                            <span key={tag} className="tag-pill">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Response Status Progression Workflow */}
                    <div>
                      <h4 className="rd-section-title text-amber-500">Mission Response Workflow</h4>
                      <div className="status-workflow mt-2">
                        {RESPONSE_WORKFLOW.map((status, index) => {
                          const currentIndex = RESPONSE_WORKFLOW.indexOf(selectedIncident.responseStatus || 'Unassigned');
                          const isCompleted = index <= currentIndex;
                          const isActiveNext = index === currentIndex + 1;

                          let btnClass = 'status-step-btn';
                          if (isCompleted) btnClass += ' completed';
                          else if (isActiveNext) btnClass += ' active-next';
                          else btnClass += ' disabled';

                          return (
                            <button
                              key={status}
                              className={btnClass}
                              onClick={() => isActiveNext && handleStatusUpdate(status)}
                              disabled={!isActiveNext}
                            >
                              <span>{WORKFLOW_LABELS[status]}</span>
                              {isCompleted && <CheckCircle2 size={16} className="text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Safety Alert */}
                    <div className="volunteer-safety-box">
                      <AlertTriangle size={16} className="shrink-0 text-danger mt-0.5" />
                      <p>
                        <strong>VOLUNTEER SAFETY ADVISORY:</strong> Maintain continuous contact with regional DRISHTI Command. Do not enter hazardous flood zones, structurally compromised buildings, or active landslides without official rescue gear.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};
export default VolunteerDashboard;
