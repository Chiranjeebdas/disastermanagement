import React from 'react';
import type { AlertSeverity } from '../../types/alert';
import { AlertTriangle, ShieldAlert, Info, CheckCircle2 } from 'lucide-react';

interface AlertSummaryProps {
  counts: Record<AlertSeverity, number>;
}

export const AlertSummary: React.FC<AlertSummaryProps> = ({ counts }) => {
  const summaryItems: { severity: AlertSeverity; label: string; count: number; icon: React.ReactNode; severityClass: string }[] = [
    { severity: 'Critical', label: 'Critical', count: counts.Critical || 0, icon: <ShieldAlert size={16} />, severityClass: 'critical' },
    { severity: 'Warning', label: 'Warning', count: counts.Warning || 0, icon: <AlertTriangle size={16} />, severityClass: 'warning' },
    { severity: 'Advisory', label: 'Advisory', count: counts.Advisory || 0, icon: <Info size={16} />, severityClass: 'advisory' },
    { severity: 'Resolved', label: 'Resolved', count: counts.Resolved || 0, icon: <CheckCircle2 size={16} />, severityClass: 'resolved' },
  ];

  return (
    <div className="alert-summary-grid">
      {summaryItems.map((item) => (
        <div key={item.severity} className={`summary-card ${item.severityClass}`}>
          <div className="summary-header">
            {item.icon}
            {item.label}
          </div>
          <div className="summary-number">
            {item.count < 10 && item.count > 0 ? `0${item.count}` : item.count}
          </div>
          <div className="summary-desc">
            {item.severity === 'Critical' && 'Immediate action required'}
            {item.severity === 'Warning' && 'Requires attention'}
            {item.severity === 'Advisory' && 'Monitor conditions'}
            {item.severity === 'Resolved' && 'No longer active'}
          </div>
        </div>
      ))}
    </div>
  );
};
