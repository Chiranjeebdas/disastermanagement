import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
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
  
  // Deterministic simulation based on location
  const data = useMemo(() => {
    const baseSeed = Math.abs(latitude + longitude);
    
    const generateConfidence = (seedMod: number, min: number, max: number) => {
      const pseudo = (Math.cos(baseSeed * seedMod) + 1) / 2;
      return Math.round(min + pseudo * (max - min));
    };

    return [
      { subject: 'Heatwave', A: generateConfidence(1.2, 70, 99), fullMark: 100 },
      { subject: 'Rainfall', A: generateConfidence(2.4, 60, 95), fullMark: 100 },
      { subject: 'Flood', A: generateConfidence(3.1, 50, 90), fullMark: 100 },
      { subject: 'Cyclone', A: generateConfidence(4.8, 40, 85), fullMark: 100 },
      { subject: 'Earthquake', A: generateConfidence(5.3, 30, 80), fullMark: 100 }
    ];
  }, [latitude, longitude]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface-hover/95 backdrop-blur border border-border p-2 rounded shadow-xl">
          <p className="text-white font-bold text-xs uppercase tracking-wider mb-1">{data.subject}</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-accent">{data.A}%</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest">Confidence</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      title="PREDICTION CONFIDENCE" 
      className="h-full flex flex-col"
    >
      <div className="flex-1 w-full min-h-[300px] flex items-center justify-center relative">
        <RadarChart width={400} height={280} cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#ffffff20" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#8a8f98', fontSize: 10, fontWeight: 600, textAnchor: 'middle' }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar 
            name="Confidence" 
            dataKey="A" 
            stroke="#00e5ff" 
            strokeWidth={2}
            fill="#00e5ff" 
            fillOpacity={0.2} 
            animationDuration={1500}
          />
        </RadarChart>
      </div>
      <div className="mt-2 text-center text-[10px] uppercase tracking-widest text-text-secondary opacity-70">
        Sensor Network Data Integrity Matrix
      </div>
    </Card>
  );
};
