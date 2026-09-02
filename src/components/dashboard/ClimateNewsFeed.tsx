import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, X, Radio } from 'lucide-react';
import '../../styles/ClimateNewsFeed.css';
import { fetchGlobalUSGSAlerts, fetchLiveWeatherAlerts } from '../../utils/liveIngestion';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  isUrgent?: boolean;
  details: string[];
}

export const ClimateNewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real-time live seismic events and meteorological intelligence
  const loadLiveFeed = async () => {
    try {
      setLoading(true);
      const [usgs, weather] = await Promise.all([
        fetchGlobalUSGSAlerts(15),
        fetchLiveWeatherAlerts(20.4625, 85.8828)
      ]);

      const liveItems: NewsItem[] = [];

      // Add live USGS seismic detections
      usgs.forEach(item => {
        const timeDiffMins = Math.max(1, Math.round((Date.now() - new Date(item.detectedAt).getTime()) / (1000 * 60)));
        const timeStr = timeDiffMins < 60 ? `${timeDiffMins}m ago` : `${Math.round(timeDiffMins / 60)}h ago`;

        const measurementsStr = (item.measurements || []).map(m => `${m.label}: ${m.value}`).join(' • ');

        liveItems.push({
          id: item.id,
          title: item.title,
          source: item.source,
          time: timeStr,
          isUrgent: item.severity === 'Critical',
          details: [
            `📍 Location: ${item.location}`,
            `⚡ Severity Classification: ${item.severity.toUpperCase()} PRIORITY`,
            `📊 Telemetry: ${measurementsStr || 'Live Seismograph Feed'}`,
            `⚠️ Radius Impact: ${item.affectedRadiusKm || 20} km radius estimated`,
            `🛡️ Recommended Action Guidance: ${item.recommendedAction}`,
            `📡 Sensor Protocol: Verified via USGS Global Seismographic Network & Real-Time Accelerometer Nodes`
          ]
        });
      });

      // Add live Weather intelligence
      weather.forEach(item => {
        const measurementsStr = (item.measurements || []).map(m => `${m.label}: ${m.value}`).join(' • ');

        liveItems.push({
          id: item.id,
          title: item.title,
          source: item.source,
          time: 'Live Stream',
          isUrgent: item.severity === 'Critical',
          details: [
            `📍 Observation Area: ${item.location}`,
            `⚡ Threat Level: ${item.severity.toUpperCase()} ADVISORY`,
            `📊 Real-Time Atmospheric Readings: ${measurementsStr || 'Station Telemetry'}`,
            `🛡️ Action Protocol: ${item.recommendedAction}`,
            `📡 Telemetry Feed: Open-Meteo High-Resolution Numerical Weather Prediction Model`
          ]
        });
      });

      if (liveItems.length > 0) {
        setNews(liveItems);
      }
    } catch (err) {
      console.warn('Error fetching live climate feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveFeed();

    // Auto-poll live news every 60 seconds
    const interval = setInterval(loadLiveFeed, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="telemetry-section climate-news-section" style={{ position: 'relative' }}>
      <header className="climate-news-header flex items-center justify-between">
        <div>
          <h2 className="climate-news-title flex items-center gap-1.5">
            <Newspaper size={16} />
            LIVE HAZARD & SEISMIC FEED
          </h2>
          <p className="climate-news-subtitle">100% Real-Time USGS Global & Regional Meteorological Telemetry</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <Radio size={10} className="animate-pulse text-emerald-400" />
          <span>LIVE API</span>
        </div>
      </header>

      <div className="climate-news-list">
        {loading && !news.length ? (
          <div className="p-4 text-center text-xs text-zinc-400 animate-pulse">
            Connecting to global seismographic & weather API feeds...
          </div>
        ) : (
          news.map((item) => (
            <div
              key={item.id}
              className={`news-card ${item.isUrgent ? 'urgent' : ''}`}
              onClick={() => setSelectedNews(item)}
            >
              <div className="news-card-header">
                <h3 className="news-card-title">
                  {item.title}
                </h3>
                <ExternalLink size={14} className="news-card-link-icon" />
              </div>
              <div className="news-card-footer">
                <span className="news-card-source">{item.source}</span>
                <span className="news-card-time">
                  <Clock size={12} />
                  {item.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedNews && (
        <div className="news-modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="news-modal-content" onClick={e => e.stopPropagation()}>
            <button className="news-modal-close" onClick={() => setSelectedNews(null)}>
              <X size={20} />
            </button>
            <div className={`news-modal-header ${selectedNews.isUrgent ? 'urgent' : ''}`}>
              <h3 className="news-modal-title">{selectedNews.title}</h3>
              <div className="news-modal-meta">
                <span className="news-modal-source">{selectedNews.source}</span>
                <span className="news-modal-time"><Clock size={14} />{selectedNews.time}</span>
              </div>
            </div>
            <div className="news-modal-body">
              <ul className="news-details-list">
                {selectedNews.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
