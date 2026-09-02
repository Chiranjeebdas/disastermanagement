import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowLeft,
  Flame,
  Activity,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Compass,
  Home as HomeIcon,
  Map as MapIcon,
  Bell,
  LifeBuoy,
  BookOpen,
  Waves,
  Wind,
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Map,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { useAlerts } from '../hooks/useAlerts';
import { getDistance } from '../utils/distance';
import type { Alert } from '../types/alert';
import '../styles/UserAlerts.css';

type SeverityFilter = 'all' | 'action' | 'alert' | 'monitor' | 'resolved';

export const UserAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { location } = useLocation();

  // Active filter state
  const [activeFilter, setActiveFilter] = useState<SeverityFilter>('all');
  
  // Expanded card details set
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 1. Real GPS User Coordinates
  const hasUserCoords = !!(location.coords && typeof location.coords.latitude === 'number' && typeof location.coords.longitude === 'number');
  const userLat = location.coords?.latitude ?? 20.4625;
  const userLon = location.coords?.longitude ?? 85.8828;
  const userAddress = location.address || (hasUserCoords ? `${userLat.toFixed(3)}°N, ${userLon.toFixed(3)}°E` : 'Bhubaneswar, Odisha');

  // 2. Real Alerts Hook (Live multi-source ingestion)
  const { alerts, loading, refreshAlerts } = useAlerts(userLat, userLon);

  // Toggle "More details"
  const toggleDetails = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper to translate hazard type to clean icon
  const getHazardIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'flood':
        return { icon: <Waves size={16} />, className: 'icon-flood', name: 'Flood' };
      case 'fire':
        return { icon: <Flame size={16} />, className: 'icon-fire', name: 'Fire' };
      case 'cyclone':
      case 'extreme weather':
      case 'wind':
        return { icon: <Wind size={16} />, className: 'icon-cyclone', name: 'Cyclone / Storm' };
      case 'earthquake':
        return { icon: <Activity size={16} />, className: 'icon-earthquake', name: 'Earthquake' };
      default:
        return { icon: <ShieldAlert size={16} />, className: 'icon-other', name: type || 'Hazard' };
    }
  };

  // Helper to translate severity to citizen language
  const getCitizenSeverity = (alert: Alert) => {
    if (alert.status === 'Resolved' || alert.severity === 'Resolved' || (alert as any).verificationStatus === 'Retracted') {
      return {
        label: 'RESOLVED / ALL CLEAR',
        className: 'severity-resolved',
        badgeClass: 'badge-resolved',
        icon: <ShieldCheck size={13} />,
        key: 'resolved'
      };
    }
    if (alert.severity === 'Critical') {
      return {
        label: 'TAKE ACTION',
        className: 'severity-action',
        badgeClass: 'badge-action',
        icon: <AlertOctagon size={13} />,
        key: 'action'
      };
    }
    if (alert.severity === 'Warning') {
      return {
        label: 'BE ALERT',
        className: 'severity-alert',
        badgeClass: 'badge-alert',
        icon: <AlertTriangle size={13} />,
        key: 'alert'
      };
    }
    return {
      label: 'MONITOR',
      className: 'severity-monitor',
      badgeClass: 'badge-monitor',
      icon: <Clock size={13} />,
      key: 'monitor'
    };
  };

  // Helper to format relative time
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recent update';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recent update';
    }
  };

  // Citizen-friendly translation of technical descriptions
  const getCitizenExplanation = (alert: Alert) => {
    if (alert.status === 'Resolved' || alert.severity === 'Resolved') {
      return 'Hazard conditions have returned to safe baselines or have been officially resolved.';
    }
    if ((alert as any).verificationStatus === 'Retracted') {
      return 'This alert was verified by field authorities as a false observation and has been retracted.';
    }

    const type = alert.type.toLowerCase();
    if (type.includes('flood')) {
      return 'Rising river level or surface rainfall accumulation detected in local catchment corridors.';
    }
    if (type.includes('fire')) {
      return 'Thermal heat anomaly observed by satellite telemetry in this sector.';
    }
    if (type.includes('cyclone') || type.includes('weather')) {
      return 'High wind speeds and unstable weather conditions monitored in this area.';
    }
    if (type.includes('earthquake')) {
      return 'Seismic vibration detected by regional seismograph stations.';
    }

    // Default: strip overly technical numbers from raw description if present
    return alert.description
      ? alert.description.replace(/\[Composite Risk Index.*?\]/g, '').replace(/Confidence: \d+%/g, '').trim()
      : 'Environmental sensor stations indicate elevated activity near this location.';
  };

  // Recommended citizen actions
  const getCitizenRecommendedAction = (alert: Alert) => {
    if (alert.status === 'Resolved' || alert.severity === 'Resolved') {
      return 'Normal activities may resume. Stay informed on regional weather advisories.';
    }
    if (alert.recommendedAction) {
      return alert.recommendedAction;
    }

    const type = alert.type.toLowerCase();
    if (type.includes('flood')) {
      return 'Avoid low-lying riverbanks and underpasses. Do not drive or walk through moving water.';
    }
    if (type.includes('fire')) {
      return 'Stay away from the affected sector. Keep doors and windows closed to avoid smoke.';
    }
    if (type.includes('cyclone') || type.includes('weather')) {
      return 'Remain indoors, secure loose outdoor objects, and charge emergency communication devices.';
    }
    if (type.includes('earthquake')) {
      return 'Drop, Cover, and Hold On if shaking occurs. Move away from tall shelves and glass windows.';
    }
    return 'Follow instructions from local emergency management authorities.';
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const sev = getCitizenSeverity(alert);
      if (activeFilter === 'all') return true;
      if (activeFilter === 'action') return sev.key === 'action';
      if (activeFilter === 'alert') return sev.key === 'alert';
      if (activeFilter === 'monitor') return sev.key === 'monitor';
      if (activeFilter === 'resolved') return sev.key === 'resolved';
      return true;
    });
  }, [alerts, activeFilter]);

  return (
    <div className="user-alerts-container">
      {/* 1. Header */}
      <header className="user-alerts-header">
        <div className="user-alerts-header-left">
          <button
            type="button"
            onClick={() => navigate('/user')}
            className="user-alerts-back-btn"
            title="Return to Citizen Dashboard"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="user-alerts-header-title-wrap">
            <h1 className="user-alerts-header-title">Local Safety Alerts</h1>
            <span className="user-alerts-location-sub">
              <MapPin size={11} className="flex-shrink-0 text-emerald-400" />
              <span>{userAddress} (30 km Radius)</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refreshAlerts?.()}
          className="user-alerts-back-btn"
          title="Refresh Alerts"
          aria-label="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* 2. Main Page Content */}
      <main className="user-alerts-content">
        {/* Severity Filter Tabs */}
        <div className="user-alerts-filters">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`user-alert-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
          >
            <span>All Alerts</span>
            <span className="user-alert-count-pill">{alerts.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('action')}
            className={`user-alert-filter-pill ${activeFilter === 'action' ? 'active' : ''}`}
          >
            <AlertOctagon size={12} className="text-rose-400" />
            <span>Take Action</span>
            <span className="user-alert-count-pill">
              {alerts.filter(a => getCitizenSeverity(a).key === 'action').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('alert')}
            className={`user-alert-filter-pill ${activeFilter === 'alert' ? 'active' : ''}`}
          >
            <AlertTriangle size={12} className="text-amber-400" />
            <span>Be Alert</span>
            <span className="user-alert-count-pill">
              {alerts.filter(a => getCitizenSeverity(a).key === 'alert').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('monitor')}
            className={`user-alert-filter-pill ${activeFilter === 'monitor' ? 'active' : ''}`}
          >
            <Clock size={12} className="text-sky-400" />
            <span>Monitor</span>
            <span className="user-alert-count-pill">
              {alerts.filter(a => getCitizenSeverity(a).key === 'monitor').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('resolved')}
            className={`user-alert-filter-pill ${activeFilter === 'resolved' ? 'active' : ''}`}
          >
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Resolved</span>
            <span className="user-alert-count-pill">
              {alerts.filter(a => getCitizenSeverity(a).key === 'resolved').length}
            </span>
          </button>
        </div>

        {/* Real Data Summary Banner */}
        <div className="user-alerts-summary-banner">
          <div className="user-alerts-summary-text">
            <Compass size={15} className="text-emerald-400 flex-shrink-0" />
            <span>
              Showing real-time disaster alerts corroborated across regional sensors and municipal bulletins.
            </span>
          </div>
        </div>

        {/* 3. Citizen Alert Cards List */}
        {filteredAlerts.length > 0 ? (
          <div className="user-alert-cards-list">
            {filteredAlerts.map(alert => {
              const hazard = getHazardIcon(alert.type);
              const severity = getCitizenSeverity(alert);
              const isExpanded = expandedIds.has(alert.id);
              
              // Calculate individual distance from citizen GPS
              const hasCoords = typeof alert.latitude === 'number' && typeof alert.longitude === 'number' && !isNaN(alert.latitude) && !isNaN(alert.longitude);
              const distanceKm = hasCoords && hasUserCoords
                ? getDistance(userLat, userLon, alert.latitude!, alert.longitude!)
                : undefined;

              const correctionNote = (alert as any).escalationNote || (alert as any).reviewerNote;

              return (
                <article
                  key={alert.id}
                  className={`user-alert-card ${severity.className}`}
                  aria-label={`${alert.type} Alert: ${severity.label}`}
                >
                  {/* Top Row */}
                  <div className="user-alert-top-row">
                    <div className="user-alert-hazard-type-wrap">
                      <div className={`user-alert-hazard-icon-box ${hazard.className}`}>
                        {hazard.icon}
                      </div>
                      <span className="user-alert-hazard-name">{hazard.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`user-alert-severity-badge ${severity.badgeClass}`}>
                        {severity.icon}
                        <span>{severity.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Location & Time Strip */}
                  <div className="user-alert-meta-strip">
                    <div className="user-alert-meta-item">
                      <MapPin size={12} className="text-emerald-400" />
                      <span>
                        {distanceKm !== undefined
                          ? `~${distanceKm.toFixed(1)} km from your location`
                          : (alert.location || 'Distance unavailable')}
                      </span>
                    </div>

                    <div className="user-alert-meta-item">
                      <Clock size={12} className="text-zinc-500" />
                      <span>{getRelativeTime(alert.updatedAt || alert.detectedAt)}</span>
                    </div>
                  </div>

                  {/* Authorized Correction Notice if applicable */}
                  {correctionNote && (
                    <div className="user-alert-correction-banner">
                      <CheckCircle2 size={13} className="flex-shrink-0" />
                      <span>Official Update: {correctionNote}</span>
                    </div>
                  )}

                  {/* Explanation & Action Body */}
                  <div className="user-alert-body">
                    <p className="user-alert-explanation">
                      {getCitizenExplanation(alert)}
                    </p>

                    <div className="user-alert-action-box">
                      <HelpCircle size={14} className="user-alert-action-icon" />
                      <p className="user-alert-action-text">
                        <strong>Action: </strong>
                        {getCitizenRecommendedAction(alert)}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="user-alert-card-footer">
                    {hasCoords ? (
                      <button
                        type="button"
                        onClick={() => navigate('/user/map', {
                          state: {
                            center: [alert.latitude, alert.longitude]
                          }
                        })}
                        className="user-alert-map-btn"
                        title="View alert location on Citizen Map"
                      >
                        <Map size={13} />
                        <span>View on Map</span>
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-500">General Corridor Area</span>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleDetails(alert.id)}
                      className="user-alert-details-toggle"
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? 'Fewer details' : 'More details'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Expandable Technical Evidence & Audit Metadata */}
                  {isExpanded && (
                    <div className="user-alert-tech-details">
                      <div className="user-tech-item">
                        <span className="user-tech-label">Sensor Source:</span>
                        <span className="user-tech-val">{alert.source || 'DRISHTI Multi-Sensor Telemetry'}</span>
                      </div>

                      {hasCoords && (
                        <div className="user-tech-item">
                          <span className="user-tech-label">Coordinates:</span>
                          <span className="user-tech-val">{alert.latitude?.toFixed(4)}°N, {alert.longitude?.toFixed(4)}°E</span>
                        </div>
                      )}

                      {alert.affectedRadiusKm && (
                        <div className="user-tech-item">
                          <span className="user-tech-label">Observed Radius:</span>
                          <span className="user-tech-val">{alert.affectedRadiusKm} km</span>
                        </div>
                      )}

                      {alert.measurements && alert.measurements.length > 0 && (
                        <div className="user-tech-item">
                          <span className="user-tech-label">Telemetry Readings:</span>
                          <span className="user-tech-val">
                            {alert.measurements.map(m => `${m.label}: ${m.value}`).join(' | ')}
                          </span>
                        </div>
                      )}

                      <div className="user-tech-item">
                        <span className="user-tech-label">Alert ID:</span>
                        <span className="user-tech-val font-mono text-[10px]">{alert.id}</span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="user-alerts-empty-box">
            <div className="user-empty-icon">
              <ShieldCheck size={28} />
            </div>
            <h3 className="user-empty-title">No Active Alerts In This Category</h3>
            <p className="user-empty-sub">
              All multi-source environmental telemetry stations within 30 km are currently operating within normal parameters.
            </p>
          </div>
        )}
      </main>

      {/* 4. Citizen Bottom Navigation Bar */}
      <nav className="user-bottom-nav" aria-label="Citizen Navigation Bar">
        <button
          type="button"
          className="user-nav-item"
          onClick={() => navigate('/user')}
        >
          <HomeIcon size={18} />
          <span>HOME</span>
        </button>

        <button
          type="button"
          className="user-nav-item"
          onClick={() => navigate('/user/map')}
        >
          <MapIcon size={18} />
          <span>MAP</span>
        </button>

        <button
          type="button"
          className="user-nav-item active"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Bell size={18} />
          <span>ALERTS</span>
        </button>

        <button
          type="button"
          className="user-nav-item"
          onClick={() => navigate('/user/help')}
        >
          <LifeBuoy size={18} />
          <span>HELP</span>
        </button>

        <button
          type="button"
          className="user-nav-item"
          onClick={() => navigate('/user/prepare')}
        >
          <BookOpen size={18} />
          <span>PREPARE</span>
        </button>
      </nav>
    </div>
  );
};

export default UserAlerts;
