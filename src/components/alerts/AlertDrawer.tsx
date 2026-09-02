import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert, AlertSeverity } from '../../types/alert';
import { X, Map, Check, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { InformationQualitySection } from './InformationQualitySection';

interface AlertDrawerProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onAlertUpdated?: (updatedAlert: Alert) => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({
  alert,
  isOpen,
  onClose,
  onAcknowledge,
  onAlertUpdated
}) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [localAlert, setLocalAlert] = useState<Alert | null>(alert);

  useEffect(() => {
    setLocalAlert(alert);
  }, [alert]);

  const handleAlertUpdated = (updated: Alert) => {
    setLocalAlert(updated);
    if (onAlertUpdated) {
      onAlertUpdated(updated);
    }
  };

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical': return { text: 'text-danger', bg: 'bg-danger/10 border-danger/30', icon: <ShieldAlert size={24} /> };
      case 'Warning': return { text: 'text-warning', bg: 'bg-warning/10 border-warning/30', icon: <AlertTriangle size={24} /> };
      case 'Advisory': return { text: 'text-info', bg: 'bg-info/10 border-info/30', icon: <Info size={24} /> };
      case 'Resolved': return { text: 'text-success', bg: 'bg-success/10 border-success/30', icon: <CheckCircle2 size={24} /> };
      default: return { text: 'text-text-secondary', bg: 'bg-surface border-border', icon: <Info size={24} /> };
    }
  };

  const handleViewOnMap = () => {
    onClose();
    navigate('/app/map'); // Navigate to map route as approved in plan
  };

  const activeAlert = localAlert || alert;

  return (
        <AnimatePresence>
          {isOpen && activeAlert && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="alert-drawer-backdrop"
              />

              {/* Drawer Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="alert-drawer"
              >
                {/* Header */}
                <div className="drawer-header">
                  <h3 className="drawer-title">ALERT DETAILS</h3>
                  <button onClick={onClose} className="drawer-close-btn" aria-label="Close drawer">
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="drawer-content">
                  
                  {/* Title & Severity */}
                  <div>
                    <div className="drawer-severity-badge">
                      {getSeverityStyles(activeAlert.severity).icon}
                      {activeAlert.severity}
                    </div>
                    <h2 className="drawer-alert-title">{activeAlert.title}</h2>
                  </div>

                  {/* Key Details Grid */}
                  <div className="drawer-data-grid">
                    <div className="drawer-data-item">
                      <span className="drawer-data-label">Location</span>
                      <span className="drawer-data-value">{activeAlert.location}</span>
                    </div>
                    <div className="drawer-data-item">
                      <span className="drawer-data-label">Detected</span>
                      <span className="drawer-data-value">{format(new Date(activeAlert.detectedAt), 'dd MMM yyyy, HH:mm')}</span>
                    </div>
                    <div className="drawer-data-item">
                      <span className="drawer-data-label">Last updated</span>
                      <span className="drawer-data-value">{formatDistanceToNow(new Date(activeAlert.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Status & Source */}
                  <div className="drawer-section">
                    <div className="drawer-data-grid">
                      <div className="drawer-data-item">
                        <span className="drawer-data-label">Source</span>
                        <span className="drawer-data-value">{activeAlert.source}</span>
                      </div>
                      <div className="drawer-data-item">
                        <span className="drawer-data-label">Status</span>
                        <span className="drawer-data-value" style={{ textTransform: 'uppercase' }}>{activeAlert.status}</span>
                      </div>
                      {activeAlert.riskScore !== undefined && (
                        <div className="drawer-data-item">
                          <span className="drawer-data-label">Assessed Risk</span>
                          <span className="drawer-data-value font-bold text-amber-400">{activeAlert.riskScore}/100 ({activeAlert.warningStage || 'Watch'})</span>
                        </div>
                      )}
                      {activeAlert.confidence !== undefined && (
                        <div className="drawer-data-item">
                          <span className="drawer-data-label">Evidence Confidence</span>
                          <span className="drawer-data-value font-bold text-emerald-400">{activeAlert.confidence}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="drawer-section">
                    <h4 className="drawer-section-title">Description</h4>
                    <p className="drawer-description" style={{ whiteSpace: 'pre-line' }}>{activeAlert.description}</p>
                  </div>

                  {/* Lifecycle Event History */}
                  {activeAlert.lifecycleHistory && activeAlert.lifecycleHistory.length > 0 && (
                    <div className="drawer-section">
                      <h4 className="drawer-section-title">Warning Lifecycle History</h4>
                      <div className="flex flex-col gap-2 bg-surface-secondary/50 p-3 rounded-lg border border-border">
                        {activeAlert.lifecycleHistory.map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between text-xs py-1 border-b border-border/40 last:border-0">
                            <div>
                              <span className="font-bold text-accent uppercase tracking-wider">[{item.stage}]</span>{' '}
                              <span className="text-zinc-300">{item.note}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 flex-shrink-0 ml-2">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Telemetry */}
                  {activeAlert.measurements && activeAlert.measurements.length > 0 && (
                    <div className="drawer-section">
                      <h4 className="drawer-section-title">Environmental Signals</h4>
                      <div className="env-signals-grid">
                        {activeAlert.measurements.map((m, idx) => (
                          <div key={idx} className="env-signal-card">
                            <span className="env-signal-label">{m.label}</span>
                            <span className="env-signal-value">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Information Quality & Verification Section */}
                  <InformationQualitySection
                    alert={activeAlert}
                    onAlertUpdated={handleAlertUpdated}
                    userRole={settings.role}
                  />

                  {/* Action */}
                  {activeAlert.recommendedAction && (
                    <div className="drawer-section">
                      <h4 className="drawer-section-title">Recommended Action</h4>
                      <div className="recommended-action-box">
                        <p className="recommended-action-text">{activeAlert.recommendedAction}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="drawer-footer">
                  <button onClick={handleViewOnMap} className="btn-drawer-action btn-view-map">
                    <Map size={16} /> View on Map
                  </button>
                  {!activeAlert.isAcknowledged && (
                    <button 
                      onClick={() => {
                        onAcknowledge(activeAlert.id);
                        onClose();
                      }}
                      className="btn-drawer-action btn-acknowledge"
                    >
                      <Check size={16} /> Acknowledge
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
  );
};
