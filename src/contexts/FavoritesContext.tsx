import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { STORAGE_KEYS, TEAM_MAX_SIZE } from '@/constants';
import type { TeamMember } from '@/types/pokemon';

interface FavoritesContextValue {
  favorites: number[];
  team: TeamMember[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (id: number, name: string) => void;
  isInTeam: (id: number) => boolean;
  addToTeam: (id: number, name: string) => boolean;
  removeFromTeam: (id: number) => void;
  clearTeam: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function loadFavorites(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function loadTeam(): TeamMember[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEAM);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTeam(team: TeamMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
  } catch {
    // ignore
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>(loadFavorites);
  const [team, setTeam] = useState<TeamMember[]>(loadTeam);

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id: number, _name: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  }, []);

  const isInTeam = useCallback((id: number) => team.some(m => m.id === id), [team]);

  const addToTeam = useCallback((id: number, name: string): boolean => {
    if (team.length >= TEAM_MAX_SIZE || team.some(m => m.id === id)) return false;
    const next = [...team, { id, name }];
    setTeam(next);
    saveTeam(next);
    return true;
  }, [team]);

  const removeFromTeam = useCallback((id: number) => {
    const next = team.filter(m => m.id !== id);
    setTeam(next);
    saveTeam(next);
  }, [team]);

  const clearTeam = useCallback(() => {
    setTeam([]);
    saveTeam([]);
  }, []);

  const value = useMemo<FavoritesContextValue>(() => ({
    favorites,
    team,
    isFavorite,
    toggleFavorite,
    isInTeam,
    addToTeam,
    removeFromTeam,
    clearTeam,
  }), [favorites, team, isFavorite, toggleFavorite, isInTeam, addToTeam, removeFromTeam, clearTeam]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
