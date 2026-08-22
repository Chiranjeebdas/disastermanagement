import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import '../../styles/ClimateNewsFeed.css';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  isUrgent?: boolean;
}

const initialNews: NewsItem[] = [
  { id: '1', title: 'Global temperatures reach record highs in equatorial regions', source: 'Climate Watch', time: '10m ago', isUrgent: true },
  { id: '2', title: 'New oceanic current patterns affecting coastal weather predictability', source: 'Oceanic Inst.', time: '1h ago' },
  { id: '3', title: 'Deforestation impact on local micro-climates studied in recent report', source: 'Eco Journal', time: '3h ago' },
  { id: '4', title: 'Unexpected shift in monsoon winds could delay seasonal rains', source: 'Met Dept', time: '5h ago', isUrgent: true },
];

const upcomingNews: NewsItem[] = [
  { id: '5', title: 'Flash flood warnings issued for low-lying coastal areas', source: 'Alert Network', time: 'Just now', isUrgent: true },
  { id: '6', title: 'Seismic activity detected near major fault lines', source: 'Geology Dept', time: 'Just now' },
  { id: '7', title: 'Sudden drop in atmospheric pressure recorded', source: 'Weather Bureau', time: 'Just now', isUrgent: true },
];

export const ClimateNewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>(initialNews);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < upcomingNews.length) {
        setNews(prev => {
          // Add new item and update times of existing ones to seem dynamic
          const updated = prev.map(n => ({...n, time: n.time === 'Just now' ? '1m ago' : n.time}));
          return [upcomingNews[index], ...updated];
        });
        index++;
      }
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="telemetry-section climate-news-section">
      <header className="climate-news-header">
        <h2 className="climate-news-title">
          <Newspaper size={16} />
          LIVE CLIMATE FEED
        </h2>
        <p className="climate-news-subtitle">Real-time environmental and climate intelligence</p>
      </header>
      
      <div className="climate-news-list">
        {news.map((item, i) => (
          <div 
            key={item.id} 
            className={`news-card ${item.isUrgent ? 'urgent' : ''}`}
            style={{
              animation: i === 0 && item.time === 'Just now' ? 'slideDownFeed 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
            }}
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
        ))}
      </div>
    </section>
  );
};
