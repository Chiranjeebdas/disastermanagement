import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate('/app');
  };

  return (
    <motion.div
      className="landing-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <div className="landing-background"></div>

      <motion.div
        className="landing-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
      >
        <h1 className="landing-title">
          See the risk before<br />
          <span className="relative inline-block highlight-wrapper whitespace-nowrap z-10 px-4 py-1 mt-2">
            it reaches you.
            <span className="highlight-block absolute inset-0 rounded-lg -z-10"></span>
          </span>
        </h1>

        <p className="landing-subtitle">
          Real-time disaster intelligence.<br />
          Prepared for the moment connectivity fails.
        </p>

        <button
          onClick={handleExplore}
          className="landing-explore-btn"
          aria-label="Explore the application"
        >
          EXPLORE
          <ChevronRight size={20} />
        </button>
      </motion.div>

      {/* The initial black overlay that fades out to reveal the page */}
      <motion.div
        className="fixed inset-0 bg-bg z-50 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </motion.div>
  );
};

export default Landing;
