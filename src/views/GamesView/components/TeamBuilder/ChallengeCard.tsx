import { memo, useState, useEffect } from 'react';
import TypeBadge from '@/components/TypeBadge/TypeBadge';
import { fetchPokemon } from '@/services/pokemonService';
import { getOfficialArtwork } from '@/utils/formatters';
import type { PokemonTypeName } from '@/types/pokemon';
import { ALL_TYPES } from '@/utils/dictionaries';
import './ChallengeCard.css';

interface ChallengeCardProps {
  challenge: {
    leader: string;
    specialty: string;
    acePokemon: string;
    difficulty: number;
    analysis: string;
  };
}

export const ChallengeCard = memo(function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [aceId, setAceId] = useState<number | null>(null);

  useEffect(() => {
    // Attempt to fetch the ID of the ace pokemon for its artwork
    let isMounted = true;
    if (challenge.acePokemon) {
      const sanitizedName = challenge.acePokemon.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
      fetchPokemon(sanitizedName)
        .then(pokemon => {
          if (isMounted) setAceId(pokemon.id);
        })
        .catch(() => {
          // Fallback if AI hallucinates a weird name
          if (isMounted) setAceId(null);
        });
    }
    return () => { isMounted = false; };
  }, [challenge.acePokemon]);

  // Clean up the specialty type to ensure it matches our badges
  const rawSpecialty = challenge.specialty?.toLowerCase().trim();
  const isValidType = ALL_TYPES.includes(rawSpecialty as PokemonTypeName);
  const displaySpecialty = isValidType ? rawSpecialty as PokemonTypeName : 'normal'; // fallback

  return (
    <div className={`challenge-card challenge-card--${displaySpecialty}`}>
      <div className="challenge-card__header">
        <div className="challenge-card__leader-info">
          <h4 className="challenge-card__leader-name">{challenge.leader}</h4>
          <div className="challenge-card__specialty">
            {isValidType ? (
              <TypeBadge type={displaySpecialty} />
            ) : (
              <span className="challenge-card__mixed-badge">
                {rawSpecialty || 'Mixto'}
              </span>
            )}
          </div>
        </div>
        
        <div className="challenge-card__difficulty" title={`Dificultad: ${challenge.difficulty}/5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg 
              key={i}
              className={`challenge-card__star ${i < challenge.difficulty ? 'challenge-card__star--active' : ''}`}
              width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      </div>

      <div className="challenge-card__body">
        <div className="challenge-card__ace-wrapper">
          {aceId ? (
            <img 
              src={getOfficialArtwork(aceId)} 
              alt={challenge.acePokemon}
              className="challenge-card__ace-sprite"
              loading="lazy"
            />
          ) : (
            <div className="challenge-card__ace-placeholder">?</div>
          )}
          <span className="challenge-card__ace-name">
            {challenge.acePokemon ? challenge.acePokemon.charAt(0).toUpperCase() + challenge.acePokemon.slice(1) : '???'}
          </span>
        </div>
        
        <div className="challenge-card__analysis">
          <p>{challenge.analysis}</p>
        </div>
      </div>
    </div>
  );
});
