import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PokemonCard from '@/components/PokemonCard/PokemonCard';
import SkeletonCard from '@/components/SkeletonCard/SkeletonCard';
import { ErrorState, EmptyState } from '@/components/StateComponents/StateComponents';
import TypeBadge from '@/components/TypeBadge/TypeBadge';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchPokemon, fetchAllPokemonNames } from '@/services/pokemonService';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useSettings } from '@/contexts/SettingsContext';
import type { Pokemon } from '@/types/pokemon';
import { ALL_TYPES, GENERATIONS } from '@/utils/dictionaries';
import es from '@/i18n/es';
import './ExploreView.css';

type SortMode = 'id' | 'name';

const ExploreView = memo(function ExploreView() {
  const { openDetail, history } = usePokemonContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchResults, setSearchResults] = useState<Pokemon[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { skin } = useSettings();
  const { favorites } = useFavorites();
  const [showFavorites, setShowFavorites] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const activeGenObj = useMemo(() => GENERATIONS.find(g => g.id === selectedGeneration), [selectedGeneration]);

  const { pokemon, isLoading, isLoadingMore, error, loadMore, reset } = useInfiniteScroll(
    selectedTypes,
    activeGenObj ? activeGenObj.range : null,
    sortMode,
    sortOrder
  );

  useEffect(() => {
    if (showFavorites) return; // Si estamos en modo favoritos, no hacer búsqueda normal
    if (!debouncedQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const isNumber = /^\d+$/.test(debouncedQuery.trim());
    setIsSearching(true);

    (async () => {
      try {
        if (isNumber) {
          const result = await fetchPokemon(debouncedQuery.trim().toLowerCase());
          setSearchResults([result]);
        } else {
          if (debouncedQuery.trim().length < 2) {
            setSearchResults(null);
            return;
          }
          const allNames = await fetchAllPokemonNames(); // Esto se saca de IndexedDB (caché local)
          const query = debouncedQuery.trim().toLowerCase();
          
          let matches = allNames.filter(p => p.name.includes(query));
          const exactMatch = matches.find(p => p.name === query);
          if (exactMatch) {
            matches = [exactMatch, ...matches.filter(p => p.name !== query)];
          }
          
          const topMatches = matches.slice(0, 20);
          const detailed = await Promise.allSettled(topMatches.map(m => fetchPokemon(m.name)));
          
          setSearchResults(
            detailed
              .filter((r): r is PromiseFulfilledResult<Pokemon> => r.status === 'fulfilled')
              .map(r => r.value)
          );
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    })();
  }, [debouncedQuery, showFavorites]);

  // Efecto para cargar y mostrar favoritos
  useEffect(() => {
    if (showFavorites) {
      setIsSearching(true);
      Promise.allSettled(favorites.map(id => fetchPokemon(id.toString())))
        .then(results => {
          setSearchResults(
            results.filter((r): r is PromiseFulfilledResult<Pokemon> => r.status === 'fulfilled')
              .map(r => r.value)
          );
        })
        .finally(() => setIsSearching(false));
    }
  }, [showFavorites, favorites]);

  useEffect(() => {
    if (!sentinelRef.current || searchResults !== null) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && !isLoadingMore && !isLoading) loadMore(); },
      { threshold: 0.1, rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, isLoadingMore, isLoading, searchResults]);

  const displayedPokemon = useMemo(() => {
    if (searchResults) {
      const sorted = [...searchResults].sort((a, b) => {
        let comparison = 0;
        if (sortMode === 'id') {
          comparison = a.id - b.id;
        } else {
          comparison = a.name.localeCompare(b.name);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      return sorted;
    }
    return pokemon;
  }, [searchResults, pokemon, sortMode, sortOrder]);

  const handleTypeSelect = useCallback((type: string) => {
    if (type === '') {
      setSelectedTypes([]);
      setIsFilterOpen(false);
      setSearchQuery('');
      return;
    }
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      if (prev.length >= 2) return prev; // Solo permitimos hasta 2 tipos (los Pokémon no tienen más de 2)
      return [...prev, type];
    });
    setSearchQuery('');
  }, []);

  const toggleFavoritesMode = () => {
    if (!showFavorites) {
      setSearchQuery('');
      setSelectedTypes([]);
      setIsFilterOpen(false);
    } else {
      setSearchResults(null);
    }
    setShowFavorites(!showFavorites);
  };

  const handleRetry = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div className={`pokedex-device pokedex-device--${skin}`}>
      {/* Device Header */}
      <div className="pokedex-device__header">
        <div className="pokedex-device__lens-container">
          <div className="pokedex-device__lens">
            <div className="pokedex-device__lens-inner"></div>
            <div className="pokedex-device__lens-reflection"></div>
          </div>
          <div className="pokedex-device__leds">
            <div className="pokedex-device__led pokedex-device__led--red"></div>
            <div className="pokedex-device__led pokedex-device__led--yellow"></div>
            <div className="pokedex-device__led pokedex-device__led--green"></div>
          </div>
        </div>
      </div>

      <div className="pokedex-device__screen-wrapper">
        <div className="explore-view pokedex-device__screen">
          {/* Header */}
          <header className="explore-view__header">
        <div className="explore-view__hero">
          <h1 className="explore-view__title">{es.explore.title}</h1>
          <span className="explore-view__subtitle" aria-live="polite">
            {pokemon.length > 0 && !searchResults && `${pokemon.length} de muchos`}
          </span>
        </div>

        {/* Search */}
        <div className="explore-view__search-row">
          <div className="explore-view__search-wrapper">
            <span className="explore-view__search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              className="explore-view__search"
              type="search"
              placeholder={es.explore.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label={es.explore.searchPlaceholder}
              id="pokemon-search"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                className="explore-view__search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                type="button"
              >
                ×
              </button>
            )}
          </div>
          <button
            className={`explore-view__filter-btn${isFilterOpen ? ' explore-view__filter-btn--active' : ''}${selectedTypes.length > 0 ? ' explore-view__filter-btn--has-filter' : ''}`}
            onClick={() => setIsFilterOpen(o => !o)}
            aria-label="Abrir filtros"
            aria-expanded={isFilterOpen}
            type="button"
            id="filter-toggle-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
          <button
            className={`explore-view__filter-btn${showFavorites ? ' explore-view__filter-btn--active explore-view__filter-btn--has-filter' : ''}`}
            onClick={toggleFavoritesMode}
            aria-label="Mostrar favoritos"
            title="Mis Favoritos"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill={showFavorites ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>

        {/* Sort controls */}
        <div className="explore-view__controls">
          <span className="explore-view__controls-label">{es.explore.sortBy}:</span>
          <button
            className={`explore-view__sort-btn${sortMode === 'id' ? ' explore-view__sort-btn--active' : ''}`}
            onClick={() => setSortMode('id')}
            type="button"
            aria-pressed={sortMode === 'id'}
          >
            {es.explore.sortById}
          </button>
          <button
            className={`explore-view__sort-btn${sortMode === 'name' ? ' explore-view__sort-btn--active' : ''}`}
            onClick={() => setSortMode('name')}
            type="button"
            aria-pressed={sortMode === 'name'}
          >
            {es.explore.sortByName}
          </button>
          
          <button
            className="explore-view__sort-order-btn"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            type="button"
            aria-label={`Orden ${sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}`}
            title={`Orden ${sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </button>
        </div>

        {/* Filter panel */}
        {isFilterOpen && (
          <div className="explore-view__filter-panel">
            {/* Types */}
            <div className="explore-view__filter-group">
              <span className="explore-view__filter-label">Tipos:</span>
              <div className="explore-view__filter-options" role="group" aria-label="Filtrar por tipo">
                <button
                  className={`explore-view__type-all${selectedTypes.length === 0 ? ' explore-view__type-all--active' : ''}`}
                  onClick={() => handleTypeSelect('')}
                  type="button"
                >
                  {es.explore.allTypes}
                </button>
                {ALL_TYPES.map(type => (
                  <button
                    key={type}
                    className={`explore-view__type-filter${selectedTypes.includes(type) ? ' explore-view__type-filter--active' : ''}`}
                    onClick={() => handleTypeSelect(type)}
                    type="button"
                    aria-pressed={selectedTypes.includes(type)}
                  >
                    <TypeBadge type={type} size="sm" />
                  </button>
                ))}
              </div>
            </div>

            {/* Generations */}
            <div className="explore-view__filter-group">
              <span className="explore-view__filter-label">Generación:</span>
              <div className="explore-view__filter-options" role="group" aria-label="Filtrar por generación">
                <button
                  className={`explore-view__gen-filter${selectedGeneration === null ? ' explore-view__gen-filter--active' : ''}`}
                  onClick={() => setSelectedGeneration(null)}
                  type="button"
                >
                  Todas
                </button>
                {GENERATIONS.map(gen => (
                  <button
                    key={gen.id}
                    className={`explore-view__gen-filter${selectedGeneration === gen.id ? ' explore-view__gen-filter--active' : ''}`}
                    onClick={() => setSelectedGeneration(gen.id)}
                    type="button"
                    aria-pressed={selectedGeneration === gen.id}
                  >
                    Gen {gen.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Recently visited */}
      {history.length > 0 && !searchQuery && selectedTypes.length === 0 && selectedGeneration === null && (
        <section className="explore-view__history" aria-label={es.history.title}>
          <h2 className="explore-view__section-title">{es.history.title}</h2>
          <div className="explore-view__history-list">
            {history.slice(0, 8).map(h => (
              <button
                key={h.id}
                className="explore-view__history-chip"
                onClick={() => openDetail(h.name)}
                type="button"
              >
                #{String(h.id).padStart(4, '0')} {h.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Active filters display */}
      {(selectedTypes.length > 0 || selectedGeneration !== null) && (
        <div className="explore-view__active-filters">
          <span className="explore-view__active-filters-label">Filtros activos:</span>
          {selectedTypes.map(type => (
            <button
              key={type}
              className="explore-view__active-filter-chip"
              onClick={() => handleTypeSelect(type)}
              type="button"
              aria-label={`Eliminar filtro de tipo ${type}`}
            >
              <TypeBadge type={type} size="sm" />
              <span className="explore-view__active-filter-close">&times;</span>
            </button>
          ))}
          {selectedGeneration !== null && activeGenObj && (
            <button
              className="explore-view__active-filter-chip explore-view__active-filter-chip--gen"
              onClick={() => setSelectedGeneration(null)}
              type="button"
              aria-label={`Eliminar filtro de ${activeGenObj.name}`}
            >
              <span>{activeGenObj.name}</span>
              <span className="explore-view__active-filter-close">&times;</span>
            </button>
          )}
          <button
            className="explore-view__clear-filters"
            onClick={() => { handleTypeSelect(''); setSelectedGeneration(null); }}
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Content */}
      <main className="explore-view__content">
        {error && !isLoading && (
          <ErrorState
            title={es.errors.network}
            message={es.errors.networkHint}
            onRetry={handleRetry}
          />
        )}

        {isSearching && (
          <div className="explore-view__grid">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {searchResults !== null && !isSearching && searchResults.length === 0 && (
          <EmptyState
            icon="🔍"
            title={es.explore.noResults}
            message={es.explore.noResultsHint}
          />
        )}

        {!error && (
          <div className="explore-view__grid" role="list" aria-label="Lista de Pokémon">
            {isLoading && !pokemon.length
              ? Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)
              : displayedPokemon.map((p, i) => (
                  <div key={p.id} role="listitem">
                    <PokemonCard pokemon={p} index={i} />
                  </div>
                ))
            }
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {!searchResults && !error && (
          <div ref={sentinelRef} className="explore-view__sentinel" aria-hidden="true">
            {isLoadingMore && (
              <div className="explore-view__load-more-indicator">
                <div className="explore-view__spinner" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
    
    {skin === 'retro' && (
      <div className="pokedex-device__controls">
        <div className="pokedex-device__dpad">
          <div className="pokedex-device__dpad-v"></div>
          <div className="pokedex-device__dpad-h"></div>
          <div className="pokedex-device__dpad-center"></div>
        </div>
        <div className="pokedex-device__buttons">
          <div className="pokedex-device__btn"></div>
          <div className="pokedex-device__btn"></div>
        </div>
      </div>
    )}
    
    </div>
  </div>
  );
});

export default ExploreView;
