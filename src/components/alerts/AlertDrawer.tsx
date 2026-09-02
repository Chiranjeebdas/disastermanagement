import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert, AlertSeverity } from '../../types/alert';
import { 
  X, 
  Map, 
  Check, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  RefreshCw, 
  Radio, 
  ShieldCheck 
} from 'lucide-react';
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

  const safeFormatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : format(d, 'dd MMM yyyy, HH:mm');
    } catch {
      return dateStr;
    }
  };

  const safeFormatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'Recently' : formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical': 
        return { 
          icon: <ShieldAlert size={18} className="text-red-400 shrink-0" />, 
          badgeClass: 'severity-critical' 
        };
      case 'Warning': 
        return { 
          icon: <AlertTriangle size={18} className="text-amber-400 shrink-0" />, 
          badgeClass: 'severity-warning' 
        };
      case 'Advisory': 
        return { 
          icon: <Info size={18} className="text-sky-400 shrink-0" />, 
          badgeClass: 'severity-advisory' 
        };
      case 'Resolved': 
        return { 
          icon: <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />, 
          badgeClass: 'severity-resolved' 
        };
      default: 
        return { 
          icon: <Info size={18} className="text-zinc-400 shrink-0" />, 
          badgeClass: 'severity-advisory' 
        };
    }
  };

  const handleViewOnMap = () => {
    onClose();
    if (alert?.latitude && alert?.longitude) {
      navigate('/app/map', { state: { center: [alert.latitude, alert.longitude], alertId: alert.id } });
    } else {
      navigate('/app/map');
    }
  };

  const sevConfig = alert ? getSeverityStyles(alert.severity) : null;

  const drawerContent = (
    <AnimatePresence>
      {isOpen && alert && (
        <div className="alert-drawer-portal-root">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="alert-drawer-backdrop drawer-overlay"
          />

          {/* Drawer Box on Right Side */}
          <motion.div
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="alert-drawer drawer-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="drawer-header">
              <div className="drawer-header-left">
                <span className="drawer-kicker">INCIDENT DOSSIER</span>
                <h3 className="drawer-title">ALERT DETAILS</h3>
              </div>
              <button onClick={onClose} className="drawer-close-btn" aria-label="Close alert details">
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="drawer-content">
              {/* Severity & Title */}
              <div className="drawer-hero-section">
                <div className={`drawer-severity-badge ${sevConfig?.badgeClass || ''}`}>
                  {sevConfig?.icon}
                  <span>{alert.severity.toUpperCase()} PRIORITY</span>
                  <span className="drawer-status-tag">{alert.status?.toUpperCase() || 'ACTIVE'}</span>
                </div>
                <h2 className="drawer-alert-title">{alert.title}</h2>
              </div>

              {/* Tactical Meta Grid */}
              <div className="drawer-data-grid">
                <div className="drawer-data-item">
                  <span className="drawer-data-label">
                    <MapPin size={12} className="inline mr-1 text-zinc-400" /> Location
                  </span>
                  <span className="drawer-data-value">{alert.location}</span>
                </div>
                <div className="drawer-data-item">
                  <span className="drawer-data-label">
                    <Clock size={12} className="inline mr-1 text-zinc-400" /> Detected
                  </span>
                  <span className="drawer-data-value">{safeFormatDate(alert.detectedAt)}</span>
                </div>
                <div className="drawer-data-item">
                  <span className="drawer-data-label">
                    <RefreshCw size={12} className="inline mr-1 text-zinc-400" /> Last Updated
                  </span>
                  <span className="drawer-data-value">{safeFormatTimeAgo(alert.updatedAt)}</span>
                </div>
                <div className="drawer-data-item">
                  <span className="drawer-data-label">
                    <Radio size={12} className="inline mr-1 text-zinc-400" /> Source Feed
                  </span>
                  <span className="drawer-data-value">{alert.source}</span>
                </div>
              </div>

              {/* Description / Field Assessment */}
              <div className="drawer-section">
                <h4 className="drawer-section-title">Incident Assessment</h4>
                <div className="drawer-description-box">
                  <p className="drawer-description">{alert.description}</p>
                </div>
              </div>

              {/* Environmental Telemetry */}
              {alert.measurements && alert.measurements.length > 0 && (
                <div className="drawer-section">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="drawer-section-title">Environmental Telemetry</h4>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">
                      ● Active Sensors
                    </span>
                  </div>
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

              {/* Recommended Action */}
              {alert.recommendedAction && (
                <div className="drawer-section">
                  <h4 className="drawer-section-title">Recommended Protocol</h4>
                  <div className="recommended-action-box">
                    <div className="recommended-action-header">
                      <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                      <span>OPERATIONAL GUIDANCE</span>
                    </div>
                    <p className="recommended-action-text">{alert.recommendedAction}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Actions Footer */}
            <div className="drawer-footer">
              <button onClick={handleViewOnMap} className="btn-drawer-action btn-view-map">
                <Map size={16} />
                <span>View on Map</span>
              </button>
              {!alert.isAcknowledged ? (
                <button 
                  onClick={() => {
                    onAcknowledge(alert.id);
                  }}
                  className="btn-drawer-action btn-acknowledge"
                >
                  <Check size={16} />
                  <span>Acknowledge</span>
                </button>
              ) : (
                <div className="drawer-ack-confirmed">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>Acknowledged</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : null;
};
