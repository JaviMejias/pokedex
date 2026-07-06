import { memo, useState, useMemo, useEffect } from 'react';
import type { Pokemon } from '@/types/pokemon';
import { fetchAbilityTranslation } from '@/services/pokemonService';
import TypeBadge from '@/components/TypeBadge/TypeBadge';
import { STAT_NAMES } from '@/utils/dictionaries';
import { calculateTypeMatchups } from '@/utils/typeMatchups';
import { PokemonPicker } from '../PokemonPicker/PokemonPicker';
import es from '@/i18n/es';

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

export const Comparator = memo(function Comparator({ left, setLeft, right, setRight }: ComparatorProps) {
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
                          <div className="comparator__bar comparator__bar--left">
                            <div className="comparator__bar-fill" style={{ width: `${Math.min(100, (leftStat / 255) * 100)}%` }} />
                          </div>
                        </div>
                        <div className="comparator__bar-wrapper comparator__bar-wrapper--right">
                          <div className="comparator__stat-meta">
                            <span className={`comparator__stat-value${rightWins ? ' comparator__stat-value--winner' : ''}`}>
                              {rightStat}
                              {rightWins && <span className="comparator__winner-icon">★</span>}
                            </span>
                            {right.sprites.front_default && <img src={right.sprites.front_default} alt="" className="comparator__stat-avatar" />}
                          </div>
                          <div className="comparator__bar comparator__bar--right">
                            <div className="comparator__bar-fill" style={{ width: `${Math.min(100, (rightStat / 255) * 100)}%` }} />
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
            <div className="comparator__abilities-grid">
              <div className="comparator__abilities-col">
                <h4 className="comparator__col-title">{left.name}</h4>
                {left.abilities.map(a => (
                  <TranslatedAbility key={a.ability.name} name={a.ability.name} isHidden={a.is_hidden} />
                ))}
              </div>
              <div className="comparator__abilities-divider" />
              <div className="comparator__abilities-col">
                <h4 className="comparator__col-title">{right.name}</h4>
                {right.abilities.map(a => (
                  <TranslatedAbility key={a.ability.name} name={a.ability.name} isHidden={a.is_hidden} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'matchups' && (
            <div className="comparator__matchups-grid">
              <div className="comparator__matchups-col">
                <h4 className="comparator__col-title">{left.name}</h4>
                <MatchupsList pokemon={left} />
              </div>
              <div className="comparator__matchups-divider" />
              <div className="comparator__matchups-col">
                <h4 className="comparator__col-title">{right.name}</h4>
                <MatchupsList pokemon={right} />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
});
