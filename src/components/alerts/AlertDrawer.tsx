import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert, AlertSeverity } from '../../types/alert';
import { X, Map, Check, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface AlertDrawerProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({ alert, isOpen, onClose, onAcknowledge }) => {
  const navigate = useNavigate();

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

  return (
        <AnimatePresence>
          {isOpen && alert && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="drawer-overlay"
              />

              {/* Drawer Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="drawer-panel"
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
                      {getSeverityStyles(alert.severity).icon}
                      {alert.severity}
                    </div>
                    <h2 className="drawer-alert-title">{alert.title}</h2>
                  </div>

                  {/* Key Details Grid */}
                  <div className="drawer-data-grid">
                    <div className="drawer-data-item">
                      <span className="drawer-data-label">Location</span>
                      <span className="drawer-data-value">{alert.location}</span>
                    </div>
                    <div className="drawer-data-item">
                      <span className="drawer-data-label">Detected</span>
                      <span className="drawer-data-value">{format(new Date(alert.detectedAt), 'dd MMM yyyy, HH:mm')}</span>
                    </div>
                    <div className="drawer-data-item">
                      <span className="drawer-data-label">Last updated</span>
                      <span className="drawer-data-value">{formatDistanceToNow(new Date(alert.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Status & Source */}
                  <div className="drawer-section">
                    <div className="drawer-data-grid">
                      <div className="drawer-data-item">
                        <span className="drawer-data-label">Source</span>
                        <span className="drawer-data-value">{alert.source}</span>
                      </div>
                      <div className="drawer-data-item">
                        <span className="drawer-data-label">Status</span>
                        <span className="drawer-data-value" style={{ textTransform: 'uppercase' }}>{alert.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="drawer-section">
                    <h4 className="drawer-section-title">Description</h4>
                    <p className="drawer-description">{alert.description}</p>
                  </div>

                  {/* Telemetry */}
                  {alert.measurements && alert.measurements.length > 0 && (
                    <div className="drawer-section">
                      <h4 className="drawer-section-title">Environmental Signals</h4>
                      <div className="env-signals-grid">
                        {alert.measurements.map((m, idx) => (
                          <div key={idx} className="env-signal-card">
                            <span className="env-signal-label">{m.label}</span>
                            <span className="env-signal-value">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action */}
                  {alert.recommendedAction && (
                    <div className="drawer-section">
                      <h4 className="drawer-section-title">Recommended Action</h4>
                      <div className="recommended-action-box">
                        <p className="recommended-action-text">{alert.recommendedAction}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="drawer-footer">
                  <button onClick={handleViewOnMap} className="btn-drawer-action btn-view-map">
                    <Map size={16} /> View on Map
                  </button>
                  {!alert.isAcknowledged && (
                    <button 
                      onClick={() => {
                        onAcknowledge(alert.id);
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
