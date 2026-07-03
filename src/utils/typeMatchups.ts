import { PokemonTypeData, TypeMatchup } from '@/types/pokemon';

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export function calculateTypeMatchups(types: string[]): TypeMatchup {
  const multipliers: Record<string, number> = {};

  for (const attackingType of Object.keys(TYPE_CHART)) {
    let multiplier = 1;
    for (const defendingType of types) {
      const row = TYPE_CHART[attackingType] ?? {};
      multiplier *= row[defendingType] ?? 1;
    }
    if (multiplier !== 1) {
      multipliers[attackingType] = multiplier;
    }
  }

  const result: TypeMatchup = {
    immune: [],
    resistant: [],
    superResistant: [],
    weak: [],
    superWeak: [],
    strongAgainst: [],
  };

  const strongSet = new Set<string>();
  for (const stab of types) {
    const row = TYPE_CHART[stab];
    if (row) {
      for (const [defendingType, mult] of Object.entries(row)) {
        if (mult === 2) strongSet.add(defendingType);
      }
    }
  }
  result.strongAgainst = Array.from(strongSet);

  for (const [type, mult] of Object.entries(multipliers)) {
    if (mult === 0) result.immune.push(type);
    else if (mult === 0.25) result.superResistant.push(type);
    else if (mult === 0.5) result.resistant.push(type);
    else if (mult === 2) result.weak.push(type);
    else if (mult === 4) result.superWeak.push(type);
  }

  return result;
}

export function calculateMatchupsFromTypeData(typeDataList: PokemonTypeData[]): TypeMatchup {
  const typeNames = typeDataList.map(t => t.name);
  return calculateTypeMatchups(typeNames);
}

export function calculateMatchupVs(attackerTypes: string[], defenderTypes: string[]): Array<{ attackType: string; multiplier: number }> {
  return attackerTypes.map(atkType => {
    let multiplier = 1;
    for (const defType of defenderTypes) {
      const row = TYPE_CHART[atkType] ?? {};
      multiplier *= row[defType] ?? 1;
    }
    return { attackType: atkType, multiplier };
  });
}
