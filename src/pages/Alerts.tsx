import React, { useState, useMemo } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { AlertSummary } from '../components/alerts/AlertSummary';
import { AlertFilterBar } from '../components/alerts/AlertFilterBar';
import type { SortOption, TimeFilter, LocationFilter } from '../components/alerts/AlertFilterBar';
import { useLocation } from '../hooks/useLocation';
import { getDistance } from '../utils/distance';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertDrawer } from '../components/alerts/AlertDrawer';
import type { AlertSeverity, AlertType } from '../types/alert';
import { ShieldCheck, WifiOff, RefreshCw, MapPin, ChevronDown } from 'lucide-react';
import '../styles/Alerts.css';

export const Alerts: React.FC = () => {
  const { alerts, isOffline, acknowledgeAlert } = useAlerts();
  const { location } = useLocation();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'All'>('All');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
  const [sortOption, setSortOption] = useState<SortOption>('Latest');

  // State for drawer
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Derive counts
  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, Warning: 0, Advisory: 0, Resolved: 0 };
    alerts.forEach(a => {
      counts[a.severity] = (counts[a.severity] || 0) + 1;
    });
    return counts as Record<AlertSeverity, number>;
  }, [alerts]);

  // Filter & Sort Logic
  const filteredAndSortedAlerts = useMemo(() => {
    let result = [...alerts];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }

    // Severity Filter
    if (severityFilter !== 'All') {
      result = result.filter(a => a.severity === severityFilter);
    }

    // Type Filter
    if (typeFilter !== 'All') {
      result = result.filter(a => a.type === typeFilter);
    }

    // Location Filter
    if (locationFilter === 'Near Me' && location.coords) {
      result = result.filter(a => {
        if (!a.latitude || !a.longitude) return false;
        const dist = getDistance(
          location.coords!.latitude,
          location.coords!.longitude,
          a.latitude,
          a.longitude
        );
        return dist <= 50; // within 50km
      });
    }

    // Time Filter
    if (timeFilter !== 'All') {
      const now = new Date().getTime();
      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * oneHour;
      const sevenDays = 7 * oneDay;

      result = result.filter(a => {
        const diff = now - new Date(a.detectedAt).getTime();
        if (timeFilter === 'Last hour') return diff <= oneHour;
        if (timeFilter === 'Last 24 hours') return diff <= oneDay;
        if (timeFilter === 'Last 7 days') return diff <= sevenDays;
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'Latest') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortOption === 'Highest Severity') {
        const severityRank: Record<AlertSeverity, number> = { Critical: 4, Warning: 3, Advisory: 2, Resolved: 1 };
        const rankDiff = severityRank[b.severity] - severityRank[a.severity];
        return rankDiff !== 0 ? rankDiff : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortOption === 'Nearest') {
        if (location.coords && a.latitude && a.longitude && b.latitude && b.longitude) {
          const distA = getDistance(location.coords.latitude, location.coords.longitude, a.latitude, a.longitude);
          const distB = getDistance(location.coords.latitude, location.coords.longitude, b.latitude, b.longitude);
          return distA - distB;
        }
        return (a.affectedRadiusKm || 999) - (b.affectedRadiusKm || 999);
      }
      return 0;
    });

    return result;
  }, [alerts, searchQuery, severityFilter, typeFilter, timeFilter, sortOption, locationFilter, location.coords]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSeverityFilter('All');
    setTypeFilter('All');
    setLocationFilter('All');
    setTimeFilter('All');
    setSortOption('Latest');
  };

  const selectedAlert = useMemo(
    () => alerts.find(a => a.id === selectedAlertId) || null,
    [alerts, selectedAlertId]
  );

  return (
    <div className="alerts-page-wrapper">
      {/* Header Area */}
      <div className="alerts-header">
        <div className="alerts-header-left">
          <h1 className="alerts-title">Alert Center</h1>
          <p className="alerts-subtitle">Verified disaster intelligence and active warnings</p>
        </div>

        {/* Right Header Area with Location + Actions */}
        <div className="alerts-header-right">
          <div className="alerts-location-pill">
            <MapPin size={13} className="text-zinc-400" />
            <span>Khapuria, Cuttack</span>
            <ChevronDown size={13} className="text-zinc-500" />
          </div>

          <div className="alerts-actions-row">
            <button className="btn-refresh" aria-label="Refresh alerts">
              <RefreshCw size={13} />
            </button>
            <div className={`alerts-live-indicator ${isOffline ? 'offline' : ''}`}>
              {isOffline ? (
                <>
                  <WifiOff size={13} /> OFFLINE
                </>
              ) : (
                <>
                  <span className="pulse-dot"></span> LIVE
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isOffline && (
        <div className="offline-banner">
          <WifiOff size={16} className="text-danger" />
          <div>
            <span className="offline-banner-title">OFFLINE MODE </span>
            <span className="offline-banner-text">Showing the latest locally cached alerts.</span>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <AlertSummary counts={severityCounts} />

      {/* Filter Bar */}
      <AlertFilterBar
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        severityFilter={severityFilter} setSeverityFilter={setSeverityFilter}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        locationFilter={locationFilter} setLocationFilter={setLocationFilter}
        timeFilter={timeFilter} setTimeFilter={setTimeFilter}
        sortOption={sortOption} setSortOption={setSortOption}
        onReset={handleResetFilters}
      />

      {/* Active Alerts Header */}
      <div className="active-alerts-header">
        <h2 className="active-alerts-title">ACTIVE ALERTS</h2>
        <p className="active-alerts-subtitle">Verified events requiring attention</p>
      </div>

      {/* Main Feed */}
      <div className="alerts-feed">
        {filteredAndSortedAlerts.length > 0 ? (
          filteredAndSortedAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              isSelected={alert.id === selectedAlertId}
              onClick={(a) => setSelectedAlertId(a.id)}
            />
          ))
        ) : (
          <div className="empty-alerts-card">
            <div className="empty-icon-wrapper">
              <ShieldCheck size={40} />
            </div>
            <h3 className="empty-title">NO MATCHING ALERTS</h3>
            <p className="empty-desc">No alerts match your current filters.</p>
            <button onClick={handleResetFilters} className="filter-clear-btn" style={{ minWidth: '120px' }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Drawer */}
      <AlertDrawer
        alert={selectedAlert}
        isOpen={!!selectedAlertId}
        onClose={() => setSelectedAlertId(null)}
        onAcknowledge={acknowledgeAlert}
      />
    </div>
  );
};
export default Alerts;
