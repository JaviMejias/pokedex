import { memo, useMemo } from 'react';
import type { Pokemon } from '@/types/pokemon';
import TypeBadge from '@/components/TypeBadge/TypeBadge';
import { calculateTypeMatchups } from '@/utils/typeMatchups';
import es from '@/i18n/es';
import './CombatTab.css';

interface CombatTabProps {
  pokemon: Pokemon;
}

interface MatchupGroupProps {
  title: string;
  types: string[];
  emptyMessage: string;
  variant: 'weak' | 'super-weak' | 'resistant' | 'super-resistant' | 'immune';
}

const MatchupGroup = memo(function MatchupGroup({ title, types, emptyMessage, variant }: MatchupGroupProps) {
  return (
    <div className={`combat-tab__group combat-tab__group--${variant}`}>
      <h3 className="combat-tab__group-title">{title}</h3>
      {types.length === 0 ? (
        <p className="combat-tab__empty">{emptyMessage}</p>
      ) : (
        <div className="combat-tab__type-list">
          {types.map(type => (
            <TypeBadge key={type} type={type} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
});

const CombatTab = memo(function CombatTab({ pokemon }: CombatTabProps) {
  const typeNames = useMemo(
    () => pokemon.types.map(t => t.type.name),
    [pokemon.types]
  );

  const matchups = useMemo(
    () => calculateTypeMatchups(typeNames),
    [typeNames]
  );

  return (
    <div className="combat-tab" aria-label="Matchups de combate">
      <MatchupGroup
        title={es.detail.combat.strongAgainst}
        types={matchups.strongAgainst}
        emptyMessage={es.detail.combat.noStrengths}
        variant="weak"
      />
      <MatchupGroup
        title={es.detail.combat.superWeak}
        types={matchups.superWeak}
        emptyMessage=""
        variant="super-weak"
      />
      <MatchupGroup
        title={es.detail.combat.weak}
        types={matchups.weak}
        emptyMessage={es.detail.combat.noWeaknesses}
        variant="weak"
      />
      <MatchupGroup
        title={es.detail.combat.resistant}
        types={matchups.resistant}
        emptyMessage={es.detail.combat.noResistances}
        variant="resistant"
      />
      <MatchupGroup
        title={es.detail.combat.superResistant}
        types={matchups.superResistant}
        emptyMessage=""
        variant="super-resistant"
      />
      <MatchupGroup
        title={es.detail.combat.immune}
        types={matchups.immune}
        emptyMessage={es.detail.combat.noImmunities}
        variant="immune"
      />
    </div>
  );
});

export default CombatTab;
