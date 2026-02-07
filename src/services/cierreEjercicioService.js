import { supabase } from '../config/supabase';
import { createPolizaCompleta, getNextNumeroPoliza } from './polizaService';

// ═════════════════════════════════════════════════════════════════════
// CIERRE DE EJERCICIO FISCAL
// Art. 49 LGCG - Cierre contable y apertura del nuevo ejercicio
// ═════════════════════════════════════════════════════════════════════

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Fetch all detail accounts of a given genero (first character of codigo)
 * with their accumulated saldos for the entire ejercicio.
 */
async function fetchSaldosPorGenero(enteId, ejercicioId, genero) {
  // Get all detail accounts matching the genero
  const { data: cuentas, error: cErr } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, naturaleza, tipo_cuenta')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('es_detalle', true)
    .like('codigo', `${genero}.%`)
    .order('codigo');
  if (cErr) throw cErr;

  if (!cuentas?.length) return [];

  const cuentaIds = cuentas.map((c) => c.id);

  // Get the last periodo to read saldo_final
  const { data: periodos } = await supabase
    .from('periodo_contable')
    .select('id')
    .eq('ejercicio_id', ejercicioId)
    .order('numero', { ascending: false })
    .limit(1);

  if (!periodos?.length) return [];
  const ultimoPeriodoId = periodos[0].id;

  // Fetch saldos for these cuentas in the last period
  const { data: saldos, error: sErr } = await supabase
    .from('saldo_cuenta')
    .select('cuenta_id, saldo_final')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('periodo_id', ultimoPeriodoId)
    .in('cuenta_id', cuentaIds);
  if (sErr) throw sErr;

  // Merge cuentas with their saldos
  const saldoMap = {};
  for (const s of saldos || []) {
    saldoMap[s.cuenta_id] = Number(s.saldo_final) || 0;
  }

  return cuentas
    .map((c) => ({
      ...c,
      saldo_final: saldoMap[c.id] || 0,
    }))
    .filter((c) => c.saldo_final !== 0);
}

/**
 * Find the "Resultado del Ejercicio" account (3.2.x.x).
 */
async function findCuentaResultado(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, naturaleza')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('es_detalle', true)
    .like('codigo', '3.2%')
    .order('codigo')
    .limit(1);
  if (error) throw error;
  if (!data?.length) {
    throw new Error('No se encontro la cuenta de Resultado del Ejercicio (3.2.x.x).');
  }
  return data[0];
}

/**
 * Find the "Hacienda Publica Contribuida / Resultados de Ejercicios Anteriores" account (3.1.x.x).
 */
async function findCuentaHacienda(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, naturaleza')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('es_detalle', true)
    .like('codigo', '3.1%')
    .order('codigo')
    .limit(1);
  if (error) throw error;
  if (!data?.length) {
    throw new Error('No se encontro la cuenta de Hacienda Publica (3.1.x.x).');
  }
  return data[0];
}

// ═════════════════════════════════════════════════════════════════════
// VALIDATION
// ═════════════════════════════════════════════════════════════════════

/**
 * Validate if ejercicio can be closed.
 * Checks:
 *   1. All periods are closed
 *   2. No pending (borrador/pendiente) polizas exist
 *   3. Balanza cuadrada (debit = credit across all approved polizas)
 *   4. Ejercicio is currently 'abierto'
 *
 * @param {string} enteId
 * @param {string} ejercicioId
 * @returns {{ canClose: boolean, errors: string[], checks: Object }}
 */
export async function validarCierreEjercicio(enteId, ejercicioId) {
  const errors = [];
  const checks = {
    ejercicioAbierto: false,
    periodossCerrados: false,
    sinPolizasPendientes: false,
    balanzaCuadrada: false,
  };

  // 1. Check ejercicio status
  const { data: ejercicio } = await supabase
    .from('ejercicio_fiscal')
    .select('id, anio, estado')
    .eq('id', ejercicioId)
    .eq('ente_id', enteId)
    .single();

  if (!ejercicio) {
    errors.push('El ejercicio fiscal no existe.');
    return { canClose: false, errors, checks };
  }

  if (ejercicio.estado === 'cerrado') {
    errors.push('El ejercicio ya se encuentra cerrado.');
    return { canClose: false, errors, checks };
  }

  checks.ejercicioAbierto = ejercicio.estado === 'abierto';
  if (!checks.ejercicioAbierto) {
    errors.push(`El ejercicio se encuentra en estado "${ejercicio.estado}". Debe estar "abierto" para cerrarlo.`);
  }

  // 2. Check all periods are closed
  const { data: periodos } = await supabase
    .from('periodo_contable')
    .select('id, numero, nombre, estado')
    .eq('ejercicio_id', ejercicioId)
    .order('numero');

  if (!periodos?.length) {
    errors.push('No se encontraron periodos contables en el ejercicio.');
  } else {
    const periodosAbiertos = periodos.filter((p) => p.estado !== 'cerrado');
    if (periodosAbiertos.length > 0) {
      const nombres = periodosAbiertos.map((p) => p.nombre || `Periodo ${p.numero}`).join(', ');
      errors.push(`Existen periodos sin cerrar: ${nombres}`);
    } else {
      checks.periodossCerrados = true;
    }
  }

  // 3. Check no pending polizas (borrador or pendiente)
  const { data: polizasPendientes, error: ppErr } = await supabase
    .from('poliza')
    .select('id, tipo, numero_poliza, estado')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .in('estado', ['borrador', 'pendiente']);
  if (ppErr) throw ppErr;

  if (polizasPendientes?.length > 0) {
    errors.push(`Existen ${polizasPendientes.length} poliza(s) en estado borrador o pendiente.`);
  } else {
    checks.sinPolizasPendientes = true;
  }

  // 4. Check balanza cuadrada - total debe == total haber across all approved polizas
  const { data: totales, error: tErr } = await supabase
    .from('movimiento_contable')
    .select('debe, haber, poliza!inner(ente_id, ejercicio_id, estado)')
    .eq('poliza.ente_id', enteId)
    .eq('poliza.ejercicio_id', ejercicioId)
    .eq('poliza.estado', 'aprobada');
  if (tErr) throw tErr;

  let totalDebe = 0;
  let totalHaber = 0;
  for (const m of totales || []) {
    totalDebe += Number(m.debe) || 0;
    totalHaber += Number(m.haber) || 0;
  }

  // Allow a small rounding tolerance (0.01)
  const diferencia = Math.abs(totalDebe - totalHaber);
  if (diferencia <= 0.01) {
    checks.balanzaCuadrada = true;
  } else {
    errors.push(
      `La balanza no esta cuadrada. Diferencia: $${diferencia.toFixed(2)} (Debe: $${totalDebe.toFixed(2)}, Haber: $${totalHaber.toFixed(2)})`
    );
  }

  const canClose = errors.length === 0;
  return { canClose, errors, checks };
}

// ═════════════════════════════════════════════════════════════════════
// PREVIEW (DRY RUN)
// ═════════════════════════════════════════════════════════════════════

/**
 * Preview closing entries (dry run).
 * Shows what polizas would be generated without executing them.
 *
 * @param {string} enteId
 * @param {string} ejercicioId
 * @returns {{ polizaIngresos: Object, polizaGastos: Object, polizaResultado: Object, resumen: Object }}
 */
export async function previsualizarCierre(enteId, ejercicioId) {
  // Fetch income accounts (genero 4) with saldos
  const cuentasIngresos = await fetchSaldosPorGenero(enteId, ejercicioId, '4');

  // Fetch expense accounts (genero 5) with saldos
  const cuentasGastos = await fetchSaldosPorGenero(enteId, ejercicioId, '5');

  // Find target accounts
  const cuentaResultado = await findCuentaResultado(enteId, ejercicioId);
  const cuentaHacienda = await findCuentaHacienda(enteId, ejercicioId);

  // Calculate totals
  const totalIngresos = cuentasIngresos.reduce((sum, c) => sum + Math.abs(c.saldo_final), 0);
  const totalGastos = cuentasGastos.reduce((sum, c) => sum + Math.abs(c.saldo_final), 0);
  const resultado = totalIngresos - totalGastos;

  // Build preview poliza for income closing
  const polizaIngresos = {
    descripcion: 'Cierre de cuentas de ingresos (4.x.x.x) contra Resultado del Ejercicio',
    movimientos: [
      ...cuentasIngresos.map((c) => ({
        cuenta_codigo: c.codigo,
        cuenta_nombre: c.nombre,
        concepto: `Cierre cuenta de ingreso ${c.codigo}`,
        debe: Math.abs(c.saldo_final),
        haber: 0,
      })),
      {
        cuenta_codigo: cuentaResultado.codigo,
        cuenta_nombre: cuentaResultado.nombre,
        concepto: 'Cierre de ingresos al Resultado del Ejercicio',
        debe: 0,
        haber: totalIngresos,
      },
    ],
    totalDebe: totalIngresos,
    totalHaber: totalIngresos,
  };

  // Build preview poliza for expense closing
  const polizaGastos = {
    descripcion: 'Cierre de cuentas de gastos (5.x.x.x) contra Resultado del Ejercicio',
    movimientos: [
      {
        cuenta_codigo: cuentaResultado.codigo,
        cuenta_nombre: cuentaResultado.nombre,
        concepto: 'Cierre de gastos al Resultado del Ejercicio',
        debe: totalGastos,
        haber: 0,
      },
      ...cuentasGastos.map((c) => ({
        cuenta_codigo: c.codigo,
        cuenta_nombre: c.nombre,
        concepto: `Cierre cuenta de gasto ${c.codigo}`,
        debe: 0,
        haber: Math.abs(c.saldo_final),
      })),
    ],
    totalDebe: totalGastos,
    totalHaber: totalGastos,
  };

  // Build preview poliza for result transfer to hacienda
  const polizaResultado = {
    descripcion: 'Traspaso del Resultado del Ejercicio a Hacienda Publica',
    movimientos: resultado >= 0
      ? [
          {
            cuenta_codigo: cuentaResultado.codigo,
            cuenta_nombre: cuentaResultado.nombre,
            concepto: 'Traspaso resultado a Hacienda Publica',
            debe: Math.abs(resultado),
            haber: 0,
          },
          {
            cuenta_codigo: cuentaHacienda.codigo,
            cuenta_nombre: cuentaHacienda.nombre,
            concepto: 'Traspaso resultado a Hacienda Publica',
            debe: 0,
            haber: Math.abs(resultado),
          },
        ]
      : [
          {
            cuenta_codigo: cuentaHacienda.codigo,
            cuenta_nombre: cuentaHacienda.nombre,
            concepto: 'Traspaso resultado negativo a Hacienda Publica',
            debe: Math.abs(resultado),
            haber: 0,
          },
          {
            cuenta_codigo: cuentaResultado.codigo,
            cuenta_nombre: cuentaResultado.nombre,
            concepto: 'Traspaso resultado negativo a Hacienda Publica',
            debe: 0,
            haber: Math.abs(resultado),
          },
        ],
    totalDebe: Math.abs(resultado),
    totalHaber: Math.abs(resultado),
  };

  const resumen = {
    totalIngresos: Math.round(totalIngresos * 100) / 100,
    totalGastos: Math.round(totalGastos * 100) / 100,
    resultado: Math.round(resultado * 100) / 100,
    tipo: resultado >= 0 ? 'superavit' : 'deficit',
    cuentasIngreso: cuentasIngresos.length,
    cuentasGasto: cuentasGastos.length,
    cuentaResultado: `${cuentaResultado.codigo} ${cuentaResultado.nombre}`,
    cuentaHacienda: `${cuentaHacienda.codigo} ${cuentaHacienda.nombre}`,
  };

  return { polizaIngresos, polizaGastos, polizaResultado, resumen };
}

// ═════════════════════════════════════════════════════════════════════
// EXECUTE CLOSING
// ═════════════════════════════════════════════════════════════════════

/**
 * Complete fiscal year closing process.
 * Steps:
 *   1. Verify all periods are closed
 *   2. Generate closing poliza for income accounts (4.x.x.x -> 3.2.x.x Resultado del Ejercicio)
 *   3. Generate closing poliza for expense accounts (5.x.x.x -> 3.2.x.x Resultado del Ejercicio)
 *   4. Generate result transfer poliza (3.2.x.x -> 3.1.x.x Hacienda Publica)
 *   5. Mark ejercicio as 'cerrado'
 *   6. Return summary
 *
 * @param {string} enteId
 * @param {string} ejercicioId
 * @param {string} userId
 * @returns {{ polizaIngresos, polizaGastos, polizaResultado, resumen }}
 */
export async function ejecutarCierreEjercicio(enteId, ejercicioId, userId) {
  // 1. Validate before proceeding
  const { canClose, errors } = await validarCierreEjercicio(enteId, ejercicioId);
  if (!canClose) {
    throw new Error(`No se puede cerrar el ejercicio:\n${errors.join('\n')}`);
  }

  // Mark ejercicio as en_cierre
  await supabase
    .from('ejercicio_fiscal')
    .update({ estado: 'en_cierre' })
    .eq('id', ejercicioId);

  try {
    // Get last periodo for the closing polizas
    const { data: periodos } = await supabase
      .from('periodo_contable')
      .select('id')
      .eq('ejercicio_id', ejercicioId)
      .order('numero', { ascending: false })
      .limit(1);

    if (!periodos?.length) throw new Error('No se encontraron periodos contables.');
    const ultimoPeriodoId = periodos[0].id;

    // Fetch account data
    const cuentasIngresos = await fetchSaldosPorGenero(enteId, ejercicioId, '4');
    const cuentasGastos = await fetchSaldosPorGenero(enteId, ejercicioId, '5');
    const cuentaResultado = await findCuentaResultado(enteId, ejercicioId);
    const cuentaHacienda = await findCuentaHacienda(enteId, ejercicioId);

    const totalIngresos = cuentasIngresos.reduce((sum, c) => sum + Math.abs(c.saldo_final), 0);
    const totalGastos = cuentasGastos.reduce((sum, c) => sum + Math.abs(c.saldo_final), 0);
    const resultado = totalIngresos - totalGastos;
    const today = new Date().toISOString().slice(0, 10);

    // 2. Generate closing poliza for income accounts
    let polizaIngresosResult = null;
    if (cuentasIngresos.length > 0) {
      const numIngreso = await getNextNumeroPoliza(enteId, ejercicioId, 'cierre');
      const headerIngresos = {
        ente_id: enteId,
        ejercicio_id: ejercicioId,
        periodo_id: ultimoPeriodoId,
        tipo: 'cierre',
        numero_poliza: numIngreso,
        fecha: today,
        descripcion: 'Cierre de cuentas de ingresos - Art. 49 LGCG',
        estado: 'aprobada',
        creado_por: userId,
        aprobado_por: userId,
        aprobado_en: new Date().toISOString(),
      };

      const movsIngresos = [
        // Debit all income accounts to zero them out
        ...cuentasIngresos.map((c) => ({
          cuenta_id: c.id,
          concepto: `Cierre cuenta de ingreso ${c.codigo} ${c.nombre}`,
          debe: Math.abs(c.saldo_final),
          haber: 0,
        })),
        // Credit resultado
        {
          cuenta_id: cuentaResultado.id,
          concepto: 'Cierre de ingresos al Resultado del Ejercicio',
          debe: 0,
          haber: totalIngresos,
        },
      ];

      polizaIngresosResult = await createPolizaCompleta(headerIngresos, movsIngresos);
    }

    // 3. Generate closing poliza for expense accounts
    let polizaGastosResult = null;
    if (cuentasGastos.length > 0) {
      const numGasto = await getNextNumeroPoliza(enteId, ejercicioId, 'cierre');
      const headerGastos = {
        ente_id: enteId,
        ejercicio_id: ejercicioId,
        periodo_id: ultimoPeriodoId,
        tipo: 'cierre',
        numero_poliza: numGasto,
        fecha: today,
        descripcion: 'Cierre de cuentas de gastos - Art. 49 LGCG',
        estado: 'aprobada',
        creado_por: userId,
        aprobado_por: userId,
        aprobado_en: new Date().toISOString(),
      };

      const movsGastos = [
        // Debit resultado
        {
          cuenta_id: cuentaResultado.id,
          concepto: 'Cierre de gastos al Resultado del Ejercicio',
          debe: totalGastos,
          haber: 0,
        },
        // Credit all expense accounts to zero them out
        ...cuentasGastos.map((c) => ({
          cuenta_id: c.id,
          concepto: `Cierre cuenta de gasto ${c.codigo} ${c.nombre}`,
          debe: 0,
          haber: Math.abs(c.saldo_final),
        })),
      ];

      polizaGastosResult = await createPolizaCompleta(headerGastos, movsGastos);
    }

    // 4. Generate result transfer poliza (3.2 -> 3.1)
    let polizaResultadoResult = null;
    if (Math.abs(resultado) > 0.01) {
      const numResultado = await getNextNumeroPoliza(enteId, ejercicioId, 'cierre');
      const headerResultado = {
        ente_id: enteId,
        ejercicio_id: ejercicioId,
        periodo_id: ultimoPeriodoId,
        tipo: 'cierre',
        numero_poliza: numResultado,
        fecha: today,
        descripcion: `Traspaso de Resultado del Ejercicio a Hacienda Publica (${resultado >= 0 ? 'Superavit' : 'Deficit'}) - Art. 49 LGCG`,
        estado: 'aprobada',
        creado_por: userId,
        aprobado_por: userId,
        aprobado_en: new Date().toISOString(),
      };

      const movsResultado = resultado >= 0
        ? [
            {
              cuenta_id: cuentaResultado.id,
              concepto: 'Traspaso de resultado a Hacienda Publica',
              debe: Math.abs(resultado),
              haber: 0,
            },
            {
              cuenta_id: cuentaHacienda.id,
              concepto: 'Traspaso de resultado a Hacienda Publica',
              debe: 0,
              haber: Math.abs(resultado),
            },
          ]
        : [
            {
              cuenta_id: cuentaHacienda.id,
              concepto: 'Traspaso de resultado negativo a Hacienda Publica',
              debe: Math.abs(resultado),
              haber: 0,
            },
            {
              cuenta_id: cuentaResultado.id,
              concepto: 'Traspaso de resultado negativo a Hacienda Publica',
              debe: 0,
              haber: Math.abs(resultado),
            },
          ];

      polizaResultadoResult = await createPolizaCompleta(headerResultado, movsResultado);
    }

    // 5. Mark ejercicio as 'cerrado'
    const { error: closeErr } = await supabase
      .from('ejercicio_fiscal')
      .update({
        estado: 'cerrado',
        fecha_cierre: today,
        cerrado_por: userId,
      })
      .eq('id', ejercicioId);
    if (closeErr) throw closeErr;

    // 6. Return summary
    return {
      polizaIngresos: polizaIngresosResult,
      polizaGastos: polizaGastosResult,
      polizaResultado: polizaResultadoResult,
      resumen: {
        totalIngresos: Math.round(totalIngresos * 100) / 100,
        totalGastos: Math.round(totalGastos * 100) / 100,
        resultado: Math.round(resultado * 100) / 100,
        tipo: resultado >= 0 ? 'superavit' : 'deficit',
        cuentasIngresoCerradas: cuentasIngresos.length,
        cuentasGastoCerradas: cuentasGastos.length,
        polizasGeneradas: [polizaIngresosResult, polizaGastosResult, polizaResultadoResult].filter(Boolean).length,
      },
    };
  } catch (err) {
    // Revert ejercicio status on failure
    await supabase
      .from('ejercicio_fiscal')
      .update({ estado: 'abierto' })
      .eq('id', ejercicioId);
    throw err;
  }
}

// ═════════════════════════════════════════════════════════════════════
// APERTURA DEL NUEVO EJERCICIO
// ═════════════════════════════════════════════════════════════════════

/**
 * Generate opening balances for new fiscal year.
 * Steps:
 *   1. Get all balance sheet accounts (1.x, 2.x, 3.x) with their final saldos
 *   2. Create apertura poliza in new ejercicio with all balances
 *   3. Create saldo_cuenta records for period 1 of new year
 *   4. Return { polizaApertura, cuentasTransferidas }
 *
 * @param {string} enteId
 * @param {string} ejercicioOrigenId - The closed ejercicio
 * @param {string} ejercicioDestinoId - The new ejercicio to open
 * @param {string} userId
 * @returns {{ polizaApertura: Object, cuentasTransferidas: number }}
 */
export async function generarPolizaApertura(enteId, ejercicioOrigenId, ejercicioDestinoId, userId) {
  // Validate origen is closed and destino is open
  const { data: origen } = await supabase
    .from('ejercicio_fiscal')
    .select('id, anio, estado')
    .eq('id', ejercicioOrigenId)
    .eq('ente_id', enteId)
    .single();
  if (!origen) throw new Error('Ejercicio origen no encontrado.');
  if (origen.estado !== 'cerrado') throw new Error('El ejercicio origen debe estar cerrado.');

  const { data: destino } = await supabase
    .from('ejercicio_fiscal')
    .select('id, anio, estado')
    .eq('id', ejercicioDestinoId)
    .eq('ente_id', enteId)
    .single();
  if (!destino) throw new Error('Ejercicio destino no encontrado.');
  if (destino.estado === 'cerrado') throw new Error('El ejercicio destino ya esta cerrado.');

  // 1. Get all balance sheet accounts (generos 1, 2, 3) with final saldos from origen
  const activos = await fetchSaldosPorGenero(enteId, ejercicioOrigenId, '1');
  const pasivos = await fetchSaldosPorGenero(enteId, ejercicioOrigenId, '2');
  const hacienda = await fetchSaldosPorGenero(enteId, ejercicioOrigenId, '3');

  const cuentasBalance = [...activos, ...pasivos, ...hacienda].filter(
    (c) => Math.abs(c.saldo_final) > 0.01
  );

  if (!cuentasBalance.length) {
    throw new Error('No se encontraron saldos de cuentas de balance para transferir.');
  }

  // Get first periodo of destino
  const { data: periodosDestino } = await supabase
    .from('periodo_contable')
    .select('id')
    .eq('ejercicio_id', ejercicioDestinoId)
    .order('numero', { ascending: true })
    .limit(1);
  if (!periodosDestino?.length) {
    throw new Error('No se encontraron periodos contables en el ejercicio destino.');
  }
  const primerPeriodoId = periodosDestino[0].id;

  // We need to find the corresponding cuentas in the destino ejercicio
  // Match by codigo since accounts may have different IDs across ejercicios
  const { data: cuentasDestino, error: cdErr } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, naturaleza')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioDestinoId)
    .eq('es_detalle', true)
    .in(
      'codigo',
      cuentasBalance.map((c) => c.codigo)
    );
  if (cdErr) throw cdErr;

  const destinoCuentaMap = {};
  for (const c of cuentasDestino || []) {
    destinoCuentaMap[c.codigo] = c;
  }

  // Filter to only cuentas that exist in destino
  const cuentasTransferibles = cuentasBalance.filter((c) => destinoCuentaMap[c.codigo]);

  if (!cuentasTransferibles.length) {
    throw new Error('No se encontraron cuentas equivalentes en el ejercicio destino.');
  }

  // 2. Create apertura poliza in destino
  const today = new Date().toISOString().slice(0, 10);
  const numPoliza = await getNextNumeroPoliza(enteId, ejercicioDestinoId, 'diario');

  const polizaHeader = {
    ente_id: enteId,
    ejercicio_id: ejercicioDestinoId,
    periodo_id: primerPeriodoId,
    tipo: 'diario',
    numero_poliza: numPoliza,
    fecha: `${destino.anio}-01-01`,
    descripcion: `Poliza de Apertura - Saldos iniciales del ejercicio ${destino.anio} (desde ${origen.anio})`,
    estado: 'aprobada',
    creado_por: userId,
    aprobado_por: userId,
    aprobado_en: new Date().toISOString(),
  };

  const movimientos = [];
  for (const cuenta of cuentasTransferibles) {
    const destCuenta = destinoCuentaMap[cuenta.codigo];
    const saldo = cuenta.saldo_final;

    if (saldo > 0) {
      // Debit balance (activos, some hacienda)
      movimientos.push({
        cuenta_id: destCuenta.id,
        concepto: `Saldo inicial ${cuenta.codigo} ${cuenta.nombre}`,
        debe: saldo,
        haber: 0,
      });
    } else {
      // Credit balance (pasivos, some hacienda)
      movimientos.push({
        cuenta_id: destCuenta.id,
        concepto: `Saldo inicial ${cuenta.codigo} ${cuenta.nombre}`,
        debe: 0,
        haber: Math.abs(saldo),
      });
    }
  }

  const polizaApertura = await createPolizaCompleta(polizaHeader, movimientos);

  // 3. Create saldo_cuenta records for period 1 of new year
  const newSaldos = cuentasTransferibles.map((c) => {
    const destCuenta = destinoCuentaMap[c.codigo];
    return {
      ente_id: enteId,
      ejercicio_id: ejercicioDestinoId,
      periodo_id: primerPeriodoId,
      cuenta_id: destCuenta.id,
      saldo_inicial: c.saldo_final,
      total_debe: c.saldo_final > 0 ? c.saldo_final : 0,
      total_haber: c.saldo_final < 0 ? Math.abs(c.saldo_final) : 0,
      saldo_final: c.saldo_final,
    };
  });

  if (newSaldos.length) {
    const { error: insertErr } = await supabase
      .from('saldo_cuenta')
      .insert(newSaldos);
    if (insertErr) throw insertErr;
  }

  // 4. Return result
  return {
    polizaApertura,
    cuentasTransferidas: cuentasTransferibles.length,
    totalDeudor: cuentasTransferibles
      .filter((c) => c.saldo_final > 0)
      .reduce((sum, c) => sum + c.saldo_final, 0),
    totalAcreedor: cuentasTransferibles
      .filter((c) => c.saldo_final < 0)
      .reduce((sum, c) => sum + Math.abs(c.saldo_final), 0),
  };
}
