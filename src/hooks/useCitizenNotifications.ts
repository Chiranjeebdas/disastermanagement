import { useState, useEffect, useRef, useCallback } from 'react';
import {
  evaluateCitizenNotification,
  dispatchBrowserNotification,
  type CitizenNotification
} from '../utils/citizenNotifications';
import type { HazardRiskAssessment } from '../types/earlyWarning';
import type { Alert } from '../types/alert';

export function useCitizenNotifications(
  currentAssessment: HazardRiskAssessment | null,
  alerts: Alert[],
  userLocationName: string
) {
  const [activeNotification, setActiveNotification] = useState<CitizenNotification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setActiveNotification(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Evaluate smart notification using shouldIssueWarning & alarm fatigue logic
    const notif = evaluateCitizenNotification(currentAssessment, alerts, userLocationName);

    if (notif) {
      setActiveNotification(notif);

      // Dispatch native OS notification if permitted
      dispatchBrowserNotification(notif);

      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Auto dismiss advisory / watch / resolved after 12 seconds (keep emergency / warning visible)
      if (notif.severityClass === 'advisory' || notif.severityClass === 'watch' || notif.severityClass === 'resolved') {
        timerRef.current = setTimeout(() => {
          setActiveNotification(null);
        }, 12000);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentAssessment, alerts, userLocationName]);

  return {
    activeNotification,
    dismiss
  };
}
