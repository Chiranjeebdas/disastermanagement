/**
 * DRISHTI Hi-Fi IndexedDB Local Database Engine
 * Fast, transactional, persistent client-side storage for offline disaster management.
 */

const DB_NAME = 'drishti_offline_db';
const DB_VERSION = 2;

export interface DBStores {
  reports: any;
  alerts: any;
  facilities: any;
  sync_queue: any;
  telemetry_logs: any;
}

let dbInstance: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Reports Store
      if (!db.objectStoreNames.contains('reports')) {
        const reportStore = db.createObjectStore('reports', { keyPath: 'id' });
        reportStore.createIndex('status', 'status', { unique: false });
        reportStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Alerts Store
      if (!db.objectStoreNames.contains('alerts')) {
        const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
        alertStore.createIndex('severity', 'severity', { unique: false });
      }

      // Facilities Store
      if (!db.objectStoreNames.contains('facilities')) {
        const facilityStore = db.createObjectStore('facilities', { keyPath: 'id' });
        facilityStore.createIndex('type', 'type', { unique: false });
      }

      // Sync Queue Store (for mutations created while offline)
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('action', 'action', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Telemetry Logs Store
      if (!db.objectStoreNames.contains('telemetry_logs')) {
        const telemetryStore = db.createObjectStore('telemetry_logs', { keyPath: 'id', autoIncrement: true });
        telemetryStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

/**
 * Generic helper to get all items from an object store
 */
export const dbGetAll = async <T>(storeName: keyof DBStores): Promise<T[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Generic helper to save or update an item in an object store
 */
export const dbPut = async <T>(storeName: keyof DBStores, item: T): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Generic helper to batch save/replace items in an object store
 */
export const dbPutBatch = async <T>(storeName: keyof DBStores, items: T[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach(item => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Generic helper to delete an item by key
 */
export const dbDelete = async (storeName: keyof DBStores, key: IDBValidKey): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Clear all items in an object store
 */
export const dbClear = async (storeName: keyof DBStores): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};
