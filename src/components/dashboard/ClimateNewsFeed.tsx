import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, X } from 'lucide-react';
import '../../styles/ClimateNewsFeed.css';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  isUrgent?: boolean;
  details: string[];
}

const initialNews: NewsItem[] = [
  { 
    id: 'n1', 
    title: 'Devastating flash floods and landslides hit Nepal', 
    source: 'Global Alert', 
    time: 'Just now', 
    isUrgent: true,
    details: [
      '📍 Location: Kathmandu Valley, Sindhupalchok, and Dolakha districts, Nepal.',
      '💀 Fatalities: 148 people confirmed dead, with 75 still reported missing.',
      '⚠️ Affected Population: Over 45,000 people displaced and severely affected.',
      '🏚️ Infrastructure Damage: 3 major bridges destroyed and Prithvi Highway completely blocked by debris.',
      '🚁 Rescue Operations: 15 military helicopters deployed for emergency airlifts from high-risk zones.',
      '💧 Ongoing Risks: River levels remain above the danger mark, with downstream evacuations continuing.'
    ]
  },
  { 
    id: '1', 
    title: 'Magnitude 6.8 Earthquake strikes High Atlas mountains in Morocco', 
    source: 'Seismic Watch', 
    time: '15m ago', 
    isUrgent: true,
    details: [
      'A powerful 6.8 magnitude earthquake struck central Morocco late Friday.',
      'The epicenter was located in the High Atlas mountains, approximately 72 km southwest of Marrakech.',
      'Significant structural damage reported in historical areas, with numerous buildings collapsing.',
      'International rescue teams are mobilizing to assist local emergency services in recovery efforts.'
    ]
  },
  { 
    id: '2', 
    title: 'Unprecedented wildfires force mass evacuations in British Columbia', 
    source: 'Forestry Dept', 
    time: '1h ago',
    isUrgent: true,
    details: [
      'Over 400 active wildfires are currently burning across the Canadian province of British Columbia.',
      'Tens of thousands of residents have been ordered to evacuate immediately as fires approach urban centers.',
      'Thick smoke is causing severe air quality warnings across North America.',
      'Firefighting crews from multiple countries have arrived to assist local teams in containing the blazes.'
    ]
  },
  { 
    id: '3', 
    title: 'Super Typhoon makes landfall in Southern China and Hong Kong', 
    source: 'Pacific Weather', 
    time: '3h ago',
    details: [
      'Winds exceeding 200 km/h have caused widespread destruction and power outages.',
      'Coastal areas are experiencing severe storm surges, leading to extensive flooding.',
      'All flights and public transportation services have been suspended until further notice.',
      'The government has issued its highest hurricane signal, urging all citizens to stay indoors.'
    ]
  },
  { 
    id: '4', 
    title: 'Severe drought conditions declared emergency in the Horn of Africa', 
    source: 'UN Relief', 
    time: '5h ago', 
    details: [
      'Consecutive failed rainy seasons have led to the worst drought in over 40 years.',
      'Millions are facing acute food insecurity and severe water shortages.',
      'Livestock herds have been decimated, destroying the livelihoods of nomadic communities.',
      'International aid organizations are appealing for immediate humanitarian assistance funding.'
    ]
  },
];

const upcomingNews: NewsItem[] = [
  { 
    id: '5', 
    title: 'Volcanic eruption begins on the Reykjanes Peninsula in Iceland', 
    source: 'Geo Alert', 
    time: 'Just now', 
    isUrgent: true,
    details: [
      'A new fissure eruption has started near Grindavík following weeks of intense seismic activity.',
      'Lava fountains reaching 50 meters high are visible from the capital, Reykjavik.',
      'The nearby town and the Blue Lagoon geothermal spa have been fully evacuated.',
      'Aviation color code raised to red, though international flights remain currently unaffected.'
    ]
  },
  { 
    id: '6', 
    title: 'Tornado outbreak causes catastrophic damage in the US Midwest', 
    source: 'Storm Center', 
    time: 'Just now',
    isUrgent: true,
    details: [
      'A series of intense tornadoes swept across multiple states, including Iowa and Illinois.',
      'Entire neighborhoods have been leveled, with search and rescue operations actively underway.',
      'Over 500,000 homes are without power as utility infrastructure suffered massive hits.',
      'Emergency shelters have been opened in schools and community centers for displaced families.'
    ]
  },
  { 
    id: '7', 
    title: 'Massive landslide buries remote village in Papua New Guinea', 
    source: 'Disaster Relief', 
    time: 'Just now', 
    isUrgent: true,
    details: [
      'A catastrophic landslide triggered by heavy rains has struck the remote Enga province.',
      'Initial reports suggest hundreds of homes have been buried under deep mud and debris.',
      'Rescue efforts are severely hampered by the remote location and ongoing unstable terrain.',
      'International aid and specialized heavy lifting equipment are urgently being requested.'
    ]
  },
];

export const ClimateNewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < upcomingNews.length) {
        setNews(prev => {
          // Add new item and update times of existing ones to seem dynamic
          const updated = prev.map(n => ({ ...n, time: n.time === 'Just now' ? '1m ago' : n.time }));
          return [upcomingNews[index], ...updated];
        });
        index++;
      }
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="telemetry-section climate-news-section" style={{ position: 'relative' }}>
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
        ))}
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
