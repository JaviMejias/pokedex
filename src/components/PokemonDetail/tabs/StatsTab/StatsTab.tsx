import { memo, useMemo } from 'react';
import type { Pokemon } from '@/types/pokemon';
import StatBar from '@/components/StatBar/StatBar';
import { MAX_STAT } from '@/constants';
import es from '@/i18n/es';
import './StatsTab.css';

interface StatsTabProps {
  pokemon: Pokemon;
}

const StatsTab = memo(function StatsTab({ pokemon }: StatsTabProps) {
  const total = useMemo(
    () => pokemon.stats.reduce((acc, s) => acc + s.base_stat, 0),
    [pokemon.stats]
  );

  const totalPercentage = useMemo(
    () => Math.min((total / (MAX_STAT * pokemon.stats.length)) * 100, 100),
    [total, pokemon.stats.length]
  );

  return (
    <div className="stats-tab" aria-label="Estadísticas del Pokémon">
      <div className="stats-tab__bars">
        {pokemon.stats.map(s => (
          <StatBar
            key={s.stat.name}
            statName={s.stat.name}
            value={s.base_stat}
            max={MAX_STAT}
            animated
          />
        ))}
      </div>

      <div className="stats-tab__total">
        <div className="stats-tab__total-label">
          <span>{es.detail.stats.total}</span>
          <span className="stats-tab__total-value">{total}</span>
        </div>
        <div className="stats-tab__total-track">
          <div
            className="stats-tab__total-fill"
            style={{ '--total-width': `${totalPercentage}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
});

export default StatsTab;
