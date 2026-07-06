import { memo, useState, useCallback, useEffect } from 'react';
import type { Pokemon } from '@/types/pokemon';
import { Comparator } from './components/Comparator/Comparator';
import { TeamBuilder } from './components/TeamBuilder/TeamBuilder';
import { TeamAdvisor } from './components/TeamAdvisor/TeamAdvisor';
import { useRotomContext } from '@/contexts/RotomContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import es from '@/i18n/es';
import './GamesView.css';

/* ============================================================
   GAMES VIEW
   ============================================================ */

type GamesTab = 'team' | 'advisor' | 'comparator';

const GamesView = memo(function GamesView() {
  const [activeTab, setActiveTab] = useState<GamesTab>('team');
  const [comparatorLeft, setComparatorLeft] = useState<Pokemon | null>(null);
  const [comparatorRight, setComparatorRight] = useState<Pokemon | null>(null);

  const { setContextMessage } = useRotomContext();
  const { team } = useFavorites();

  useEffect(() => {
    let msg = 'El usuario está en la vista de Juegos.';
    if (activeTab === 'team') {
      const teamNames = team.map(t => t.name).join(', ');
      msg = `El usuario está armando su equipo Pokémon. Actualmente tiene: ${teamNames || 'Ninguno'}.`;
    } else if (activeTab === 'advisor') {
      const teamNames = team.map(t => t.name).join(', ');
      msg = `El usuario está en el Analizador de Equipo, analizando debilidades de su equipo (${teamNames || 'Ninguno'}).`;
    } else if (activeTab === 'comparator') {
      msg = `El usuario está en el Comparador cara a cara. Está comparando a ${comparatorLeft?.name || 'Nadie'} contra ${comparatorRight?.name || 'Nadie'}.`;
    }
    setContextMessage(msg);
  }, [activeTab, team, comparatorLeft, comparatorRight, setContextMessage]);

  useEffect(() => {
    return () => setContextMessage('');
  }, [setContextMessage]);

  const handleAnalyzeMatchup = useCallback((myPokemon: Pokemon, opponent: Pokemon) => {
    setComparatorLeft(myPokemon);
    setComparatorRight(opponent);
    setActiveTab('comparator');
  }, []);

  return (
    <div className="games-view">
      <header className="games-view__header">
        <h1 className="games-view__title">{es.games.title}</h1>
        <div className="games-view__tabs">
          <button
            className={`games-view__tab ${activeTab === 'team' ? 'games-view__tab--active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Mi Equipo
          </button>
          <button
            className={`games-view__tab ${activeTab === 'advisor' ? 'games-view__tab--active' : ''}`}
            onClick={() => setActiveTab('advisor')}
          >
            Analizador
          </button>
          <button
            className={`games-view__tab ${activeTab === 'comparator' ? 'games-view__tab--active' : ''}`}
            onClick={() => setActiveTab('comparator')}
          >
            Comparador
          </button>
        </div>
      </header>

      <div className="games-view__content">
        {activeTab === 'team' && <TeamBuilder />}
        {activeTab === 'advisor' && <TeamAdvisor onAnalyzeMatchup={handleAnalyzeMatchup} />}
        {activeTab === 'comparator' && (
          <Comparator 
            left={comparatorLeft} 
            setLeft={setComparatorLeft} 
            right={comparatorRight} 
            setRight={setComparatorRight} 
          />
        )}
      </div>
    </div>
  );
});

export default GamesView;
