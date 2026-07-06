export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
export const PAGE_SIZE = 20;
export const MAX_STAT = 255;
export const TEAM_MAX_SIZE = 6;
export const DEBOUNCE_MS = 300;
export const HISTORY_MAX_SIZE = 20;
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const STORAGE_KEYS = {
  FAVORITES: 'pokedex-pro:favorites',
  HISTORY: 'pokedex-pro:history',
  THEME: 'pokedex-pro:theme',
  AUDIO_MUTED: 'pokedex-pro:audio-muted',
  TEAM: 'pokedex-pro:team',
  SKIN: 'pokedex-pro:skin',
  YOUTUBE_URL: 'pokedex-pro:youtube-url',
} as const;

export const IDB_CONFIG = {
  DB_NAME: 'pokedex-pro-db',
  DB_VERSION: 1,
  STORES: {
    POKEMON: 'pokemon',
    SPECIES: 'species',
    TYPES: 'types',
    EVOLUTIONS: 'evolutions',
  },
} as const;

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

export const STAT_COLORS: Record<string, string> = {
  hp: '#FF5959',
  attack: '#F5AC78',
  defense: '#FAE078',
  'special-attack': '#9DB7F5',
  'special-defense': '#A7DB8D',
  speed: '#FA92B2',
};
