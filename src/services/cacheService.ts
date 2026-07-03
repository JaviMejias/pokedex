import { IDB_CONFIG, CACHE_TTL_MS } from '@/constants';
import { CachedEntry } from '@/types/pokemon';

class CacheService {
  private memoryCache: Map<string, CachedEntry<unknown>> = new Map();
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initIndexedDB();
  }

  private initIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve();
        return;
      }

      const request = indexedDB.open(IDB_CONFIG.DB_NAME, IDB_CONFIG.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        Object.values(IDB_CONFIG.STORES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'key' });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => {
        resolve();
      };
    });
  }

  private isExpired(entry: CachedEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > CACHE_TTL_MS;
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    const memKey = `${storeName}:${key}`;
    const memEntry = this.memoryCache.get(memKey) as CachedEntry<T> | undefined;
    if (memEntry && !this.isExpired(memEntry)) {
      return memEntry.data;
    }

    await this.dbReady;
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as ({ key: string } & CachedEntry<T>) | undefined;
        if (result && !this.isExpired(result)) {
          this.memoryCache.set(memKey, result);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  async set<T>(storeName: string, key: string, data: T): Promise<void> {
    const entry: CachedEntry<T> = { data, timestamp: Date.now() };
    const memKey = `${storeName}:${key}`;
    this.memoryCache.set(memKey, entry as CachedEntry<unknown>);

    await this.dbReady;
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.put({ key, ...entry });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  }

  async clear(storeName: string): Promise<void> {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(`${storeName}:`)) {
        this.memoryCache.delete(key);
      }
    }

    await this.dbReady;
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  }
}

export const cacheService = new CacheService();
