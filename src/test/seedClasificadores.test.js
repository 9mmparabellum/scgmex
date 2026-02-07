import { describe, it, expect } from 'vitest';
import {
  COG_DATA,
  FUNCIONAL_DATA,
  ECONOMICO_DATA,
  FUENTE_FINANCIAMIENTO_DATA,
  GEOGRAFICO_DATA,
  TIPO_GASTO_DATA,
  getClasificadorData,
} from '../utils/seedClasificadores';

// ===========================================================================
// COG_DATA - Clasificador por Objeto del Gasto
// ===========================================================================
describe('COG_DATA structure', () => {
  it('should contain all 9 chapters (1000-9000)', () => {
    const chapters = COG_DATA.filter((item) => item.nivel === 1);
    const chapterCodes = chapters.map((c) => c.codigo);
    expect(chapterCodes).toContain('1000');
    expect(chapterCodes).toContain('2000');
    expect(chapterCodes).toContain('3000');
    expect(chapterCodes).toContain('4000');
    expect(chapterCodes).toContain('5000');
    expect(chapterCodes).toContain('6000');
    expect(chapterCodes).toContain('7000');
    expect(chapterCodes).toContain('8000');
    expect(chapterCodes).toContain('9000');
    expect(chapters.length).toBe(9);
  });

  it('should have unique codes', () => {
    const codes = COG_DATA.map((item) => item.codigo);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should have valid parent references', () => {
    const allCodes = new Set(COG_DATA.map((item) => item.codigo));
    const itemsWithParents = COG_DATA.filter((item) => item.padre_codigo !== null);
    itemsWithParents.forEach((item) => {
      expect(allCodes.has(item.padre_codigo)).toBe(true);
    });
  });

  it('should have nivel 1 items with null padre_codigo', () => {
    const nivel1 = COG_DATA.filter((item) => item.nivel === 1);
    nivel1.forEach((item) => {
      expect(item.padre_codigo).toBeNull();
    });
  });

  it('should have nivel 2 items referencing nivel 1 parents', () => {
    const nivel1Codes = new Set(COG_DATA.filter((i) => i.nivel === 1).map((i) => i.codigo));
    const nivel2 = COG_DATA.filter((item) => item.nivel === 2);
    nivel2.forEach((item) => {
      expect(nivel1Codes.has(item.padre_codigo)).toBe(true);
    });
  });

  it('should have nivel 3 items referencing nivel 2 parents', () => {
    const nivel2Codes = new Set(COG_DATA.filter((i) => i.nivel === 2).map((i) => i.codigo));
    const nivel3 = COG_DATA.filter((item) => item.nivel === 3);
    nivel3.forEach((item) => {
      expect(nivel2Codes.has(item.padre_codigo)).toBe(true);
    });
  });

  it('should have at least 2 concept groups (nivel 2) per chapter', () => {
    const chapters = COG_DATA.filter((item) => item.nivel === 1);
    chapters.forEach((chapter) => {
      const concepts = COG_DATA.filter(
        (item) => item.nivel === 2 && item.padre_codigo === chapter.codigo
      );
      expect(concepts.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should have at least 1 specific concept (nivel 3) per group', () => {
    const groups = COG_DATA.filter((item) => item.nivel === 2);
    groups.forEach((group) => {
      const specifics = COG_DATA.filter(
        (item) => item.nivel === 3 && item.padre_codigo === group.codigo
      );
      expect(specifics.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should have at least 200 entries total', () => {
    expect(COG_DATA.length).toBeGreaterThanOrEqual(200);
  });

  it('should have all items with nombre and codigo strings', () => {
    COG_DATA.forEach((item) => {
      expect(typeof item.codigo).toBe('string');
      expect(typeof item.nombre).toBe('string');
      expect(item.nombre.length).toBeGreaterThan(0);
      expect(item.codigo.length).toBeGreaterThan(0);
    });
  });

  it('should have numeric nivel between 1 and 3', () => {
    COG_DATA.forEach((item) => {
      expect(item.nivel).toBeGreaterThanOrEqual(1);
      expect(item.nivel).toBeLessThanOrEqual(3);
    });
  });

  it('chapter 1000 should be Servicios Personales', () => {
    const ch = COG_DATA.find((i) => i.codigo === '1000');
    expect(ch.nombre).toBe('Servicios Personales');
  });

  it('chapter 2000 should be Materiales y Suministros', () => {
    const ch = COG_DATA.find((i) => i.codigo === '2000');
    expect(ch.nombre).toBe('Materiales y Suministros');
  });

  it('chapter 3000 should be Servicios Generales', () => {
    const ch = COG_DATA.find((i) => i.codigo === '3000');
    expect(ch.nombre).toBe('Servicios Generales');
  });

  it('chapter 9000 should be Deuda Publica', () => {
    const ch = COG_DATA.find((i) => i.codigo === '9000');
    expect(ch.nombre).toBe('Deuda Publica');
  });

  it('chapter codes should be 4-digit strings ending in 000', () => {
    const chapters = COG_DATA.filter((item) => item.nivel === 1);
    chapters.forEach((ch) => {
      expect(ch.codigo).toMatch(/^\d000$/);
    });
  });

  it('concept group codes should follow XX00 pattern', () => {
    const groups = COG_DATA.filter((item) => item.nivel === 2);
    groups.forEach((g) => {
      expect(g.codigo).toMatch(/^\d{2}00$/);
    });
  });

  it('specific concept codes should follow XXX0 pattern', () => {
    const specifics = COG_DATA.filter((item) => item.nivel === 3);
    specifics.forEach((s) => {
      expect(s.codigo).toMatch(/^\d{3}0$/);
    });
  });
});

// ===========================================================================
// FUNCIONAL_DATA - Clasificador Funcional
// ===========================================================================
describe('FUNCIONAL_DATA structure', () => {
  it('should contain 4 top-level functions', () => {
    const topLevel = FUNCIONAL_DATA.filter((item) => item.nivel === 1);
    expect(topLevel.length).toBe(4);
  });

  it('should have unique codes', () => {
    const codes = FUNCIONAL_DATA.map((item) => item.codigo);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should have valid parent references', () => {
    const allCodes = new Set(FUNCIONAL_DATA.map((item) => item.codigo));
    const withParents = FUNCIONAL_DATA.filter((item) => item.padre_codigo);
    withParents.forEach((item) => {
      expect(allCodes.has(item.padre_codigo)).toBe(true);
    });
  });

  it('function 1 should be Gobierno', () => {
    const f = FUNCIONAL_DATA.find((i) => i.codigo === '1');
    expect(f.nombre).toBe('Gobierno');
  });

  it('function 2 should be Desarrollo Social', () => {
    const f = FUNCIONAL_DATA.find((i) => i.codigo === '2');
    expect(f.nombre).toBe('Desarrollo Social');
  });

  it('function 3 should be Desarrollo Economico', () => {
    const f = FUNCIONAL_DATA.find((i) => i.codigo === '3');
    expect(f.nombre).toBe('Desarrollo Economico');
  });

  it('should have at least 2 subfunctions per function', () => {
    const topLevel = FUNCIONAL_DATA.filter((item) => item.nivel === 1);
    topLevel.forEach((fn) => {
      const subs = FUNCIONAL_DATA.filter((item) => item.padre_codigo === fn.codigo);
      expect(subs.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should have at least 30 entries total', () => {
    expect(FUNCIONAL_DATA.length).toBeGreaterThanOrEqual(30);
  });
});

// ===========================================================================
// ECONOMICO_DATA - Clasificador Economico
// ===========================================================================
describe('ECONOMICO_DATA structure', () => {
  it('should contain 5 economic categories', () => {
    expect(ECONOMICO_DATA.length).toBe(5);
  });

  it('should have unique codes', () => {
    const codes = ECONOMICO_DATA.map((item) => item.codigo);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should include Gasto Corriente as first category', () => {
    const first = ECONOMICO_DATA.find((i) => i.codigo === '1');
    expect(first.nombre).toBe('Gasto Corriente');
  });

  it('should include Gasto de Capital', () => {
    const item = ECONOMICO_DATA.find((i) => i.codigo === '2');
    expect(item.nombre).toBe('Gasto de Capital');
  });

  it('all items should be nivel 1', () => {
    ECONOMICO_DATA.forEach((item) => {
      expect(item.nivel).toBe(1);
    });
  });
});

// ===========================================================================
// FUENTE_FINANCIAMIENTO_DATA
// ===========================================================================
describe('FUENTE_FINANCIAMIENTO_DATA structure', () => {
  it('should contain 6 top-level sources', () => {
    const topLevel = FUENTE_FINANCIAMIENTO_DATA.filter((item) => item.nivel === 1);
    expect(topLevel.length).toBe(6);
  });

  it('should have unique codes', () => {
    const codes = FUENTE_FINANCIAMIENTO_DATA.map((item) => item.codigo);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should have valid parent references', () => {
    const allCodes = new Set(FUENTE_FINANCIAMIENTO_DATA.map((item) => item.codigo));
    const withParents = FUENTE_FINANCIAMIENTO_DATA.filter((item) => item.padre_codigo);
    withParents.forEach((item) => {
      expect(allCodes.has(item.padre_codigo)).toBe(true);
    });
  });

  it('should include Recursos Fiscales', () => {
    const item = FUENTE_FINANCIAMIENTO_DATA.find((i) => i.codigo === '1');
    expect(item.nombre).toBe('Recursos Fiscales');
  });

  it('should include Recursos Federales', () => {
    const item = FUENTE_FINANCIAMIENTO_DATA.find((i) => i.codigo === '5');
    expect(item.nombre).toBe('Recursos Federales');
  });

  it('should have sub-sources for Recursos Federales', () => {
    const subs = FUENTE_FINANCIAMIENTO_DATA.filter((item) => item.padre_codigo === '5');
    expect(subs.length).toBeGreaterThanOrEqual(2);
  });
});

// ===========================================================================
// GEOGRAFICO_DATA - 32 Entidades Federativas
// ===========================================================================
describe('GEOGRAFICO_DATA structure', () => {
  it('should contain all 32 states', () => {
    expect(GEOGRAFICO_DATA.length).toBe(32);
  });

  it('should have unique codes', () => {
    const codes = GEOGRAFICO_DATA.map((item) => item.codigo);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should have codes from 01 to 32', () => {
    const codes = GEOGRAFICO_DATA.map((item) => item.codigo).sort();
    expect(codes[0]).toBe('01');
    expect(codes[codes.length - 1]).toBe('32');
  });

  it('should include Aguascalientes as 01', () => {
    const item = GEOGRAFICO_DATA.find((i) => i.codigo === '01');
    expect(item.nombre).toBe('Aguascalientes');
  });

  it('should include Ciudad de Mexico as 09', () => {
    const item = GEOGRAFICO_DATA.find((i) => i.codigo === '09');
    expect(item.nombre).toBe('Ciudad de Mexico');
  });

  it('should include Zacatecas as 32', () => {
    const item = GEOGRAFICO_DATA.find((i) => i.codigo === '32');
    expect(item.nombre).toBe('Zacatecas');
  });

  it('all codes should be 2-digit strings', () => {
    GEOGRAFICO_DATA.forEach((item) => {
      expect(item.codigo).toMatch(/^\d{2}$/);
    });
  });

  it('all items should have a non-empty nombre', () => {
    GEOGRAFICO_DATA.forEach((item) => {
      expect(item.nombre.length).toBeGreaterThan(0);
    });
  });
});

// ===========================================================================
// TIPO_GASTO_DATA
// ===========================================================================
describe('TIPO_GASTO_DATA structure', () => {
  it('should have 3 top-level types', () => {
    const topLevel = TIPO_GASTO_DATA.filter((item) => item.nivel === 1);
    expect(topLevel.length).toBe(3);
  });

  it('should have unique codes', () => {
    const codes = TIPO_GASTO_DATA.map((item) => item.codigo);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should have valid parent references', () => {
    const allCodes = new Set(TIPO_GASTO_DATA.map((item) => item.codigo));
    const withParents = TIPO_GASTO_DATA.filter((item) => item.padre_codigo);
    withParents.forEach((item) => {
      expect(allCodes.has(item.padre_codigo)).toBe(true);
    });
  });
});

// ===========================================================================
// getClasificadorData utility
// ===========================================================================
describe('getClasificadorData', () => {
  it('should return COG_DATA for "objeto_gasto"', () => {
    const data = getClasificadorData('objeto_gasto');
    expect(data).toBe(COG_DATA);
  });

  it('should return FUNCIONAL_DATA for "funcional"', () => {
    const data = getClasificadorData('funcional');
    expect(data).toBe(FUNCIONAL_DATA);
  });

  it('should return ECONOMICO_DATA for "economico"', () => {
    const data = getClasificadorData('economico');
    expect(data).toBe(ECONOMICO_DATA);
  });

  it('should return FUENTE_FINANCIAMIENTO_DATA for "fuente_financiamiento"', () => {
    const data = getClasificadorData('fuente_financiamiento');
    expect(data).toBe(FUENTE_FINANCIAMIENTO_DATA);
  });

  it('should return GEOGRAFICO_DATA for "geografico"', () => {
    const data = getClasificadorData('geografico');
    expect(data).toBe(GEOGRAFICO_DATA);
  });

  it('should return empty array for unknown type', () => {
    const data = getClasificadorData('nonexistent');
    expect(data).toEqual([]);
  });
});

// ===========================================================================
// Cross-dataset consistency
// ===========================================================================
describe('Cross-dataset consistency', () => {
  it('all datasets should be non-empty arrays', () => {
    expect(Array.isArray(COG_DATA)).toBe(true);
    expect(COG_DATA.length).toBeGreaterThan(0);
    expect(Array.isArray(FUNCIONAL_DATA)).toBe(true);
    expect(FUNCIONAL_DATA.length).toBeGreaterThan(0);
    expect(Array.isArray(ECONOMICO_DATA)).toBe(true);
    expect(ECONOMICO_DATA.length).toBeGreaterThan(0);
    expect(Array.isArray(FUENTE_FINANCIAMIENTO_DATA)).toBe(true);
    expect(FUENTE_FINANCIAMIENTO_DATA.length).toBeGreaterThan(0);
    expect(Array.isArray(GEOGRAFICO_DATA)).toBe(true);
    expect(GEOGRAFICO_DATA.length).toBeGreaterThan(0);
    expect(Array.isArray(TIPO_GASTO_DATA)).toBe(true);
    expect(TIPO_GASTO_DATA.length).toBeGreaterThan(0);
  });

  it('all items in all datasets should have codigo and nombre', () => {
    const allData = [
      ...COG_DATA,
      ...FUNCIONAL_DATA,
      ...ECONOMICO_DATA,
      ...FUENTE_FINANCIAMIENTO_DATA,
      ...GEOGRAFICO_DATA,
      ...TIPO_GASTO_DATA,
    ];
    allData.forEach((item) => {
      expect(item).toHaveProperty('codigo');
      expect(item).toHaveProperty('nombre');
    });
  });
});
