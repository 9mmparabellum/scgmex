import { supabase } from '../config/supabase';
import { fetchAll } from './dataService';

// ── Momentos presupuestales ─────────────────────────────────────────
const MOMENTOS_EGRESO = ['aprobado', 'modificado', 'comprometido', 'devengado', 'ejercido', 'pagado'];
const MOMENTOS_INGRESO = ['estimado', 'modificado', 'devengado', 'recaudado'];

function emptyTotalesEgreso() {
  return { aprobado: 0, modificado: 0, comprometido: 0, devengado: 0, ejercido: 0, pagado: 0 };
}

function emptyTotalesIngreso() {
  return { estimado: 0, modificado: 0, devengado: 0, recaudado: 0 };
}

// ── Helpers ─────────────────────────────────────────────────────────
function aggregateMovimientos(movimientos, partidaKey, momentos, emptyFn) {
  const map = {};
  for (const mov of movimientos) {
    const pid = mov[partidaKey];
    if (!map[pid]) map[pid] = emptyFn();
    const momento = mov.momento;
    if (momentos.includes(momento)) {
      map[pid][momento] += Number(mov.monto) || 0;
    }
  }
  return map;
}

function aggregateResumen(movimientos, momentos, emptyFn) {
  const totales = emptyFn();
  for (const mov of movimientos) {
    const momento = mov.momento;
    if (momentos.includes(momento)) {
      totales[momento] += Number(mov.monto) || 0;
    }
  }
  return totales;
}

// ═════════════════════════════════════════════════════════════════════
// EGRESOS
// ═════════════════════════════════════════════════════════════════════

/**
 * Fetch partidas de egreso with clasificador joins and aggregated totals
 * per momento presupuestal.
 */
export async function fetchPartidasConTotales(enteId, ejercicioId) {
  if (supabase) {
    // 1. Fetch partidas with clasificador and fuente joins
    const { data: partidas, error: pError } = await supabase
      .from('partida_egreso')
      .select('*, clasificador:clasificador_presupuestal!clasificador_id(codigo, nombre), fuente:clasificador_presupuestal!fuente_id(codigo, nombre)')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId)
      .order('clave');
    if (pError) throw pError;
    if (!partidas.length) return [];

    // 2. Fetch all movimientos for those partidas in one query
    const partidaIds = partidas.map((p) => p.id);
    const { data: movimientos, error: mError } = await supabase
      .from('movimiento_presupuestal_egreso')
      .select('*')
      .in('partida_id', partidaIds);
    if (mError) throw mError;

    // 3. Aggregate totals by partida and momento
    const totalesMap = aggregateMovimientos(movimientos, 'partida_id', MOMENTOS_EGRESO, emptyTotalesEgreso);

    return partidas.map((p) => ({
      ...p,
      totales: totalesMap[p.id] || emptyTotalesEgreso(),
    }));
  }

  // localStorage fallback
  const partidas = await fetchAll('partida_egreso', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
    order: { column: 'clave', ascending: true },
  });
  if (!partidas.length) return [];

  const partidaIds = new Set(partidas.map((p) => p.id));
  const allMovs = await fetchAll('movimiento_presupuestal_egreso');
  const movimientos = allMovs.filter((m) => partidaIds.has(m.partida_id));
  const totalesMap = aggregateMovimientos(movimientos, 'partida_id', MOMENTOS_EGRESO, emptyTotalesEgreso);

  return partidas.map((p) => ({
    ...p,
    totales: totalesMap[p.id] || emptyTotalesEgreso(),
  }));
}

/**
 * Fetch movimientos presupuestales de egreso with optional filters.
 * @param {{ partida_id?: string, periodo_id?: string, momento?: string }} filter
 */
export async function fetchMovimientosEgreso(filter = {}) {
  if (supabase) {
    let query = supabase
      .from('movimiento_presupuestal_egreso')
      .select('*, partida:partida_egreso(clave, descripcion, clasificador:clasificador_presupuestal!clasificador_id(codigo, nombre))')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (filter.partida_id) query = query.eq('partida_id', filter.partida_id);
    if (filter.periodo_id) query = query.eq('periodo_id', filter.periodo_id);
    if (filter.momento) query = query.eq('momento', filter.momento);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // localStorage fallback
  let data = await fetchAll('movimiento_presupuestal_egreso', {
    order: { column: 'fecha', ascending: false },
  });
  if (filter.partida_id) data = data.filter((m) => m.partida_id === filter.partida_id);
  if (filter.periodo_id) data = data.filter((m) => m.periodo_id === filter.periodo_id);
  if (filter.momento) data = data.filter((m) => m.momento === filter.momento);
  return data;
}

/**
 * Fetch a summary of all egreso movimientos grouped by momento.
 * Returns totals: { aprobado, modificado, comprometido, devengado, ejercido, pagado }
 */
export async function fetchResumenEgresos(enteId, ejercicioId) {
  if (supabase) {
    // Get all partida ids for the ente/ejercicio, then fetch their movimientos
    const { data: partidas, error: pError } = await supabase
      .from('partida_egreso')
      .select('id')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId);
    if (pError) throw pError;
    if (!partidas.length) return emptyTotalesEgreso();

    const partidaIds = partidas.map((p) => p.id);
    const { data: movimientos, error: mError } = await supabase
      .from('movimiento_presupuestal_egreso')
      .select('momento, monto')
      .in('partida_id', partidaIds);
    if (mError) throw mError;

    return aggregateResumen(movimientos, MOMENTOS_EGRESO, emptyTotalesEgreso);
  }

  // localStorage fallback
  const partidas = await fetchAll('partida_egreso', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
  });
  if (!partidas.length) return emptyTotalesEgreso();

  const partidaIds = new Set(partidas.map((p) => p.id));
  const allMovs = await fetchAll('movimiento_presupuestal_egreso');
  const movimientos = allMovs.filter((m) => partidaIds.has(m.partida_id));

  return aggregateResumen(movimientos, MOMENTOS_EGRESO, emptyTotalesEgreso);
}

// ═════════════════════════════════════════════════════════════════════
// INGRESOS
// ═════════════════════════════════════════════════════════════════════

/**
 * Fetch conceptos de ingreso with clasificador join and aggregated totals
 * per momento presupuestal.
 */
export async function fetchConceptosConTotales(enteId, ejercicioId) {
  if (supabase) {
    const { data: conceptos, error: cError } = await supabase
      .from('concepto_ingreso')
      .select('*, clasificador:clasificador_presupuestal!clasificador_id(codigo, nombre)')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId)
      .order('clave');
    if (cError) throw cError;
    if (!conceptos.length) return [];

    const conceptoIds = conceptos.map((c) => c.id);
    const { data: movimientos, error: mError } = await supabase
      .from('movimiento_presupuestal_ingreso')
      .select('*')
      .in('concepto_id', conceptoIds);
    if (mError) throw mError;

    const totalesMap = aggregateMovimientos(movimientos, 'concepto_id', MOMENTOS_INGRESO, emptyTotalesIngreso);

    return conceptos.map((c) => ({
      ...c,
      totales: totalesMap[c.id] || emptyTotalesIngreso(),
    }));
  }

  // localStorage fallback
  const conceptos = await fetchAll('concepto_ingreso', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
    order: { column: 'clave', ascending: true },
  });
  if (!conceptos.length) return [];

  const conceptoIds = new Set(conceptos.map((c) => c.id));
  const allMovs = await fetchAll('movimiento_presupuestal_ingreso');
  const movimientos = allMovs.filter((m) => conceptoIds.has(m.concepto_id));
  const totalesMap = aggregateMovimientos(movimientos, 'concepto_id', MOMENTOS_INGRESO, emptyTotalesIngreso);

  return conceptos.map((c) => ({
    ...c,
    totales: totalesMap[c.id] || emptyTotalesIngreso(),
  }));
}

/**
 * Fetch movimientos presupuestales de ingreso with optional filters.
 * @param {{ concepto_id?: string, periodo_id?: string, momento?: string }} filter
 */
export async function fetchMovimientosIngreso(filter = {}) {
  if (supabase) {
    let query = supabase
      .from('movimiento_presupuestal_ingreso')
      .select('*, concepto:concepto_ingreso(clave, descripcion, clasificador:clasificador_presupuestal!clasificador_id(codigo, nombre))')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (filter.concepto_id) query = query.eq('concepto_id', filter.concepto_id);
    if (filter.periodo_id) query = query.eq('periodo_id', filter.periodo_id);
    if (filter.momento) query = query.eq('momento', filter.momento);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // localStorage fallback
  let data = await fetchAll('movimiento_presupuestal_ingreso', {
    order: { column: 'fecha', ascending: false },
  });
  if (filter.concepto_id) data = data.filter((m) => m.concepto_id === filter.concepto_id);
  if (filter.periodo_id) data = data.filter((m) => m.periodo_id === filter.periodo_id);
  if (filter.momento) data = data.filter((m) => m.momento === filter.momento);
  return data;
}

/**
 * Fetch a summary of all ingreso movimientos grouped by momento.
 * Returns totals: { estimado, modificado, devengado, recaudado }
 */
export async function fetchResumenIngresos(enteId, ejercicioId) {
  if (supabase) {
    const { data: conceptos, error: cError } = await supabase
      .from('concepto_ingreso')
      .select('id')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId);
    if (cError) throw cError;
    if (!conceptos.length) return emptyTotalesIngreso();

    const conceptoIds = conceptos.map((c) => c.id);
    const { data: movimientos, error: mError } = await supabase
      .from('movimiento_presupuestal_ingreso')
      .select('momento, monto')
      .in('concepto_id', conceptoIds);
    if (mError) throw mError;

    return aggregateResumen(movimientos, MOMENTOS_INGRESO, emptyTotalesIngreso);
  }

  // localStorage fallback
  const conceptos = await fetchAll('concepto_ingreso', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
  });
  if (!conceptos.length) return emptyTotalesIngreso();

  const conceptoIds = new Set(conceptos.map((c) => c.id));
  const allMovs = await fetchAll('movimiento_presupuestal_ingreso');
  const movimientos = allMovs.filter((m) => conceptoIds.has(m.concepto_id));

  return aggregateResumen(movimientos, MOMENTOS_INGRESO, emptyTotalesIngreso);
}
