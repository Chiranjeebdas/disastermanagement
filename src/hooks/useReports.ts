import { useState, useEffect, useCallback } from 'react';
import type { IncidentReport, ReportSourceInfo } from '../types/report';
import { analyzeIncidentReport, SEEDED_REPORTS } from '../utils/aiVerification';
import { dbGetAll, dbPut, dbPutBatch } from '../utils/indexedDB';
import { offlineSyncManager } from '../utils/offlineSyncManager';

const STORAGE_KEY = 'drishti_reports_v7';

export const useReports = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial from IndexedDB (with localStorage and SEEDED_REPORTS fallback)
  useEffect(() => {
    const loadReports = async () => {
      try {
        // Try IndexedDB first
        const idbReports = await dbGetAll<IncidentReport>('reports');
        if (idbReports && idbReports.length > 0) {
          setReports(idbReports);
          setIsInitialized(true);
          return;
        }

        // Fallback to localStorage
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as IncidentReport[];
          if (parsed && parsed.length > 0) {
            setReports(parsed);
            await dbPutBatch('reports', parsed);
            setIsInitialized(true);
            return;
          }
        }

        // Default seed
        setReports(SEEDED_REPORTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_REPORTS));
        await dbPutBatch('reports', SEEDED_REPORTS);
      } catch (e) {
        console.warn('Failed to load IndexedDB reports, falling back to seed', e);
        setReports(SEEDED_REPORTS);
      } finally {
        setIsInitialized(true);
      }
    };

    loadReports();
  }, []);

  // Persist to both IndexedDB and localStorage whenever reports change
  useEffect(() => {
    if (isInitialized && reports.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        dbPutBatch('reports', reports).catch(e => console.warn('IDB Batch save error:', e));
      } catch (e) {
        console.warn('Failed to persist reports cache:', e);
      }
    }
  }, [reports, isInitialized]);

  // Handle Offline/Online and Sync Event Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      offlineSyncManager.processSyncQueue();
    };

    const handleOffline = () => setIsOffline(true);

    const handleSyncComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{ syncedCount: number }>;
      if (customEvent.detail?.syncedCount > 0) {
        setReports(prev => prev.map(report => {
          if (report.status === 'PendingSync') {
            return {
              ...report,
              status: report.verificationStatus === 'Verified' ? 'Verified' : 'Submitted'
            };
          }
          return report;
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('drishti-sync-complete', handleSyncComplete);

    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('drishti-sync-complete', handleSyncComplete);
    };
  }, []);

  // Submit report with real-time local AI verification & automatic offline sync queueing
  const submitReport = useCallback(async (
    reportData: Omit<IncidentReport, 'id' | 'status' | 'verificationStatus' | 'timestamp' | 'aiAnalysis' | 'sourceInfo'> & { sourceInfo?: ReportSourceInfo }
  ) => {
    const defaultSource: ReportSourceInfo = reportData.sourceInfo || {
      platform: 'DRISHTI Web App',
      authorName: 'Citizen / Field Responder',
      authorHandle: '@drishti_field',
      verifiedUser: true,
      engagementStats: { shares: 1, corroborations: 1 }
    };

    // Run Instant In-Browser AI Agent Analysis (Works 100% Offline)
    const aiAnalysis = analyzeIncidentReport(
      reportData.type,
      reportData.locationName,
      reportData.coordinates,
      reportData.description,
      reportData.mediaBase64,
      reportData.urgency,
      reportData.tags,
      defaultSource
    );

    const isCurrentOffline = !navigator.onLine;

    const initialStatus = aiAnalysis.verdict === 'Avoid' 
      ? 'Avoid' 
      : isCurrentOffline
        ? 'PendingSync'
        : aiAnalysis.verdict === 'Genuine' 
          ? 'Verified' 
          : 'UnderReview';

    const newReport: IncidentReport = {
      ...reportData,
      id: `DRISHTI-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
      timestamp: new Date().toISOString(),
      status: initialStatus,
      verificationStatus: aiAnalysis.verdict === 'Genuine' ? 'Verified' : aiAnalysis.verdict === 'Avoid' ? 'Rejected' : 'UnderReview',
      responseStatus: aiAnalysis.verdict === 'Genuine' ? 'ResponderAssigned' : 'Unassigned',
      sourceInfo: defaultSource,
      aiAnalysis
    };

    // Save to local IndexedDB immediately
    await dbPut('reports', newReport);

    // If offline, enqueue for cloud reconciliation
    if (isCurrentOffline) {
      await offlineSyncManager.enqueueAction('CREATE_REPORT', newReport);
    }

    setReports(prev => [newReport, ...prev]);
    return newReport;
  }, []);

  const updateReportStatus = useCallback((id: string, newStatus: IncidentReport['responseStatus']) => {
    setReports(prev => {
      const updated = prev.map(report => {
        if (report.id === id) {
          const mod = { ...report, responseStatus: newStatus };
          dbPut('reports', mod);
          return mod;
        }
        return report;
      });
      return updated;
    });
  }, []);

  const manuallyVerifyReport = useCallback((id: string, newVerdict: 'Genuine' | 'Avoid') => {
    setReports(prev => {
      const updated = prev.map(report => {
        if (report.id !== id) return report;
        const updatedAnalysis = report.aiAnalysis ? {
          ...report.aiAnalysis,
          verdict: newVerdict,
          confidenceLevel: (newVerdict === 'Genuine' ? 'High' : 'Low') as 'High' | 'Low',
          confidenceScore: newVerdict === 'Genuine' ? 95 : 15,
          reasoning: [
            `Manual Command Center Override by Operator: Marked as ${newVerdict.toUpperCase()}`,
            ...report.aiAnalysis.reasoning
          ]
        } : undefined;

        const mod: IncidentReport = {
          ...report,
          status: newVerdict === 'Genuine' ? 'Verified' : 'Avoid',
          verificationStatus: newVerdict === 'Genuine' ? 'Verified' : 'Rejected',
          responseStatus: newVerdict === 'Genuine' ? 'ResponderAssigned' : 'Unassigned',
          aiAnalysis: updatedAnalysis
        };

        dbPut('reports', mod);
        return mod;
      });
      return updated;
    });
  }, []);

  return {
    reports,
    isOffline,
    submitReport,
    updateReportStatus,
    manuallyVerifyReport
  };
};
