export function formatPokemonId(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}

export function formatHeight(heightDecimetres: number): string {
  const meters = heightDecimetres / 10;
  return `${meters.toFixed(1)} m`;
}

export function formatWeight(weightHectograms: number): string {
  const kg = weightHectograms / 10;
  return `${kg.toFixed(1)} kg`;
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

export function extractIdFromUrl(url: string): number {
  const parts = url.replace(/\/$/, '').split('/');
  return parseInt(parts[parts.length - 1], 10);
}

export function getOfficialArtwork(id: number): string {
  return `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function getAnimatedSprite(id: number): string {
  return `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;
}

export function getHomeSprite(id: number): string {
  return `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/home/${id}.png`;
}

export function cleanFlavorText(text: string): string {
  return text
    .replace(/\f/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\u00ad/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getStatPercentage(value: number, max = 255): number {
  return Math.min((value / max) * 100, 100);
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function generateTeamShareUrl(pokemonIds: number[]): string {
  const encoded = pokemonIds.join(',');
  const url = new URL(window.location.href);
  url.searchParams.set('team', encoded);
  url.hash = 'games';
  return url.toString();
}

export function parseTeamFromUrl(): number[] {
  const params = new URLSearchParams(window.location.search);
  const team = params.get('team');
  if (!team) return [];
  return team.split(',').map(Number).filter(n => !isNaN(n) && n > 0);
}
