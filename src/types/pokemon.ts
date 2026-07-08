export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

export interface PokemonType {
  slot: number;
  type: NamedAPIResource;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
}

export interface PokemonAbility {
  ability: NamedAPIResource;
  is_hidden: boolean;
  slot: number;
}

export interface PokemonMove {
  move: NamedAPIResource;
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  back_default: string | null;
  other: {
    'official-artwork': {
      front_default: string | null;
      front_shiny: string | null;
    };
    'home': {
      front_default: string | null;
    };
  };
  versions: {
    'generation-v': {
      'black-white': {
        animated: {
          front_default: string | null;
          front_shiny: string | null;
          back_default: string | null;
        };
      };
    };
  };
}

export interface PokemonCries {
  latest: string;
  legacy: string | null;
}

export interface Pokemon {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  is_default: boolean;
  order: number;
  types: PokemonType[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  moves: PokemonMove[];
  sprites: PokemonSprites;
  cries: PokemonCries;
  species: NamedAPIResource;
}

export interface FlavorTextEntry {
  flavor_text: string;
  language: NamedAPIResource;
  version: NamedAPIResource;
}

export interface Genus {
  genus: string;
  language: NamedAPIResource;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  order: number;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number;
  has_gender_differences: boolean;
  forms_switchable: boolean;
  growth_rate: NamedAPIResource;
  pokedex_numbers: Array<{ entry_number: number; pokedex: NamedAPIResource }>;
  egg_groups: NamedAPIResource[];
  color: NamedAPIResource;
  shape: NamedAPIResource;
  evolves_from_species: NamedAPIResource | null;
  evolution_chain: { url: string };
  habitat: NamedAPIResource | null;
  generation: NamedAPIResource;
  names: Array<{ name: string; language: NamedAPIResource }>;
  flavor_text_entries: FlavorTextEntry[];
  form_descriptions: Array<{ description: string; language: NamedAPIResource }>;
  genera: Genus[];
  varieties: Array<{ is_default: boolean; pokemon: NamedAPIResource }>;
}

export interface TypeDamageRelations {
  double_damage_from: NamedAPIResource[];
  double_damage_to: NamedAPIResource[];
  half_damage_from: NamedAPIResource[];
  half_damage_to: NamedAPIResource[];
  no_damage_from: NamedAPIResource[];
  no_damage_to: NamedAPIResource[];
}

export interface PokemonTypeData {
  id: number;
  name: string;
  damage_relations: TypeDamageRelations;
  pokemon: Array<{ slot: number; pokemon: NamedAPIResource }>;
}

export interface EvolutionDetail {
  min_level: number | null;
  trigger: NamedAPIResource;
  item: NamedAPIResource | null;
  held_item: NamedAPIResource | null;
  known_move: NamedAPIResource | null;
  known_move_type: NamedAPIResource | null;
  location: NamedAPIResource | null;
  min_affection: number | null;
  min_beauty: number | null;
  min_happiness: number | null;
  needs_overworld_rain: boolean;
  party_species: NamedAPIResource | null;
  party_type: NamedAPIResource | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: NamedAPIResource | null;
  turn_upside_down: boolean;
}

export interface ChainLink {
  is_baby: boolean;
  species: NamedAPIResource;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
}

export interface EvolutionChain {
  id: number;
  baby_trigger_item: NamedAPIResource | null;
  chain: ChainLink;
}

export interface FlatEvolution {
  name: string;
  id: number;
  minLevel: number | null;
  trigger: string;
  item: string | null;
}

export interface TypeMatchup {
  immune: string[];
  resistant: string[];
  superResistant: string[];
  weak: string[];
  superWeak: string[];
  strongAgainst: string[];
}

export type PokemonTypeName =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export interface TeamMember {
  id: number;
  name: string;
  speciesName?: string;
}

export type NavigationTab = 'explore' | 'scanner' | 'games';

export interface CachedEntry<T> {
  data: T;
  timestamp: number;
}
