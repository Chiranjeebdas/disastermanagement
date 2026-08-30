import React from 'react';
import type { AlertSeverity } from '../../types/alert';
import { ShieldAlert, AlertTriangle, Info, Check } from 'lucide-react';

interface AlertSummaryProps {
  counts: Record<AlertSeverity, number>;
}

export const AlertSummary: React.FC<AlertSummaryProps> = ({ counts }) => {
  const summaryItems = [
    {
      severity: 'Critical' as AlertSeverity,
      label: 'CRITICAL',
      count: counts.Critical || 0,
      icon: <ShieldAlert size={20} />,
      badgeClass: 'badge-critical',
      desc: 'Immediate action required'
    },
    {
      severity: 'Warning' as AlertSeverity,
      label: 'WARNING',
      count: counts.Warning || 0,
      icon: <AlertTriangle size={20} />,
      badgeClass: 'badge-warning',
      desc: 'Requires attention'
    },
    {
      severity: 'Advisory' as AlertSeverity,
      label: 'ADVISORY',
      count: counts.Advisory || 0,
      icon: <Info size={20} />,
      badgeClass: 'badge-advisory',
      desc: 'Monitor conditions'
    },
    {
      severity: 'Resolved' as AlertSeverity,
      label: 'RESOLVED',
      count: counts.Resolved || 0,
      icon: <Check size={20} />,
      badgeClass: 'badge-resolved',
      desc: 'No longer active'
    }
  ];

  return (
    <div className="alert-summary-grid">
      {summaryItems.map((item) => (
        <div key={item.severity} className="summary-card">
          <div className="summary-card-top">
            <div className={`summary-icon-badge ${item.badgeClass}`}>
              {item.icon}
            </div>
            <div className="summary-card-info">
              <span className={`summary-label ${item.badgeClass}`}>{item.label}</span>
              <span className="summary-number">
                {item.count < 10 && item.count > 0 ? `0${item.count}` : item.count}
              </span>
            </div>
          </div>
          <div className="summary-desc">{item.desc}</div>
        </div>
      ))}
    </div>
  );
};
