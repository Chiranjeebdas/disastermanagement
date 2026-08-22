import { useState, useEffect, useCallback } from 'react';
import type { IncidentReport } from '../types/report';

const STORAGE_KEY = 'drishti_reports_v1';

export const useReports = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  
  // Load initial from localStorage
  useEffect(() => {
    const loadReports = () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          setReports(JSON.parse(cached));
        }
      } catch (e) {
        console.warn('Failed to parse cached reports', e);
      }
    };
    loadReports();
  }, []);

  // Persist to localStorage whenever reports change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  }, [reports]);

  // Handle Offline/Online and Sync Logic
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      
      // Attempt Synchronization
      setReports(prev => {
        let hasChanges = false;
        const updated = prev.map(report => {
          if (report.status === 'PendingSync') {
            hasChanges = true;
            return { ...report, status: 'Submitted' as const };
          }
          return report;
        });
        
        return hasChanges ? updated : prev;
      });
    };
    
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check just in case we started offline but are now online, 
    // or to sync items that were PendingSync from a previous session.
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const submitReport = useCallback(async (reportData: Omit<IncidentReport, 'id' | 'status' | 'verificationStatus' | 'timestamp'>) => {
    const newReport: IncidentReport = {
      ...reportData,
      id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      status: navigator.onLine ? 'Submitted' : 'PendingSync',
      verificationStatus: 'Unverified'
    };

    setReports(prev => [newReport, ...prev]);
    return newReport;
  }, []);

  const updateReportStatus = useCallback((id: string, newStatus: IncidentReport['responseStatus']) => {
    setReports(prev => prev.map(report => 
      report.id === id 
        ? { 
            ...report, 
            responseStatus: newStatus,
            // If offline, flag it to sync later, otherwise keep Submitted. 
            // In a real app we'd have a separate queue for status updates.
            // For now, if offline we just update it locally.
          }
        : report
    ));
  }, []);

  return {
    reports,
    isOffline,
    submitReport,
    updateReportStatus
  };
};
