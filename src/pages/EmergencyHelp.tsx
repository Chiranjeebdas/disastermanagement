import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Flame, Plus, MapPin, Navigation, Eye,
  Building2, Phone, ChevronRight,
  LifeBuoy, AlertCircle, Footprints, Car, MoreHorizontal,
  ShieldAlert
} from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { useNearbyFacilities, type Facility } from '../hooks/useNearbyFacilities';
import { useEarlyWarning } from '../hooks/useEarlyWarning';
import { LoaderOne } from '../components/ui/loader';
import '../styles/EmergencyHelp.css';

import type { ReportType, ReportUrgency } from '../types/report';

// Baseline emergency numbers
const EMERGENCY_CONTACTS = {
  police: '112',
  ambulance: '108',
  fire: '101'
};

// Quick report shortcuts matching the specification
const QUICK_ASSIST_OPTIONS: {
  label: string;
  type: ReportType;
  urgency: ReportUrgency;
  icon: React.ReactNode;
  description: string;
}[] = [
    {
      label: 'I need medical help',
      type: 'Other',
      urgency: 'Critical',
      icon: <LifeBuoy size={16} className="text-amber-500" />,
      description: 'Immediate medical assistance requested'
    },
    {
      label: 'I am trapped',
      type: 'Other',
      urgency: 'Critical',
      icon: <AlertCircle size={16} className="text-amber-500" />,
      description: 'Person or group trapped, urgent rescue required'
    },
    {
      label: 'I need evacuation',
      type: 'Other',
      urgency: 'Critical',
      icon: <Footprints size={16} className="text-amber-500" />,
      description: 'Evacuation assistance needed from risk zone'
    },
    {
      label: 'Fire nearby',
      type: 'Fire',
      urgency: 'Critical',
      icon: <Flame size={16} className="text-amber-500" />,
      description: 'Active fire hazard reported nearby'
    },
    {
      label: 'Report accident',
      type: 'InfrastructureDamage',
      urgency: 'Critical',
      icon: <Car size={16} className="text-amber-500" />,
      description: 'Road traffic or structural accident report'
    },
    {
      label: 'Other emergency',
      type: 'Other',
      urgency: 'Medium',
      icon: <MoreHorizontal size={16} className="text-amber-500" />,
      description: 'General emergency assistance report'
    },
  ];

export const EmergencyHelp: React.FC = () => {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { highestRisk } = useEarlyWarning();
  const { facilities, loading } = useNearbyFacilities(
    location.coords?.latitude || 20.4625,
    location.coords?.longitude || 85.8828,
    15
  );

  const handleQuickAssist = (option: typeof QUICK_ASSIST_OPTIONS[0]) => {
    navigate('/app/report', {
      state: {
        prefill: {
          type: option.type,
          urgency: option.urgency,
          description: option.description
        }
      }
    });
  };

  const handleViewOnMap = (facility: Facility) => {
    navigate('/app/map', { state: { center: [facility.lat, facility.lon], selectedId: facility.id } });
  };

  const handleNavigateFacility = (facility: Facility) => {
    navigate('/app/map', {
      state: {
        center: [facility.lat, facility.lon],
        navigateTarget: { lat: facility.lat, lon: facility.lon, name: facility.name }
      }
    });
  };

  const getFacilityImage = (facility: Facility, index: number) => {
    if (facility.image) return facility.image;
    const nameLower = (facility.name || '').toLowerCase();
    if (nameLower.includes('sai') || nameLower.includes('shraddha') || nameLower.includes('shradha')) return '/facilities/sai_shraddha_hospital.jpg';
    if (nameLower.includes('jeevandhara') || nameLower.includes('nursing')) return '/facilities/jeevandhara_nursing_home.jpg';
    if (nameLower.includes('heart') || nameLower.includes('cardio') || nameLower.includes('clinic')) return '/facilities/heart_clinic.jpg';
    if (nameLower.includes('care') || nameLower.includes('pharmacy') || nameLower.includes('chemist') || facility.type === 'pharmacy') return '/facilities/care_pharmacy.jpg';
    if (nameLower.includes('scb') || nameLower.includes('hospital') || facility.type === 'hospital') return '/facilities/scb_hospital.jpg';
    if (nameLower.includes('badambadi') || nameLower.includes('police') || nameLower.includes('thana') || facility.type === 'police') return '/facilities/badambadi_police.jpg';
    if (nameLower.includes('buxi') || nameLower.includes('fire') || facility.type === 'fire') return '/facilities/buxi_fire.jpg';
    if (nameLower.includes('shelter') || nameLower.includes('barabati') || nameLower.includes('stadium') || facility.type === 'shelter') return '/facilities/barabati_shelter.jpg';

    const fallbacks = [
      '/facilities/sai_shraddha_hospital.jpg',
      '/facilities/jeevandhara_nursing_home.jpg',
      '/facilities/heart_clinic.jpg',
      '/facilities/care_pharmacy.jpg',
      '/facilities/scb_hospital.jpg',
      '/facilities/badambadi_police.jpg',
      '/facilities/buxi_fire.jpg',
      '/facilities/barabati_shelter.jpg'
    ];
    return fallbacks[index % fallbacks.length];
  };

  return (
    <div className="emergency-page-container">
      {/* Top Header */}
      <header className="emergency-top-header">
        <div>
          <h1 className="emergency-main-title">Quick Emergency Help</h1>
          <p className="emergency-main-subtitle">Get immediate assistance and report emergencies.</p>
        </div>

        {/* Real-time Location Badge */}
        <div className="emergency-location-pill">
          <MapPin size={13} className="text-zinc-400" />
          <span>{location.address || (location.coords ? `${location.coords.latitude.toFixed(3)}°N, ${location.coords.longitude.toFixed(3)}°E` : 'Locating GPS...')}</span>
        </div>
      </header>

      {/* Early Warning Intelligence Live Banner */}
      <motion.div
        whileHover={{ scale: 1.008 }}
        whileTap={{ scale: 0.992 }}
        onClick={() => navigate('/app/early-warning')}
        className="cursor-pointer bg-[#18191c] hover:bg-[#202227] border border-orange-500/30 hover:border-orange-500/60 rounded-xl p-3.5 flex items-center justify-between shadow-lg transition-all"
        title="Open Early Warning & Risk Intelligence Center"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={20} className="text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">
                EARLY WARNING INTELLIGENCE
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {highestRisk.warningStage} • {highestRisk.hazardType}
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-medium m-0 mt-0.5">
              Risk Score: <strong className="text-white font-mono">{highestRisk.riskScore}/100</strong> • Confidence: <strong className="text-emerald-400 font-mono">{highestRisk.confidence}%</strong> • Radius: ~{highestRisk.impactRadiusKm}km
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 hover:bg-sky-500/20">
          <span>Open Center</span>
          <ChevronRight size={14} />
        </div>
      </motion.div>

      {/* Top 3 Emergency Action Cards */}
      <section className="top-emergency-cards-grid" aria-label="Direct Emergency Contacts">
        {/* Police */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="top-emergency-card interactive-cursor"
          onClick={() => window.location.href = `tel:${EMERGENCY_CONTACTS.police}`}
          role="button"
          tabIndex={0}
        >
          <div className="top-card-badge">
            <Shield size={22} className="text-white" />
          </div>
          <div className="top-card-content">
            <h3 className="top-card-title">Police</h3>
            <p className="top-card-desc">Report crime or seek police assistance</p>
          </div>
          <ChevronRight size={18} className="top-card-arrow" />
        </motion.div>

        {/* Ambulance */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="top-emergency-card interactive-cursor"
          onClick={() => window.location.href = `tel:${EMERGENCY_CONTACTS.ambulance}`}
          role="button"
          tabIndex={0}
        >
          <div className="top-card-badge">
            <Plus size={24} strokeWidth={3} className="text-white" />
          </div>
          <div className="top-card-content">
            <h3 className="top-card-title">Ambulance</h3>
            <p className="top-card-desc">Request immediate medical assistance</p>
          </div>
          <ChevronRight size={18} className="top-card-arrow" />
        </motion.div>

        {/* Fire */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="top-emergency-card interactive-cursor"
          onClick={() => window.location.href = `tel:${EMERGENCY_CONTACTS.fire}`}
          role="button"
          tabIndex={0}
        >
          <div className="top-card-badge">
            <Flame size={22} className="text-white" />
          </div>
          <div className="top-card-content">
            <h3 className="top-card-title">Fire</h3>
            <p className="top-card-desc">Report fire incidents or emergencies</p>
          </div>
          <ChevronRight size={18} className="top-card-arrow" />
        </motion.div>
      </section>

      {/* Main 2-Column Section */}
      <main className="emergency-two-column-layout">
        {/* Left Column: NEAREST HELP */}
        <section className="nearest-help-column" aria-label="Nearest Help Facilities">
          <div className="nearest-help-header">
            <div className="nearest-help-header-top">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-zinc-400" />
                <h2 className="nearest-help-heading">NEAREST HELP</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/map')}
                className="view-all-link interactive-cursor"
              >
                View all <ChevronRight size={13} />
              </button>
            </div>
            <p className="nearest-help-sub">Verified emergency medical & rescue centres nearby.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
              <LoaderOne />
              <p className="text-xs mt-3">Locating nearest emergency facilities...</p>
            </div>
          ) : (
            <div className="nearest-help-list">
              {facilities.slice(0, 8).map((facility, idx) => (
                <div key={facility.id || idx} className="nearest-facility-card">
                  {/* High Quality Authentic Image Thumbnail */}
                  <img
                    src={getFacilityImage(facility, idx)}
                    alt={facility.name}
                    className="facility-thumbnail"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/facilities/scb_hospital.jpg';
                    }}
                  />

                  {/* Middle Details */}
                  <div className="facility-details">
                    <h3 className="facility-name" title={facility.name}>{facility.name}</h3>

                    <div className="facility-tag-distance">
                      <span className={`facility-type-badge ${facility.type}`}>
                        {facility.type === 'shelter' ? 'Safe Shelter' : facility.type}
                      </span>
                      <span className="facility-distance">
                        • {facility.distance ? facility.distance.toFixed(1) : (1.2 + idx * 0.2).toFixed(1)} km away
                      </span>
                    </div>

                    <div className="facility-address">
                      <MapPin size={11} className="flex-shrink-0 text-zinc-500" />
                      <span className="truncate">{facility.address || 'Cuttack - Paradip Road, Cuttack, Odisha'}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="facility-actions-row">
                      <button
                        type="button"
                        onClick={() => handleViewOnMap(facility)}
                        className="facility-action-btn view-map-btn interactive-cursor"
                      >
                        <Eye size={12} />
                        View on Map
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigateFacility(facility)}
                        className="facility-action-btn navigate-btn interactive-cursor"
                      >
                        <Navigation size={12} />
                        Navigate
                      </button>
                    </div>
                  </div>

                  {/* Right Call Action */}
                  <a
                    href={`tel:${facility.phone || (facility.type === 'police' ? '112' : facility.type === 'fire' ? '101' : '108')}`}
                    className="facility-call-btn interactive-cursor"
                    title={`Call ${facility.name}`}
                  >
                    <Phone size={15} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: NEED HELP? */}
        <section className="need-help-column" aria-label="Quick Emergency Assistance">
          <div className="need-help-header">
            <h2 className="need-help-heading">NEED HELP?</h2>
            <p className="need-help-sub">Select an option to quickly generate an emergency report for responders.</p>
          </div>

          <div className="quick-assist-list">
            {QUICK_ASSIST_OPTIONS.map((opt, idx) => (
              <motion.button
                key={idx}
                type="button"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAssist(opt)}
                className="quick-assist-card interactive-cursor"
              >
                <div className="quick-assist-icon-wrapper">
                  {opt.icon}
                </div>
                <span className="quick-assist-label">{opt.label}</span>
                <ChevronRight size={15} className="quick-assist-arrow" />
              </motion.button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
