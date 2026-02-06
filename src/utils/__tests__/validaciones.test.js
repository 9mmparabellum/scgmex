import { describe, it, expect } from 'vitest';
import {
  validarPolizaCuadrada,
  validarPeriodoAbierto,
  validarCuentaDetalle,
  validarMomentoPresupuestal,
  SECUENCIA_MOMENTOS_EGRESO,
  SECUENCIA_MOMENTOS_INGRESO,
} from '../validaciones';

describe('validarPolizaCuadrada', () => {
  it('returns valid when debits equal credits', () => {
    const movimientos = [
      { debe: 100, haber: 0 },
      { debe: 0, haber: 100 },
    ];
    const resultado = validarPolizaCuadrada(movimientos);
    expect(resultado.valido).toBe(true);
    expect(resultado.mensaje).toBeNull();
  });

  it('returns invalid when not balanced', () => {
    const movimientos = [
      { debe: 100, haber: 0 },
      { debe: 0, haber: 50 },
    ];
    const resultado = validarPolizaCuadrada(movimientos);
    expect(resultado.valido).toBe(false);
    expect(resultado.diferencia).toBeCloseTo(50);
    expect(resultado.mensaje).toBeTruthy();
  });

  it('tolerates small floating point differences', () => {
    const movimientos = [
      { debe: 100.004, haber: 0 },
      { debe: 0, haber: 100.001 },
    ];
    const resultado = validarPolizaCuadrada(movimientos);
    expect(resultado.valido).toBe(true);
  });

  it('handles empty movimientos', () => {
    const resultado = validarPolizaCuadrada([]);
    expect(resultado.valido).toBe(true);
  });
});

describe('validarPeriodoAbierto', () => {
  it('returns valid for open period', () => {
    expect(validarPeriodoAbierto({ estado: 'abierto' }).valido).toBe(true);
  });

  it('returns invalid for closed period', () => {
    const res = validarPeriodoAbierto({ estado: 'cerrado' });
    expect(res.valido).toBe(false);
    expect(res.mensaje).toContain('cerrado');
  });

  it('returns invalid for null period', () => {
    expect(validarPeriodoAbierto(null).valido).toBe(false);
  });
});

describe('validarCuentaDetalle', () => {
  it('returns valid for detail account (es_detalle)', () => {
    expect(validarCuentaDetalle({ es_detalle: true }).valido).toBe(true);
  });

  it('returns valid for account with nivel >= 3', () => {
    expect(validarCuentaDetalle({ nivel: 3 }).valido).toBe(true);
    expect(validarCuentaDetalle({ nivel: 4 }).valido).toBe(true);
  });

  it('returns invalid for non-detail account', () => {
    expect(validarCuentaDetalle({ nivel: 1 }).valido).toBe(false);
  });

  it('returns invalid for null', () => {
    expect(validarCuentaDetalle(null).valido).toBe(false);
  });
});

describe('validarMomentoPresupuestal', () => {
  it('first momento in sequence is always valid', () => {
    expect(validarMomentoPresupuestal('aprobado', SECUENCIA_MOMENTOS_EGRESO).valido).toBe(true);
    expect(validarMomentoPresupuestal('estimado', SECUENCIA_MOMENTOS_INGRESO).valido).toBe(true);
  });

  it('returns previous momento for sequential validation', () => {
    const res = validarMomentoPresupuestal('comprometido', SECUENCIA_MOMENTOS_EGRESO);
    expect(res.valido).toBe(true);
    expect(res.momentoPrevio).toBe('modificado');
  });

  it('returns invalid for unrecognized momento', () => {
    expect(validarMomentoPresupuestal('inventado', SECUENCIA_MOMENTOS_EGRESO).valido).toBe(false);
  });
});
