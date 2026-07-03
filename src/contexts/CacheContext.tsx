import React, { createContext, useContext, useMemo } from 'react';
import { cacheService } from '@/services/cacheService';
import { IDB_CONFIG } from '@/constants';

interface CacheContextValue {
  clearPokemonCache: () => Promise<void>;
  clearAllCache: () => Promise<void>;
}

const CacheContext = createContext<CacheContextValue | null>(null);

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const clearPokemonCache = useMemo(() => async () => {
    await cacheService.clear(IDB_CONFIG.STORES.POKEMON);
  }, []);

  const clearAllCache = useMemo(() => async () => {
    await Promise.all(
      Object.values(IDB_CONFIG.STORES).map(store => cacheService.clear(store))
    );
  }, []);

  const value = useMemo<CacheContextValue>(() => ({
    clearPokemonCache,
    clearAllCache,
  }), [clearPokemonCache, clearAllCache]);

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache(): CacheContextValue {
  const ctx = useContext(CacheContext);
  if (!ctx) throw new Error('useCache must be used within CacheProvider');
  return ctx;
}
