import { memo, useCallback } from 'react';
import type { Pokemon } from '@/types/pokemon';
import TypeBadge from '@/components/TypeBadge/TypeBadge';
import PokemonImage from '@/components/PokemonImage/PokemonImage';
import { useFavorites } from '@/contexts/FavoritesContext';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { formatPokemonId, getOfficialArtwork } from '@/utils/formatters';
import './PokemonCard.css';

interface PokemonCardProps {
  pokemon: Pokemon;
  index?: number;
}

const PokemonCard = memo(function PokemonCard({ pokemon, index = 0 }: PokemonCardProps) {
  const { openDetail } = usePokemonContext();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pokemon.id);

  const artworkSrc =
    pokemon.sprites.other['official-artwork'].front_default ??
    getOfficialArtwork(pokemon.id);

  const handleClick = useCallback(() => {
    openDetail(pokemon.name);
  }, [openDetail, pokemon.name]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(pokemon.id, pokemon.name);
  }, [toggleFavorite, pokemon.id, pokemon.name]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetail(pokemon.name);
    }
  }, [openDetail, pokemon.name]);

  const primaryType = pokemon.types[0]?.type.name ?? 'normal';

  return (
    <article
      className="pokemon-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalles de ${pokemon.name} #${pokemon.id}`}
      style={{ '--card-delay': `${(index % 20) * 30}ms`, '--primary-type': `var(--type-${primaryType}, #888)` } as React.CSSProperties}
    >
      <div className="pokemon-card__bg-pokeball" aria-hidden="true" />

      <button
        className={`pokemon-card__favorite${favorite ? ' pokemon-card__favorite--active' : ''}`}
        onClick={handleFavoriteClick}
        aria-label={favorite ? `Quitar ${pokemon.name} de favoritos` : `Agregar ${pokemon.name} a favoritos`}
        type="button"
      >
        {favorite ? '★' : '☆'}
      </button>

      <div className="pokemon-card__image-wrapper">
        <PokemonImage
          src={artworkSrc}
          alt={pokemon.name}
          id={pokemon.id}
          className="pokemon-card__image"
        />
      </div>

      <div className="pokemon-card__info">
        <span className="pokemon-card__id pokemon-id">{formatPokemonId(pokemon.id)}</span>
        <h2 className="pokemon-card__name pokemon-name">{pokemon.name}</h2>
        <div className="pokemon-card__types">
          {pokemon.types.map(t => (
            <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
          ))}
        </div>
      </div>
    </article>
  );
});

export default PokemonCard;
