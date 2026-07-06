import { memo } from 'react';
import type { PokemonSpecies } from '@/types/pokemon';
import PokemonImage from '@/components/PokemonImage/PokemonImage';
import { usePokemonContext } from '@/contexts/PokemonContext';
import './FormsTab.css';

interface FormsTabProps {
  species: PokemonSpecies | null;
  currentName: string;
}

const FormsTab = memo(function FormsTab({ species, currentName }: FormsTabProps) {
  const { openDetail } = usePokemonContext();

  if (!species || species.varieties.length <= 1) {
    return (
      <div className="forms-tab forms-tab--empty">
        <p>Este Pokémon no tiene formas alternativas.</p>
      </div>
    );
  }

  return (
    <div className="forms-tab">
      <div className="forms-tab__grid">
        {species.varieties.map((variety) => {
          const formName = variety.pokemon.name;
          const isActive = formName === currentName;
          const id = parseInt(variety.pokemon.url.split('/').filter(Boolean).pop() || '0', 10);
          
          // Formateamos el nombre para que sea más legible ("pikachu-alola" -> "Alola")
          let displayName = formName;
          if (formName !== species.name) {
            displayName = formName.replace(`${species.name}-`, '').replace('-', ' ');
          } else {
            displayName = 'Normal';
          }

          return (
            <button
              key={formName}
              className={`forms-tab__btn ${isActive ? 'forms-tab__btn--active' : ''}`}
              onClick={() => {
                if (!isActive) openDetail(formName);
              }}
              type="button"
              title={formName}
            >
              <div className="forms-tab__img-container">
                <PokemonImage
                  id={id}
                  src={null}
                  alt={formName}
                  className="forms-tab__img"
                />
              </div>
              <span className="forms-tab__name">{displayName}</span>
              {variety.is_default && <span className="forms-tab__default-badge">Base</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default FormsTab;
