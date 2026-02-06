import { describe, it, expect } from 'vitest';
import { formatNumeroPoliza, validarPartidaDoble, transicionValida } from '../polizaHelpers';

describe('formatNumeroPoliza', () => {
  it('formats ingreso poliza', () => {
    expect(formatNumeroPoliza('ingreso', 1)).toBe('I-001');
  });

  it('formats egreso poliza', () => {
    expect(formatNumeroPoliza('egreso', 15)).toBe('E-015');
  });

  it('formats diario poliza', () => {
    expect(formatNumeroPoliza('diario', 3)).toBe('D-003');
  });

  it('formats ajuste poliza', () => {
    expect(formatNumeroPoliza('ajuste', 100)).toBe('A-100');
  });

  it('formats cierre poliza', () => {
    expect(formatNumeroPoliza('cierre', 1)).toBe('C-001');
  });
});

describe('validarPartidaDoble', () => {
  it('returns true when balanced', () => {
    expect(validarPartidaDoble([
      { debe: 500, haber: 0 },
      { debe: 0, haber: 500 },
    ])).toBe(true);
  });

  it('returns false when not balanced', () => {
    expect(validarPartidaDoble([
      { debe: 500, haber: 0 },
      { debe: 0, haber: 300 },
    ])).toBe(false);
  });

  it('handles string values', () => {
    expect(validarPartidaDoble([
      { debe: '100', haber: '0' },
      { debe: '0', haber: '100' },
    ])).toBe(true);
  });
});

describe('transicionValida', () => {
  it('allows borrador -> pendiente', () => {
    expect(transicionValida('borrador', 'pendiente')).toBe(true);
  });

  it('allows pendiente -> aprobada', () => {
    expect(transicionValida('pendiente', 'aprobada')).toBe(true);
  });

  it('allows pendiente -> borrador', () => {
    expect(transicionValida('pendiente', 'borrador')).toBe(true);
  });

  it('disallows cancelada -> anything', () => {
    expect(transicionValida('cancelada', 'borrador')).toBe(false);
    expect(transicionValida('cancelada', 'aprobada')).toBe(false);
  });

  it('disallows borrador -> aprobada directly', () => {
    expect(transicionValida('borrador', 'aprobada')).toBe(false);
  });
});
