import React, { useState, useEffect, useCallback } from 'react';
import type { Alert, AlertSeverity } from '../../types/alert';
import type {
  CorrectionRequest,
  CorrectionReason,
  FieldVerificationStatus
} from '../../types/correction';
import {
  submitCorrectionRequest,
  submitFieldVerification,
  reviewCorrectionRequest,
  loadStoredCorrections,
  checkAlertFreshness
} from '../../utils/correctionManager';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  Send,
  UserCheck,
  Check,
  X
} from 'lucide-react';

interface InformationQualitySectionProps {
  alert: Alert;
  onAlertUpdated?: (updatedAlert: Alert) => void;
  userRole?: string;
}

const CORRECTION_REASONS: { value: CorrectionReason; label: string }[] = [
  { value: 'FALSE INFORMATION', label: 'False Information / Hallucination' },
  { value: 'OUTDATED INFORMATION', label: 'Outdated Information' },
  { value: 'WRONG LOCATION', label: 'Wrong Location / Coordinate' },
  { value: 'WRONG SEVERITY', label: 'Wrong Severity Level' },
  { value: 'DUPLICATE ALERT', label: 'Duplicate Alert' },
  { value: 'HAZARD RESOLVED', label: 'Hazard Resolved / Clear' },
  { value: 'OTHER', label: 'Other Verification Issue' }
];

export const InformationQualitySection: React.FC<InformationQualitySectionProps> = ({
  alert,
  onAlertUpdated,
  userRole = 'citizen'
}) => {
  // State for forms & review panel
  const [showCitizenForm, setShowCitizenForm] = useState(false);
  const [showResponderForm, setShowResponderForm] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [isReviewerMode, setIsReviewerMode] = useState(userRole === 'authorized_reviewer');

  // Citizen Form state
  const [selectedReason, setSelectedReason] = useState<CorrectionReason>('FALSE INFORMATION');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [proposedLocation, setProposedLocation] = useState('');
  const [proposedSeverity, setProposedSeverity] = useState<AlertSeverity>('Warning');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Responder Form state
  const [responderStatus, setResponderStatus] = useState<FieldVerificationStatus>('CONFIRMED');
  const [responderObservation, setResponderObservation] = useState('');
  const [responderSuccessMsg, setResponderSuccessMsg] = useState<string | null>(null);

  // Reviewer state
  const [reviewerNote, setReviewerNote] = useState('');
  const [reviewActionMsg, setReviewActionMsg] = useState<string | null>(null);

  // Load relevant corrections for this alert
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);

  const refreshCorrections = useCallback(() => {
    const all = loadStoredCorrections();
    const alertCorrections = all.filter(c => c.alertId === alert.id);
    setCorrections(alertCorrections);
  }, [alert.id]);

  useEffect(() => {
    refreshCorrections();
  }, [refreshCorrections]);

  const pendingCorrections = corrections.filter(c => c.status === 'PENDING');
  const freshnessInfo = checkAlertFreshness(alert);

  // Submit Citizen Correction
  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const created = submitCorrectionRequest({
      alertId: alert.id,
      alertHazard: alert.type,
      alertTitle: alert.title,
      requesterRole: userRole,
      reason: selectedReason,
      description,
      evidence,
      proposedLocation: selectedReason === 'WRONG LOCATION' ? proposedLocation : undefined,
      proposedSeverity: selectedReason === 'WRONG SEVERITY' ? proposedSeverity : undefined
    });

    setDescription('');
    setEvidence('');
    setProposedLocation('');
    setSubmitSuccessMsg('Correction submitted for authorized review.');
    setShowCitizenForm(false);
    refreshCorrections();

    if (onAlertUpdated) {
      onAlertUpdated({
        ...alert,
        verificationStatus: 'Under Review',
        activeCorrectionId: created.id
      });
    }

    setTimeout(() => setSubmitSuccessMsg(null), 5000);
  };

  // Submit Responder Field Verification
  const handleSubmitFieldVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responderObservation.trim()) return;

    const updatedCorr = submitFieldVerification(
      alert.id,
      responderStatus,
      responderObservation,
      userRole === 'volunteer' ? 'Volunteer First Responder' : 'Field Observer'
    );

    setResponderObservation('');
    setResponderSuccessMsg('Field verification recorded successfully.');
    setShowResponderForm(false);
    refreshCorrections();

    if (onAlertUpdated) {
      onAlertUpdated({
        ...alert,
        verificationStatus: 'Under Review',
        activeCorrectionId: updatedCorr.id
      });
    }

    setTimeout(() => setResponderSuccessMsg(null), 5000);
  };

  // Authorized Review Decision
  const handleReviewDecision = (correctionId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const result = reviewCorrectionRequest(
        correctionId,
        decision,
        reviewerNote || (decision === 'APPROVED' ? 'Approved based on verified feedback.' : 'Correction request rejected; active alert verified.'),
        'AUTHORIZED REVIEWER'
      );

      setReviewerNote('');
      setReviewActionMsg(`Correction ${decision.toLowerCase()} successfully.`);
      refreshCorrections();

      if (result.updatedAlert && onAlertUpdated) {
        onAlertUpdated(result.updatedAlert);
      }

      setTimeout(() => setReviewActionMsg(null), 5000);
    } catch (err: any) {
      console.warn('Review failed:', err);
    }
  };

  const getVerificationBadge = () => {
    const vStatus = alert.verificationStatus || (alert.isVerified ? 'Verified' : 'Under Review');
    switch (vStatus) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck size={13} />
            Verified Multi-Source Signal
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle size={13} />
            Information Review Pending
          </span>
        );
      case 'Corrected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <FileCheck size={13} />
            Corrected by Authorized Reviewer
          </span>
        );
      case 'Retracted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle size={13} />
            Retracted False Information
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
            <ShieldCheck size={13} />
            Monitored Baseline
          </span>
        );
    }
  };

  return (
    <div className="drawer-section border-t border-white/10 pt-4 mt-2">
      {/* Header & Badges */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <h4 className="drawer-section-title flex items-center gap-1.5 text-zinc-300">
          <FileCheck size={14} className="text-accent" />
          INFORMATION QUALITY & VERIFICATION
        </h4>
        {getVerificationBadge()}
      </div>

      {/* Stale / Degraded Telemetry Notice */}
      {freshnessInfo.advisoryText && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs mb-2">
          <Clock size={14} className="flex-shrink-0" />
          <span>{freshnessInfo.advisoryText}</span>
        </div>
      )}

      {/* Success Notification Banners */}
      {submitSuccessMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs mb-2">
          <CheckCircle2 size={14} className="flex-shrink-0" />
          <span>{submitSuccessMsg}</span>
        </div>
      )}

      {responderSuccessMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs mb-2">
          <CheckCircle2 size={14} className="flex-shrink-0" />
          <span>{responderSuccessMsg}</span>
        </div>
      )}

      {reviewActionMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs mb-2">
          <CheckCircle2 size={14} className="flex-shrink-0" />
          <span>{reviewActionMsg}</span>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <button
          type="button"
          onClick={() => {
            setShowCitizenForm(prev => !prev);
            setShowResponderForm(false);
            setShowReviewPanel(false);
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <AlertCircle size={13} className="text-amber-400" />
          {showCitizenForm ? 'Close Report Form' : 'Report Incorrect Information'}
        </button>

        <button
          type="button"
          onClick={() => {
            setShowResponderForm(prev => !prev);
            setShowCitizenForm(false);
            setShowReviewPanel(false);
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <UserCheck size={13} className="text-emerald-400" />
          {showResponderForm ? 'Close Field Form' : 'Submit Field Verification'}
        </button>

        {/* Authorized Reviewer Prototype Mode Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsReviewerMode(prev => !prev);
            setShowReviewPanel(prev => !prev);
            setShowCitizenForm(false);
            setShowResponderForm(false);
          }}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
            isReviewerMode
              ? 'bg-accent text-[#090b0c] border-accent font-extrabold shadow'
              : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
          }`}
          title="Toggle Authorized Reviewer prototype mode"
        >
          <FileCheck size={13} />
          {isReviewerMode ? 'Review Mode (Active)' : `Review Corrections (${pendingCorrections.length})`}
        </button>
      </div>

      {/* 1. CITIZEN CORRECTION FORM */}
      {showCitizenForm && (
        <form onSubmit={handleSubmitCorrection} className="mt-3 p-3 rounded-lg bg-[#0e1014] border border-amber-500/30 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Report Outdated / Incorrect Info</span>
            <span className="text-[10px] text-zinc-500">Citizen Feedback</span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Reason for Correction *</label>
            <select
              value={selectedReason}
              onChange={e => setSelectedReason(e.target.value as CorrectionReason)}
              className="w-full bg-[#161920] border border-white/15 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
            >
              {CORRECTION_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {selectedReason === 'WRONG LOCATION' && (
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Corrected Location / Landmark *</label>
              <input
                type="text"
                placeholder="e.g. Sector 6 Drainage Canal, Bidanasi"
                value={proposedLocation}
                onChange={e => setProposedLocation(e.target.value)}
                className="w-full bg-[#161920] border border-white/15 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>
          )}

          {selectedReason === 'WRONG SEVERITY' && (
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Suggested Severity Level</label>
              <select
                value={proposedSeverity}
                onChange={e => setProposedSeverity(e.target.value as AlertSeverity)}
                className="w-full bg-[#161920] border border-white/15 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="Advisory">Advisory (Low / Monitoring)</option>
                <option value="Warning">Warning (Moderate / High)</option>
                <option value="Critical">Critical (Severe / Life-Safety)</option>
                <option value="Resolved">Resolved (All Clear)</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Description / Observation *</label>
            <textarea
              rows={2}
              placeholder="Describe what has changed or is incorrect on the ground..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#161920] border border-white/15 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent resize-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Optional Reference / Evidence</label>
            <input
              type="text"
              placeholder="e.g. Field photo, local municipal warden update, live CCTV"
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
              className="w-full bg-[#161920] border border-white/15 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-zinc-500">Subject to review by Authorized Reviewers</span>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md bg-accent text-[#090b0c] font-bold text-xs hover:bg-accent/90 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={12} />
              Submit Correction
            </button>
          </div>
        </form>
      )}

      {/* 2. RESPONDER FIELD VERIFICATION FORM */}
      {showResponderForm && (
        <form onSubmit={handleSubmitFieldVerification} className="mt-3 p-3 rounded-lg bg-[#0e1014] border border-emerald-500/30 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Field Responder Ground Truth</span>
            <span className="text-[10px] text-zinc-500">First Responder Channel</span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">On-Scene Verification Status *</label>
            <select
              value={responderStatus}
              onChange={e => setResponderStatus(e.target.value as FieldVerificationStatus)}
              className="w-full bg-[#161920] border border-white/15 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
            >
              <option value="CONFIRMED">CONFIRMED (Hazard verified active on site)</option>
              <option value="NO_LONGER_PRESENT">NO LONGER PRESENT (Hazard has receded / cleared)</option>
              <option value="LOCATION_INCORRECT">LOCATION INCORRECT (Misaligned coordinates)</option>
              <option value="SEVERITY_INCORRECT">SEVERITY INCORRECT (Observed conditions differ from telemetry)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Field Observation Details *</label>
            <textarea
              rows={2}
              placeholder="e.g. Unit 4 arrived at sector. Water receded by 1.2m. Traffic moving normally."
              value={responderObservation}
              onChange={e => setResponderObservation(e.target.value)}
              className="w-full bg-[#161920] border border-white/15 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-zinc-500">Signal attached to alert for rapid authorization</span>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md bg-emerald-500 text-[#090b0c] font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck size={12} />
              Record Field Signal
            </button>
          </div>
        </form>
      )}

      {/* 3. AUTHORIZED REVIEW PANEL */}
      {showReviewPanel && (
        <div className="mt-3 p-3 rounded-lg bg-[#0e1014] border border-accent/40 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-accent" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">AUTHORIZED REVIEW INTERFACE</span>
            </div>
            <span className="text-[10px] text-zinc-400 bg-white/10 px-2 py-0.5 rounded">Prototype Reviewer Role</span>
          </div>

          {pendingCorrections.length === 0 ? (
            <p className="text-xs text-zinc-400 italic py-1">No pending correction requests for this alert.</p>
          ) : (
            pendingCorrections.map(corr => (
              <div key={corr.id} className="p-2.5 rounded bg-[#161920] border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-400 uppercase">[{corr.reason}]</span>
                  <span className="text-zinc-500">Submitted: {new Date(corr.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <p className="text-xs text-zinc-200 font-medium">"{corr.description}"</p>

                {corr.evidence && (
                  <span className="text-[11px] text-zinc-400 bg-black/40 px-2 py-1 rounded">
                    Evidence: {corr.evidence}
                  </span>
                )}

                {corr.fieldVerification && (
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex flex-col gap-0.5">
                    <span className="font-bold">Responder Field Signal: {corr.fieldVerification.responderStatus}</span>
                    <span>"{corr.fieldVerification.observation}"</span>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Reviewer Note / Decision Rationale</label>
                  <input
                    type="text"
                    placeholder="Enter audit rationale note..."
                    value={reviewerNote}
                    onChange={e => setReviewerNote(e.target.value)}
                    className="w-full bg-[#0c0d10] border border-white/15 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleReviewDecision(corr.id, 'REJECTED')}
                    className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X size={12} />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewDecision(corr.id, 'APPROVED')}
                    className="px-3 py-1 rounded bg-accent text-[#090b0c] hover:bg-accent/90 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={12} />
                    Approve Correction
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
