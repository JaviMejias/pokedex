import { memo, useState, useCallback, useEffect } from 'react';
import type { Pokemon } from '@/types/pokemon';
import { fetchPokemon, fetchAllPokemonNames } from '@/services/pokemonService';
import PokemonImage from '@/components/PokemonImage/PokemonImage';
import TypeBadge from '@/components/TypeBadge/TypeBadge';
import { formatPokemonId, getOfficialArtwork } from '@/utils/formatters';
import { useDebounce } from '@/hooks/useDebounce';

interface PokemonPickerProps {
  value: Pokemon | null;
  onSelect: (p: Pokemon) => void;
  onClear: () => void;
  placeholder: string;
  id: string;
}

export const PokemonPicker = memo(function PokemonPicker({ value, onSelect, onClear, placeholder, id }: PokemonPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setIsLoading(true);
    fetchAllPokemonNames()
      .then(names => {
        const filtered = names
          .filter(n => n.name.includes(debouncedQuery.toLowerCase()))
          .slice(0, 8);
        setResults(filtered);
      })
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  const handleSelect = useCallback(async (name: string) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    try {
      const p = await fetchPokemon(name);
      onSelect(p);
    } catch {
      // ignore
    }
  }, [onSelect]);

  if (value) {
    return (
      <div className="pokemon-picker pokemon-picker--selected">
        <div className="pokemon-picker__preview">
          <div className="pokemon-picker__image">
            <PokemonImage
              src={value.sprites.other['official-artwork'].front_default ?? getOfficialArtwork(value.id)}
              alt={value.name}
              id={value.id}
            />
          </div>
          <div className="pokemon-picker__info">
            <span className="pokemon-picker__id pokemon-id">{formatPokemonId(value.id)}</span>
            <span className="pokemon-picker__name pokemon-name">{value.name}</span>
            <div className="pokemon-picker__types">
              {value.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} size="sm" />)}
            </div>
          </div>
        </div>
        <button className="pokemon-picker__clear" onClick={onClear} type="button" aria-label="Quitar Pokémon">×</button>
      </div>
    );
  }

  return (
    <div className="pokemon-picker" id={id}>
      <input
        className="pokemon-picker__input"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        aria-label={placeholder}
        autoComplete="off"
      />
      {isOpen && (results.length > 0 || isLoading) && (
        <div className="pokemon-picker__dropdown" role="listbox">
          {isLoading && <div className="pokemon-picker__loading">Buscando...</div>}
          {results.map(r => (
            <button
              key={r.name}
              className="pokemon-picker__option"
              onClick={() => handleSelect(r.name)}
              type="button"
              role="option"
              aria-selected="false"
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
