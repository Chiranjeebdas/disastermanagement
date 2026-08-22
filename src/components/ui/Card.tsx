import React from 'react';
import { InteractiveCard } from './InteractiveCard';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  severity?: 'critical' | 'high' | 'moderate' | 'low' | 'safe' | 'info';
  isInteractive?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '', 
  headerAction,
  severity,
  isInteractive = true
}) => {
  const severityClass = severity ? `severity-${severity}` : '';
  
  return (
    <InteractiveCard isInteractive={isInteractive} className={`drishti-card ${severityClass} ${className}`}>
      {(title || headerAction) && (
        <div className="card-header">
          {title && (typeof title === 'string' ? <h3 className="card-title">{title}</h3> : title)}
          {headerAction && <div className="card-action">{headerAction}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </InteractiveCard>
  );
};
