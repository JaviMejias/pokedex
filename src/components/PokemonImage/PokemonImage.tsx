import { memo, useState, useCallback, useEffect } from 'react';
import { getOfficialArtwork } from '@/utils/formatters';

interface PokemonImageProps {
  src: string | null;
  alt: string;
  id: number;
  className?: string;
}

const PokemonImage = memo(function PokemonImage({ src, alt, id, className }: PokemonImageProps) {
  const [imgSrc, setImgSrc] = useState(src ?? getOfficialArtwork(id));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src ?? getOfficialArtwork(id));
    setHasError(false);
  }, [src, id]);

  const handleError = useCallback(() => {
    if (imgSrc !== getOfficialArtwork(id)) {
      setImgSrc(getOfficialArtwork(id));
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

export default PokemonImage;
