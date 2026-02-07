import { supabase } from '../config/supabase';

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

export async function fetchPartidasConTotales(enteId, ejercicioId) {
  const { data: partidas, error: pError } = await supabase
    .from('partida_egreso')
    .select('*, clasificador:clasificador_presupuestal!clasificador_id(codigo, nombre), fuente:clasificador_presupuestal!fuente_id(codigo, nombre)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('clave');
  if (pError) throw pError;
  if (!partidas.length) return [];

  const partidaIds = partidas.map((p) => p.id);
  const { data: movimientos, error: mError } = await supabase
    .from('movimiento_presupuestal_egreso')
    .select('*')
    .in('partida_id', partidaIds);
  if (mError) throw mError;

  const totalesMap = aggregateMovimientos(movimientos, 'partida_id', MOMENTOS_EGRESO, emptyTotalesEgreso);

  return partidas.map((p) => ({
    ...p,
    totales: totalesMap[p.id] || emptyTotalesEgreso(),
  }));
}

export async function fetchMovimientosEgreso(enteId, filter = {}) {
  let query = supabase
    .from('movimiento_presupuestal_egreso')
    .select('*, partida:partida_egreso!inner(clave, descripcion, ente_id, clasificador:clasificador_presupuestal!clasificador_id(codigo, nombre))')
    .eq('partida_egreso.ente_id', enteId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (filter.partida_id) query = query.eq('partida_id', filter.partida_id);
  if (filter.periodo_id) query = query.eq('periodo_id', filter.periodo_id);
  if (filter.momento) query = query.eq('momento', filter.momento);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchResumenEgresos(enteId, ejercicioId) {
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

// ═════════════════════════════════════════════════════════════════════
// INGRESOS
// ═════════════════════════════════════════════════════════════════════

export async function fetchConceptosConTotales(enteId, ejercicioId) {
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

export async function fetchMovimientosIngreso(enteId, filter = {}) {
  let query = supabase
    .from('movimiento_presupuestal_ingreso')
    .select('*, concepto:concepto_ingreso!inner(clave, descripcion, ente_id, clasificador:clasificador_presupuestal!clasificador_id(codigo, nombre))')
    .eq('concepto_ingreso.ente_id', enteId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (filter.concepto_id) query = query.eq('concepto_id', filter.concepto_id);
  if (filter.periodo_id) query = query.eq('periodo_id', filter.periodo_id);
  if (filter.momento) query = query.eq('momento', filter.momento);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchResumenIngresos(enteId, ejercicioId) {
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
