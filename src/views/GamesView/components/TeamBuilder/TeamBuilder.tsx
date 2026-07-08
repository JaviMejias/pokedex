import { memo, useState, useCallback, useEffect } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { fetchPokemon, fetchAllPokemonNames } from '@/services/pokemonService';
import { shareTeam } from '@/services/shareService';
import { getOfficialArtwork, generateTeamShareUrl } from '@/utils/formatters';
import { useDebounce } from '@/hooks/useDebounce';
import { TEAM_MAX_SIZE } from '@/constants';
import type { Pokemon } from '@/types/pokemon';
import TypeBadge from '@/components/TypeBadge/TypeBadge';
import es from '@/i18n/es';

const PremiumTeamSlot = memo(function PremiumTeamSlot({ member, openDetail }: { member: {id: number, name: string}, openDetail: (id: number) => void }) {
  const [data, setData] = useState<Pokemon | null>(null);

  useEffect(() => {
    fetchPokemon(member.id).then(setData).catch(() => {});
  }, [member.id]);

  const primaryType = data?.types[0]?.type.name || 'normal';
  const highestStat = data ? data.stats.reduce((prev, curr) => (prev.base_stat > curr.base_stat) ? prev : curr) : null;
  
  return (
    <div 
      className={`team-builder__slot-link team-builder__slot-link--premium type-${primaryType}`}
      onClick={() => openDetail(member.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && openDetail(member.id)}
      style={{ '--slot-type-color': `var(--color-type-${primaryType})` } as React.CSSProperties}
    >
      <div className="team-builder__slot-bg" />
      <img
        src={getOfficialArtwork(member.id)}
        alt={member.name}
        className="team-builder__slot-image premium-image"
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="team-builder__slot-content">
        <span className="team-builder__slot-name pokemon-name">{member.name}</span>
        {data && (
          <div className="team-builder__slot-types">
            {data.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} size="sm" />)}
          </div>
        )}
        {highestStat && (
          <div className="team-builder__slot-stat" title={`Destaca en: ${highestStat.stat.name}`}>
            ★ {highestStat.base_stat}
          </div>
        )}
      </div>
    </div>
  );
});

export const TeamBuilder = memo(function TeamBuilder() {
  const { team, addToTeam, removeFromTeam, clearTeam, swapInTeam } = useFavorites();
  const { openDetail } = usePokemonContext();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string }>>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | undefined>(undefined);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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
      addToTeam(p.id, p.name, p.species.name, activeSlotIndex);
      setActiveSlotIndex(undefined);
    } catch {
      // ignore
    }
  }, [addToTeam, activeSlotIndex]);

  const handleShare = useCallback(async () => {
    const validTeam = team.filter(Boolean);
    if (validTeam.length === 0) return;
    const url = generateTeamShareUrl(validTeam.map(m => m!.id));
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
          {team.filter(Boolean).length > 0 && (
            <>
              <button className="team-builder__btn team-builder__btn--share" onClick={handleShare} type="button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {copied ? '✓ ' + es.games.team.copied : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    {es.games.team.share}
                  </>
                )}
              </button>
              <button className="team-builder__btn team-builder__btn--clear" onClick={clearTeam} type="button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                {es.games.team.clear}
              </button>
            </>
          )}
        </div>
      </div>

      {team.filter(Boolean).length < TEAM_MAX_SIZE && (
        <div className="team-builder__add" style={{ marginBottom: '1.5rem' }}>
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
                    disabled={team.some(m => m?.name === r.name || (m?.speciesName && (r.name === m.speciesName || r.name.startsWith(m.speciesName + '-'))))}
                  >
                    {r.name}
                    {team.some(m => m?.name === r.name || (m?.speciesName && (r.name === m.speciesName || r.name.startsWith(m.speciesName + '-')))) && <span className="team-builder__in-team">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="team-builder__slots">
        {Array.from({ length: TEAM_MAX_SIZE }).map((_, i) => {
          const member = team[i];
          return (
            <div
              key={i}
              className={`team-builder__slot${member ? ' team-builder__slot--filled' : ''}${draggedIndex === i ? ' team-builder__slot--dragging' : ''}`}
              aria-label={member ? member.name : es.games.team.empty}
              onClick={() => {
                if (!member) {
                  setActiveSlotIndex(i);
                  document.getElementById('team-search')?.focus();
                }
              }}
              draggable={!!member}
              onDragStart={(e) => {
                if (member) {
                  setDraggedIndex(i);
                  e.dataTransfer.effectAllowed = 'move';
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sharedData = e.dataTransfer.getData('shared-pokemon');
                if (sharedData) {
                  try {
                    const p = JSON.parse(sharedData);
                    addToTeam(p.id, p.name, p.speciesName, i);
                  } catch {}
                } else if (draggedIndex !== null && draggedIndex !== i) {
                  swapInTeam(draggedIndex, i);
                }
                setDraggedIndex(null);
              }}
              onDragEnd={() => setDraggedIndex(null)}
              role={!member ? "button" : undefined}
              tabIndex={!member ? 0 : undefined}
              style={{ cursor: !member ? 'pointer' : 'default', borderColor: activeSlotIndex === i ? 'var(--color-brand-primary)' : undefined }}
            >
              {member ? (
                <>
                  <PremiumTeamSlot member={member} openDetail={openDetail} />
                  <button
                    className="team-builder__slot-remove"
                    onClick={(e) => { e.stopPropagation(); removeFromTeam(member.id); }}
                    type="button"
                    aria-label={`Quitar ${member.name} del equipo`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </>
              ) : (
                <span className="team-builder__slot-empty" aria-hidden="true">+</span>
              )}
            </div>
          );
        })}
      </div>

      {team.filter(Boolean).length === TEAM_MAX_SIZE && (
        <p className="team-builder__full-msg" aria-live="polite">✓ {es.games.team.full}</p>
      )}

    </section>
  );
});
