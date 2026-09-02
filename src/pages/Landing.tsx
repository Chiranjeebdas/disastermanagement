import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Logo } from '../components/ui/Logo';
import '../styles/Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse Parallax Motion Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const bgX = useTransform(smoothMouseX, [-0.5, 0.5], ['15px', '-15px']);
  const bgY = useTransform(smoothMouseY, [-0.5, 0.5], ['15px', '-15px']);
  const bgScale = useTransform(smoothMouseX, [-0.5, 0.5], [1.06, 1.06]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set((clientX / innerWidth) - 0.5);
    mouseY.set((clientY / innerHeight) - 0.5);
  };

  const handleEnterOrganization = () => {
    navigate('/app');
  };

  const handleEnterUser = () => {
    navigate('/user');
  };

  // Interactive Particle Canvas for Disaster Telemetry & Embers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle System (Amber disaster embers & cyan telemetry nodes)
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      maxLife: number;
      life: number;
    }

    const particles: Particle[] = [];
    const colors = [
      'rgba(249, 115, 22, ', // Orange/Fire
      'rgba(234, 88, 12, ',  // Amber
      'rgba(56, 189, 248, ',  // Cyan/Radar
      'rgba(255, 255, 255, '  // Spark
    ];

    const createParticle = (originX?: number, originY?: number): Particle => {
      const isRadar = Math.random() > 0.65;
      return {
        x: originX ?? Math.random() * width,
        y: originY ?? Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6 + (isRadar ? 0 : 0.2),
        vy: -Math.random() * 0.8 - (isRadar ? 0.2 : 0.4),
        size: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.7 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        maxLife: Math.random() * 180 + 120,
        life: 0
      };
    };

    for (let i = 0; i < 45; i++) {
      particles.push(createParticle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const progress = p.life / p.maxLife;
        const currentAlpha = p.alpha * Math.sin(progress * Math.PI);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0, currentAlpha)})`;
        ctx.shadowColor = p.color.includes('249') ? '#f97316' : '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fill();

        // Reset if offscreen or expired
        if (p.y < -10 || p.x < -10 || p.x > width + 10 || p.life >= p.maxLife) {
          particles[i] = createParticle(Math.random() * width, height + 10);
        }
      }

      // Draw delicate connecting telemetry lines between nearby particles
      ctx.shadowBlur = 0;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            const lineAlpha = (1 - dist / 90) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(249, 115, 22, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <motion.div
      className="landing-container"
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Interactive Cinematic Parallax Background */}
      <motion.div
        className="landing-background"
        style={{
          x: bgX,
          y: bgY,
          scale: bgScale
        }}
      />

      {/* Atmospheric Radar & Disaster Vignette Gradient */}
      <div className="landing-overlay" />

      {/* Live Interactive Telemetry Canvas */}
      <canvas ref={canvasRef} className="landing-particles-canvas" />

      {/* Tactical Radar Grid Lines */}
      <div className="landing-tactical-grid" />

      <motion.div
        className="landing-content"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
      >
        {/* Brand Header */}
        <div className="landing-brand-header">
          <Logo size={36} color="#10b981" />
          <span className="landing-brand-name">DRISHTI</span>
        </div>

        {/* Hero Title */}
        <h1 className="landing-title">
          See the risk before<br />
          <span className="text-accent">it reaches you.</span>
        </h1>

        {/* Subtitle */}
        <p className="landing-subtitle">
          Real-time disaster intelligence.<br />
          Prepared for the moment connectivity fails.
        </p>

        {/* Mode Selection Grid */}
        <div className="landing-modes-grid" role="region" aria-label="Platform Access Modes">
          {/* 1. Organization Mode */}
          <div className="landing-mode-card mode-org">
            <div className="mode-card-top">
              <div className="mode-icon-wrapper org-icon">
                <Building2 size={22} className="text-orange-400" />
              </div>
              <span className="mode-tag org-tag">Command & Ops</span>
            </div>

            <div className="mode-card-info">
              <h2 className="mode-title">ORGANIZATION MODE</h2>
              <p className="mode-audience">
                For municipal authorities, emergency responders and disaster management teams
              </p>
            </div>

            <button
              onClick={handleEnterOrganization}
              className="mode-action-btn org-btn"
              aria-label="Enter Organization Dashboard"
            >
              <span>ENTER ORGANIZATION DASHBOARD</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* 2. User Mode */}
          <div className="landing-mode-card mode-user">
            <div className="mode-card-top">
              <div className="mode-icon-wrapper user-icon">
                <User size={22} className="text-emerald-400" />
              </div>
              <span className="mode-tag user-tag">Citizen Safety</span>
            </div>

            <div className="mode-card-info">
              <h2 className="mode-title">USER MODE</h2>
              <p className="mode-audience">
                Simple local safety information for citizens
              </p>
            </div>

            <button
              onClick={handleEnterUser}
              className="mode-action-btn user-btn"
              aria-label="Enter User Mode"
            >
              <span>ENTER USER MODE</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Smooth Fade-in Revealer */}
      <motion.div
        className="fixed inset-0 bg-bg z-50 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
    </motion.div>
  );
};

export default Landing;
