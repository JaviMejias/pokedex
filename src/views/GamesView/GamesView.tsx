import { memo, useState, useCallback, useEffect } from 'react';
import type { Pokemon } from '@/types/pokemon';
import { Comparator } from './components/Comparator/Comparator';
import { TeamBuilder } from './components/TeamBuilder/TeamBuilder';
import { TeamHistory } from './components/TeamBuilder/TeamHistory';
import { TeamAdventureAnalyzer } from './components/TeamBuilder/TeamAdventureAnalyzer';
import { TeamAdvisor } from './components/TeamAdvisor/TeamAdvisor';
import { useRotomContext } from '@/contexts/RotomContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { parseTeamFromUrl } from '@/utils/formatters';
import { fetchPokemon } from '@/services/pokemonService';
import es from '@/i18n/es';
import './GamesView.css';

/* ============================================================
   GAMES VIEW
   ============================================================ */

type GamesTab = 'team' | 'adventure' | 'history' | 'advisor' | 'comparator';

const GamesView = memo(function GamesView() {
  const [activeTab, setActiveTab] = useState<GamesTab>('team');
  const [comparatorLeft, setComparatorLeft] = useState<Pokemon | null>(null);
  const [comparatorRight, setComparatorRight] = useState<Pokemon | null>(null);

  const { setContextMessage } = useRotomContext();
  const { team, addToTeam, clearTeam } = useFavorites();
  
  const [sharedTeamData, setSharedTeamData] = useState<Pokemon[]>([]);
  const [analyzingSharedTeam, setAnalyzingSharedTeam] = useState(false);
  const [selectedSharedOpponent, setSelectedSharedOpponent] = useState<Pokemon | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const ids = parseTeamFromUrl();
    if (ids.length > 0) {
      Promise.all(ids.map(id => fetchPokemon(id)))
        .then(data => setSharedTeamData(data))
        .catch(console.error);
    }
  }, []);

  const clearSharedTeamUrl = useCallback(() => {
    setSharedTeamData([]);
    setAnalyzingSharedTeam(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('team');
    window.history.replaceState({}, '', url.toString());
  }, []);

  useEffect(() => {
    let msg = 'El usuario está en la vista de Juegos.';
    if (activeTab === 'team') {
      const teamNames = team.filter(Boolean).map(t => t!.name).join(', ');
      msg = `El usuario está armando su equipo Pokémon. Actualmente tiene: ${teamNames || 'Ninguno'}.`;
    } else if (activeTab === 'advisor') {
      const teamNames = team.filter(Boolean).map(t => t!.name).join(', ');
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
            className={`games-view__tab ${activeTab === 'adventure' ? 'games-view__tab--active' : ''}`}
            onClick={() => setActiveTab('adventure')}
          >
            Aventura
          </button>
          <button
            className={`games-view__tab ${activeTab === 'history' ? 'games-view__tab--active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Mis Equipos
          </button>
          <button
            className={`games-view__tab ${activeTab === 'advisor' ? 'games-view__tab--active' : ''}`}
            onClick={() => setActiveTab('advisor')}
          >
            Rotom Dex
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
        {sharedTeamData.length > 0 && activeTab !== 'comparator' && (
          <div className="shared-team-banner">
            <div className="shared-team-banner__header">
              <div className="shared-team-banner__titles">
                <h3 className="shared-team-banner__title">¡Alguien te ha compartido un equipo!</h3>
                {activeTab === 'advisor' && (
                  <p className="shared-team-banner__subtitle" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    💡 Toca una de las tarjetas para seleccionarlo como rival en el Analizador.
                  </p>
                )}
              </div>
              <button className="shared-team-banner__close" onClick={clearSharedTeamUrl} aria-label="Cerrar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="shared-team-banner__sprites">
              {sharedTeamData.map(p => {
                const inTeam = team.some(m => m?.speciesName === p.species.name || m?.name === p.name);
                return (
                  <div 
                    key={p.id} 
                    className="shared-team-banner__card shared-team-banner__card--interactive" 
                    title={`${p.name} - Arrástralo a tu equipo o haz clic para analizar`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('shared-pokemon', JSON.stringify({ id: p.id, name: p.name, speciesName: p.species.name }));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => {
                      setSelectedSharedOpponent(p);
                      setAnalyzingSharedTeam(false);
                      setActiveTab('advisor');
                    }}
                  >
                    <img src={p.sprites.front_default || ''} alt={p.name} className="shared-team-banner__sprite" />
                    <span className="shared-team-banner__name pokemon-name">{p.name}</span>
                    
                    <button
                      className={`shared-team-banner__add-btn ${inTeam ? 'shared-team-banner__add-btn--added' : ''}`}
                      title={inTeam ? 'Ya en tu equipo' : `Añadir ${p.name} a mi equipo`}
                      disabled={inTeam}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!inTeam) {
                          const success = addToTeam(p.id, p.name, p.species.name);
                          if (success) {
                            setContextMessage(`¡${p.name} ha sido añadido a tu equipo!`);
                          }
                        }
                      }}
                    >
                      {inTeam ? '✓' : '+'}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="shared-team-banner__actions">
            <button
              className="shared-team-banner__btn shared-team-banner__btn--import"
              onClick={() => setShowConfirmModal(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Importar Equipo
            </button>
            <button
              className="shared-team-banner__btn shared-team-banner__btn--analyze"
              onClick={() => {
                setAnalyzingSharedTeam(true);
                setSelectedSharedOpponent(null);
                setActiveTab('advisor');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Analizar
            </button>
          </div>
          </div>
        )}
        {activeTab === 'team' && <TeamBuilder />}
        {activeTab === 'adventure' && <TeamAdventureAnalyzer />}
        {activeTab === 'history' && <TeamHistory />}
        {activeTab === 'advisor' && (
          <TeamAdvisor 
            onAnalyzeMatchup={handleAnalyzeMatchup} 
            teamOverride={analyzingSharedTeam ? sharedTeamData : undefined} 
            initialOpponent={selectedSharedOpponent}
          />
        )}
        {activeTab === 'comparator' && (
          <Comparator 
            left={comparatorLeft} 
            setLeft={setComparatorLeft} 
            right={comparatorRight} 
            setRight={setComparatorRight} 
            sharedTeam={sharedTeamData}
          />
        )}
      </div>

      {showConfirmModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-modal__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="var(--color-brand-primary)" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                <circle cx="12" cy="12" r="3" stroke="var(--color-bg-base)"/>
                <path d="M12 6v2m0 8v2M6 12h2m8 0h2" stroke="var(--color-bg-base)"/>
              </svg>
            </div>
            <h3 className="confirm-modal__title">¡Bzzzt! ¿Sobrescribir equipo?</h3>
            <p className="confirm-modal__text">Al importar este equipo, los Pokémon que tienes actualmente serán reemplazados. ¿Estás seguro de que quieres continuar?</p>
            <div className="confirm-modal__actions">
              <button className="confirm-modal__btn confirm-modal__btn--cancel" onClick={() => setShowConfirmModal(false)}>Cancelar</button>
              <button className="confirm-modal__btn confirm-modal__btn--confirm" onClick={() => {
                clearTeam();
                sharedTeamData.forEach((p, index) => addToTeam(p.id, p.name, p.species.name, index));
                clearSharedTeamUrl();
                setShowConfirmModal(false);
              }}>¡Sí, importar!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default GamesView;
