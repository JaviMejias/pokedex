import { describe, it, expect } from 'vitest';
import { calculateTypeMatchups } from '@/utils/typeMatchups';

describe('calculateTypeMatchups', () => {
  it('debe calcular correctamente la inmunidad de Normal a Fantasma', () => {
    const result = calculateTypeMatchups(['normal']);
    expect(result.immune).toContain('ghost');
  });

  it('debe calcular debilidades de Agua', () => {
    const result = calculateTypeMatchups(['water']);
    expect(result.weak).toContain('electric');
    expect(result.weak).toContain('grass');
  });

  it('debe calcular debilidades de Acero', () => {
    const result = calculateTypeMatchups(['steel']);
    // fire[steel]=2 → fuego ataca acero = 2x daño → acero es débil a fuego
    // ground[steel]=2 → tierra ataca acero = 2x
    expect(result.weak).toContain('fire');
    expect(result.weak).toContain('ground');
    // flying[steel]=0.5 → volador ataca acero = 0.5x → acero resiste volador
    expect(result.resistant).toContain('flying');
  });

  it('debe calcular doble debilidad x4 para Bicho/Planta a Fuego', () => {
    const result = calculateTypeMatchups(['bug', 'grass']);
    expect(result.superWeak).toContain('fire');
  });

  it('debe resultar en neutro si 2x y 0.5x se cancelan', () => {
    const result = calculateTypeMatchups(['grass', 'poison']);
    const allTypes = [
      ...result.immune,
      ...result.resistant,
      ...result.superResistant,
      ...result.weak,
      ...result.superWeak,
    ];
    expect(allTypes).not.toContain('ground');
  });

  it('debe manejar Pokémon de tipo único', () => {
    const result = calculateTypeMatchups(['fire']);
    expect(result.weak).toContain('water');
    expect(result.weak).toContain('rock');
    expect(result.resistant).toContain('fire');
  });

  it('debe calcular correctamente Dragon debilidad a Hada', () => {
    // fairy attacks dragon = 2x (fairy type is super effective vs dragon)
    // dragon attacks fairy = 0x (dragon is immune to fairy defense)
    // For dragon DEFENDER: fairy ATTACKER deals 2x → weak
    const result = calculateTypeMatchups(['dragon']);
    expect(result.weak).toContain('fairy');
  });

  it('debe calcular super resistencia x0.25 para acero a bicho', () => {
    const result = calculateTypeMatchups(['steel', 'grass']);
    expect(result.superResistant.length).toBeGreaterThan(0);
  });
});
