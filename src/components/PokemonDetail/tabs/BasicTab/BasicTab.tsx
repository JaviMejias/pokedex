import { memo, useState, useEffect, useMemo } from 'react';
import type { Pokemon, PokemonSpecies } from '@/types/pokemon';
import { fetchPokemonSpecies, fetchAbilityTranslation } from '@/services/pokemonService';
import { formatHeight, formatWeight, capitalizeFirst, cleanFlavorText } from '@/utils/formatters';
import { GENERATION_NAMES, VERSION_NAMES } from '@/utils/dictionaries';
import es from '@/i18n/es';
import './BasicTab.css';

interface BasicTabProps {
  pokemon: Pokemon;
}

const BasicTab = memo(function BasicTab({ pokemon }: BasicTabProps) {
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [abilities, setAbilities] = useState<Array<{ name: string; isHidden: boolean }>>([]);

  useEffect(() => {
    Promise.all(pokemon.abilities.map(async (a) => ({
      name: capitalizeFirst(await fetchAbilityTranslation(a.ability.name)),
      isHidden: a.is_hidden,
    }))).then(setAbilities);
  }, [pokemon.abilities]);

  useEffect(() => {
    setIsLoading(true);
    fetchPokemonSpecies(pokemon.id).then(s => {
      setSpecies(s);
      const spanishEntries = s.flavor_text_entries.filter(e => e.language.name === 'es');
      if (spanishEntries.length > 0) {
        setSelectedVersion(spanishEntries[0].version.name);
      }
    }).catch(() => {
      // ignore — show without species
    }).finally(() => setIsLoading(false));
  }, [pokemon.id]);

  const spanishEntries = useMemo(
    () => species?.flavor_text_entries.filter(e => e.language.name === 'es') ?? [],
    [species]
  );

  const availableVersions = useMemo(() => {
    const seen = new Set<string>();
    return spanishEntries.filter(e => {
      if (seen.has(e.version.name)) return false;
      seen.add(e.version.name);
      return true;
    });
  }, [spanishEntries]);

  const currentFlavorText = useMemo(() => {
    const entry = spanishEntries.find(e => e.version.name === selectedVersion);
    return entry ? cleanFlavorText(entry.flavor_text) : '';
  }, [spanishEntries, selectedVersion]);

  const spanishGenus = species?.genera.find(g => g.language.name === 'es');
  const generation = species?.generation.name ?? '';

  return (
    <div className="basic-tab">
      {spanishEntries.length > 0 && (
        <div className="basic-tab__flavor">
          {availableVersions.length > 1 && (
            <div className="basic-tab__version-selector">
              <label htmlFor="version-select" className="basic-tab__label">
                {es.detail.gameVersion}
              </label>
              <select
                id="version-select"
                className="basic-tab__select"
                value={selectedVersion}
                onChange={e => setSelectedVersion(e.target.value)}
              >
                {availableVersions.map(v => (
                  <option key={v.version.name} value={v.version.name}>
                    {VERSION_NAMES[v.version.name] ?? capitalizeFirst(v.version.name)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <blockquote className="basic-tab__description">
            {currentFlavorText || es.detail.noDescription}
          </blockquote>
        </div>
      )}

      {isLoading && !species && (
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
