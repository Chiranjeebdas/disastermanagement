import React from 'react';

interface LoadingStateProps {
  text?: string;
  minimal?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  text = 'Loading...',
  minimal = false
}) => {
  if (minimal) {
    return (
      <div className="loading-state-minimal">
        <div className="skeleton-pulse"></div>
        <span className="loading-text">{text}</span>
      </div>
    );
  }

  return (
    <div className="loading-state">
      <div className="skeleton-block title"></div>
      <div className="skeleton-block line"></div>
      <div className="skeleton-block line short"></div>
      <span className="loading-text sr-only">{text}</span>
    </div>
  );
};
