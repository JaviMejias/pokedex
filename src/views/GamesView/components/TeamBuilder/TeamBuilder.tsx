import { memo, useState, useCallback, useEffect } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { fetchPokemon, fetchAllPokemonNames } from '@/services/pokemonService';
import { shareTeam } from '@/services/shareService';
import { getOfficialArtwork, generateTeamShareUrl } from '@/utils/formatters';
import { useDebounce } from '@/hooks/useDebounce';
import { TEAM_MAX_SIZE } from '@/constants';
import es from '@/i18n/es';

export const TeamBuilder = memo(function TeamBuilder() {
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
