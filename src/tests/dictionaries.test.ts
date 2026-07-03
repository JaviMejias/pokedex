import { describe, it, expect } from 'vitest';
import { TYPE_NAMES, STAT_NAMES, GENERATION_NAMES, VERSION_NAMES, ALL_TYPES } from '@/utils/dictionaries';

describe('TYPE_NAMES', () => {
  it('debe tener 18 tipos', () => {
    expect(Object.keys(TYPE_NAMES)).toHaveLength(18);
  });

  it('debe traducir fuego correctamente', () => {
    expect(TYPE_NAMES['fire']).toBe('Fuego');
  });

  it('debe traducir agua correctamente', () => {
    expect(TYPE_NAMES['water']).toBe('Agua');
  });

  it('ALL_TYPES debe tener 18 entradas', () => {
    expect(ALL_TYPES).toHaveLength(18);
  });

  it('todos los tipos en ALL_TYPES deben existir en TYPE_NAMES', () => {
    ALL_TYPES.forEach(type => {
      expect(TYPE_NAMES[type]).toBeDefined();
    });
  });
});

describe('STAT_NAMES', () => {
  it('debe traducir hp como PS', () => {
    expect(STAT_NAMES['hp']).toBe('PS');
  });

  it('debe traducir special-attack correctamente', () => {
    expect(STAT_NAMES['special-attack']).toBe('At. Esp.');
  });

  it('debe tener las 6 estadísticas principales', () => {
    const keys = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
    keys.forEach(k => expect(STAT_NAMES[k]).toBeDefined());
  });
});

describe('GENERATION_NAMES', () => {
  it('debe tener 9 generaciones', () => {
    expect(Object.keys(GENERATION_NAMES)).toHaveLength(9);
  });

  it('debe traducir generation-i correctamente', () => {
    expect(GENERATION_NAMES['generation-i']).toBe('Generación I');
  });
});

describe('VERSION_NAMES', () => {
  it('debe traducir red correctamente', () => {
    expect(VERSION_NAMES['red']).toBe('Rojo');
  });

  it('debe traducir scarlet correctamente', () => {
    expect(VERSION_NAMES['scarlet']).toBe('Escarlata');
  });
});
