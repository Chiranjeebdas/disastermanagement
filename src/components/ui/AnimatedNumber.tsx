import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value,
  format = (val) => Math.round(val).toString()
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const springValue = useSpring(value, { stiffness: 100, damping: 20 });
  
  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <motion.span>
      {format(displayValue)}
    </motion.span>
  );
};
