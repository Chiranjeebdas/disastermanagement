import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Flame, Cross, MapPin,
  Navigation, Building, Home, WifiOff 
} from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { useNearbyFacilities } from '../hooks/useNearbyFacilities';
import { LoaderOne } from '../components/ui/loader';
import '../styles/EmergencyHelp.css';

// Indian standard emergency numbers as baseline
const EMERGENCY_CONTACTS = {
  police: '100',
  fire: '101',
  ambulance: '102'
};

const QUICK_ASSIST_OPTIONS = [
  { label: 'I need medical help', type: 'Other', urgency: 'Critical', tag: 'Medical emergency' },
  { label: 'I am trapped', type: 'Other', urgency: 'Critical', tag: 'People trapped' },
  { label: 'I need evacuation', type: 'Other', urgency: 'Critical', tag: 'Immediate assistance needed' },
  { label: 'Fire nearby', type: 'Fire', urgency: 'Critical', tag: 'Immediate assistance needed' },
  { label: 'Flooding', type: 'Flood', urgency: 'Medium', tag: 'Water rising' },
  { label: 'Road blocked', type: 'RoadBlockage', urgency: 'Medium', tag: 'Road blocked' },
];

export const EmergencyHelp: React.FC = () => {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { facilities, loading, error } = useNearbyFacilities(location.coords?.latitude, location.coords?.longitude, 10);

  const handleQuickAssist = (option: typeof QUICK_ASSIST_OPTIONS[0]) => {
    // We would pass state to the Report page to prefill it.
    // React Router allows passing state:
    navigate('/app/report', { state: { prefill: option } });
  };

  const handleNavigate = (lat: number, lon: number) => {
    navigate('/app/map', { state: { center: [lat, lon] } });
  };

  // Combined nearest help and shelters

  const getIconForType = (type: string) => {
    switch (type) {
      case 'hospital': return <Cross size={18} />;
      case 'police': return <Shield size={18} />;
      case 'fire': return <Flame size={18} />;
      case 'pharmacy': return <Cross size={18} />;
      case 'shelter': return <Home size={18} />;
      default: return <Building size={18} />;
    }
  };

  return (
    <div className="emergency-container">
      {/* Header */}
      <header className="emergency-header justify-end">
        {(!navigator.onLine) && (
          <div className="mt-4 flex items-center gap-2 text-warning text-sm font-semibold bg-warning/10 border border-warning/20 p-2 rounded-md w-fit">
            <WifiOff size={16} /> OFFLINE MODE: Using locally cached emergency information.
          </div>
        )}
      </header>

      {/* 1. Emergency Action Area */}
      <div className="emergency-action-grid">
        <a href={`tel:${EMERGENCY_CONTACTS.police}`} className="emergency-quick-call">
          <div className="quick-call-icon">
            <Shield size={28} />
          </div>
          <span className="quick-call-label">Police</span>
        </a>

        <a href={`tel:${EMERGENCY_CONTACTS.ambulance}`} className="emergency-quick-call">
          <div className="quick-call-icon">
            <Cross size={28} />
          </div>
          <span className="quick-call-label">Ambulance</span>
        </a>

        <a href={`tel:${EMERGENCY_CONTACTS.fire}`} className="emergency-quick-call">
          <div className="quick-call-icon">
            <Flame size={28} />
          </div>
          <span className="quick-call-label">Fire</span>
        </a>
      </div>

      <div className="emergency-main-layout">
        {/* Nearest Help */}
          <section className="emergency-section">
            <div className="section-header">
              <h2 className="section-title"><Building size={18} className="text-accent" /> NEAREST HELP</h2>
            </div>
            
            {loading ? (
              <div className="resource-loading">
                <LoaderOne />
                <p>Locating verified facilities...</p>
              </div>
            ) : error ? (
              <div className="resource-empty">
                <WifiOff size={32} />
                <p>{error}</p>
                <button className="recalc-btn mt-2 w-fit px-4" onClick={() => window.location.reload()}>Try Again</button>
              </div>
            ) : facilities.length === 0 ? (
              <div className="resource-empty">
                <MapPin size={32} />
                <p className="font-bold">NO NEARBY RESOURCES FOUND</p>
                <p className="text-xs">DRISHTI could not retrieve nearby emergency facilities.</p>
              </div>
            ) : (
              <div className="resource-list">
                {facilities.slice(0, 8).map(facility => (
                  <div key={facility.id} className="resource-card">
                    <div className="resource-header">
                      <div className="resource-info">
                        <div className="resource-icon">{getIconForType(facility.type)}</div>
                        <div>
                          <h3 className="resource-name">{facility.name}</h3>
                          <div className="resource-meta">
                            <span className="resource-type">{facility.type}</span>
                            {facility.distance && <span>{facility.distance.toFixed(1)} km away</span>}
                            {facility.type === 'shelter' && facility.address && (
                              <span className="truncate max-w-[200px]" title={facility.address}>
                                {facility.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="resource-actions mt-2 border-t border-border pt-3">
                      <button className="resource-btn secondary" onClick={() => handleNavigate(facility.lat, facility.lon)}>
                        <MapPin size={14} /> View
                      </button>
                      <button className="resource-btn primary" onClick={() => handleNavigate(facility.lat, facility.lon)}>
                        <Navigation size={14} /> Navigate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        {/* Need Help Quick Options */}
          <section className="emergency-section bg-accent/5">
            <div className="section-header border-accent/20">
              <h2 className="section-title text-accent">NEED HELP?</h2>
            </div>
            <p className="text-sm text-text-secondary mb-2">Select an option to quickly generate an emergency report for responders.</p>
            <div className="quick-assist-grid">
              {QUICK_ASSIST_OPTIONS.map((opt, idx) => (
                <button key={idx} className="quick-assist-btn" onClick={() => handleQuickAssist(opt)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </section>
      </div>
    </div>
  );
};
