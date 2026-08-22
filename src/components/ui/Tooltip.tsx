import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled) return <>{children}</>;

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { bottom: '100%', left: '50%', x: '-50%', y: -8 };
      case 'right':
        return { left: '100%', top: '50%', y: '-50%', x: 8 };
      case 'bottom':
        return { top: '100%', left: '50%', x: '-50%', y: 8 };
      case 'left':
        return { right: '100%', top: '50%', y: '-50%', x: -8 };
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      style={{ display: 'inline-flex' }}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, ...getPositionStyles() }}
            animate={{ opacity: 1, scale: 1, ...getPositionStyles() }}
            exit={{ opacity: 0, scale: 0.95, ...getPositionStyles() }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 whitespace-nowrap rounded bg-surface border border-border px-2 py-1 text-xs text-text shadow-lg pointer-events-none"
            style={{ position: 'absolute', ...getPositionStyles() }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
