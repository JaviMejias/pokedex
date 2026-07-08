import { memo, useState, useEffect, useCallback } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useApiKey } from '@/hooks/useApiKey';
import { analyzeFullTeamAdventure } from '@/services/geminiService';
import { getOfficialArtwork } from '@/utils/formatters';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { ChallengeCard } from './ChallengeCard';

const CACHE_KEY_PREFIX = 'pokedex-pro:adventure-v3:';

type TabType = 'general' | 'gyms' | 'league' | 'individual';

const GAMES = [
  { id: 'kanto', name: 'Rojo Fuego / Verde Hoja', region: 'Kanto' },
  { id: 'johto', name: 'HeartGold / SoulSilver', region: 'Johto' },
  { id: 'hoenn', name: 'Rubí Omega / Zafiro Alfa', region: 'Hoenn' },
  { id: 'sinnoh', name: 'Platino', region: 'Sinnoh' },
  { id: 'hisui', name: 'Leyendas: Arceus', region: 'Hisui' },
  { id: 'teselia', name: 'Blanco / Negro', region: 'Teselia' },
  { id: 'kalos', name: 'X / Y', region: 'Kalos' },
  { id: 'alola', name: 'Sol / Luna', region: 'Alola' },
  { id: 'galar', name: 'Espada / Escudo', region: 'Galar' },
  { id: 'paldea', name: 'Escarlata / Púrpura', region: 'Paldea' }
];

export const TeamAdventureAnalyzer = memo(function TeamAdventureAnalyzer() {
  const { team } = useFavorites();
  const { apiKey } = useApiKey();
  const { openDetail } = usePokemonContext();
  
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const filledTeam = team.filter(Boolean);
  const teamSignature = filledTeam.map(p => p!.id).join(',');

  // Load cached analysis from localStorage based on current team
  const loadCache = useCallback((sig: string): Record<string, Record<string, any>> => {
    try {
      const raw = localStorage.getItem(CACHE_KEY_PREFIX + sig);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const [tabData, setTabData] = useState<Record<string, Record<string, any>>>(
    () => loadCache(filledTeam.map(p => p!.id).join(','))
  );

  // When team composition changes, swap to the new team's cache
  useEffect(() => {
    setTabData(loadCache(teamSignature));
  }, [teamSignature, loadCache]);

  const handleAnalyze = async (gameId: string, tab: TabType = 'general') => {
    setSelectedGame(gameId);
    setActiveTab(tab);
    
    if (filledTeam.length === 0) return; // empty-state handled in JSX
    
    // If we already have cached data for this combination, do not fetch again (unless it was an error)
    if (tabData[gameId] && !tabData[gameId].error) {
      return;
    }
    
    setIsAnalyzing(true);
    
    const teamNames = filledTeam.map(p => p!.name);
    const game = GAMES.find(g => g.id === gameId)?.name || gameId;
    
    const result = await analyzeFullTeamAdventure(apiKey, teamNames, game);
    
    setTabData(prev => {
      const next = {
        ...prev,
        [gameId]: result
      };
      // Persist to localStorage so it survives page reloads
      try {
        localStorage.setItem(CACHE_KEY_PREFIX + teamSignature, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
    
    setIsAnalyzing(false);
  };

  const gameData = selectedGame ? tabData[selectedGame] : null;
  const currentData = gameData && !gameData.error ? gameData[activeTab] : gameData;

  useEffect(() => {
    if (currentData?.retryAfter) {
      setCountdown(currentData.retryAfter);
    } else {
      setCountdown(null);
    }
  }, [currentData]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(c => (c !== null && c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="adventure-analyzer">
      <div className="adventure-analyzer__header">
        <h3 className="adventure-analyzer__title">Analizador de Aventura</h3>
        <p className="adventure-analyzer__subtitle">¿En qué región estás usando este equipo?</p>
      </div>

      <div className="adventure-analyzer__games">
        {GAMES.map((game) => (
          <button
            key={game.id}
            className={`adventure-analyzer__game-btn ${selectedGame === game.id ? 'adventure-analyzer__game-btn--active' : ''}`}
            onClick={() => handleAnalyze(game.id, 'general')}
            type="button"
            disabled={isAnalyzing}
          >
            <span className="adventure-analyzer__game-region">{game.region}</span>
            <span className="adventure-analyzer__game-name">{game.name}</span>
          </button>
        ))}
      </div>

      {selectedGame && (
        <div className="adventure-analyzer__tabs">
          {(['general', 'gyms', 'league', 'individual'] as TabType[]).map(tab => {
            const labels: Record<TabType, string> = {
              general: 'Sinergia General',
              gyms: 'Gimnasios',
              league: 'Alto Mando',
              individual: 'Desglose Individual'
            };
            const isCached = !!(selectedGame && tabData[selectedGame] && !tabData[selectedGame].error);
            return (
              <button
                key={tab}
                className={`adventure-analyzer__tab-btn ${activeTab === tab ? 'adventure-analyzer__tab-btn--active' : ''}`}
                onClick={() => setActiveTab(tab)}
                disabled={isAnalyzing}
              >
                {labels[tab]}
                {isCached && <span className="adventure-analyzer__tab-cached">&#10003;</span>}
              </button>
            );
          })}
        </div>
      )}

      {selectedGame && filledTeam.length === 0 && (
        <div className="adventure-analyzer__empty">
          <div className="adventure-analyzer__rotom-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          </div>
          <p>¡Zzzt! Tu equipo está vacío, compañero. ¡Añade Pokémon al equipo para que pueda analizar tu aventura en <strong>{GAMES.find(g => g.id === selectedGame)?.region}</strong>!</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="adventure-analyzer__loading">
          <div className="adventure-analyzer__loading-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
          </div>
          <span>¡Rotom Dex está escaneando tu equipo detalladamente!</span>
        </div>
      )}

      {currentData && !isAnalyzing && (
        <div className="adventure-analyzer__result-container">
          {currentData.isQuotaExceeded ? (
            <div className="adventure-analyzer__sleeping-state">
              <div className="adventure-analyzer__sleeping-rotom">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                <span className="adventure-analyzer__zzz">Zzz...</span>
              </div>
              <h4 className="adventure-analyzer__sleeping-title">Rotom Dex está agotado</h4>
              <p className="adventure-analyzer__sleeping-text">
                He consumido toda la energía analítica disponible por hoy procesando tantos datos a la vez. ¡Necesito descansar en mi PC hasta mañana! 
              </p>
              <p className="adventure-analyzer__sleeping-subtext">
                (Has alcanzado el límite diario gratuito de la API de Gemini. Vuelve a intentarlo mañana o usa otra Clave API en la configuración).
              </p>
            </div>
          ) : currentData.error ? (
            <div className="adventure-analyzer__error">
              <div className="adventure-analyzer__rotom-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              </div>
              <p>{currentData.error}</p>
              {selectedGame && (
                <button 
                  className="adventure-analyzer__retry-btn"
                  onClick={() => handleAnalyze(selectedGame, activeTab)}
                  title={countdown !== null && countdown > 0 ? `Espera ${countdown} segundos` : "Volver a intentar el análisis"}
                  disabled={countdown !== null && countdown > 0}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.3l5.08 5.08"></path></svg>
                  {countdown !== null && countdown > 0 ? `Reintentar en ${countdown}s` : 'Reintentar'}
                </button>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'general' && currentData.intro && (
                <div className="adventure-analyzer__stage-card">
                  <div className="adventure-analyzer__intro">
                    <div className="adventure-analyzer__rotom-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                    </div>
                    <p>{currentData.intro}</p>
                  </div>
                  <div className="adventure-analyzer__stage-section">
                    <h4>Juego Temprano (Early Game)</h4>
                    <p>{currentData.earlyGame}</p>
                  </div>
                  <div className="adventure-analyzer__stage-section">
                    <h4>Juego Medio (Mid Game)</h4>
                    <p>{currentData.midGame}</p>
                  </div>
                  <div className="adventure-analyzer__stage-section">
                    <h4>Juego Tardío (Late Game)</h4>
                    <p>{currentData.lateGame}</p>
                  </div>
                  <div className="adventure-analyzer__stage-rating">
                    Veredicto General: <strong>{currentData.rating}</strong>
                  </div>
                </div>
              )}

              {activeTab === 'gyms' && currentData.summary && (
                <div className="adventure-analyzer__stage-card">
                  <div className="adventure-analyzer__intro">
                    <div className="adventure-analyzer__rotom-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    <p>{currentData.summary}</p>
                  </div>
                  <div className="adventure-analyzer__challenges">
                    {currentData.challenges?.map((challenge: any, idx: number) => (
                      <ChallengeCard key={idx} challenge={challenge} />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'league' && currentData.summary && (
                <div className="adventure-analyzer__stage-card">
                  <div className="adventure-analyzer__intro">
                    <div className="adventure-analyzer__rotom-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                    </div>
                    <p>{currentData.summary}</p>
                  </div>
                  <div className="adventure-analyzer__challenges">
                    {currentData.challenges?.map((challenge: any, idx: number) => (
                      <ChallengeCard key={idx} challenge={challenge} />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'individual' && currentData.pokemon && (
                <div className="adventure-analyzer__pokemon-grid">
                  {currentData.pokemon.map((pkmn: any, index: number) => {
                    const teamMember = filledTeam.find(p => p!.name.toLowerCase() === pkmn.name.toLowerCase());
                    
                    return (
                      <div key={index} className="adventure-analyzer__pokemon-card">
                        {teamMember && (
                          <div
                            className="adventure-analyzer__pokemon-image adventure-analyzer__pokemon-image--clickable"
                            onClick={() => openDetail(teamMember.id)}
                            title={`Ver ficha de ${pkmn.name}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && openDetail(teamMember.id)}
                          >
                            <img src={getOfficialArtwork(teamMember.id)} alt={pkmn.name} loading="lazy" />
                          </div>
                        )}
                        <div className="adventure-analyzer__pokemon-info">
                          <h4
                            className="adventure-analyzer__pokemon-name adventure-analyzer__pokemon-name--clickable"
                            onClick={() => teamMember && openDetail(teamMember.id)}
                            title={teamMember ? `Ver ficha de ${pkmn.name}` : ''}
                          >
                            {pkmn.name}
                            {teamMember && (
                              <span className="adventure-analyzer__pokemon-link-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                              </span>
                            )}
                          </h4>
                          <div className="adventure-analyzer__pokemon-tags">
                            <span className="adventure-analyzer__tag" title="Pokédex Regional">Reg: {pkmn.regionalDex}</span>
                            <span className="adventure-analyzer__tag" title="Pokédex Nacional">Nat: {pkmn.nationalDex}</span>
                          </div>
                          <div className="adventure-analyzer__pokemon-details">
                            <p><strong>Evolución:</strong> {pkmn.evolution}</p>
                            <p><strong>Habilidad Ideal:</strong> {pkmn.bestAbilities}</p>
                          </div>
                          <div className="adventure-analyzer__pokemon-analysis">
                            <p>{pkmn.analysis}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});
