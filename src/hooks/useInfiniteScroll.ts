import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchPokemonList, fetchPokemon, fetchTypeData } from '@/services/pokemonService';
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

export function useInfiniteScroll(typeFilters: string[] = []): UseInfiniteScrollReturn {
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
      let results: { name: string }[] = [];
      let totalCount = 0;
      let hasNext = false;

      if (typeFilters.length > 0) {
        const typeDatas = await Promise.all(typeFilters.map(t => fetchTypeData(t)));
        
        // Lógica AND (intersección) si hay varios filtros, para buscar Pokémon que tengan AMBOS tipos
        let validNames = new Set(typeDatas[0].pokemon.map(p => p.pokemon.name));
        const idMap = new Map<string, number>();
        
        for (const p of typeDatas[0].pokemon) {
          idMap.set(p.pokemon.name, parseInt(p.pokemon.url.split('/').filter(Boolean).pop() || '0', 10));
        }

        for (let i = 1; i < typeDatas.length; i++) {
          const nextSet = new Set(typeDatas[i].pokemon.map(p => p.pokemon.name));
          for (const p of typeDatas[i].pokemon) {
            idMap.set(p.pokemon.name, parseInt(p.pokemon.url.split('/').filter(Boolean).pop() || '0', 10));
          }
          for (const name of validNames) {
            if (!nextSet.has(name)) validNames.delete(name);
          }
        }

        const sortedNames = Array.from(validNames).sort((a, b) => (idMap.get(a) || 0) - (idMap.get(b) || 0));
        
        totalCount = sortedNames.length;
        results = sortedNames.slice(offset, offset + PAGE_SIZE).map(name => ({ name }));
        hasNext = offset + PAGE_SIZE < totalCount;
      } else {
        const list = await fetchPokemonList(offset, PAGE_SIZE);
        totalCount = list.count;
        results = list.results;
        hasNext = list.next !== null;
      }

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
  }, [typeFilters]);

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
