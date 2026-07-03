import { memo, useState, useEffect, useCallback } from 'react';
import type { Pokemon, ChainLink, EvolutionChain } from '@/types/pokemon';
import { fetchPokemonSpecies, fetchEvolutionChain, fetchPokemon, fetchItemTranslation } from '@/services/pokemonService';
import PokemonImage from '@/components/PokemonImage/PokemonImage';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { formatPokemonId, extractIdFromUrl, getOfficialArtwork } from '@/utils/formatters';
import { TRIGGER_NAMES } from '@/utils/dictionaries';
import { LoadingState } from '@/components/StateComponents/StateComponents';
import es from '@/i18n/es';
import './EvolutionsTab.css';

interface EvolutionNode {
  id: number;
  name: string;
  minLevel: number | null;
  trigger: string;
  item: string | null;
  sprite: string | null;
}

function flattenChain(chain: ChainLink, parent?: EvolutionNode): Array<{ from: EvolutionNode | null; to: EvolutionNode }> {
  const id = extractIdFromUrl(chain.species.url);
  const node: EvolutionNode = {
    id,
    name: chain.species.name,
    minLevel: chain.evolution_details[0]?.min_level ?? null,
    trigger: chain.evolution_details[0]?.trigger?.name ?? '',
    item: chain.evolution_details[0]?.item?.name ?? chain.evolution_details[0]?.held_item?.name ?? null,
    sprite: null,
  };

  const result: Array<{ from: EvolutionNode | null; to: EvolutionNode }> = [{ from: parent ?? null, to: node }];

  for (const child of chain.evolves_to) {
    result.push(...flattenChain(child, node));
  }

  return result;
}

interface EvolutionsTabProps {
  pokemon: Pokemon;
}

const EvolutionsTab = memo(function EvolutionsTab({ pokemon }: EvolutionsTabProps) {
  const { openDetail } = usePokemonContext();
  const [chain, setChain] = useState<EvolutionChain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sprites, setSprites] = useState<Record<number, string>>({});
  const [itemTranslations, setItemTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsLoading(true);
    fetchPokemonSpecies(pokemon.id)
      .then(species => fetchEvolutionChain(species.evolution_chain.url))
      .then(async (evo) => {
        setChain(evo);
        const nodes = flattenChain(evo.chain);
        const ids = [...new Set(nodes.map(n => n.to.id))];
        const spriteMap: Record<number, string> = {};
        
        const items = [...new Set(nodes.map(n => n.to.item).filter((i): i is string => i !== null))];
        const itemMap: Record<string, string> = {};

        await Promise.allSettled([
          ...ids.map(async (id) => {
            const p = await fetchPokemon(id);
            spriteMap[id] = p.sprites.other['official-artwork'].front_default ?? getOfficialArtwork(id);
          }),
          ...items.map(async (item) => {
            itemMap[item] = await fetchItemTranslation(item);
          })
        ]);

        setSprites(spriteMap);
        setItemTranslations(itemMap);
      })
      .catch(() => setChain(null))
      .finally(() => setIsLoading(false));
  }, [pokemon.id]);

  const handleNavigate = useCallback((name: string) => {
    openDetail(name);
  }, [openDetail]);

  if (isLoading) return <LoadingState message="Cargando evoluciones..." />;

  if (!chain) return (
    <div className="evolutions-tab evolutions-tab--empty">
      <p>{es.detail.evolutions.noEvolutions}</p>
    </div>
  );

  const nodes = flattenChain(chain.chain);
  const evolutions = nodes.filter(n => n.from !== null);

  if (evolutions.length === 0) {
    return (
      <div className="evolutions-tab evolutions-tab--empty">
        <p className="evolutions-tab__no-evo">{es.detail.evolutions.noEvolutions}</p>
      </div>
    );
  }

  const allNodes = [...new Map(nodes.map(n => [n.to.id, n.to])).values()];

  return (
    <div className="evolutions-tab">
      <div className="evolutions-tab__chain">
        {allNodes.map((node, idx) => {
          const evo = evolutions.find(e => e.to.id === node.id);
          const isCurrentPokemon = node.id === pokemon.id;

          return (
            <div key={node.id} className="evolutions-tab__stage">
              {idx > 0 && evo && (
                <div className="evolutions-tab__arrow">
                  <span className="evolutions-tab__arrow-icon" aria-hidden="true">→</span>
                  <div className="evolutions-tab__trigger">
                    {evo.to.minLevel && (
                      <span className="evolutions-tab__trigger-text">
                        {es.detail.evolutions.level} {evo.to.minLevel}
                      </span>
                    )}
                    {evo.to.trigger && !evo.to.minLevel && (
                      <span className="evolutions-tab__trigger-text">
                        {TRIGGER_NAMES[evo.to.trigger] ?? evo.to.trigger}
                      </span>
                    )}
                    {evo.to.item && (
                      <span className="evolutions-tab__trigger-item">
                        {itemTranslations[evo.to.item] 
                          ? itemTranslations[evo.to.item].replace(/-/g, ' ') 
                          : evo.to.item.replace(/-/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <button
                className={`evolutions-tab__pokemon${isCurrentPokemon ? ' evolutions-tab__pokemon--current' : ''}`}
                onClick={() => !isCurrentPokemon && handleNavigate(node.name)}
                disabled={isCurrentPokemon}
                type="button"
                aria-label={`Ver ${node.name}`}
              >
                <div className="evolutions-tab__sprite-wrapper">
                  <PokemonImage
                    src={sprites[node.id] ?? null}
                    alt={node.name}
                    id={node.id}
                    className="evolutions-tab__sprite"
                  />
                </div>
                <span className="evolutions-tab__name pokemon-name">{node.name}</span>
                <span className="evolutions-tab__id pokemon-id">{formatPokemonId(node.id)}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default EvolutionsTab;
