import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, CheckCircle2, Search, 
  MapPin, Clock, Users, AlertTriangle, X
} from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { useLocation } from '../hooks/useLocation';
import { DisasterMap } from './DisasterMap';
import type { ResponseStatus } from '../types/report';
import '../styles/VolunteerDashboard.css';

const RESPONSE_WORKFLOW: ResponseStatus[] = [
  'Unassigned', 
  'ResponderAssigned', 
  'EnRoute', 
  'OnScene', 
  'AssistanceProvided', 
  'Resolved'
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

export const VolunteerDashboard: React.FC = () => {
  const { reports, isOffline, updateReportStatus } = useReports();
  const { location } = useLocation();
  
  const [search, setSearch] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Process and sort incidents
  const incidents = useMemo(() => {
    let filtered = reports.filter(r => r.status !== 'Draft');
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.type.toLowerCase().includes(s) || 
        r.locationName.toLowerCase().includes(s) ||
        r.tags.some(t => t.toLowerCase().includes(s))
      );
    }

    // Attach distance if we have coords
    return filtered.map(r => ({
      ...r,
      distance: location.coords && r.coordinates 
        ? calculateDistance(location.coords.latitude, location.coords.longitude, r.coordinates.latitude, r.coordinates.longitude)
        : null
    })).sort((a, b) => {
      // 1. Criticality
      const urgencyScore = { Critical: 3, Medium: 2, Low: 1 };
      const diff = urgencyScore[b.urgency] - urgencyScore[a.urgency];
      if (diff !== 0) return diff;
      
      // 2. Distance
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      
      // 3. Recency
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [reports, search, location.coords]);

  const stats = useMemo(() => ({
    critical: reports.filter(r => r.urgency === 'Critical' && r.responseStatus !== 'Resolved').length,
    high: reports.filter(r => r.urgency === 'Medium' && r.responseStatus !== 'Resolved').length,
    active: reports.filter(r => r.responseStatus && r.responseStatus !== 'Unassigned' && r.responseStatus !== 'Resolved').length,
    resolved: reports.filter(r => r.responseStatus === 'Resolved' || r.status === 'Resolved').length
  }), [reports]);

  const selectedIncident = useMemo(() => 
    incidents.find(i => i.id === selectedIncidentId) || null,
  [incidents, selectedIncidentId]);

  const handleStatusUpdate = (status: ResponseStatus) => {
    if (!selectedIncident) return;
    updateReportStatus(selectedIncident.id, status);
  };

  return (
    <div className="volunteer-container">
      {/* Header */}
      <header className="volunteer-header">
        <div className="volunteer-header-top">
          <div>
            <h1 className="volunteer-title">VOLUNTEER RESPONSE</h1>
            <p className="volunteer-subtitle">Find incidents that need assistance and coordinate your response.</p>
          </div>
          <div className={`network-status ${isOffline ? 'network-offline' : 'network-online'}`}>
            {isOffline ? '○ OFFLINE MODE' : '● RESPONSE NETWORK ONLINE'}
          </div>
        </div>
        
        <div className="kpi-strip">
          <div className="kpi-card critical">
            <span className="kpi-label">CRITICAL</span>
            <span className="kpi-value">{stats.critical}</span>
          </div>
          <div className="kpi-card high">
            <span className="kpi-label">HIGH PRIORITY</span>
            <span className="kpi-value">{stats.high}</span>
          </div>
          <div className="kpi-card active">
            <span className="kpi-label">ACTIVE RESPONSES</span>
            <span className="kpi-value">{stats.active}</span>
          </div>
          <div className="kpi-card resolved">
            <span className="kpi-label">RESOLVED</span>
            <span className="kpi-value">{stats.resolved}</span>
          </div>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="volunteer-content">
        {/* Left List */}
        <aside className="volunteer-list-panel">
          <div className="list-controls">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                className="volunteer-search pl-9" 
                placeholder="Search active incidents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="incident-feed">
            {incidents.length === 0 ? (
              <div className="text-center p-8 text-text-secondary border border-dashed border-border rounded-lg m-4">
                No active incidents found.
              </div>
            ) : (
              incidents.map(incident => (
                <div 
                  key={incident.id} 
                  className={`incident-card ${selectedIncidentId === incident.id ? 'selected' : ''}`}
                  onClick={() => setSelectedIncidentId(incident.id)}
                >
                  <div className="card-header">
                    <div className="card-badges">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                        incident.urgency === 'Critical' ? 'bg-danger text-white' : 
                        incident.urgency === 'Medium' ? 'bg-warning text-black' : 'bg-surface-hover text-text'
                      }`}>
                        {incident.urgency}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-accent/10 text-accent uppercase tracking-wider">
                        COMMUNITY REPORT
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="card-title">{incident.type}</h3>
                  <p className="card-desc">{incident.description || 'No description provided.'}</p>
                  
                  <div className="card-meta flex-col items-start gap-1">
                    <div className="card-meta-item">
                      <MapPin size={12} /> {incident.locationName} 
                      {incident.distance !== null && <span className="font-bold text-accent ml-1">({incident.distance.toFixed(1)} km)</span>}
                    </div>
                    <div className="card-meta-item">
                      <Clock size={12} /> {new Date(incident.timestamp).toLocaleTimeString()}
                      <span className="ml-2 px-1.5 py-0.5 bg-black/30 rounded text-[10px]">
                        Status: {incident.responseStatus || 'UNASSIGNED'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Map */}
        <section className="volunteer-map-panel">
          <DisasterMap 
            embedded 
            selectedIncidentId={selectedIncidentId || undefined}
            onSelectIncident={setSelectedIncidentId} 
          />
          
          {/* Drawer Over Map */}
          <AnimatePresence>
            {selectedIncident && (
              <div className="response-drawer-overlay" onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedIncidentId(null);
              }}>
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="response-drawer"
                >
                  <div className="rd-header">
                    <div className="font-bold tracking-widest uppercase">
                      INCIDENT DETAILS
                    </div>
                    <button className="drawer-close text-text-secondary hover:text-white" onClick={() => setSelectedIncidentId(null)}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="rd-content">
                    {selectedIncident.mediaBase64 && (
                      <img src={selectedIncident.mediaBase64} alt="Evidence" className="w-full rounded-md object-contain max-h-48 bg-black/20" />
                    )}
                    
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">{selectedIncident.type}</h2>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Severity</span>
                          <span className={`font-bold ${selectedIncident.urgency === 'Critical' ? 'text-danger' : selectedIncident.urgency === 'Medium' ? 'text-warning' : 'text-success'}`}>
                            {selectedIncident.urgency}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Reported</span>
                          <span className="text-sm">{new Date(selectedIncident.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex flex-col col-span-2">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Location</span>
                          <span className="text-sm flex items-center gap-1">
                            <MapPin size={12} /> {selectedIncident.locationName}
                            {selectedIncident.distance !== null && ` (${selectedIncident.distance.toFixed(1)} km)`}
                          </span>
                        </div>
                        {selectedIncident.peopleAffected && selectedIncident.peopleAffected !== 'Unknown' && (
                          <div className="flex flex-col col-span-2">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">People Affected</span>
                            <span className="text-sm flex items-center gap-1"><Users size={12} /> {selectedIncident.peopleAffected}</span>
                          </div>
                        )}
                      </div>

                      {selectedIncident.tags && selectedIncident.tags.length > 0 && (
                        <div className="mb-6">
                          <h3 className="rd-section-title">Help Needed</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedIncident.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-accent/10 border border-accent/20 text-accent rounded text-xs font-semibold">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedIncident.description && (
                        <div className="mb-6">
                          <h3 className="rd-section-title">Description</h3>
                          <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{selectedIncident.description}</p>
                        </div>
                      )}

                      <div>
                        <h3 className="rd-section-title text-accent">Response Workflow</h3>
                        <div className="status-workflow mt-2">
                          {RESPONSE_WORKFLOW.map((status, index) => {
                            const currentIndex = RESPONSE_WORKFLOW.indexOf(selectedIncident.responseStatus || 'Unassigned');
                            const isCompleted = index <= currentIndex;
                            const isActiveNext = index === currentIndex + 1;
                            
                            // Map string keys to readable labels
                            const labels: Record<ResponseStatus, string> = {
                              Unassigned: 'Incident Reported',
                              ResponderAssigned: 'Assigned / Claimed',
                              EnRoute: 'En Route',
                              OnScene: 'On Scene',
                              AssistanceProvided: 'Assistance Provided',
                              Resolved: 'Resolved'
                            };

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
                                <span>{labels[status]}</span>
                                {isCompleted && <CheckCircle2 size={16} />}
                              </button>
                            );
                          })}
                        </div>
                        {isOffline && (
                          <p className="text-xs text-warning mt-2 flex items-center gap-1">
                            <Activity size={12} /> Updates saved locally. Pending sync.
                          </p>
                        )}
                      </div>

                      <div className="mt-8 p-3 bg-danger/10 border border-danger/20 rounded-md text-xs text-danger flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <p><strong>VOLUNTEER SAFETY:</strong> Do not enter restricted, flooded, burning or otherwise dangerous areas without appropriate training or authorization.</p>
                      </div>
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
