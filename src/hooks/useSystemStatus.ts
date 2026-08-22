import { useState, useEffect } from 'react';

interface StorageQuota {
  usage: number; // in bytes
  quota: number; // in bytes
  supported: boolean;
}

export const useSystemStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [storage, setStorage] = useState<StorageQuota>({ usage: 0, quota: 0, supported: false });
  const [serviceWorkerActive, setServiceWorkerActive] = useState<boolean>(false);

  useEffect(() => {
    // 1. Network Status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    // 2. Notification Permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('denied'); // Not supported
    }

    // 3. Storage Quota
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        setStorage({
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
          supported: true
        });
      }).catch(e => console.warn('Storage estimation failed', e));
    }

    // 4. Service Worker Status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        setServiceWorkerActive(!!reg && !!reg.active);
      }).catch(() => {
        setServiceWorkerActive(false);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return 'denied';
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  };

  return {
    isOnline,
    notificationPermission,
    requestNotificationPermission,
    storage,
    serviceWorkerActive
  };
};
