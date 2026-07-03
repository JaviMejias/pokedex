import { describe, it, expect } from 'vitest';
import {
  formatPokemonId,
  formatHeight,
  formatWeight,
  capitalizeFirst,
  extractIdFromUrl,
  cleanFlavorText,
  getStatPercentage,
} from '@/utils/formatters';

describe('formatPokemonId', () => {
  it('debe formatear id 1 como #0001', () => {
    expect(formatPokemonId(1)).toBe('#0001');
  });

  it('debe formatear id 25 como #0025', () => {
    expect(formatPokemonId(25)).toBe('#0025');
  });

  it('debe formatear id 1000 como #1000', () => {
    expect(formatPokemonId(1000)).toBe('#1000');
  });
});

describe('formatHeight', () => {
  it('debe convertir decímetros a metros', () => {
    expect(formatHeight(7)).toBe('0.7 m');
  });

  it('debe mostrar un decimal', () => {
    expect(formatHeight(40)).toBe('4.0 m');
  });
});

describe('formatWeight', () => {
  it('debe convertir hectogramos a kilogramos', () => {
    expect(formatWeight(60)).toBe('6.0 kg');
  });

  it('debe mostrar un decimal', () => {
    expect(formatWeight(905)).toBe('90.5 kg');
  });
});

describe('capitalizeFirst', () => {
  it('debe capitalizar la primera letra', () => {
    expect(capitalizeFirst('pikachu')).toBe('Pikachu');
  });

  it('debe reemplazar guiones con espacios', () => {
    expect(capitalizeFirst('mr-mime')).toBe('Mr mime');
  });
});

describe('extractIdFromUrl', () => {
  it('debe extraer el id de una URL de PokéAPI', () => {
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25);
  });

  it('debe funcionar sin slash final', () => {
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon-species/1')).toBe(1);
  });
});

describe('cleanFlavorText', () => {
  it('debe eliminar saltos de página', () => {
    expect(cleanFlavorText('Hola\fMundo')).toBe('Hola Mundo');
  });

  it('debe eliminar saltos de línea', () => {
    expect(cleanFlavorText('Hola\nMundo')).toBe('Hola Mundo');
  });

  it('debe eliminar espacios múltiples', () => {
    expect(cleanFlavorText('Hola   Mundo')).toBe('Hola Mundo');
  });
});

describe('getStatPercentage', () => {
  it('debe calcular correctamente 255/255 = 100%', () => {
    expect(getStatPercentage(255)).toBe(100);
  });

  it('debe calcular correctamente 128/255 ≈ 50.2%', () => {
    const result = getStatPercentage(128);
    expect(result).toBeGreaterThan(50);
    expect(result).toBeLessThan(51);
  });

  it('no debe superar 100% aunque el valor sea mayor', () => {
    expect(getStatPercentage(300)).toBe(100);
  });
});
