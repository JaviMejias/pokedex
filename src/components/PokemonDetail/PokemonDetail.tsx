import { memo, useState, useEffect, useCallback, useRef } from 'react';
import type { Pokemon } from '@/types/pokemon';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useTheme } from '@/contexts/ThemeContext';
import TypeBadge from '@/components/TypeBadge/TypeBadge';
import PokemonImage from '@/components/PokemonImage/PokemonImage';
import { fetchPokemonSpecies } from '@/services/pokemonService';
import type { PokemonSpecies } from '@/types/pokemon';
import BasicTab from './tabs/BasicTab/BasicTab';
import StatsTab from './tabs/StatsTab/StatsTab';
import CombatTab from './tabs/CombatTab/CombatTab';
import EvolutionsTab from './tabs/EvolutionsTab/EvolutionsTab';
import FormsTab from './tabs/FormsTab/FormsTab';
import { ErrorState, LoadingState } from '@/components/StateComponents/StateComponents';
import { sharePokemon } from '@/services/shareService';
import { formatPokemonId, getOfficialArtwork } from '@/utils/formatters';
import { TYPE_COLORS } from '@/constants';
import es from '@/i18n/es';
import './PokemonDetail.css';

type TabId = 'basic' | 'stats' | 'combat' | 'evolutions' | 'forms';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'basic', label: es.detail.tabs.basic },
  { id: 'stats', label: es.detail.tabs.stats },
  { id: 'combat', label: es.detail.tabs.combat },
  { id: 'evolutions', label: es.detail.tabs.evolutions },
  { id: 'forms', label: es.detail.tabs.forms },
];

function playCry(pokemon: Pokemon): void {
  try {
    const url = pokemon.cries?.latest;
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = 0.6;
    audio.play().catch(() => {/* ignore */});
  } catch {
    // ignore
  }
}

const PokemonDetail = memo(function PokemonDetail() {
  const { selectedPokemon, isDetailOpen, isDetailLoading, detailError, closeDetail } = usePokemonContext();
  const { isFavorite, toggleFavorite, isInTeam, addToTeam, removeFromTeam } = useFavorites();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShiny, setIsShiny] = useState(false);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedPokemon) {
      setIsShiny(false);
      const speciesId = parseInt(selectedPokemon.species.url.split('/').filter(Boolean).pop() || '0', 10);
      fetchPokemonSpecies(speciesId || selectedPokemon.id)
        .then(setSpecies)
        .catch(() => setSpecies(null));
    } else {
      setSpecies(null);
    }
  }, [selectedPokemon]);

  useEffect(() => {
    if (isDetailOpen) {
      setActiveTab('basic');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDetailOpen]);

  useEffect(() => {
    if (selectedPokemon && isDetailOpen) {
      playCry(selectedPokemon);
    }
  }, [selectedPokemon, isDetailOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDetailOpen) closeDetail();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailOpen, closeDetail]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeDetail();
  }, [closeDetail]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const handleShare = useCallback(async () => {
    if (!selectedPokemon) return;
    const success = await sharePokemon(selectedPokemon.name, selectedPokemon.id);
    if (success) {
      showToast('Enlace copiado');
    }
  }, [selectedPokemon, showToast]);

  const handleTeamToggle = useCallback(() => {
    if (!selectedPokemon) return;
    if (isInTeam(selectedPokemon.id, selectedPokemon.species.name)) {
      removeFromTeam(selectedPokemon.id);
      showToast('Eliminado del equipo');
    } else {
      addToTeam(selectedPokemon.id, selectedPokemon.name, selectedPokemon.species.name);
      showToast('Añadido al equipo');
    }
  }, [selectedPokemon, isInTeam, addToTeam, removeFromTeam, showToast]);

  const handleFavoriteToggle = useCallback(() => {
    if (!selectedPokemon) return;
    toggleFavorite(selectedPokemon.id, selectedPokemon.name);
    showToast(isFavorite(selectedPokemon.id) ? 'Eliminado de favoritos' : 'Añadido a favoritos');
  }, [selectedPokemon, toggleFavorite, isFavorite, showToast]);

  if (!isDetailOpen) return null;

  const primaryType = selectedPokemon?.types[0]?.type.name ?? 'normal';
  const primaryColor = TYPE_COLORS[primaryType] ?? '#888888';

  let mainImageSrc: string | null = null;
  if (selectedPokemon) {
    let rawOfficial = isShiny 
      ? selectedPokemon.sprites.other['official-artwork'].front_shiny 
      : selectedPokemon.sprites.other['official-artwork'].front_default;
      
    if (rawOfficial && typeof rawOfficial === 'string') {
      rawOfficial = rawOfficial.replace('raw.githubusercontent.com/PokeAPI/sprites/master', 'cdn.jsdelivr.net/gh/PokeAPI/sprites@master');
    }
    
    let rawFront = isShiny ? selectedPokemon.sprites.front_shiny : selectedPokemon.sprites.front_default;
    if (rawFront && typeof rawFront === 'string') {
      rawFront = rawFront.replace('raw.githubusercontent.com/PokeAPI/sprites/master', 'cdn.jsdelivr.net/gh/PokeAPI/sprites@master');
    }

    mainImageSrc = rawOfficial ?? rawFront ?? getOfficialArtwork(selectedPokemon.id);
  }

  return (
    <div
      className="pokemon-detail-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={selectedPokemon ? `Detalles de ${selectedPokemon.name}` : 'Cargando Pokémon'}
      aria-busy={isDetailLoading}
    >
      <div
        className="pokemon-detail"
        ref={modalRef}
        data-theme={theme}
        style={{ '--detail-color': primaryColor } as React.CSSProperties}
      >
        {/* Header */}
        <div className="pokemon-detail__header">
          <div
            className="pokemon-detail__header-bg"
            style={{ background: `radial-gradient(ellipse at 70% 0%, ${primaryColor}30 0%, transparent 70%)` }}
          />
          {toastMessage && (
            <div className="pokemon-detail__toast">
              {toastMessage}
            </div>
          )}

          <button
            ref={closeButtonRef}
            className="pokemon-detail__close"
            onClick={closeDetail}
            aria-label="Cerrar detalle"
            type="button"
            id="detail-close-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {selectedPokemon && !isDetailLoading && (
            <div className="pokemon-detail__actions">
              <button
                className={`pokemon-detail__action-btn${isFavorite(selectedPokemon.id) ? ' pokemon-detail__action-btn--active' : ''}`}
                onClick={handleFavoriteToggle}
                aria-label={isFavorite(selectedPokemon.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite(selectedPokemon.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
              <button
                className={`pokemon-detail__action-btn${isInTeam(selectedPokemon.id, selectedPokemon.species.name) ? ' pokemon-detail__action-btn--team' : ''}`}
                onClick={handleTeamToggle}
                aria-label={isInTeam(selectedPokemon.id, selectedPokemon.species.name) ? 'Quitar del equipo' : 'Agregar al equipo'}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isInTeam(selectedPokemon.id, selectedPokemon.species.name) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M2 12h7M15 12h7"/>
                </svg>
              </button>
              <button
                className="pokemon-detail__action-btn"
                onClick={handleShare}
                aria-label="Compartir Pokémon"
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pokemon-detail__scroll">
          {isDetailLoading && <LoadingState message="Cargando Pokémon..." />}

          {detailError && (
            <ErrorState
              title={es.errors.notFound}
              message={es.errors.notFoundHint}
              onRetry={closeDetail}
            />
          )}

          {selectedPokemon && !isDetailLoading && !detailError && (
            <>
              {/* Hero section */}
              <div className="pokemon-detail__hero">
                <div className="pokemon-detail__hero-content">
                  {species?.is_legendary && (
                    <span className="pokemon-detail__hero-badge pokemon-detail__hero-badge--legendary" title={es.detail.legendary}>⚡ {es.detail.legendary}</span>
                  )}
                  {species?.is_mythical && (
                    <span className="pokemon-detail__hero-badge pokemon-detail__hero-badge--mythical" title={es.detail.mythical}>✨ {es.detail.mythical}</span>
                  )}
                  <div className="pokemon-detail__image-wrapper">
                    <PokemonImage
                      src={mainImageSrc}
                      alt={selectedPokemon.name}
                      id={selectedPokemon.id}
                      className="pokemon-detail__image"
                    />
                  </div>
                  <button 
                    className={`pokemon-detail__shiny-btn ${isShiny ? 'pokemon-detail__shiny-btn--active' : ''}`}
                    onClick={() => setIsShiny(!isShiny)}
                    title="Alternar versión variocolor (Shiny)"
                    type="button"
                  >
                    ✨
                  </button>
                </div>
                <div className="pokemon-detail__identity">
                  <span className="pokemon-detail__id pokemon-id">{formatPokemonId(selectedPokemon.id)}</span>
                  <h1 className="pokemon-detail__name pokemon-name">{selectedPokemon.name}</h1>
                  <div className="pokemon-detail__types">
                    {selectedPokemon.types.map(t => (
                      <TypeBadge key={t.type.name} type={t.type.name} size="lg" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="pokemon-detail__tabs" role="tablist" aria-label="Información del Pokémon">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`tab-panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    className={`pokemon-detail__tab${activeTab === tab.id ? ' pokemon-detail__tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab panels */}
              <div
                className="pokemon-detail__tab-content"
                role="tabpanel"
                id={`tab-panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
              >
                {activeTab === 'basic' && <BasicTab pokemon={selectedPokemon} species={species} />}
                {activeTab === 'stats' && <StatsTab pokemon={selectedPokemon} />}
                {activeTab === 'combat' && <CombatTab pokemon={selectedPokemon} />}
                {activeTab === 'evolutions' && <EvolutionsTab pokemon={selectedPokemon} />}
                {activeTab === 'forms' && (
                  <FormsTab
                    species={species}
                    currentName={selectedPokemon.name}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
    </div>
  );
});

export default PokemonDetail;
