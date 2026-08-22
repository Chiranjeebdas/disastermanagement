import React from 'react';
import type { Alert, AlertSeverity } from '../../types/alert';
import { AlertTriangle, ShieldAlert, Info, CheckCircle2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  alert: Alert;
  onClick: (alert: Alert) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onClick }) => {
  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical': return { border: 'border-l-danger border-t-border/40 border-r-border/40 border-b-border/40', text: 'text-danger', icon: <ShieldAlert size={18} /> };
      case 'Warning': return { border: 'border-l-warning border-t-border/40 border-r-border/40 border-b-border/40', text: 'text-warning', icon: <AlertTriangle size={18} /> };
      case 'Advisory': return { border: 'border-l-info border-t-border/40 border-r-border/40 border-b-border/40', text: 'text-info', icon: <Info size={18} /> };
      case 'Resolved': return { border: 'border-l-success border-t-border/40 border-r-border/40 border-b-border/40', text: 'text-success', icon: <CheckCircle2 size={18} /> };
      default: return { border: 'border-l-border border-t-border/40 border-r-border/40 border-b-border/40', text: 'text-text-secondary', icon: <Info size={18} /> };
    }
  };

  const styles = getSeverityStyles(alert.severity);
  const timeAgo = formatDistanceToNow(new Date(alert.updatedAt), { addSuffix: true });
  const severityClass = `severity-${alert.severity.toLowerCase()}`;

  return (
    <div 
      onClick={() => onClick(alert)}
      className={`alert-card ${severityClass}`}
    >
      {/* LEFT: Severity Indicator */}
      <div className="alert-card-icon">
        {styles.icon}
      </div>

      {/* CENTER & BOTTOM: Content */}
      <div className="alert-card-content">
        <div className="alert-card-severity-badge">
          [{alert.severity}]
        </div>
        
        <h3 className="alert-card-title">
          {alert.title}
        </h3>
        
        <p className="alert-card-location">
          {alert.location}
        </p>
        
        <p className="alert-card-desc">
          "{alert.description}"
        </p>

        {/* BOTTOM: Source and Time */}
        <div className="alert-card-meta">
          <span>Source: {alert.source}</span>
          <span>Detected: {timeAgo}</span>
        </div>
      </div>

      {/* RIGHT: Status and Action */}
      <div className="alert-card-actions">
        <span className="alert-status-pill">
          {alert.status}
        </span>
        
        <div className="view-details-btn">
          <span>View details</span>
          <ExternalLink size={14} />
        </div>
      </div>
    </div>
  );
};
