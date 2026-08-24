import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { Thermometer, RefreshCw, Wind } from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';

interface LiveReadingsCardProps {
  latitude?: number;
  longitude?: number;
}

// Generate smooth deterministic mock data for the sparklines
const generateSparklineData = (baseVal: number, variance: number, seed: number, timeOffset: number) => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    // We add timeOffset to simulate the wave moving to the left
    const random = Math.sin(seed * (i + timeOffset)) * variance;
    // Add some secondary noise for realism
    const noise = Math.cos(seed * 2.5 * (i + timeOffset)) * (variance * 0.2);
    const current = baseVal + (random + noise) * 0.5;
    data.push({ value: current });
  }
  return data;
};

const Sparkline = ({ data, color, height = 50 }: { data: any[], color: string, height?: number }) => (
  <div style={{ width: '100%', height: `${height}px`, marginTop: '8px' }}>
    <ResponsiveContainer width="100%" height="100%" className="animated-sparkline">
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.5} />
            <stop offset="95%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fillOpacity={1}
          fill={`url(#color-${color})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
    <style>{`
      @keyframes breath-chart {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }
      .animated-sparkline path.recharts-area-area,
      .animated-sparkline path.recharts-area-curve {
        animation: breath-chart 4s ease-in-out infinite;
      }
    `}</style>
  </div>
);

export const LiveReadingsCard: React.FC<LiveReadingsCardProps> = ({ latitude, longitude }) => {
  const { data: weather } = useWeather(latitude, longitude);

  // State to drive the animation
  const [timeOffset, setTimeOffset] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      // Calculate delta time to ensure smooth animation regardless of frame rate
      const deltaTime = time - lastTime;
      if (deltaTime > 50) { // Update roughly every 50ms (20fps) to save CPU while looking smooth
        setTimeOffset(prev => prev + 0.05);
        lastTime = time;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const tempData = useMemo(() => generateSparklineData(weather?.temperature || 25.9, 2, 0.4, timeOffset), [weather, timeOffset]);
  const humData = useMemo(() => generateSparklineData(weather?.humidity || 96, 5, 0.6, timeOffset * 1.5), [weather, timeOffset]);
  const precipData = useMemo(() => generateSparklineData(weather?.precipitation || 0, 8, 0.8, timeOffset * 2).map(d => ({ value: Math.max(0, d.value) })), [weather, timeOffset]);




  const valueStyle = {
    fontSize: '2rem',
    fontWeight: 300,
    color: '#ffffff',
    lineHeight: 1,
    marginBottom: '8px'
  };

  const axisLabelsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.55rem',
    color: '#555555',
    marginTop: '4px',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  };

  const boxStyle = {
    backgroundColor: '#1a1b1e',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const
  };

  const headerStyle = {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', width: '100%' }}>
      {/* Temperature Card */}
      <div style={boxStyle}>
        <div style={headerStyle}>
          <h3 style={{ fontSize: '0.7rem', color: '#8a8f98', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>Temperature</h3>
          <Thermometer size={14} color="#8a8f98" />
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={valueStyle}>
            {weather?.temperature?.toFixed(1) || '--'}°C
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Sparkline data={tempData} color="#fb923c" height={50} />
            <div style={axisLabelsStyle}>
              <span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
            </div>
          </div>
        </div>
      </div>

      {/* Humidity Card */}
      <div style={boxStyle}>
        <div style={headerStyle}>
          <h3 style={{ fontSize: '0.7rem', color: '#8a8f98', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>Humidity</h3>
          <RefreshCw size={14} color="#8a8f98" />
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={valueStyle}>
            {weather?.humidity || '--'}%
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Sparkline data={humData} color="#fb923c" height={50} />
            <div style={axisLabelsStyle}>
              <span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wind Card */}
      <div style={boxStyle}>
        <div style={headerStyle}>
          <h3 style={{ fontSize: '0.7rem', color: '#8a8f98', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>Wind</h3>
          <Wind size={14} color="#8a8f98" />
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={valueStyle}>
            {weather?.windSpeed?.toFixed(1) || '--'} <span style={{ fontSize: '1.2rem', color: '#8a8f98' }}>km/h</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginTop: '12px', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '1px dashed rgba(255,255,255,0.2)',
              animation: `spin-wind ${weather?.windSpeed ? Math.max(1, 20 / weather.windSpeed) : 5}s linear infinite`
            }} />
            <div style={{
              position: 'absolute',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.05)',
            }} />
            <div style={{
              position: 'absolute',
              transform: `rotate(${weather?.windDirection || 0}deg)`,
              transition: 'transform 1s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ transform: 'translateY(-12px)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fb923c" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                </svg>
              </div>
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-5px',
              fontSize: '0.55rem',
              color: '#555555',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>DIR: {weather?.windDirection || 0}°</div>
            <style>{`
              @keyframes spin-wind { 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        </div>
      </div>

      {/* Precipitation Card */}
      <div style={boxStyle}>
        <div style={headerStyle}>
          <h3 style={{ fontSize: '0.7rem', color: '#8a8f98', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>Precipitation</h3>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={valueStyle}>
            {weather?.precipitation ?? '--'} <span style={{ fontSize: '1.2rem', color: '#8a8f98' }}>mm</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Sparkline data={precipData} color="#fb923c" height={50} />
            <div style={axisLabelsStyle}>
              <span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
