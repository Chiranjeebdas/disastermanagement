import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Bell, 
  Map, 
  Activity, 
  AlertTriangle, 
  Users, 
  Settings,
  ShieldAlert
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import '../styles/Sidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const navSections = [
  {
    title: 'MAIN',
    items: [
      { label: 'Home', path: '/app', icon: <Home size={20} />, exact: true },
      { label: 'Alerts', path: '/app/alerts', icon: <Bell size={20} /> },
      { label: 'Disaster Map', path: '/app/map', icon: <Map size={20} /> },
      { label: 'Live Telemetry', path: '/app/telemetry', icon: <Activity size={20} /> },
    ]
  },
  {
    title: 'RESPONSE',
    items: [
      { label: 'Report Incident', path: '/app/report', icon: <AlertTriangle size={20} /> },
    ]
  },
  {
    title: 'VOLUNTEER',
    items: [
      { label: 'Volunteer Dashboard', path: '/app/volunteer', icon: <Users size={20} /> },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Notifications', path: '/app/notifications', icon: <Bell size={20} /> },
      { label: 'Settings', path: '/app/settings', icon: <Settings size={20} /> },
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, isMobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isItemActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path) && path !== '/app';
  };

  return (
    <>
      {isMobileOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="sidebar-mobile-overlay" 
          onClick={onMobileClose}
        />
      )}
      
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <motion.div 
            className="flex items-center cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
          >
            <ShieldAlert className="sidebar-brand-icon" size={24} color="var(--color-accent)" />
            {!isCollapsed && <span className="sidebar-brand" style={{ marginLeft: '12px' }}>DRISHTI</span>}
          </motion.div>
        </div>
        
        <div className="sidebar-content">
          {navSections.map((section, idx) => (
            <div key={idx} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              <nav className="sidebar-nav">
                {section.items.map((item, itemIdx) => {
                  const active = isItemActive(item.path, item.exact);
                  
                  return (
                    <Tooltip 
                      key={itemIdx} 
                      content={item.label} 
                      position="right" 
                      disabled={!isCollapsed}
                    >
                      <NavLink 
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) => `sidebar-item interactive-cursor ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          if (isMobileOpen) onMobileClose();
                        }}
                      >
                        {active && (
                          <motion.div
                            layoutId="sidebar-active-indicator"
                            className="sidebar-active-bg"
                            initial={false}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30
                            }}
                          />
                        )}
                        <span className="sidebar-icon z-10 relative">{item.icon}</span>
                        {!isCollapsed && <span className="sidebar-item-label z-10 relative">{item.label}</span>}
                      </NavLink>
                    </Tooltip>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
