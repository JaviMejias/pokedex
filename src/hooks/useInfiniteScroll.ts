import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchPokemon, fetchTypeData, fetchAllPokemonNames } from '@/services/pokemonService';
import type { Pokemon } from '@/types/pokemon';
import { PAGE_SIZE } from '@/constants';

interface UseInfiniteScrollReturn {
  pokemon: Pokemon[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  total: number;
}

export function useInfiniteScroll(
  typeFilters: string[] = [],
  generationRange: [number, number] | null = null,
  sortMode: 'id' | 'name' = 'id',
  sortOrder: 'asc' | 'desc' = 'asc'
): UseInfiniteScrollReturn {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const offsetRef = useRef(0);
  const isLoadingRef = useRef(false);

  const fetchPage = useCallback(async (offset: number, replace: boolean) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      const allNamesList = await fetchAllPokemonNames();
      
      let validNames = new Set<string>();
      const idMap = new Map<string, number>();

      for (const p of allNamesList) {
        const id = parseInt(p.url.replace(/\/$/, '').split('/').pop() || '0', 10);
        if (id > 0 && id < 10000) {
          validNames.add(p.name);
          idMap.set(p.name, id);
        }
      }

      if (generationRange) {
        const [min, max] = generationRange;
        for (const name of validNames) {
          const id = idMap.get(name)!;
          if (id < min || id > max) {
            validNames.delete(name);
          }
        }
      }

      if (typeFilters.length > 0) {
        const typeDatas = await Promise.all(typeFilters.map(t => fetchTypeData(t)));
        for (const typeData of typeDatas) {
          const typeSet = new Set(typeData.pokemon.map(p => p.pokemon.name));
          for (const name of validNames) {
            if (!typeSet.has(name)) {
              validNames.delete(name);
            }
          }
        }
      }

      const sortedNames = Array.from(validNames).sort((a, b) => {
        let comparison = 0;
        if (sortMode === 'id') {
          comparison = idMap.get(a)! - idMap.get(b)!;
        } else {
          comparison = a.localeCompare(b);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      const totalCount = sortedNames.length;
      const results = sortedNames.slice(offset, offset + PAGE_SIZE).map(name => ({ name }));
      const hasNext = offset + PAGE_SIZE < totalCount;

      setTotal(totalCount);
      setHasMore(hasNext);

      const pokemonData = await Promise.allSettled(
        results.map(r => fetchPokemon(r.name))
      );

      const resolved = pokemonData
        .filter((r): r is PromiseFulfilledResult<Pokemon> => r.status === 'fulfilled')
        .map(r => r.value);

      setPokemon(prev => replace ? resolved : [...prev, ...resolved]);
      offsetRef.current = offset + PAGE_SIZE;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar Pokémon');
    } finally {
      isLoadingRef.current = false;
    }
  }, [typeFilters, generationRange, sortMode, sortOrder]);

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return;
    setIsLoadingMore(true);
    fetchPage(offsetRef.current, false).finally(() => setIsLoadingMore(false));
  }, [fetchPage, hasMore]);

  const reset = useCallback(() => {
    offsetRef.current = 0;
    setPokemon([]);
    setHasMore(true);
    setError(null);
    setIsLoading(true);
    fetchPage(0, true).finally(() => setIsLoading(false));
  }, [fetchPage]);

  useEffect(() => {
    reset();
  }, [reset]);

  return { pokemon, isLoading, isLoadingMore, error, hasMore, loadMore, reset, total };
}
