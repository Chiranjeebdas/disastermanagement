import { motion } from 'framer-motion';

export const LoaderOne = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px 0' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{
            width: '14px',
            height: '14px',
            backgroundColor: '#ffffff',
            borderRadius: '50%'
          }}
          animate={{
            y: ['0%', '-100%', '0%'],
            scale: [1, 1.3, 1],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
};
