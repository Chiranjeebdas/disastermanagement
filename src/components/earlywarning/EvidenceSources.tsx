import React, { useMemo } from 'react';
import type { EvidenceSource } from '../../types/earlyWarning';
import { Database, ShieldCheck, Radio, Users, MapPin, Clock, Flame, Waves, Activity } from 'lucide-react';

interface EvidenceSourcesProps {
  sources: EvidenceSource[];
  assessmentTitle?: string;
}

export const EvidenceSources: React.FC<EvidenceSourcesProps> = ({
  sources,
  assessmentTitle
}) => {
  // Deduplicate and group evidence into distinct authoritative telemetry streams
  const distinctSources = useMemo(() => {
    if (!sources || sources.length === 0) return [];
    
    const seenTypes = new Set<string>();
    const result: EvidenceSource[] = [];

    sources.forEach(s => {
      // Group all Open_Meteo atmospheric sensors together
      const key = s.sourceType === 'Open_Meteo' ? 'Atmospheric_Consolidated' : s.sourceType;
      if (!seenTypes.has(key)) {
        seenTypes.add(key);
        result.push(s);
      }
    });

    return result;
  }, [sources]);

  const getSourceIcon = (type: EvidenceSource['sourceType']) => {
    switch (type) {
      case 'USGS_Seismic': return <Activity size={13} className="text-amber-400" />;
      case 'NASA_FIRMS': return <Flame size={13} className="text-rose-400" />;
      case 'GloFAS_Hydrology':
      case 'CWC_River_Gauge': return <Waves size={13} className="text-cyan-400" />;
      case 'Open_Meteo': return <Radio size={13} className="text-sky-400" />;
      case 'Community_Report': return <Users size={13} className="text-emerald-400" />;
      case 'Historical_Terrain': return <MapPin size={13} className="text-purple-400" />;
      case 'Official_Bulletin': return <ShieldCheck size={13} className="text-orange-400" />;
      default: return <Database size={13} className="text-zinc-400" />;
    }
  };

  const getSourceTypeLabel = (type: EvidenceSource['sourceType']) => {
    switch (type) {
      case 'USGS_Seismic': return 'SEISMIC SENSOR';
      case 'NASA_FIRMS': return 'SATELLITE THERMAL';
      case 'GloFAS_Hydrology': return 'RIVER HYDROLOGY';
      case 'CWC_River_Gauge': return 'RIVER GAUGE';
      case 'Open_Meteo': return 'ATMOSPHERIC SENSOR';
      case 'Community_Report': return 'GROUND OBSERVATION';
      case 'Historical_Terrain': return 'TOPOGRAPHY DATASET';
      case 'Official_Bulletin': return 'CIVIL BULLETIN';
      default: return 'TELEMETRY';
    }
  };

  const getProvenanceClass = (prov?: string) => {
    switch (prov) {
      case 'DIRECT OBSERVATION': return 'provenance-direct';
      case 'DERIVED ASSESSMENT': return 'provenance-derived';
      case 'ESTIMATED': return 'provenance-estimated';
      case 'VERIFIED COMMUNITY REPORT': return 'provenance-report';
      case 'UNAVAILABLE': return 'provenance-unavailable';
      default: return 'provenance-derived';
    }
  };

  return (
    <div className="evidence-sources-container">
      {/* Header */}
      <div className="evidence-header">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-zinc-400" />
          <h3 className="evidence-title">EVIDENCE & SIGNAL PROOF</h3>
        </div>
        <span className="evidence-subtitle">
          {assessmentTitle ? `Underlying live telemetry for ${assessmentTitle}` : 'Multi-Source Corroborating Intelligence'}
        </span>
      </div>

      {/* Sources Grid */}
      <div className="evidence-list">
        {distinctSources && distinctSources.length > 0 ? (
          distinctSources.map((source, idx) => {
            const provenanceLabel = source.provenance || 'DERIVED ASSESSMENT';
            return (
              <div key={idx} className="evidence-item-card">
                {/* 1. Header: Type Badge & Source Name + Reliability Weight */}
                <div className="evidence-item-header">
                  <div className="evidence-header-main">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="evidence-type-icon">
                        {getSourceIcon(source.sourceType)}
                      </div>
                      <span className={`evidence-type-badge type-${source.sourceType.toLowerCase()}`}>
                        {getSourceTypeLabel(source.sourceType)}
                      </span>
                    </div>
                    <span className="evidence-source-name" title={source.sourceName}>
                      {source.sourceName}
                    </span>
                  </div>

                  <div className="evidence-reliability flex-shrink-0" title={`Engineering weight: ${source.reliability}/100`}>
                    <span className="reliability-label">Weight</span>
                    <div className="reliability-bar-track">
                      <div
                        className="reliability-bar-fill"
                        style={{ width: `${source.reliability}%` }}
                      />
                    </div>
                    <span className="reliability-value">{source.reliability}</span>
                  </div>
                </div>

                {/* 2. Body: Actual Observation Description */}
                <div className="evidence-body">
                  <p className="evidence-description">
                    {source.description}
                  </p>
                </div>

                {/* 3. Footer: Timestamp & Honest Provenance Badge */}
                <div className="evidence-item-footer">
                  <span className="evidence-timestamp flex items-center gap-1 text-[11px] text-zinc-400 min-w-0">
                    <Clock size={11} className="flex-shrink-0" />
                    <span className="truncate">
                      Captured: {new Date(source.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(source.timestamp).toLocaleDateString()})
                    </span>
                  </span>
                  <span className={`evidence-provenance flex-shrink-0 ${getProvenanceClass(source.provenance)}`}>
                    {provenanceLabel}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="evidence-empty-state">
            <Radio size={28} className="text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400">No active evidence signals recorded for current selection.</p>
          </div>
        )}
      </div>
    </div>
  );
};
