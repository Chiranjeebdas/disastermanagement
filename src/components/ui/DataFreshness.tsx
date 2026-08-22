import React from 'react';
import { RefreshCw } from 'lucide-react';

interface DataFreshnessProps {
  lastUpdated: Date | null;
  isLive?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
}

export const DataFreshness: React.FC<DataFreshnessProps> = ({
  isLive = false,
  onRefresh,
  loading = false
}) => {
  return (
    <div className="data-freshness" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {isLive && <span className="live-indicator" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-critical)' }}><span className="live-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-critical)', borderRadius: '50%' }}></span> LIVE</span>}
      
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`refresh-btn ${loading ? 'spinning' : ''}`}
          aria-label="Refresh data"
          title="Refresh data"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px' }}
        >
          <RefreshCw size={14} />
        </button>
      )}
    </div>
  );
};
