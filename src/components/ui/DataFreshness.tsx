import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface DataFreshnessProps {
  lastUpdated: Date | null;
  isLive?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
}

export const DataFreshness: React.FC<DataFreshnessProps> = ({
  lastUpdated,
  isLive = false,
  onRefresh,
  loading = false
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!lastUpdated) {
      setTimeAgo('Unavailable');
      return;
    }

    const updateTime = () => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

      if (diffInSeconds < 60) {
        setTimeAgo(`${diffInSeconds} sec ago`);
      } else if (diffInSeconds < 3600) {
        setTimeAgo(`${Math.floor(diffInSeconds / 60)} min ago`);
      } else {
        setTimeAgo('Stale');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000); // update string every 10s

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="data-freshness">
      {isLive && <span className="live-indicator"><span className="live-dot"></span> LIVE</span>}
      <span className="time-ago">Updated {timeAgo}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`refresh-btn ${loading ? 'spinning' : ''}`}
          aria-label="Refresh data"
          title="Refresh data"
        >
          <RefreshCw size={12} />
        </button>
      )}
    </div>
  );
};
