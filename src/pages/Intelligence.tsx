import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Search, 
  Activity, 
  CloudRain, 
  Newspaper, 
  Users, 
  Radio, 
  AlertTriangle,
  Map as MapIcon,
  X,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useIntelligence } from '../hooks/useIntelligence';
import type { IntelligenceItem, IntelligenceSourceType } from '../types/intelligence';
import '../styles/Intelligence.css';

// Formatter
const formatTimeAgo = (dateStr: string) => {
  const diffInMinutes = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  return `${Math.floor(diffInHours / 24)} days ago`;
};

// Icons mapping
const getSourceIcon = (source: IntelligenceSourceType) => {
  switch (source) {
    case 'Official': return <ShieldAlert size={12} />;
    case 'Weather': return <CloudRain size={12} />;
    case 'News': return <Newspaper size={12} />;
    case 'Community': return <Users size={12} />;
    case 'System': return <Activity size={12} />;
  }
};

export const Intelligence: React.FC = () => {
  const navigate = useNavigate();
  const { data, stats, priorityItem, isOffline, filter, setFilter } = useIntelligence();
  
  const [selectedItem, setSelectedItem] = useState<IntelligenceItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleViewOnMap = (item: IntelligenceItem) => {
    // If we have coordinates, we can pass them in state
    navigate('/app/map', { state: { center: item.coordinates } });
  };

  return (
    <div className="intel-container">
      {/* Header Section */}
      <header className="intel-header-section">
        <div className="intel-header-top">
          <div className="intel-title-group">
            <h1>INTELLIGENCE</h1>
            <p className="intel-subtitle">Aggregated disaster intelligence from verified sources</p>
          </div>
          <div className="intel-status-group">
            <div className="intel-live-badge">
              <div className="intel-pulse" />
              LIVE
            </div>
            <button className="intel-refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              REFRESH
            </button>
          </div>
        </div>

        {isOffline && (
          <div className="offline-banner">
            <WifiOff size={18} />
            <div>
              <strong>OFFLINE MODE:</strong> Showing the latest locally cached intelligence.
            </div>
          </div>
        )}

        <div className="intel-overview-strip">
          <div className="intel-overview-card">
            <span className="intel-overview-label">ACTIVE EVENTS</span>
            <span className="intel-overview-value">{stats.activeEvents}</span>
          </div>
          <div className="intel-overview-card">
            <span className="intel-overview-label">WATCHING</span>
            <span className="intel-overview-value">{stats.watching}</span>
          </div>
          <div className="intel-overview-card">
            <span className="intel-overview-label">OFFICIAL UPDATES</span>
            <span className="intel-overview-value">{stats.officialUpdates}</span>
          </div>
          <div className="intel-overview-card">
            <span className="intel-overview-label">COMMUNITY REPORTS</span>
            <span className="intel-overview-value">{stats.communityReports}</span>
          </div>
        </div>
      </header>

      <div className="intel-main-layout">
        {/* Left: Filters */}
        <aside className="intel-filters">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="intel-search" 
              placeholder="Search intelligence..." 
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Type</span>
            <button className={`filter-btn ${filter.type === 'All' ? 'active' : ''}`} onClick={() => setFilter({...filter, type: 'All'})}>All Sources</button>
            <button className={`filter-btn ${filter.type === 'Official' ? 'active' : ''}`} onClick={() => setFilter({...filter, type: 'Official'})}>Official</button>
            <button className={`filter-btn ${filter.type === 'Weather' ? 'active' : ''}`} onClick={() => setFilter({...filter, type: 'Weather'})}>Weather</button>
            <button className={`filter-btn ${filter.type === 'News' ? 'active' : ''}`} onClick={() => setFilter({...filter, type: 'News'})}>News</button>
            <button className={`filter-btn ${filter.type === 'Community' ? 'active' : ''}`} onClick={() => setFilter({...filter, type: 'Community'})}>Community</button>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Severity</span>
            <button className={`filter-btn ${filter.severity === 'All' ? 'active' : ''}`} onClick={() => setFilter({...filter, severity: 'All'})}>All Severities</button>
            <button className={`filter-btn ${filter.severity === 'Critical' ? 'active' : ''}`} onClick={() => setFilter({...filter, severity: 'Critical'})}>Critical</button>
            <button className={`filter-btn ${filter.severity === 'Warning' ? 'active' : ''}`} onClick={() => setFilter({...filter, severity: 'Warning'})}>Warning</button>
            <button className={`filter-btn ${filter.severity === 'Advisory' ? 'active' : ''}`} onClick={() => setFilter({...filter, severity: 'Advisory'})}>Advisory</button>
          </div>
        </aside>

        {/* Right: Feed */}
        <main className="intel-feed">
          {priorityItem && filter.type === 'All' && filter.severity === 'All' && !filter.search && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="priority-banner intel-card"
              onClick={() => setSelectedItem(priorityItem)}
            >
              <div className="priority-header">
                <AlertTriangle size={16} />
                PRIORITY INTELLIGENCE
              </div>
              <div className="intel-card-header">
                <div className="intel-badges">
                  <span className={`source-badge source-${priorityItem.sourceType.toLowerCase()}`}>
                    {getSourceIcon(priorityItem.sourceType)}
                    {priorityItem.sourceType}
                  </span>
                  <span className={`severity-badge sev-${priorityItem.severity.toLowerCase()}`}>
                    {priorityItem.severity}
                  </span>
                </div>
              </div>
              <h3>{priorityItem.title}</h3>
              <p>{priorityItem.summary}</p>
              <div className="intel-card-footer">
                <span className="intel-location">
                  <MapPin size={14} /> {priorityItem.location}
                </span>
                <span className="intel-card-time flex items-center gap-1">
                  <Clock size={12} /> {formatTimeAgo(priorityItem.timestamp)}
                </span>
              </div>
            </motion.div>
          )}

          {data.length === 0 ? (
            <div className="intel-empty">
              <Radio size={48} className="text-text-muted opacity-50" />
              <div>
                <h3 className="text-text-secondary font-bold tracking-widest uppercase text-sm mb-2">NO RECENT INTELLIGENCE</h3>
                <p className="text-sm text-text-muted max-w-sm mx-auto">DRISHTI is currently waiting for new verified information matching your filters.</p>
              </div>
              <button className="intel-refresh-btn mt-4" onClick={handleRefresh}>
                <RefreshCw size={14} /> Refresh Feed
              </button>
            </div>
          ) : (
            data.filter(item => item.id !== priorityItem?.id).map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="intel-card"
                onClick={() => setSelectedItem(item)}
              >
                <div className="intel-card-header">
                  <div className="intel-badges">
                    <span className={`source-badge source-${item.sourceType.toLowerCase()}`}>
                      {getSourceIcon(item.sourceType)}
                      {item.sourceType}
                    </span>
                    <span className={`severity-badge sev-${item.severity.toLowerCase()}`}>
                      {item.severity}
                    </span>
                  </div>
                  <span className="intel-card-time">
                    {formatTimeAgo(item.timestamp)}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <div className="intel-card-footer">
                  <span className="intel-location">
                    <MapPin size={14} /> {item.location}
                  </span>
                  <span style={{ color: item.isVerified ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {item.isVerified ? 'Verified' : 'Unverified'} • {item.status}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </main>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <div className="intel-drawer-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="intel-drawer"
            >
              <div className="drawer-header">
                <div className="intel-badges">
                  <span className={`source-badge source-${selectedItem.sourceType.toLowerCase()}`}>
                    {getSourceIcon(selectedItem.sourceType)}
                    {selectedItem.sourceType}
                  </span>
                  <span className={`severity-badge sev-${selectedItem.severity.toLowerCase()}`}>
                    {selectedItem.severity}
                  </span>
                </div>
                <button className="drawer-close" onClick={() => setSelectedItem(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="drawer-content">
                <div>
                  <h2 className="drawer-title">{selectedItem.title}</h2>
                  
                  <div className="drawer-meta-grid">
                    <div className="drawer-meta-item">
                      <span className="drawer-meta-label">Source</span>
                      <span className="drawer-meta-value">{selectedItem.sourceName}</span>
                    </div>
                    <div className="drawer-meta-item">
                      <span className="drawer-meta-label">Location</span>
                      <span className="drawer-meta-value flex items-center gap-1">
                        <MapPin size={12} /> {selectedItem.location}
                      </span>
                    </div>
                    <div className="drawer-meta-item">
                      <span className="drawer-meta-label">Detected Time</span>
                      <span className="drawer-meta-value">{new Date(selectedItem.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="drawer-meta-item">
                      <span className="drawer-meta-label">Status</span>
                      <span className="drawer-meta-value" style={{ color: selectedItem.isVerified ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {selectedItem.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>

                  <p className="drawer-desc">{selectedItem.fullDescription}</p>
                </div>

                <button className="drawer-btn" onClick={() => handleViewOnMap(selectedItem)}>
                  <MapIcon size={16} /> VIEW ON MAP
                </button>

                {selectedItem.metadata && selectedItem.metadata.length > 0 && (
                  <div>
                    <h3 className="drawer-section-title">Environmental Signals</h3>
                    <div className="drawer-meta-grid mt-4">
                      {selectedItem.metadata.map((meta, idx) => (
                        <div key={idx} className="drawer-meta-item">
                          <span className="drawer-meta-label">{meta.label}</span>
                          <span className="drawer-meta-value">{meta.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.relatedAlertIds && selectedItem.relatedAlertIds.length > 0 ? (
                  <div>
                    <h3 className="drawer-section-title">Related Alerts</h3>
                    <p className="drawer-desc mt-4">
                      This intelligence item correlates with {selectedItem.relatedAlertIds.length} active emergency alerts.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="drawer-section-title">Related Intelligence</h3>
                    <p className="drawer-desc mt-4">No related intelligence available.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
