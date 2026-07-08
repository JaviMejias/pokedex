import { memo, useState, useEffect, useMemo } from 'react';
import type { Pokemon } from '@/types/pokemon';
import { useFavorites } from '@/contexts/FavoritesContext';
import { fetchPokemon } from '@/services/pokemonService';
import PokemonImage from '@/components/PokemonImage/PokemonImage';
import { calculateTypeMatchups } from '@/utils/typeMatchups';
import { PokemonPicker } from '../PokemonPicker/PokemonPicker';
import { EmptyState } from '@/components/StateComponents/StateComponents';

interface TeamAdvisorProps {
  onAnalyzeMatchup: (myPokemon: Pokemon, opponent: Pokemon) => void;
  teamOverride?: Pokemon[];
  initialOpponent?: Pokemon | null;
}

export const TeamAdvisor = memo(function TeamAdvisor({ onAnalyzeMatchup, teamOverride, initialOpponent }: TeamAdvisorProps) {
  const { team } = useFavorites();
  const [opponent, setOpponent] = useState<Pokemon | null>(initialOpponent || null);
  const [teamData, setTeamData] = useState<Pokemon[]>([]);

  useEffect(() => {
    if (initialOpponent) {
      setOpponent(initialOpponent);
    }
  }, [initialOpponent]);

  useEffect(() => {
    const validTeam = team.filter(Boolean);
    if (validTeam.length === 0) {
      setTeamData([]);
      return;
    }
    Promise.all(validTeam.map(m => fetchPokemon(m!.id)))
      .then(setTeamData)
      .catch(console.error);
  }, [team]);

  const currentTeamData = teamOverride || teamData;

  const recommendations = useMemo(() => {
    if (!opponent || currentTeamData.length === 0) return null;
    
    const opponentTypes = opponent.types.map(t => t.type.name);
    const oppMatchups = calculateTypeMatchups(opponentTypes); 

    const vanguard: Pokemon[] = [];
    const neutral: Pokemon[] = [];
    const danger: Pokemon[] = [];

    currentTeamData.forEach(p => {
      const pTypes = p.types.map(t => t.type.name);
      const pMatchups = calculateTypeMatchups(pTypes);

      const isWeakToOpponent = pMatchups.weak.some(t => opponentTypes.includes(t)) || 
                               pMatchups.superWeak.some(t => opponentTypes.includes(t));
      
      const isStrongAgainstOpponent = oppMatchups.weak.some(t => pTypes.includes(t)) || 
                                      oppMatchups.superWeak.some(t => pTypes.includes(t));

      if (isWeakToOpponent) {
        danger.push(p);
      } else if (isStrongAgainstOpponent) {
        vanguard.push(p);
      } else {
        neutral.push(p);
      }
    });

    return { vanguard, neutral, danger };
  }, [opponent, currentTeamData]);

  if (currentTeamData.length === 0 && !teamOverride) {
    return (
      <section className="team-advisor" aria-label="Analizador de Equipo">
        <h2 className="games-section-title">Analizador de Equipo</h2>
        <EmptyState 
          icon="🛡️" 
          title="Equipo vacío" 
          message="Agrega Pokémon a tu equipo para poder usar el Analizador." 
        />
      </section>
    );
  }

  return (
    <section className="team-advisor" aria-label="Analizador de Equipo">
      <h2 className="games-section-title">Analizador de Equipo</h2>
      <p className="games-section-subtitle">Elige un Pokémon rival para descubrir quién de tu equipo es la mejor opción para enfrentarlo.</p>

      <div className="team-advisor__picker">
        <PokemonPicker
          id="advisor-opponent"
          value={opponent}
          onSelect={setOpponent}
          onClear={() => setOpponent(null)}
          placeholder="Buscar Pokémon rival..."
        />
      </div>

      {opponent && recommendations && (
        <div className="team-advisor__results">
          
          <div className="team-advisor__group team-advisor__group--vanguard">
            <h3 className="team-advisor__group-title">
              <span className="team-advisor__group-icon">🟢</span> Recomendados (Vanguardia)
            </h3>
            <p className="team-advisor__group-desc">Tienen ventaja de tipo para atacar y no son débiles a los ataques del rival.</p>
            <div className="team-advisor__list">
              {recommendations.vanguard.length === 0 ? (
                <span className="team-advisor__empty">Ningún Pokémon recomendado.</span>
              ) : (
                recommendations.vanguard.map(p => (
                  <button key={p.id} className="team-advisor__pokemon" onClick={() => onAnalyzeMatchup(p, opponent!)}>
                    <PokemonImage src={p.sprites.front_default || ''} alt={p.name} id={p.id} />
                    <span className="team-advisor__pokemon-name pokemon-name">{p.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="team-advisor__group team-advisor__group--neutral">
            <h3 className="team-advisor__group-title">
              <span className="team-advisor__group-icon">🟡</span> Neutros
            </h3>
            <p className="team-advisor__group-desc">No destacan ni para bien ni para mal contra este rival.</p>
            <div className="team-advisor__list">
              {recommendations.neutral.length === 0 ? (
                <span className="team-advisor__empty">Ningún Pokémon neutro.</span>
              ) : (
                recommendations.neutral.map(p => (
                  <button key={p.id} className="team-advisor__pokemon" onClick={() => onAnalyzeMatchup(p, opponent!)}>
                    <PokemonImage src={p.sprites.front_default || ''} alt={p.name} id={p.id} />
                    <span className="team-advisor__pokemon-name pokemon-name">{p.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="team-advisor__group team-advisor__group--danger">
            <h3 className="team-advisor__group-title">
              <span className="team-advisor__group-icon">🔴</span> En Peligro
            </h3>
            <p className="team-advisor__group-desc">Son débiles a los tipos del rival. ¡Evita enviarlos al combate!</p>
            <div className="team-advisor__list">
              {recommendations.danger.length === 0 ? (
                <span className="team-advisor__empty">Tu equipo está a salvo.</span>
              ) : (
                recommendations.danger.map(p => (
                  <button key={p.id} className="team-advisor__pokemon" onClick={() => onAnalyzeMatchup(p, opponent!)}>
                    <PokemonImage src={p.sprites.front_default || ''} alt={p.name} id={p.id} />
                    <span className="team-advisor__pokemon-name pokemon-name">{p.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </section>
  );
});
