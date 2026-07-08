import { memo, useState, useEffect, useMemo } from 'react';
import type { Pokemon, PokemonSpecies } from '@/types/pokemon';
import { fetchAbilityTranslation } from '@/services/pokemonService';
import { formatHeight, formatWeight, capitalizeFirst, cleanFlavorText } from '@/utils/formatters';
import { GENERATION_NAMES } from '@/utils/dictionaries';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import es from '@/i18n/es';
import './BasicTab.css';

interface BasicTabProps {
  pokemon: Pokemon;
  species: PokemonSpecies | null;
}

const BasicTab = memo(function BasicTab({ pokemon, species }: BasicTabProps) {
  const [abilities, setAbilities] = useState<Array<{ name: string; isHidden: boolean }>>([]);
  const { speak, stop, isSpeaking, isSupported } = useSpeechSynthesis();

  useEffect(() => {
    Promise.all(pokemon.abilities.map(async (a) => ({
      name: capitalizeFirst(await fetchAbilityTranslation(a.ability.name)),
      isHidden: a.is_hidden,
    }))).then(setAbilities);
  }, [pokemon.abilities]);



  const spanishEntries = useMemo(
    () => species?.flavor_text_entries.filter(e => e.language.name === 'es') ?? [],
    [species]
  );

  const currentFlavorText = useMemo(() => {
    return spanishEntries.length > 0 ? cleanFlavorText(spanishEntries[0].flavor_text) : '';
  }, [spanishEntries]);

  const spanishGenus = species?.genera.find(g => g.language.name === 'es');
  const generation = species?.generation.name ?? '';

  return (
    <div className="basic-tab">
      {spanishEntries.length > 0 && (
      <section className="basic-tab__description-section">
        <div className="basic-tab__description-header">
          <span className="basic-tab__version-label" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Descripción:
          </span>
          <div className="basic-tab__version-actions">
            {isSupported && currentFlavorText && (
              <button
                className={`basic-tab__voice-btn ${isSpeaking ? 'is-speaking' : ''}`}
                onClick={() => isSpeaking ? stop() : speak(currentFlavorText)}
                aria-label={isSpeaking ? 'Detener lectura' : 'Leer descripción'}
                title={isSpeaking ? 'Detener lectura' : 'Leer descripción'}
                type="button"
              >
                {isSpeaking ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="basic-tab__description-box">
          <p className="basic-tab__description-text">
            {currentFlavorText || es.detail.noDescription}
          </p>
        </div>
      </section>
      )}

      {!species && (
        <div className="basic-tab__skeleton-text" />
      )}

      <div className="basic-tab__grid">
        <div className="basic-tab__stat-item">
          <span className="basic-tab__stat-label">{es.detail.height}</span>
          <span className="basic-tab__stat-value">{formatHeight(pokemon.height)}</span>
        </div>
        <div className="basic-tab__stat-item">
          <span className="basic-tab__stat-label">{es.detail.weight}</span>
          <span className="basic-tab__stat-value">{formatWeight(pokemon.weight)}</span>
        </div>
        {spanishGenus && (
          <div className="basic-tab__stat-item">
            <span className="basic-tab__stat-label">{es.detail.category}</span>
            <span className="basic-tab__stat-value">{spanishGenus.genus}</span>
          </div>
        )}
        {generation && (
          <div className="basic-tab__stat-item">
            <span className="basic-tab__stat-label">{es.detail.generation}</span>
            <span className="basic-tab__stat-value">{GENERATION_NAMES[generation] ?? generation}</span>
          </div>
        )}
        {species && (
          <>
            <div className="basic-tab__stat-item">
              <span className="basic-tab__stat-label">{es.detail.captureRate}</span>
              <span className="basic-tab__stat-value">{species.capture_rate}</span>
            </div>
            <div className="basic-tab__stat-item">
              <span className="basic-tab__stat-label">{es.detail.baseHappiness}</span>
              <span className="basic-tab__stat-value">{species.base_happiness}</span>
            </div>
          </>
        )}
      </div>

      {abilities.length > 0 && (
        <div className="basic-tab__abilities">
          <h3 className="basic-tab__section-title">{es.detail.abilities}</h3>
          <div className="basic-tab__abilities-list">
            {abilities.map(a => (
              <span
                key={a.name}
                className={`basic-tab__ability${a.isHidden ? ' basic-tab__ability--hidden' : ''}`}
              >
                {a.name}
                {a.isHidden && <em className="basic-tab__hidden-label">{es.detail.hidden}</em>}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
});

export default BasicTab;
