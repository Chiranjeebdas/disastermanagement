import React from 'react';
import { Info, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'info' | 'warning' | 'error';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon, 
  action,
  variant = 'info'
}) => {
  
  const renderIcon = () => {
    if (icon) return icon;
    if (variant === 'warning' || variant === 'error') return <AlertCircle size={32} />;
    return <Info size={32} />;
  };

  return (
    <div className={`empty-state variant-${variant}`}>
      <div className="empty-state-icon">
        {renderIcon()}
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-description">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};
