import { POKEAPI_BASE_URL, PAGE_SIZE } from '@/constants';
import { IDB_CONFIG } from '@/constants';
import { cacheService } from './cacheService';
import type {
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  PokemonTypeData,
  EvolutionChain,
} from '@/types/pokemon';

async function fetchWithTimeout<T>(url: string, timeoutMs = 10000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getCached<T>(store: string, key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = await cacheService.get<T>(store, key);
  if (cached) return cached;
  const data = await fetcher();
  await cacheService.set(store, key, data);
  return data;
}

export async function fetchPokemonList(offset: number, limit = PAGE_SIZE): Promise<PokemonListResponse> {
  const key = `list-species-${offset}-${limit}`;
  return getCached(IDB_CONFIG.STORES.POKEMON, key, () =>
    fetchWithTimeout<PokemonListResponse>(`${POKEAPI_BASE_URL}/pokemon-species?limit=${limit}&offset=${offset}`)
  );
}

export async function fetchPokemon(nameOrId: string | number): Promise<Pokemon> {
  const key = String(nameOrId).toLowerCase();
  return getCached(IDB_CONFIG.STORES.POKEMON, key, () =>
    fetchWithTimeout<Pokemon>(`${POKEAPI_BASE_URL}/pokemon/${key}`)
  );
}

export async function fetchPokemonSpecies(nameOrId: string | number): Promise<PokemonSpecies> {
  const key = String(nameOrId).toLowerCase();
  return getCached(IDB_CONFIG.STORES.SPECIES, key, () =>
    fetchWithTimeout<PokemonSpecies>(`${POKEAPI_BASE_URL}/pokemon-species/${key}`)
  );
}

export async function fetchTypeData(typeName: string): Promise<PokemonTypeData> {
  const key = typeName.toLowerCase();
  return getCached(IDB_CONFIG.STORES.TYPES, key, () =>
    fetchWithTimeout<PokemonTypeData>(`${POKEAPI_BASE_URL}/type/${key}`)
  );
}

export async function fetchEvolutionChain(url: string): Promise<EvolutionChain> {
  const id = url.replace(/\/$/, '').split('/').pop() ?? '';
  return getCached(IDB_CONFIG.STORES.EVOLUTIONS, id, () =>
    fetchWithTimeout<EvolutionChain>(url)
  );
}

export async function searchPokemonByName(query: string): Promise<Pokemon | null> {
  try {
    return await fetchPokemon(query.toLowerCase().trim());
  } catch {
    return null;
  }
}

export async function fetchAllPokemonNames(): Promise<Array<{ name: string; url: string }>> {
  const key = 'all-names-base';
  return getCached(IDB_CONFIG.STORES.POKEMON, key, () =>
    fetchWithTimeout<PokemonListResponse>(`${POKEAPI_BASE_URL}/pokemon?limit=10000&offset=0`)
      .then(r => r.results.filter(p => {
        const id = parseInt(p.url.replace(/\/$/, '').split('/').pop() || '0', 10);
        return id > 0 && id < 10000;
      }))
  );
}

export async function fetchAbilityTranslation(name: string): Promise<string> {
  const key = `ability-${name}`;
  try {
    const data = await getCached(IDB_CONFIG.STORES.TYPES, key, () =>
      fetchWithTimeout<any>(`${POKEAPI_BASE_URL}/ability/${name}`)
    );
    const esName = data.names.find((n: any) => n.language.name === 'es')?.name;
    return esName || name;
  } catch {
    return name;
  }
}

export async function fetchItemTranslation(name: string): Promise<string> {
  const key = `item-${name}`;
  try {
    const data = await getCached(IDB_CONFIG.STORES.TYPES, key, () =>
      fetchWithTimeout<any>(`${POKEAPI_BASE_URL}/item/${name}`)
    );
    const esName = data.names.find((n: any) => n.language.name === 'es')?.name;
    return esName || name;
  } catch {
    return name;
  }
}
