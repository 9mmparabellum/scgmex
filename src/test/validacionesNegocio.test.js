import { describe, it, expect } from 'vitest';
import {
  validarSecuenciaMomento,
  validarDisponibilidadPresupuestal,
  validarPartidaDoble,
  validarMinMovimientos,
  validarRFC,
  validarCURP,
  validarCLABE,
  validarPlazoRegistroBien,
  validarPeriodoAbierto,
  validarEjercicioAbierto,
  validarSecuenciaMomentoIngreso,
  validarDevengadoVsComprometido,
  validarPagadoVsDevengado,
  validarOperacion,
} from '../utils/validacionesNegocio.js';

// ---------------------------------------------------------------------------
// 1. validarSecuenciaMomento
//    Signature: (momentoActual: string, partidaPresupuestal: Object) => { valid, error }
//    partidaPresupuestal has momento keys with numeric values (amounts)
// ---------------------------------------------------------------------------
describe('validarSecuenciaMomento', () => {
  it('should allow aprobado as first momento', () => {
    const result = validarSecuenciaMomento('aprobado', {});
    expect(result.valid).toBe(true);
  });

  it('should allow modificado when aprobado has amount', () => {
    const result = validarSecuenciaMomento('modificado', { aprobado: 10000 });
    expect(result.valid).toBe(true);
  });

  it('should reject modificado when aprobado has no amount', () => {
    const result = validarSecuenciaMomento('modificado', {});
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should reject comprometido without aprobado', () => {
    const result = validarSecuenciaMomento('comprometido', {});
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should allow comprometido when aprobado and modificado exist', () => {
    const result = validarSecuenciaMomento('comprometido', { aprobado: 10000, modificado: 10000 });
    expect(result.valid).toBe(true);
  });

  it('should reject devengado without comprometido', () => {
    const result = validarSecuenciaMomento('devengado', { aprobado: 10000, modificado: 10000 });
    expect(result.valid).toBe(false);
  });

  it('should allow devengado when all prior momentos have amounts', () => {
    const result = validarSecuenciaMomento('devengado', {
      aprobado: 10000, modificado: 10000, comprometido: 5000,
    });
    expect(result.valid).toBe(true);
  });

  it('should reject ejercido without devengado', () => {
    const result = validarSecuenciaMomento('ejercido', {
      aprobado: 10000, modificado: 10000, comprometido: 5000,
    });
    expect(result.valid).toBe(false);
  });

  it('should allow ejercido when devengado exists', () => {
    const result = validarSecuenciaMomento('ejercido', {
      aprobado: 10000, modificado: 10000, comprometido: 5000, devengado: 3000,
    });
    expect(result.valid).toBe(true);
  });

  it('should reject pagado without ejercido', () => {
    const result = validarSecuenciaMomento('pagado', {
      aprobado: 10000, modificado: 10000, comprometido: 5000, devengado: 3000,
    });
    expect(result.valid).toBe(false);
  });

  it('should allow pagado when full chain exists', () => {
    const result = validarSecuenciaMomento('pagado', {
      aprobado: 10000, modificado: 10000, comprometido: 5000, devengado: 3000, ejercido: 2000,
    });
    expect(result.valid).toBe(true);
  });

  it('should reject unknown momento', () => {
    const result = validarSecuenciaMomento('inventado', {});
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. validarSecuenciaMomentoIngreso
// ---------------------------------------------------------------------------
describe('validarSecuenciaMomentoIngreso', () => {
  it('should allow estimado as first momento', () => {
    const result = validarSecuenciaMomentoIngreso('estimado', {});
    expect(result.valid).toBe(true);
  });

  it('should allow modificado when estimado exists', () => {
    const result = validarSecuenciaMomentoIngreso('modificado', { estimado: 50000 });
    expect(result.valid).toBe(true);
  });

  it('should reject recaudado without devengado', () => {
    const result = validarSecuenciaMomentoIngreso('recaudado', { estimado: 50000, modificado: 50000 });
    expect(result.valid).toBe(false);
  });

  it('should allow recaudado when full chain exists', () => {
    const result = validarSecuenciaMomentoIngreso('recaudado', {
      estimado: 50000, modificado: 50000, devengado: 30000,
    });
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. validarDisponibilidadPresupuestal
//    Signature: (monto, partidaPresupuestal) => { valid, disponible, error }
// ---------------------------------------------------------------------------
describe('validarDisponibilidadPresupuestal', () => {
  it('should allow when monto is within budget', () => {
    const partida = { aprobado: 1000, comprometido: 200 };
    const result = validarDisponibilidadPresupuestal(500, partida);
    expect(result.valid).toBe(true);
  });

  it('should reject when monto exceeds budget', () => {
    const partida = { aprobado: 1000, comprometido: 200 };
    const result = validarDisponibilidadPresupuestal(900, partida);
    expect(result.valid).toBe(false);
  });

  it('should return available amount', () => {
    const partida = { aprobado: 1000, comprometido: 200 };
    const result = validarDisponibilidadPresupuestal(500, partida);
    expect(result.disponible).toBe(800);
  });

  it('should use modificado as techo when available', () => {
    const partida = { aprobado: 1000, modificado: 1500, comprometido: 200 };
    const result = validarDisponibilidadPresupuestal(500, partida);
    expect(result.disponible).toBe(1300);
  });

  it('should handle zero budget', () => {
    const partida = { aprobado: 0, comprometido: 0 };
    const result = validarDisponibilidadPresupuestal(100, partida);
    expect(result.valid).toBe(false);
    expect(result.disponible).toBe(0);
  });

  it('should allow exact amount match', () => {
    const partida = { aprobado: 1000, comprometido: 200 };
    const result = validarDisponibilidadPresupuestal(800, partida);
    expect(result.valid).toBe(true);
  });

  it('should reject negative monto', () => {
    const partida = { aprobado: 1000, comprometido: 0 };
    const result = validarDisponibilidadPresupuestal(-100, partida);
    expect(result.valid).toBe(false);
  });

  it('should handle large numbers without floating-point errors', () => {
    const partida = { aprobado: 2000000000.00, comprometido: 1000000000.00 };
    const result = validarDisponibilidadPresupuestal(999999999.99, partida);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. validarDevengadoVsComprometido
// ---------------------------------------------------------------------------
describe('validarDevengadoVsComprometido', () => {
  it('should allow when within comprometido', () => {
    const partida = { comprometido: 5000, devengado: 1000 };
    const result = validarDevengadoVsComprometido(2000, partida);
    expect(result.valid).toBe(true);
  });

  it('should reject when exceeds comprometido', () => {
    const partida = { comprometido: 5000, devengado: 4000 };
    const result = validarDevengadoVsComprometido(2000, partida);
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. validarPagadoVsDevengado
// ---------------------------------------------------------------------------
describe('validarPagadoVsDevengado', () => {
  it('should allow when within devengado', () => {
    const partida = { devengado: 3000, pagado: 500 };
    const result = validarPagadoVsDevengado(1000, partida);
    expect(result.valid).toBe(true);
  });

  it('should reject when exceeds devengado', () => {
    const partida = { devengado: 3000, pagado: 2500 };
    const result = validarPagadoVsDevengado(1000, partida);
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. validarPartidaDoble
//    Signature: (movimientos) => { valid, diferencia, error }
// ---------------------------------------------------------------------------
describe('validarPartidaDoble', () => {
  it('should pass when cargos equal abonos', () => {
    const movimientos = [
      { tipo: 'cargo', monto: 1000 },
      { tipo: 'abono', monto: 1000 },
    ];
    const result = validarPartidaDoble(movimientos);
    expect(result.valid).toBe(true);
    expect(result.diferencia).toBe(0);
  });

  it('should fail when cargos exceed abonos', () => {
    const movimientos = [
      { tipo: 'cargo', monto: 1500 },
      { tipo: 'abono', monto: 1000 },
    ];
    const result = validarPartidaDoble(movimientos);
    expect(result.valid).toBe(false);
  });

  it('should fail when abonos exceed cargos', () => {
    const movimientos = [
      { tipo: 'cargo', monto: 500 },
      { tipo: 'abono', monto: 1000 },
    ];
    const result = validarPartidaDoble(movimientos);
    expect(result.valid).toBe(false);
  });

  it('should handle empty movimientos', () => {
    const result = validarPartidaDoble([]);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should handle multiple cargos and abonos summing equally', () => {
    const movimientos = [
      { tipo: 'cargo', monto: 300 },
      { tipo: 'cargo', monto: 700 },
      { tipo: 'abono', monto: 500 },
      { tipo: 'abono', monto: 500 },
    ];
    const result = validarPartidaDoble(movimientos);
    expect(result.valid).toBe(true);
  });

  it('should return the difference when unbalanced', () => {
    const movimientos = [
      { tipo: 'cargo', monto: 1000 },
      { tipo: 'abono', monto: 750 },
    ];
    const result = validarPartidaDoble(movimientos);
    expect(result.diferencia).toBe(250);
  });

  it('should tolerate small floating-point rounding (0.001)', () => {
    const movimientos = [
      { tipo: 'cargo', monto: 0.1 + 0.2 },
      { tipo: 'abono', monto: 0.3 },
    ];
    const result = validarPartidaDoble(movimientos);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. validarMinMovimientos
// ---------------------------------------------------------------------------
describe('validarMinMovimientos', () => {
  it('should pass with at least one cargo and one abono', () => {
    const movs = [
      { tipo: 'cargo', monto: 100 },
      { tipo: 'abono', monto: 100 },
    ];
    expect(validarMinMovimientos(movs).valid).toBe(true);
  });

  it('should fail with only cargos', () => {
    const movs = [
      { tipo: 'cargo', monto: 100 },
      { tipo: 'cargo', monto: 100 },
    ];
    expect(validarMinMovimientos(movs).valid).toBe(false);
  });

  it('should fail with less than 2 movimientos', () => {
    expect(validarMinMovimientos([{ tipo: 'cargo', monto: 100 }]).valid).toBe(false);
  });

  it('should fail with empty array', () => {
    expect(validarMinMovimientos([]).valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. validarRFC
//    Signature: (rfc: string) => { valid, error }
// ---------------------------------------------------------------------------
describe('validarRFC', () => {
  it('should accept valid persona moral RFC (12 chars)', () => {
    // ABC + 010101 + XY1 = 12 chars
    expect(validarRFC('ABC010101XY1').valid).toBe(true);
  });

  it('should accept valid persona fisica RFC (13 chars)', () => {
    // GAPA + 850101 + HDF -> doesn't match regex since HDF is 3 alphanumeric (valid)
    expect(validarRFC('GAPA850101HDF').valid).toBe(true);
  });

  it('should reject RFC shorter than 12 characters', () => {
    expect(validarRFC('ABC').valid).toBe(false);
  });

  it('should reject RFC longer than 13 characters', () => {
    expect(validarRFC('GAPA850101HDFXX').valid).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validarRFC('').valid).toBe(false);
  });

  it('should reject null/undefined', () => {
    expect(validarRFC(null).valid).toBe(false);
    expect(validarRFC(undefined).valid).toBe(false);
  });

  it('should accept RFC generico nacional XAXX010101000', () => {
    expect(validarRFC('XAXX010101000').valid).toBe(true);
  });

  it('should accept RFC generico extranjero XEXX010101000', () => {
    expect(validarRFC('XEXX010101000').valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. validarCURP
//    Signature: (curp: string) => { valid, error }
// ---------------------------------------------------------------------------
describe('validarCURP', () => {
  it('should accept valid CURP (18 chars)', () => {
    // GAPA850101HDFRRL09 - need valid format
    // 4 letters + 850101 + H + DF + RRL + 0 + 9
    expect(validarCURP('GAPA850101HDFRRL09').valid).toBe(true);
  });

  it('should reject CURP with wrong length', () => {
    expect(validarCURP('GAPA8501').valid).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validarCURP('').valid).toBe(false);
  });

  it('should reject null', () => {
    expect(validarCURP(null).valid).toBe(false);
  });

  it('should reject CURP with invalid date portion', () => {
    // 999901 -> month 99 is invalid
    expect(validarCURP('GAPA999901HDFRRL09').valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10. validarCLABE
//     Signature: (clabe: string) => { valid, error }
//     18 digits with verification digit (mod 10 weighted)
// ---------------------------------------------------------------------------
describe('validarCLABE', () => {
  it('should accept valid CLABE with correct check digit', () => {
    // BBVA CLABE known example: 012180015940000813
    // We compute: for simplicity use a known valid CLABE
    // Let's compute one: 002010077777777771
    // The actual check digit is calculated by the algorithm
    // Easier: just test the function accepts what it should
    // Use a real example: Banorte 072180012345678905
    // Simpler: build one manually
    // digits: 0 1 2 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ?
    // weights: 3 7 1 3 7 1 3 7 1 3 7 1 3 7 1 3 7
    // products mod 10: 0 7 2 0 0 0 0 0 0 0 0 0 0 0 0 0 0 = sum 9
    // check = (10 - 9) % 10 = 1
    expect(validarCLABE('012000000000000001').valid).toBe(true);
  });

  it('should reject CLABE with wrong length', () => {
    expect(validarCLABE('01234').valid).toBe(false);
  });

  it('should reject CLABE with letters', () => {
    expect(validarCLABE('01234567890123456A').valid).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validarCLABE('').valid).toBe(false);
  });

  it('should reject null', () => {
    expect(validarCLABE(null).valid).toBe(false);
  });

  it('should reject CLABE with incorrect check digit', () => {
    // Same as valid one but wrong last digit
    expect(validarCLABE('012000000000000002').valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. validarPlazoRegistroBien
//     Signature: (fechaAdquisicion) => { valid, diasRestantes, error }
//     Uses current date internally
// ---------------------------------------------------------------------------
describe('validarPlazoRegistroBien', () => {
  it('should accept registration within 30 days of acquisition', () => {
    const adquisicion = new Date();
    adquisicion.setDate(adquisicion.getDate() - 10);
    const result = validarPlazoRegistroBien(adquisicion.toISOString());
    expect(result.valid).toBe(true);
    expect(result.diasRestantes).toBeGreaterThan(0);
  });

  it('should reject registration after 30+ days', () => {
    const adquisicion = new Date();
    adquisicion.setDate(adquisicion.getDate() - 45);
    const result = validarPlazoRegistroBien(adquisicion.toISOString());
    expect(result.valid).toBe(false);
    expect(result.diasRestantes).toBeLessThan(0);
  });

  it('should accept same-day registration', () => {
    const result = validarPlazoRegistroBien(new Date().toISOString());
    expect(result.valid).toBe(true);
    expect(result.diasRestantes).toBe(30);
  });

  it('should handle invalid date', () => {
    const result = validarPlazoRegistroBien('not-a-date');
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 12. validarPeriodoAbierto
//     Signature: (periodo: Object) => { valid, error }
// ---------------------------------------------------------------------------
describe('validarPeriodoAbierto', () => {
  it('should return valid for open period', () => {
    expect(validarPeriodoAbierto({ estado: 'abierto' }).valid).toBe(true);
  });

  it('should return valid for activo period', () => {
    expect(validarPeriodoAbierto({ estado: 'activo' }).valid).toBe(true);
  });

  it('should return invalid for closed period', () => {
    const result = validarPeriodoAbierto({ estado: 'cerrado' });
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should return invalid for null period', () => {
    expect(validarPeriodoAbierto(null).valid).toBe(false);
  });

  it('should include periodo name in error message when closed', () => {
    const result = validarPeriodoAbierto({ estado: 'cerrado', nombre: 'Enero' });
    expect(result.error).toContain('Enero');
  });
});

// ---------------------------------------------------------------------------
// 13. validarEjercicioAbierto
//     Signature: (ejercicio: Object) => { valid, error }
// ---------------------------------------------------------------------------
describe('validarEjercicioAbierto', () => {
  it('should return valid for open ejercicio', () => {
    expect(validarEjercicioAbierto({ estado: 'abierto', anio: 2025 }).valid).toBe(true);
  });

  it('should return invalid for closed ejercicio', () => {
    const result = validarEjercicioAbierto({ estado: 'cerrado', anio: 2024 });
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should return invalid for null ejercicio', () => {
    expect(validarEjercicioAbierto(null).valid).toBe(false);
  });

  it('should include anio in error message', () => {
    const result = validarEjercicioAbierto({ estado: 'cerrado', anio: 2024 });
    expect(result.error).toContain('2024');
  });
});

// ---------------------------------------------------------------------------
// 14. validarOperacion (master validator)
// ---------------------------------------------------------------------------
describe('validarOperacion', () => {
  it('should validate poliza with all checks', () => {
    const result = validarOperacion('poliza', {
      movimientos: [
        { tipo: 'cargo', monto: 1000 },
        { tipo: 'abono', monto: 1000 },
      ],
      periodo: { estado: 'abierto' },
      ejercicio: { estado: 'abierto', anio: 2025 },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should collect multiple errors for invalid poliza', () => {
    const result = validarOperacion('poliza', {
      movimientos: [],
      periodo: { estado: 'cerrado', nombre: 'Enero' },
      ejercicio: { estado: 'cerrado', anio: 2024 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it('should validate RFC operation', () => {
    const result = validarOperacion('rfc', { rfc: 'XAXX010101000' });
    expect(result.valid).toBe(true);
  });

  it('should reject unrecognized operation', () => {
    const result = validarOperacion('unknown', {});
    expect(result.valid).toBe(false);
  });
});
