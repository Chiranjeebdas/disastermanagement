import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip } from './ui/Tooltip';
import { useLocation as useGeoLocation } from '../hooks/useLocation';
import '../styles/TopBar.css';

interface TopBarProps {
  onMobileMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMobileMenuClick }) => {
  const location = useLocation();
  const { location: geoLocation } = useGeoLocation();
  const [activeMapFilter, setActiveMapFilter] = useState('all');

  const isHome = location.pathname === '/app';

  const mapFilters = [
    { id: 'all', label: 'All' },
    { id: 'hospital', label: 'Hospital' },
    { id: 'police', label: 'Police Station' },
    { id: 'fire', label: 'Fire Station' },
    { id: 'shelter', label: 'Shelter' }
  ];

  return (
    <header className={`topbar ${isHome ? 'topbar-home' : ''}`}>
      <div className="topbar-left">
        <Tooltip content="Menu" position="right">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mobile-menu-btn interactive-cursor"
            onClick={onMobileMenuClick}
            aria-label="Open mobile menu"
          >
            <Menu size={20} />
          </motion.button>
        </Tooltip>

        {location.pathname === '/app/telemetry' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="ml-2 flex flex-col justify-center"
          >
            <h2 className="text-[1.35rem] leading-none font-bold tracking-[0.1em] text-text uppercase">
              LIVE TELEMETRY
            </h2>
            <p className="text-[0.7rem] leading-tight text-text-secondary mt-1">
              Real-time environmental signals and anomaly monitoring
            </p>
          </motion.div>
        )}

        {/* Map filter buttons with fluid animated orange indicator */}
        {location.pathname.includes('/map') && (
          <div className="map-filter-bar" role="toolbar" aria-label="Map filters">
            {mapFilters.map(filter => {
              const isActive = activeMapFilter === filter.id;
              return (
                <motion.button
                  key={filter.id}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setActiveMapFilter(filter.id);
                    window.dispatchEvent(new CustomEvent('map-filter-change', { detail: filter.id }));
                  }}
                  className={`map-filter-btn ${isActive ? 'active' : ''}`}
                  data-filter={filter.id}
                >
                  {isActive && (
                    <motion.div
                      layoutId="map-filter-active-pill"
                      className="map-filter-active-bg"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32
                      }}
                    />
                  )}
                  <span className="map-filter-label">{filter.label}</span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <div className="topbar-right">
        {!isHome && (
          <div className={`flex items-center gap-2 text-xs font-semibold ${geoLocation.coords ? 'text-success' : 'text-danger'}`}>
            <div className="w-2 h-2 rounded-full bg-current" />
            {geoLocation.address ? geoLocation.address : geoLocation.coords ? 'Location detected' : 'Location unavailable'}
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
