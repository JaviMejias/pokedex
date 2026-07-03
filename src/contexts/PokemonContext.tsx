import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import type { Pokemon } from '@/types/pokemon';
import { fetchPokemon } from '@/services/pokemonService';
import { STORAGE_KEYS, HISTORY_MAX_SIZE } from '@/constants';

interface HistoryItem {
  id: number;
  name: string;
  timestamp: number;
}

interface PokemonContextValue {
  selectedPokemon: Pokemon | null;
  isDetailOpen: boolean;
  isDetailLoading: boolean;
  detailError: string | null;
  history: HistoryItem[];
  openDetail: (nameOrId: string | number) => Promise<void>;
  closeDetail: () => void;
  clearHistory: () => void;
}

const PokemonContext = createContext<PokemonContextValue | null>(null);

function loadHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function PokemonProvider({ children }: { children: React.ReactNode }) {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const scrollPositionRef = useRef(0);

  const addToHistory = useCallback((pokemon: Pokemon) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.id !== pokemon.id);
      const newHistory = [
        { id: pokemon.id, name: pokemon.name, timestamp: Date.now() },
        ...filtered,
      ].slice(0, HISTORY_MAX_SIZE);
      saveHistory(newHistory);
      return newHistory;
    });
  }, []);

  const openDetail = useCallback(async (nameOrId: string | number) => {
    scrollPositionRef.current = window.scrollY;
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const pokemon = await fetchPokemon(nameOrId);
      setSelectedPokemon(pokemon);
      addToHistory(pokemon);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Error desconocido');
      setSelectedPokemon(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, [addToHistory]);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedPokemon(null);
    setDetailError(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const value = useMemo<PokemonContextValue>(() => ({
    selectedPokemon,
    isDetailOpen,
    isDetailLoading,
    detailError,
    history,
    openDetail,
    closeDetail,
    clearHistory,
  }), [selectedPokemon, isDetailOpen, isDetailLoading, detailError, history, openDetail, closeDetail, clearHistory]);

  return (
    <PokemonContext.Provider value={value}>
      {children}
    </PokemonContext.Provider>
  );
}

export function usePokemonContext(): PokemonContextValue {
  const ctx = useContext(PokemonContext);
  if (!ctx) throw new Error('usePokemonContext must be used within PokemonProvider');
  return ctx;
}
