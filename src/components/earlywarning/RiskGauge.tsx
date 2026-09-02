import React from 'react';
import type { RiskLevel, WarningStage } from '../../types/earlyWarning';
import { ShieldCheck, AlertTriangle, ShieldAlert, AlertOctagon, Info } from 'lucide-react';

interface RiskGaugeProps {
  riskScore: number; // 0 to 100
  confidence: number; // 0 to 100
  riskLevel: RiskLevel;
  warningStage: WarningStage;
  hazardTitle?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  riskScore,
  confidence,
  riskLevel,
  warningStage,
  hazardTitle = 'PRIMARY THREAT'
}) => {
  // Theme color mapping based on WarningStage / RiskLevel
  const getStageColor = (stage: WarningStage) => {
    switch (stage) {
      case 'Emergency': return { primary: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'Warning': return { primary: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)' };
      case 'Watch': return { primary: '#eab308', glow: 'rgba(234, 179, 8, 0.35)', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)' };
      case 'Advisory': return { primary: '#38bdf8', glow: 'rgba(56, 189, 248, 0.35)', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' };
      case 'Normal':
      default: return { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  const stageStyle = getStageColor(warningStage);

  const getStageIcon = () => {
    switch (warningStage) {
      case 'Emergency': return <AlertOctagon size={18} className="text-red-500" />;
      case 'Warning': return <ShieldAlert size={18} className="text-orange-500" />;
      case 'Watch': return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'Advisory': return <Info size={18} className="text-sky-400" />;
      case 'Normal':
      default: return <ShieldCheck size={18} className="text-emerald-400" />;
    }
  };

  // SVG Circular progress constants
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  const isComposite = hazardTitle.toUpperCase().includes('COMPOSITE');

  return (
    <div className="risk-gauge-container">
      {/* Top Header Strip */}
      <div className="risk-gauge-header">
        <span className="risk-gauge-threat-label">{hazardTitle}</span>
        <div 
          className="risk-stage-pill"
          style={{ 
            backgroundColor: stageStyle.bg, 
            borderColor: stageStyle.border,
            color: stageStyle.primary 
          }}
        >
          {getStageIcon()}
          <span>{warningStage.toUpperCase()}</span>
        </div>
      </div>

      {/* Main Dial & Numbers Area */}
      <div className="risk-gauge-main">
        {/* Left: Circular Risk Dial */}
        <div className="risk-dial-wrapper" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="risk-dial-svg">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Active Colored Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={stageStyle.primary}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: `drop-shadow(0 0 8px ${stageStyle.glow})`
              }}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>

          {/* Central Numeric Readout */}
          <div className="risk-dial-center">
            <span className="risk-dial-score">{riskScore}</span>
            <span className="risk-dial-scale">/ 100</span>
            <span 
              className="risk-dial-level"
              style={{ color: stageStyle.primary }}
            >
              {riskLevel.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right: Metrics & Explanations */}
        <div className="risk-gauge-meta">
          {/* Risk Score Explanation */}
          <div className="risk-metric-box">
            <div className="metric-box-header">
              <span className="metric-title">{isComposite ? 'COMPOSITE LOCAL RISK' : `${hazardTitle.toUpperCase()} INDEX`}</span>
              <span className="metric-score" style={{ color: stageStyle.primary }}>{riskScore}%</span>
            </div>
            <div className="metric-bar-track">
              <div 
                className="metric-bar-fill"
                style={{ width: `${riskScore}%`, backgroundColor: stageStyle.primary }}
              />
            </div>
            <p className="metric-caption">
              {isComposite ? 'Combined assessment across currently evaluated hazards.' : 'Specific risk score calculated for this hazard.'}
            </p>
          </div>

          {/* Separate Confidence Metric */}
          <div className="risk-metric-box confidence-box">
            <div className="metric-box-header">
              <span className="metric-title">EVIDENCE CONFIDENCE</span>
              <span className="metric-score text-emerald-400">{confidence}%</span>
            </div>
            <div className="metric-bar-track">
              <div 
                className="metric-bar-fill bg-emerald-500" 
                style={{ width: `${confidence}%` }}
              />
            </div>
            <p className="metric-caption">
              Evidence confidence reflects multi-source corroboration and engineering reliability weights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
