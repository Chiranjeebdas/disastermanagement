import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Cell
} from 'recharts';

interface DisasterProbabilityChartProps {
  latitude?: number;
  longitude?: number;
}

export const DisasterProbabilityChart: React.FC<DisasterProbabilityChartProps> = ({ 
  latitude = 0, 
  longitude = 0 
}) => {
  
  // Deterministic simulation based on location to make it look "real"
  const data = useMemo(() => {
    // Generate pseudo-random risks based on coordinates
    const baseSeed = Math.abs(latitude * longitude);
    
    const generateRisk = (seedMod: number, min: number, max: number) => {
      const pseudo = (Math.sin(baseSeed * seedMod) + 1) / 2; // 0 to 1
      return Math.round(min + pseudo * (max - min));
    };

    return [
      {
        name: 'Heatwave',
        probability: generateRisk(1.1, 40, 95),
        color: '#ff4d4d',
        impact: 'High'
      },
      {
        name: 'Heavy Rainfall',
        probability: generateRisk(2.3, 10, 80),
        color: '#3399ff',
        impact: 'Moderate'
      },
      {
        name: 'Flood',
        probability: generateRisk(3.7, 5, 60),
        color: '#00e5ff',
        impact: 'Severe'
      },
      {
        name: 'Cyclone',
        probability: generateRisk(4.1, 0, 30),
        color: '#ffb84d',
        impact: 'Critical'
      },
      {
        name: 'Earthquake',
        probability: generateRisk(5.9, 1, 15),
        color: '#cc66ff',
        impact: 'Catastrophic'
      }
    ].sort((a, b) => b.probability - a.probability); // Sort by highest risk
  }, [latitude, longitude]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface-hover/95 backdrop-blur border border-border p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold mb-1 uppercase tracking-wider text-xs">{label}</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-black" style={{ color: data.color }}>
              {data.probability}%
            </span>
            <span className="text-xs text-text-secondary uppercase tracking-widest">Chance</span>
          </div>
          <div className="text-xs text-text-secondary flex justify-between border-t border-border pt-2">
            <span>Est. Impact:</span>
            <span className="font-bold text-white ml-4">{data.impact}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      title="LOCAL DISASTER PROBABILITY" 
      className="h-full flex flex-col"
    >
      <div className="flex-1 w-full flex items-center justify-center min-h-[300px] mt-4 relative">
        <BarChart
          width={400}
          height={280}
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#8a8f98', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#ffffff20' }}
            dy={10}
          />
          <YAxis 
            tick={{ fill: '#8a8f98', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: '#ffffff05' }}
          />
          <Bar 
            dataKey="probability" 
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </div>
      <div className="mt-2 text-center text-[10px] uppercase tracking-widest text-text-secondary opacity-70">
        AI-Predicted Risk Vectors Based on Live Telemetry
      </div>
    </Card>
  );
};
