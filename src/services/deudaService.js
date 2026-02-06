import { supabase } from '../config/supabase';
import { fetchAll } from './dataService';

// ── Helpers ─────────────────────────────────────────────────────────

function emptyMovimientosTotales() {
  return { disposiciones: 0, amortizaciones: 0, pago_intereses: 0, comisiones: 0 };
}

function emptyResumenDeuda() {
  return { saldo_total: 0, intereses_pagados: 0, amortizaciones: 0, total_instrumentos: 0 };
}

function aggregateMovimientosPorInstrumento(movimientos) {
  const map = {};
  for (const m of movimientos) {
    const iid = m.instrumento_id;
    if (!map[iid]) map[iid] = emptyMovimientosTotales();
    const monto = Number(m.monto) || 0;
    const tipo = m.tipo;
    if (tipo === 'disposicion') map[iid].disposiciones += monto;
    else if (tipo === 'amortizacion') map[iid].amortizaciones += monto;
    else if (tipo === 'pago_intereses') map[iid].pago_intereses += monto;
    else if (tipo === 'comision') map[iid].comisiones += monto;
  }
  return map;
}

// ═════════════════════════════════════════════════════════════════════
// INSTRUMENTOS DE DEUDA
// ═════════════════════════════════════════════════════════════════════

/**
 * Fetch instrumentos de deuda with aggregated movimiento totals.
 */
export async function fetchInstrumentosConSaldo(enteId, ejercicioId) {
  if (supabase) {
    const { data: instrumentos, error: iError } = await supabase
      .from('instrumento_deuda')
      .select('*')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId)
      .order('clave');
    if (iError) throw iError;
    if (!instrumentos.length) return [];

    const instrumentoIds = instrumentos.map((i) => i.id);
    const { data: movimientos, error: mError } = await supabase
      .from('movimiento_deuda')
      .select('*')
      .in('instrumento_id', instrumentoIds);
    if (mError) throw mError;

    const totalesMap = aggregateMovimientosPorInstrumento(movimientos);

    return instrumentos.map((i) => ({
      ...i,
      movimientos_totales: totalesMap[i.id] || emptyMovimientosTotales(),
    }));
  }

  // localStorage fallback
  const instrumentos = await fetchAll('instrumento_deuda', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
    order: { column: 'clave', ascending: true },
  });
  if (!instrumentos.length) return [];

  const instrumentoIds = new Set(instrumentos.map((i) => i.id));
  const allMovs = await fetchAll('movimiento_deuda');
  const movimientos = allMovs.filter((m) => instrumentoIds.has(m.instrumento_id));
  const totalesMap = aggregateMovimientosPorInstrumento(movimientos);

  return instrumentos.map((i) => ({
    ...i,
    movimientos_totales: totalesMap[i.id] || emptyMovimientosTotales(),
  }));
}

// ═════════════════════════════════════════════════════════════════════
// MOVIMIENTOS DE DEUDA
// ═════════════════════════════════════════════════════════════════════

/**
 * Fetch movimientos de deuda for a specific instrumento.
 */
export async function fetchMovimientosDeuda(instrumentoId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('movimiento_deuda')
      .select('*, instrumento:instrumento_deuda(clave, descripcion)')
      .eq('instrumento_id', instrumentoId)
      .order('fecha', { ascending: false });
    if (error) throw error;
    return data;
  }

  // localStorage fallback
  const data = await fetchAll('movimiento_deuda', {
    order: { column: 'fecha', ascending: false },
  });
  return data.filter((m) => m.instrumento_id === instrumentoId);
}

// ═════════════════════════════════════════════════════════════════════
// RESUMEN DE DEUDA
// ═════════════════════════════════════════════════════════════════════

/**
 * Fetch a summary of all deuda: saldo total, intereses pagados,
 * amortizaciones, and count of instrumentos.
 */
export async function fetchResumenDeuda(enteId, ejercicioId) {
  if (supabase) {
    const { data: instrumentos, error: iError } = await supabase
      .from('instrumento_deuda')
      .select('id, saldo_vigente')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId);
    if (iError) throw iError;
    if (!instrumentos.length) return emptyResumenDeuda();

    const instrumentoIds = instrumentos.map((i) => i.id);
    const { data: movimientos, error: mError } = await supabase
      .from('movimiento_deuda')
      .select('tipo, monto')
      .in('instrumento_id', instrumentoIds);
    if (mError) throw mError;

    return computeResumen(instrumentos, movimientos);
  }

  // localStorage fallback
  const instrumentos = await fetchAll('instrumento_deuda', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
  });
  if (!instrumentos.length) return emptyResumenDeuda();

  const instrumentoIds = new Set(instrumentos.map((i) => i.id));
  const allMovs = await fetchAll('movimiento_deuda');
  const movimientos = allMovs.filter((m) => instrumentoIds.has(m.instrumento_id));

  return computeResumen(instrumentos, movimientos);
}

function computeResumen(instrumentos, movimientos) {
  const resumen = emptyResumenDeuda();
  resumen.total_instrumentos = instrumentos.length;
  for (const i of instrumentos) {
    resumen.saldo_total += Number(i.saldo_vigente) || 0;
  }
  for (const m of movimientos) {
    const monto = Number(m.monto) || 0;
    if (m.tipo === 'pago_intereses') resumen.intereses_pagados += monto;
    else if (m.tipo === 'amortizacion') resumen.amortizaciones += monto;
  }
  return resumen;
}
