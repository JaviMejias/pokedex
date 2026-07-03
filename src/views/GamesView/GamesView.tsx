import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import type { Pokemon } from '@/types/pokemon';
import { fetchPokemon, fetchAbilityTranslation } from '@/services/pokemonService';
import { useFavorites } from '@/contexts/FavoritesContext';
import { usePokemonContext } from '@/contexts/PokemonContext';
import PokemonImage from '@/components/PokemonImage/PokemonImage';
import StatBar from '@/components/StatBar/StatBar';
import TypeBadge from '@/components/TypeBadge/TypeBadge';
import { shareTeam } from '@/services/shareService';
import { formatPokemonId, getOfficialArtwork, generateTeamShareUrl } from '@/utils/formatters';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchAllPokemonNames } from '@/services/pokemonService';
import { TEAM_MAX_SIZE } from '@/constants';
import { STAT_NAMES } from '@/utils/dictionaries';
import { calculateTypeMatchups } from '@/utils/typeMatchups';

import es from '@/i18n/es';
import './GamesView.css';

/* ============================================================
   COMPARATOR
   ============================================================ */

interface PokemonPickerProps {
  value: Pokemon | null;
  onSelect: (p: Pokemon) => void;
  onClear: () => void;
  placeholder: string;
  id: string;
}

const PokemonPicker = memo(function PokemonPicker({ value, onSelect, onClear, placeholder, id }: PokemonPickerProps) {
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

type ComparatorTabId = 'stats' | 'abilities' | 'matchups';

const TranslatedAbility = memo(function TranslatedAbility({ name, isHidden }: { name: string, isHidden: boolean }) {
  const [esName, setEsName] = useState(name.replace('-', ' '));
  useEffect(() => {
    fetchAbilityTranslation(name).then(setEsName);
  }, [name]);
  
  return (
    <div className="comparator__ability">
      <span className="comparator__ability-name">{esName}</span>
      {isHidden && <span className="comparator__ability-hidden">(Oculta)</span>}
    </div>
  );
});

const MatchupsList = memo(function MatchupsList({ pokemon }: { pokemon: Pokemon }) {
  const matchups = useMemo(() => {
    return calculateTypeMatchups(pokemon.types.map(t => t.type.name));
  }, [pokemon]);

  return (
    <div className="comparator__matchups-simple">
      <div className="comparator__matchups-group">
        <h5 className="comparator__matchups-group-title">
          Súper Fuerte Contra <span className="comparator__matchups-multiplier">(Hace x2)</span>
        </h5>
        <div className="comparator__matchups-badges">
          {matchups.strongAgainst.length === 0 ? (
            <span className="comparator__matchups-empty">Ninguno</span>
          ) : (
            matchups.strongAgainst.map(t => <TypeBadge key={t} type={t} size="sm" />)
          )}
        </div>
      </div>
      <div className="comparator__matchups-group">
        <h5 className="comparator__matchups-group-title">
          Débil Contra <span className="comparator__matchups-multiplier">(Recibe x2 / x4)</span>
        </h5>
        <div className="comparator__matchups-badges">
          {[...matchups.superWeak, ...matchups.weak].length === 0 ? (
            <span className="comparator__matchups-empty">Ninguno</span>
          ) : (
            [...matchups.superWeak, ...matchups.weak].map(t => <TypeBadge key={t} type={t} size="sm" />)
          )}
        </div>
      </div>
    </div>
  );
});

interface ComparatorProps {
  left: Pokemon | null;
  setLeft: (p: Pokemon | null) => void;
  right: Pokemon | null;
  setRight: (p: Pokemon | null) => void;
}

const Comparator = memo(function Comparator({ left, setLeft, right, setRight }: ComparatorProps) {
  const [activeTab, setActiveTab] = useState<ComparatorTabId>('stats');

  const statNames = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

  return (
    <section className="comparator" aria-label="Comparador de Pokémon">
      <h2 className="games-section-title">{es.games.comparator.title}</h2>
      <p className="games-section-subtitle">{es.games.comparator.subtitle}</p>

      <div className="comparator__pickers">
        <PokemonPicker
          id="comparator-left"
          value={left}
          onSelect={setLeft}
          onClear={() => setLeft(null)}
          placeholder={es.games.comparator.selectFirst}
        />
        <div className="comparator__vs" aria-hidden="true">VS</div>
        <PokemonPicker
          id="comparator-right"
          value={right}
          onSelect={setRight}
          onClear={() => setRight(null)}
          placeholder={es.games.comparator.selectSecond}
        />
      </div>

      {left && right && (
        <div className="comparator__content">
          <div className="comparator__tabs">
            <button
              className={`comparator__tab ${activeTab === 'stats' ? 'comparator__tab--active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Estadísticas
            </button>
            <button
              className={`comparator__tab ${activeTab === 'abilities' ? 'comparator__tab--active' : ''}`}
              onClick={() => setActiveTab('abilities')}
            >
              Habilidades
            </button>
            <button
              className={`comparator__tab ${activeTab === 'matchups' ? 'comparator__tab--active' : ''}`}
              onClick={() => setActiveTab('matchups')}
            >
              Tipos & Cobertura
            </button>
          </div>

          {activeTab === 'stats' && (
            <div className="comparator__stats">
              {statNames.map(statName => {
                const leftStat = left.stats.find(s => s.stat.name === statName)?.base_stat ?? 0;
                const rightStat = right.stats.find(s => s.stat.name === statName)?.base_stat ?? 0;
                const leftWins = leftStat > rightStat;
                const rightWins = rightStat > leftStat;

                return (
                  <div key={statName} className="comparator__stat-row">
                    <div className="comparator__stat-center">
                      <span className="comparator__stat-name">{STAT_NAMES[statName] ?? statName}</span>
                      <div className="comparator__bars">
                        <div className="comparator__bar-wrapper">
                          <div className="comparator__stat-meta">
                            {left.sprites.front_default && <img src={left.sprites.front_default} alt="" className="comparator__stat-avatar" />}
                            <span className={`comparator__stat-value${leftWins ? ' comparator__stat-value--winner' : ''}`}>
                              {leftWins && <span className="comparator__winner-icon">★</span>}
                              {leftStat}
                            </span>
                          </div>
                          <div className="comparator__bar-left">
                            <StatBar statName={statName} value={leftStat} animated hideLabel />
                          </div>
                        </div>
                        <div className="comparator__bar-wrapper">
                          <div className="comparator__stat-meta">
                            {right.sprites.front_default && <img src={right.sprites.front_default} alt="" className="comparator__stat-avatar" />}
                            <span className={`comparator__stat-value${rightWins ? ' comparator__stat-value--winner' : ''}`}>
                              {rightWins && <span className="comparator__winner-icon">★</span>}
                              {rightStat}
                            </span>
                          </div>
                          <div className="comparator__bar-right">
                            <StatBar statName={statName} value={rightStat} animated hideLabel />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'abilities' && (
            <div className="comparator__abilities">
              <div className="comparator__abilities-col">
                <div className="comparator__section-header">
                  {left.sprites.front_default && <img src={left.sprites.front_default} alt="" className="comparator__section-avatar" />}
                  <h4 className="comparator__section-title">{left.name}</h4>
                </div>
                <div className="comparator__abilities-list">
                  {left.abilities.map(a => (
                    <TranslatedAbility key={a.ability.name} name={a.ability.name} isHidden={a.is_hidden} />
                  ))}
                </div>
              </div>
              <div className="comparator__abilities-col">
                <div className="comparator__section-header">
                  {right.sprites.front_default && <img src={right.sprites.front_default} alt="" className="comparator__section-avatar" />}
                  <h4 className="comparator__section-title">{right.name}</h4>
                </div>
                <div className="comparator__abilities-list">
                  {right.abilities.map(a => (
                    <TranslatedAbility key={a.ability.name} name={a.ability.name} isHidden={a.is_hidden} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matchups' && (
            <div className="comparator__abilities">
              <div className="comparator__abilities-col">
                <div className="comparator__section-header">
                  {left.sprites.front_default && <img src={left.sprites.front_default} alt="" className="comparator__section-avatar" />}
                  <h4 className="comparator__section-title">{left.name}</h4>
                </div>
                <MatchupsList pokemon={left} />
              </div>
              <div className="comparator__abilities-col">
                <div className="comparator__section-header">
                  {right.sprites.front_default && <img src={right.sprites.front_default} alt="" className="comparator__section-avatar" />}
                  <h4 className="comparator__section-title">{right.name}</h4>
                </div>
                <MatchupsList pokemon={right} />
              </div>
            </div>
          )}


        </div>
      )}
    </section>
  );
});

/* ============================================================
   TEAM BUILDER
   ============================================================ */

const TeamBuilder = memo(function TeamBuilder() {
  const { team, addToTeam, removeFromTeam, clearTeam } = useFavorites();
  const { openDetail } = usePokemonContext();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string }>>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setSearchResults([]); return; }
    fetchAllPokemonNames()
      .then(names => setSearchResults(names.filter(n => n.name.includes(debouncedQuery.toLowerCase())).slice(0, 6)))
      .catch(() => setSearchResults([]));
  }, [debouncedQuery]);

  const handleAddToTeam = useCallback(async (name: string) => {
    setIsSearchOpen(false);
    setQuery('');
    setSearchResults([]);
    try {
      const p = await fetchPokemon(name);
      addToTeam(p.id, p.name);
    } catch {
      // ignore
    }
  }, [addToTeam]);

  const handleShare = useCallback(async () => {
    if (team.length === 0) return;
    const url = generateTeamShareUrl(team.map(m => m.id));
    await shareTeam(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [team]);

  return (
    <section className="team-builder" aria-label="Constructor de equipo">
      <div className="team-builder__header">
        <div>
          <h2 className="games-section-title">{es.games.team.title}</h2>
          <p className="games-section-subtitle">{es.games.team.subtitle}</p>
        </div>
        <div className="team-builder__actions">
          {team.length > 0 && (
            <>
              <button className="team-builder__btn team-builder__btn--share" onClick={handleShare} type="button">
                {copied ? '✓ ' + es.games.team.copied : es.games.team.share}
              </button>
              <button className="team-builder__btn team-builder__btn--clear" onClick={clearTeam} type="button">
                {es.games.team.clear}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="team-builder__slots">
        {Array.from({ length: TEAM_MAX_SIZE }).map((_, i) => {
          const member = team[i];
          return (
            <div
              key={i}
              className={`team-builder__slot${member ? ' team-builder__slot--filled' : ''}`}
              aria-label={member ? member.name : es.games.team.empty}
            >
              {member ? (
                <>
                  <div 
                    className="team-builder__slot-link" 
                    onClick={() => openDetail(member.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && openDetail(member.id)}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    <img
                      src={getOfficialArtwork(member.id)}
                      alt={member.name}
                      className="team-builder__slot-image"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="team-builder__slot-name pokemon-name">{member.name}</span>
                  </div>
                  <button
                    className="team-builder__slot-remove"
                    onClick={() => removeFromTeam(member.id)}
                    type="button"
                    aria-label={`Quitar ${member.name} del equipo`}
                  >
                    ×
                  </button>
                </>
              ) : (
                <span className="team-builder__slot-empty" aria-hidden="true">+</span>
              )}
            </div>
          );
        })}
      </div>

      {team.length < TEAM_MAX_SIZE && (
        <div className="team-builder__add">
          <div className="team-builder__search-wrapper">
            <input
              className="team-builder__search"
              type="text"
              placeholder={es.games.team.searchPlaceholder}
              value={query}
              onChange={e => { setQuery(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 150)}
              id="team-search"
              autoComplete="off"
              aria-label={es.games.team.searchPlaceholder}
            />
            {isSearchOpen && searchResults.length > 0 && (
              <div className="team-builder__dropdown" role="listbox">
                {searchResults.map(r => (
                  <button
                    key={r.name}
                    className="team-builder__dropdown-item"
                    onClick={() => handleAddToTeam(r.name)}
                    type="button"
                    role="option"
                    aria-selected="false"
                    disabled={team.some(m => m.name === r.name)}
                  >
                    {r.name}
                    {team.some(m => m.name === r.name) && <span className="team-builder__in-team">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {team.length === TEAM_MAX_SIZE && (
        <p className="team-builder__full-msg" aria-live="polite">✓ {es.games.team.full}</p>
      )}
    </section>
  );
});

/* ============================================================
   TEAM ADVISOR
   ============================================================ */

interface TeamAdvisorProps {
  onAnalyzeMatchup: (myPokemon: Pokemon, opponent: Pokemon) => void;
}

const TeamAdvisor = memo(function TeamAdvisor({ onAnalyzeMatchup }: TeamAdvisorProps) {
  const { team } = useFavorites();
  const [opponent, setOpponent] = useState<Pokemon | null>(null);
  const [teamData, setTeamData] = useState<Pokemon[]>([]);

  useEffect(() => {
    if (team.length === 0) {
      setTeamData([]);
      return;
    }
    Promise.all(team.map(m => fetchPokemon(m.id)))
      .then(setTeamData)
      .catch(console.error);
  }, [team]);

  const recommendations = useMemo(() => {
    if (!opponent || teamData.length === 0) return null;
    
    const opponentTypes = opponent.types.map(t => t.type.name);
    const oppMatchups = calculateTypeMatchups(opponentTypes); 

    const vanguard: Pokemon[] = [];
    const neutral: Pokemon[] = [];
    const danger: Pokemon[] = [];

    teamData.forEach(p => {
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
  }, [opponent, teamData]);

  if (team.length === 0) return null;

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

/* ============================================================
   GAMES VIEW
   ============================================================ */

type GamesTab = 'team' | 'advisor' | 'comparator';

const GamesView = memo(function GamesView() {
  const [activeTab, setActiveTab] = useState<GamesTab>('team');
  const [comparatorLeft, setComparatorLeft] = useState<Pokemon | null>(null);
  const [comparatorRight, setComparatorRight] = useState<Pokemon | null>(null);

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
