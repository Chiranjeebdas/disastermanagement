import { useState, useEffect } from 'react';

export type ConnectivityStatus = 'ONLINE' | 'LIMITED' | 'OFFLINE';

export const useConnectivity = () => {
  const [status, setStatus] = useState<ConnectivityStatus>(
    navigator.onLine ? 'ONLINE' : 'OFFLINE'
  );

  useEffect(() => {
    const handleOnline = () => setStatus('ONLINE');
    const handleOffline = () => setStatus('OFFLINE');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check (some browsers might cache navigator.onLine incorrectly on load)
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
       setStatus(navigator.onLine ? 'ONLINE' : 'OFFLINE');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
};
