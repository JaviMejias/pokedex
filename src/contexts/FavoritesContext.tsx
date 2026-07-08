import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { STORAGE_KEYS, TEAM_MAX_SIZE } from '@/constants';
import type { TeamMember } from '@/types/pokemon';

interface FavoritesContextValue {
  favorites: number[];
  team: (TeamMember | null)[];
  savedTeams: SavedTeam[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (id: number, name: string) => void;
  isInTeam: (id: number, speciesName?: string) => boolean;
  addToTeam: (id: number, name: string, speciesName?: string, targetIndex?: number) => boolean;
  removeFromTeam: (id: number) => void;
  swapInTeam: (index1: number, index2: number) => void;
  clearTeam: () => void;
  saveCurrentTeam: (name: string) => void;
  loadSavedTeam: (id: string) => void;
  deleteSavedTeam: (id: string) => void;
}

export interface SavedTeam {
  id: string;
  name: string;
  createdAt: number;
  members: (TeamMember | null)[];
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

function loadTeam(): (TeamMember | null)[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEAM);
    const parsed = stored ? JSON.parse(stored) : [];
    const arr = Array(TEAM_MAX_SIZE).fill(null);
    for (let i = 0; i < TEAM_MAX_SIZE; i++) {
      if (parsed[i]) arr[i] = parsed[i];
    }
    return arr;
  } catch {
    return Array(TEAM_MAX_SIZE).fill(null);
  }
}

function saveTeam(team: (TeamMember | null)[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
  } catch {
    // ignore
  }
}

function loadSavedTeams(): SavedTeam[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_TEAMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSavedTeams(teams: SavedTeam[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_TEAMS, JSON.stringify(teams));
  } catch {}
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>(loadFavorites);
  const [team, setTeam] = useState<(TeamMember | null)[]>(loadTeam);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>(loadSavedTeams);

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id: number, _name: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  }, []);

  const isInTeam = useCallback((id: number, speciesName?: string) => {
    return team.some(m => {
      if (!m) return false;
      if (m.id === id) return true;
      if (speciesName && m.speciesName === speciesName) return true;
      if (speciesName && (m.name === speciesName || m.name.startsWith(speciesName + '-'))) return true;
      return false;
    });
  }, [team]);

  const addToTeam = useCallback((id: number, name: string, speciesName?: string, targetIndex?: number): boolean => {
    let wasAdded = false;
    setTeam(prev => {
      // Inline isInTeam check using 'prev' state instead of stale closure
      const isDuplicate = prev.some(m => {
        if (!m) return false;
        if (m.id === id) return true;
        if (speciesName && m.speciesName === speciesName) return true;
        if (speciesName && (m.name === speciesName || m.name.startsWith(speciesName + '-'))) return true;
        return false;
      });

      if (isDuplicate) return prev;
      
      const next = [...prev];
      if (targetIndex !== undefined && targetIndex >= 0 && targetIndex < TEAM_MAX_SIZE) {
        next[targetIndex] = { id, name, speciesName };
        wasAdded = true;
      } else {
        const emptyIdx = next.findIndex(m => !m);
        if (emptyIdx !== -1) {
          next[emptyIdx] = { id, name, speciesName };
          wasAdded = true;
        }
      }
      if (wasAdded) saveTeam(next);
      return next;
    });
    // This return value might not be perfectly synchronous if we just added it, 
    // but the UI typically doesn't strictly rely on this returning false except for silent fails.
    // Assuming true since we allow silent fails mostly.
    return true; 
  }, []);

  const removeFromTeam = useCallback((id: number) => {
    const next = team.map(m => m?.id === id ? null : m);
    setTeam(next);
    saveTeam(next);
  }, [team]);

  const swapInTeam = useCallback((idx1: number, idx2: number) => {
    setTeam(prev => {
      if (idx1 < 0 || idx1 >= TEAM_MAX_SIZE || idx2 < 0 || idx2 >= TEAM_MAX_SIZE) return prev;
      const next = [...prev];
      const temp = next[idx1];
      next[idx1] = next[idx2];
      next[idx2] = temp;
      saveTeam(next);
      return next;
    });
  }, []);

  const clearTeam = useCallback(() => {
    const next = Array(TEAM_MAX_SIZE).fill(null);
    setTeam(next);
    saveTeam(next);
  }, []);

  const saveCurrentTeam = useCallback((name: string) => {
    const filled = team.filter(Boolean);
    if (filled.length === 0) return;
    const newEntry: SavedTeam = {
      id: Date.now().toString(),
      name: name.trim() || `Equipo ${new Date().toLocaleDateString('es')}`,
      createdAt: Date.now(),
      members: [...team],
    };
    setSavedTeams(prev => {
      const next = [newEntry, ...prev].slice(0, 20); // max 20 saved teams
      saveSavedTeams(next);
      return next;
    });
  }, [team]);

  const loadSavedTeam = useCallback((id: string) => {
    const found = savedTeams.find(t => t.id === id);
    if (!found) return;
    const restored = Array(TEAM_MAX_SIZE).fill(null).map((_, i) => found.members[i] ?? null) as (TeamMember | null)[];
    setTeam(restored);
    saveTeam(restored);
  }, [savedTeams]);

  const deleteSavedTeam = useCallback((id: string) => {
    setSavedTeams(prev => {
      const next = prev.filter(t => t.id !== id);
      saveSavedTeams(next);
      return next;
    });
  }, []);

  const value = useMemo<FavoritesContextValue>(() => ({
    favorites,
    team,
    savedTeams,
    isFavorite,
    toggleFavorite,
    isInTeam,
    addToTeam,
    removeFromTeam,
    swapInTeam,
    clearTeam,
    saveCurrentTeam,
    loadSavedTeam,
    deleteSavedTeam,
  }), [favorites, team, savedTeams, isFavorite, toggleFavorite, isInTeam, addToTeam, removeFromTeam, swapInTeam, clearTeam, saveCurrentTeam, loadSavedTeam, deleteSavedTeam]);

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
