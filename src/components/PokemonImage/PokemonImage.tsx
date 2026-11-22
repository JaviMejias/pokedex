import { memo, useState, useCallback } from 'react';
import { getOfficialArtwork } from '@/utils/formatters';

interface PokemonImageProps {
  src: string | null;
  alt: string;
  id: number;
  className?: string;
}

const PokemonImageWithFallback = memo(function PokemonImageWithFallback({ src, alt, id, className }: PokemonImageProps) {
  const [imgSrc, setImgSrc] = useState(src ?? getOfficialArtwork(id));
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    const official = getOfficialArtwork(id);
    const standard = `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/${id}.png`;
    
    if (imgSrc !== official && imgSrc !== standard) {
      setImgSrc(official);
    } else if (imgSrc === official) {
      setImgSrc(standard);
    } else {
      setHasError(true);
    }
  }, [imgSrc, id]);

  if (hasError) {
    return (
      <div className={`pokemon-image pokemon-image--fallback ${className ?? ''}`} aria-label={alt}>
        <span>?</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`pokemon-image ${className ?? ''}`}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
});

const PokemonImage = memo(function PokemonImage(props: PokemonImageProps) {
  return <PokemonImageWithFallback key={`${props.id}:${props.src ?? 'default'}`} {...props} />;
});

export default PokemonImage;
