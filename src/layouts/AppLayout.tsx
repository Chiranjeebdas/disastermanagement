import React, { useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { PageTransition } from '../components/ui/PageTransition';
import '../styles/AppLayout.css';

const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const currentOutlet = useOutlet();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-layout">
      <Sidebar 
        isCollapsed={false} 
        isMobileOpen={isMobileMenuOpen} 
        onMobileClose={closeMobileMenu} 
      />
      <div className="app-main">
        <TopBar 
          onMobileMenuClick={toggleMobileMenu} 
        />
        <main className="app-content relative overflow-x-hidden">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              {currentOutlet}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
