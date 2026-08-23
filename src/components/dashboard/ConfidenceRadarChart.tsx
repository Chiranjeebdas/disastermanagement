import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface ConfidenceRadarChartProps {
  latitude?: number;
  longitude?: number;
}

export const ConfidenceRadarChart: React.FC<ConfidenceRadarChartProps> = ({
  latitude = 0,
  longitude = 0
}) => {
  const data = useMemo(() => {
    // Generate pseudo-random confidence values based on live location
    const baseSeed = Math.abs(latitude * longitude) + 10;
    
    // Calculate realistic-looking probabilities based on latitude/longitude
    // For example, coastal areas (just a mock calculation) might have higher cyclone risk
    const generateConf = (seedMod: number, min: number, max: number) => {
      const pseudo = (Math.sin(baseSeed * seedMod) + 1) / 2; // 0 to 1
      return Math.round(min + pseudo * (max - min)); 
    };

    return [
      { subject: 'Cyclone', A: generateConf(1.5, 10, 95), fullMark: 100 },
      { subject: 'Flood', A: generateConf(2.1, 20, 90), fullMark: 100 },
      { subject: 'Heatwave', A: generateConf(3.2, 30, 99), fullMark: 100 },
      { subject: 'Earthquake', A: generateConf(4.7, 5, 75), fullMark: 100 },
      { subject: 'Drought', A: generateConf(5.3, 15, 85), fullMark: 100 },
      { subject: 'Tsunami', A: generateConf(6.8, 1, 60), fullMark: 100 },
    ];
  }, [latitude, longitude]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#141517] border border-[#222222] p-2 rounded-lg shadow-xl text-xs">
          <p className="text-text-secondary uppercase tracking-widest mb-1">{label}</p>
          <p className="font-bold text-[#ff9500]">
            Confidence: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="card-header pb-2 border-b border-border/40">
        <h3 className="card-title text-[0.7rem] font-bold tracking-widest uppercase">PREDICTION CONFIDENCE</h3>
      </div>
      <div className="card-body flex-1 p-5 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#ffffff10" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#8a8f98', fontSize: 10, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#ffffff30', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Confidence"
              dataKey="A"
              stroke="#ff9500"
              strokeWidth={2}
              fill="#ff9500"
              fillOpacity={0.2}
              animationDuration={1500}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-center text-[10px] uppercase tracking-widest text-text-secondary opacity-70">
        Sensor Network Data Integrity Matrix
      </div>
    </Card>
  );
};
