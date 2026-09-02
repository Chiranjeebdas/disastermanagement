import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Eye
} from 'lucide-react';
import type { CitizenNotification } from '../../utils/citizenNotifications';
import '../../styles/CitizenNotificationBanner.css';

interface CitizenNotificationBannerProps {
  notification: CitizenNotification | null;
  onDismiss: () => void;
}

export const CitizenNotificationBanner: React.FC<CitizenNotificationBannerProps> = ({
  notification,
  onDismiss
}) => {
  const navigate = useNavigate();

  if (!notification) return null;

  const getSeverityIcon = () => {
    switch (notification.severityClass) {
      case 'emergency':
        return <AlertOctagon size={14} />;
      case 'warning':
        return <AlertTriangle size={14} />;
      case 'watch':
        return <ShieldAlert size={14} />;
      case 'advisory':
        return <Eye size={14} />;
      case 'resolved':
      default:
        return <ShieldCheck size={14} />;
    }
  };

  return (
    <div className="citizen-toast-container" role="alert" aria-live="assertive">
      <div className={`citizen-toast-card ${notification.severityClass}`}>
        {/* Top Header */}
        <div className="citizen-toast-header">
          <div className="citizen-toast-left-badge">
            <span className="citizen-toast-badge">
              {getSeverityIcon()}
              <span>{notification.severityBadge}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="citizen-toast-close-btn"
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>

        {/* 1. What Happened */}
        <h3 className="citizen-toast-title">{notification.headline}</h3>

        {/* 2 & 3. What User Should Do */}
        <p className="citizen-toast-action-text">
          <strong>Action: </strong>
          {notification.recommendedAction}
        </p>

        {/* 4 & 5. Affected Area & Update Time */}
        <div className="citizen-toast-footer">
          <div className="citizen-toast-meta">
            <span className="flex items-center gap-1">
              <MapPin size={11} className="text-emerald-400" />
              <span>{notification.affectedArea}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-zinc-400" />
              <span>{notification.updateTime}</span>
            </span>
          </div>

          {notification.targetUrl && (
            <button
              type="button"
              onClick={() => {
                onDismiss();
                navigate(notification.targetUrl!);
              }}
              className="citizen-toast-view-btn"
            >
              <span>View Details</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
