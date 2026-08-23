import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waves, Wind, Flame, Mountain, CloudRain,
  Activity, Sun, Building, Map, AlertTriangle,
  MapPin, Camera, X, CheckCircle2, ChevronRight,
  ShieldCheck, Loader2
} from 'lucide-react';
import { useLocation as useReactRouterLocation } from 'react-router-dom';
import { useLocation } from '../hooks/useLocation';
import { useReports } from '../hooks/useReports';
import type { ReportType, ReportUrgency, IncidentReport } from '../types/report';
import '../styles/ReportIncident.css';

const INCIDENT_TYPES: { id: ReportType; label: string; icon: React.ReactNode }[] = [
  { id: 'Flood', label: 'Flood / Waterlogging', icon: <Waves size={24} /> },
  { id: 'Cyclone', label: 'Cyclone / Wind', icon: <Wind size={24} /> },
  { id: 'Fire', label: 'Fire', icon: <Flame size={24} /> },
  { id: 'Landslide', label: 'Landslide', icon: <Mountain size={24} /> },
  { id: 'HeavyRain', label: 'Heavy Rain', icon: <CloudRain size={24} /> },
  { id: 'Earthquake', label: 'Earthquake', icon: <Activity size={24} /> },
  { id: 'ExtremeHeat', label: 'Extreme Heat', icon: <Sun size={24} /> },
  { id: 'InfrastructureDamage', label: 'Building Damage', icon: <Building size={24} /> },
  { id: 'RoadBlockage', label: 'Road Blocked', icon: <Map size={24} /> },
  { id: 'Other', label: 'Other Emergency', icon: <AlertTriangle size={24} /> },
];

const QUICK_TAGS = [
  'People trapped', 'Water rising', 'Road blocked',
  'Power outage', 'Medical emergency', 'Building damaged', 'Immediate assistance needed'
];

export const ReportIncident: React.FC = () => {
  const routerLocation = useReactRouterLocation();
  const prefill = routerLocation.state?.prefill;

  const { location, requestLocation } = useLocation();
  const { reports, submitReport } = useReports();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [selectedType, setSelectedType] = useState<ReportType | null>(prefill?.type || null);
  const [manualLocation, setManualLocation] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [description, setDescription] = useState(prefill?.label || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(prefill?.tag ? [prefill.tag] : []);
  const [urgency, setUrgency] = useState<ReportUrgency | null>(prefill?.urgency || null);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<IncidentReport | null>(null);
  const [viewingReport, setViewingReport] = useState<IncidentReport | null>(null);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress/resize for local storage simulation (max width 800)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > 800) {
          height = Math.round((height * 800) / width);
          width = 800;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress heavily for local storage
        setMediaPreview(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!selectedType) return alert('Please select an incident type.');
    if (!location.coords && !manualLocation) return alert('Please provide a location.');
    if (!urgency) return alert('Please select an urgency level.');

    setIsSubmitting(true);

    const fullDesc = [description, ...selectedTags.map(t => `#${t.replace(/\s+/g, '')}`)].filter(Boolean).join('\n\n');

    // Reverse geocode would happen here in a real app. For now, mock location name.
    const locName = manualLocation || (location.coords ? `Lat: ${location.coords.latitude.toFixed(4)}, Lon: ${location.coords.longitude.toFixed(4)}` : 'Unknown Location');

    const result = await submitReport({
      type: selectedType,
      locationName: locName,
      coordinates: location.coords ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null,
      description: fullDesc,
      mediaBase64: mediaPreview,
      urgency,
      peopleAffected: selectedTags.includes('People trapped') ? 'Unknown (Trapped)' : 'Unknown',
      tags: selectedTags,
    });

    setIsSubmitting(false);
    setSubmittedReport(result);
  };

  const resetForm = () => {
    setSelectedType(null);
    setManualLocation('');
    setMediaPreview(null);
    setDescription('');
    setSelectedTags([]);
    setUrgency(null);
    setSubmittedReport(null);
  };

  if (submittedReport) {
    return (
      <div className="report-container">
        <div className="success-card">
          <div className="success-icon-wrapper">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="success-title">INCIDENT RECEIVED</h2>
          <p className="success-desc">Thank you. Your report has been added to DRISHTI.</p>

          <div className="success-meta">
            <div className="meta-row">
              <span className="meta-label">Report ID</span>
              <span className="meta-value font-mono text-xs">{submittedReport.id}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Timestamp</span>
              <span className="meta-value">{new Date(submittedReport.timestamp).toLocaleString()}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Location</span>
              <span className="meta-value">{submittedReport.locationName}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Status</span>
              <span className={`meta-value ${submittedReport.status === 'PendingSync' ? 'text-warning' : 'text-accent'}`}>
                {submittedReport.status === 'PendingSync' ? 'PENDING SYNC (OFFLINE)' : 'RECEIVED'}
              </span>
            </div>
          </div>

          <div className="success-actions">
            <button className="success-btn btn-secondary" onClick={() => { setViewingReport(submittedReport); setSubmittedReport(null); }}>View Report</button>
            <button className="success-btn btn-primary" onClick={resetForm}>Report Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <header className="report-header">
        <h1 className="report-title">REPORT AN INCIDENT</h1>
        <p className="report-subtitle">Help responders understand what is happening on the ground.</p>
        <div className="report-trust-note">
          <ShieldCheck size={14} />
          Only report genuine emergencies and disaster-related situations.
        </div>
      </header>

      {/* 1. Incident Type */}
      <section className="report-section">
        <h3 className="section-label">WHAT IS HAPPENING?</h3>
        <div className="incident-type-grid">
          {INCIDENT_TYPES.map(type => (
            <div
              key={type.id}
              className={`type-card ${selectedType === type.id ? 'selected' : ''}`}
              onClick={() => setSelectedType(type.id)}
            >
              <div className="type-icon">{type.icon}</div>
              <span className="type-label">{type.label}</span>
              {selectedType === type.id && <CheckCircle2 size={16} className="type-check" />}
            </div>
          ))}
        </div>
      </section>

      {/* 2. Location */}
      <section className="report-section">
        <h3 className="section-label">INCIDENT LOCATION</h3>
        {!location.coords && location.status !== 'denied' && (
          <button className="location-btn" onClick={requestLocation}>
            <MapPin size={18} /> Use My Current Location
          </button>
        )}

        {location.coords && (
          <div className="location-display">
            <div className="location-icon-wrapper"><MapPin size={20} /></div>
            <div className="location-text">
              <h4>Current location detected</h4>
              <p>Latitude: {location.coords.latitude.toFixed(6)}</p>
              <p>Longitude: {location.coords.longitude.toFixed(6)}</p>
              <p>Accuracy: ±{Math.round(location.coords.accuracy)}m</p>
            </div>
          </div>
        )}

        {(location.status === 'denied' || location.status === 'unavailable') && (
          <div>
            <p className="text-sm text-text-secondary mb-2">Location access is unavailable.</p>
            <input
              type="text"
              className="manual-location-input"
              placeholder="Enter Location Manually (e.g. Near Cuttack Railway Station)"
              value={manualLocation}
              onChange={e => setManualLocation(e.target.value)}
            />
          </div>
        )}
      </section>

      {/* 3. Evidence */}
      <section className="report-section">
        <h3 className="section-label">ADD EVIDENCE</h3>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleMediaUpload}
        />

        {!mediaPreview ? (
          <div className="evidence-upload" onClick={() => fileInputRef.current?.click()}>
            <Camera size={32} className="text-text-muted mb-2" />
            <span className="font-semibold text-text">Upload Photo / Video</span>
            <span className="text-xs text-text-muted mt-1">or Take Photo</span>
          </div>
        ) : (
          <div className="evidence-upload has-file">
            <img src={mediaPreview} alt="Evidence preview" className="evidence-preview" />
            <button className="evidence-remove" onClick={(e) => { e.stopPropagation(); setMediaPreview(null); }}>
              <X size={16} />
            </button>
          </div>
        )}
        <p className="evidence-note">Photos help responders verify the situation.</p>
      </section>

      {/* 4. Description */}
      <section className="report-section">
        <h3 className="section-label">WHAT SHOULD RESPONDERS KNOW?</h3>
        <textarea
          className="report-textarea"
          placeholder="Describe what you are seeing..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <div className="tags-container">
          {QUICK_TAGS.map(tag => (
            <button
              key={tag}
              className={`tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* 5. Urgency */}
      <section className="report-section">
        <h3 className="section-label">HOW URGENT IS THIS?</h3>
        <div className="urgency-grid">
          <div
            className={`urgency-card urgency-low ${urgency === 'Low' ? 'selected' : ''}`}
            onClick={() => setUrgency('Low')}
          >
            <span className="urgency-label">LOW</span>
            <span className="urgency-desc">Situation observed, no immediate danger</span>
          </div>
          <div
            className={`urgency-card urgency-medium ${urgency === 'Medium' ? 'selected' : ''}`}
            onClick={() => setUrgency('Medium')}
          >
            <span className="urgency-label">MEDIUM</span>
            <span className="urgency-desc">People/property may be at risk</span>
          </div>
          <div
            className={`urgency-card urgency-critical ${urgency === 'Critical' ? 'selected' : ''}`}
            onClick={() => setUrgency('Critical')}
          >
            <span className="urgency-label">CRITICAL</span>
            <span className="urgency-desc">Immediate danger / life-threatening situation</span>
          </div>
        </div>
      </section>

      <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <><Loader2 className="animate-spin" size={20} /> SUBMITTING...</>
        ) : (
          'SUBMIT INCIDENT'
        )}
      </button>

      {/* My Reports */}
      <section className="my-reports-section">
        <h3 className="my-reports-title">MY RECENT REPORTS</h3>

        {reports.length === 0 ? (
          <div className="reports-empty">
            <p className="font-semibold mb-1">No reports yet</p>
            <p className="text-sm">Reports you submit will appear here.</p>
          </div>
        ) : (
          <div className="reports-list">
            {reports.map(report => (
              <div key={report.id} className="report-item" onClick={() => setViewingReport(report)}>
                <div className="report-item-left">
                  {report.mediaBase64 ? (
                    <img src={report.mediaBase64} alt="" className="report-item-thumb" />
                  ) : (
                    <div className="report-item-thumb">
                      <Camera size={16} />
                    </div>
                  )}
                  <div className="report-item-info">
                    <h4>{INCIDENT_TYPES.find(t => t.id === report.type)?.label || report.type}</h4>
                    <p>
                      <MapPin size={10} /> {report.locationName.substring(0, 25)}{report.locationName.length > 25 ? '...' : ''} • {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`report-status-badge status-${report.status.toLowerCase()}`}>
                    {report.status}
                  </span>
                  <ChevronRight size={16} className="text-text-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Report Detail Drawer */}
      <AnimatePresence>
        {viewingReport && (
          <div className="intel-drawer-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) setViewingReport(null);
          }}>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="intel-drawer" // Reusing intelligence drawer styles
            >
              <div className="drawer-header">
                <span className={`report-status-badge status-${viewingReport.status.toLowerCase()}`}>
                  {viewingReport.status}
                </span>
                <button className="drawer-close" onClick={() => setViewingReport(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="drawer-content">
                {viewingReport.mediaBase64 && (
                  <img src={viewingReport.mediaBase64} alt="Evidence" className="w-full rounded-md object-contain max-h-64 bg-black/20" />
                )}

                <div>
                  <h2 className="drawer-title">{INCIDENT_TYPES.find(t => t.id === viewingReport.type)?.label || viewingReport.type}</h2>

                  <div className="drawer-meta-grid">
                    <div className="drawer-meta-item">
                      <span className="drawer-meta-label">Location</span>
                      <span className="drawer-meta-value flex items-center gap-1">
                        <MapPin size={12} /> {viewingReport.locationName}
                      </span>
                    </div>
                    <div className="drawer-meta-item">
                      <span className="drawer-meta-label">Reported Time</span>
                      <span className="drawer-meta-value">{new Date(viewingReport.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="drawer-meta-item">
                      <span className="drawer-meta-label">Urgency</span>
                      <span className={`drawer-meta-value font-bold ${viewingReport.urgency === 'Critical' ? 'text-danger' : viewingReport.urgency === 'Medium' ? 'text-warning' : 'text-success'}`}>
                        {viewingReport.urgency}
                      </span>
                    </div>
                    <div className="drawer-meta-item">
                      <span className="drawer-meta-label">Sync Status</span>
                      <span className="drawer-meta-value" style={{ color: viewingReport.status === 'PendingSync' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                        {viewingReport.status === 'PendingSync' ? 'Offline - Waiting' : 'Synced'}
                      </span>
                    </div>
                  </div>

                  {viewingReport.description && (
                    <div className="mt-4">
                      <h3 className="drawer-section-title">Description</h3>
                      <p className="drawer-desc mt-2 whitespace-pre-wrap">{viewingReport.description}</p>
                    </div>
                  )}

                  <div className="mt-6">
                    <h3 className="drawer-section-title">Response Updates</h3>
                    <p className="drawer-desc mt-2">No response updates yet.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
