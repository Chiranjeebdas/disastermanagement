import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { IndiaRiskMap } from './IndiaRiskMap';

interface RiskForecastProps {
  latitude?: number;
  longitude?: number;
}

export const DisasterProbabilityChart: React.FC<RiskForecastProps> = ({
  latitude = 0,
  longitude = 0
}) => {

  // Generate a bell curve data distribution
  const data = useMemo(() => {
    const pts = [];
    const mean = 0.4;
    const stdDev = 0.15;

    for (let i = 0; i <= 100; i += 2) {
      const x = i / 100;
      const exponent = Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * exponent;
      pts.push({ x: x.toFixed(1), y: Math.min(100, y * 35) });
    }
    return pts;
  }, [latitude, longitude]);

  return (
    <Card className="h-full bg-[#18191c] border border-border/40 p-0 overflow-hidden flex flex-col">
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h3 style={{ fontSize: '0.7rem', color: '#8a8f98', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>RISK FORECAST</h3>
      </div>
      <div style={{ display: 'flex', flex: 1, padding: '20px', gap: '24px', flexDirection: 'row', flexWrap: 'wrap' }}>
        {/* Left Side: Bell Curve */}
        <div style={{ flex: '1 1 0', minWidth: '250px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', fontSize: '0.65rem', color: '#8a8f98', fontWeight: 500, letterSpacing: '0.05em' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#fb923c', border: '1px solid #555', borderRadius: '2px' }}></div>
              <span style={{ color: '#fb923c' }}>Probability</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: 0.5 }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#333', border: '1px solid #555', borderRadius: '2px' }}></div>
              <span>Confidence</span>
            </div>
          </div>

          <div style={{ flex: 1, width: '100%', minHeight: '180px', marginLeft: '-16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bellGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="x"
                  tick={{ fill: '#666', fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                  ticks={['0.0', '0.2', '0.4', '0.6', '0.8', '1.0']}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: '#666', fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  ticks={[0, 25, 50, 75, 100]}
                  width={40}
                />
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke="#fb923c"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#bellGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: India Risk Map */}
        <div style={{ flex: '1 1 0', minWidth: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e2024', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.04)', overflow: 'hidden', position: 'relative' }}>
          <IndiaRiskMap />
        </div>
      </div>
    </Card>
  );
};
