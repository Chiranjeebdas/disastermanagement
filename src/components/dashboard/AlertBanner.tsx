import React from 'react';
import { motion } from 'framer-motion';

export const AlertBanner: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-[#18191c] border border-border/40 rounded-lg px-4 py-2 mb-6"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute w-3 h-3 bg-[#ff9500] rounded-full opacity-30 animate-ping"></div>
        <div className="w-1.5 h-1.5 bg-[#ff9500] rounded-full relative z-10"></div>
      </div>
      <span className="text-text-secondary text-[0.7rem] font-bold tracking-widest uppercase">
        <span className="text-[#ff9500] mr-1">ALERT:</span> CYCLONE GATI APPROACHING - CAT 2 - 2HRS TO LANDFALL
      </span>
    </motion.div>
  );
};
