import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.1, 
        ease: 'easeOut',
      }}
      className={className}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', position: 'relative', height: '100%' }}
    >
      {children}
    </motion.div>
  );
};
