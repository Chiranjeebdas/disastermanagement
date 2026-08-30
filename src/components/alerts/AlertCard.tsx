import React from 'react';
import type { Alert, AlertSeverity } from '../../types/alert';
import { AlertTriangle, ShieldAlert, Info, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  alert: Alert;
  onClick: (alert: Alert) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onClick }) => {
  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical': 
        return { 
          icon: <ShieldAlert size={20} />, 
          tag: '[CRITICAL]',
          badgeText: alert.status?.toUpperCase() || 'ACTIVE',
          badgeClass: 'status-critical'
        };
      case 'Warning': 
        return { 
          icon: <AlertTriangle size={20} />, 
          tag: '[WARNING]',
          badgeText: alert.status?.toUpperCase() || 'MONITORING',
          badgeClass: 'status-warning'
        };
      case 'Advisory': 
        return { 
          icon: <Info size={20} />, 
          tag: '[ADVISORY]',
          badgeText: alert.status?.toUpperCase() || 'ACTIVE',
          badgeClass: 'status-advisory'
        };
      case 'Resolved': 
        return { 
          icon: <CheckCircle2 size={20} />, 
          tag: '[RESOLVED]',
          badgeText: 'RESOLVED',
          badgeClass: 'status-resolved'
        };
      default: 
        return { 
          icon: <Info size={20} />, 
          tag: '[ALERT]',
          badgeText: 'ACTIVE',
          badgeClass: 'status-advisory'
        };
    }
  };

  const config = getSeverityConfig(alert.severity);
  const timeAgo = formatDistanceToNow(new Date(alert.detectedAt || alert.updatedAt), { addSuffix: true });
  const severityClass = `severity-${alert.severity.toLowerCase()}`;

  return (
    <div 
      onClick={() => onClick(alert)}
      className={`alert-card ${severityClass}`}
      role="button"
      tabIndex={0}
    >
      {/* LEFT: Severity Indicator Icon */}
      <div className="alert-card-icon-wrapper">
        {config.icon}
      </div>

      {/* CENTER & BOTTOM: Content */}
      <div className="alert-card-body">
        <div className="alert-card-tag">
          {config.tag}
        </div>
        
        <h3 className="alert-card-title">
          {alert.title}
        </h3>
        
        <div className="alert-card-location">
          <MapPin size={13} className="alert-location-icon" />
          <span>{alert.location}</span>
        </div>
        
        <p className="alert-card-desc">
          "{alert.description}"
        </p>

        {/* BOTTOM: Source and Time */}
        <div className="alert-card-meta">
          <span>Source: {alert.source}</span>
          <span className="meta-dot">•</span>
          <span>Detected: {timeAgo}</span>
        </div>
      </div>

      {/* RIGHT: Status and Action */}
      <div className="alert-card-actions">
        <span className={`alert-status-pill ${config.badgeClass}`}>
          {config.badgeText}
        </span>
        
        <div className="view-details-btn">
          <span>View details</span>
          <ChevronRight size={15} />
        </div>
      </div>
    </div>
  );
};
