import { supabase } from '../config/supabase';
import { fetchAll, fetchOne, create, update, remove } from './dataService';

export async function getNextNumeroPoliza(enteId, ejercicioId, tipo) {
  if (supabase) {
    const { data, error } = await supabase.rpc('fn_siguiente_numero_poliza', {
      p_ente_id: enteId, p_ejercicio_id: ejercicioId, p_tipo: tipo,
    });
    if (error) throw error;
    return data;
  }
  const polizas = await fetchAll('poliza', { filter: { ente_id: enteId, ejercicio_id: ejercicioId, tipo } });
  return polizas.reduce((max, p) => Math.max(max, p.numero_poliza || 0), 0) + 1;
}

export async function createPolizaCompleta(polizaHeader, movimientos) {
  if (supabase) {
    const { data: poliza, error: pError } = await supabase.from('poliza').insert(polizaHeader).select().single();
    if (pError) throw pError;
    const movsWithId = movimientos.map((m, i) => ({ ...m, poliza_id: poliza.id, numero_linea: i + 1 }));
    const { error: mError } = await supabase.from('movimiento_contable').insert(movsWithId);
    if (mError) throw mError;
    return poliza;
  }
  const poliza = await create('poliza', polizaHeader);
  for (let i = 0; i < movimientos.length; i++) {
    await create('movimiento_contable', { ...movimientos[i], poliza_id: poliza.id, numero_linea: i + 1 });
  }
  return poliza;
}

export async function updatePolizaCompleta(polizaId, polizaChanges, movimientos) {
  if (supabase) {
    const { data: poliza, error: pError } = await supabase.from('poliza').update(polizaChanges).eq('id', polizaId).select().single();
    if (pError) throw pError;
    await supabase.from('movimiento_contable').delete().eq('poliza_id', polizaId);
    const movsWithId = movimientos.map((m, i) => ({ ...m, poliza_id: polizaId, numero_linea: i + 1 }));
    const { error: mError } = await supabase.from('movimiento_contable').insert(movsWithId);
    if (mError) throw mError;
    return poliza;
  }
  const poliza = await update('poliza', polizaId, polizaChanges);
  const existing = await fetchAll('movimiento_contable', { filter: { poliza_id: polizaId } });
  for (const m of existing) await remove('movimiento_contable', m.id);
  for (let i = 0; i < movimientos.length; i++) {
    await create('movimiento_contable', { ...movimientos[i], poliza_id: polizaId, numero_linea: i + 1 });
  }
  return poliza;
}

export async function enviarAprobacion(polizaId) {
  return update('poliza', polizaId, { estado: 'pendiente' });
}

export async function aprobarPoliza(polizaId, aprobadoPor) {
  const poliza = await update('poliza', polizaId, {
    estado: 'aprobada',
    aprobado_por: aprobadoPor,
    aprobado_en: new Date().toISOString(),
  });
  if (supabase) {
    const { error } = await supabase.rpc('fn_actualizar_saldos', { p_poliza_id: polizaId });
    if (error) console.error('Error updating saldos:', error);
  }
  return poliza;
}

export async function cancelarPoliza(polizaId, canceladoPor, motivo) {
  return update('poliza', polizaId, {
    estado: 'cancelada',
    cancelado_por: canceladoPor,
    cancelado_en: new Date().toISOString(),
    motivo_cancelacion: motivo,
  });
}

export async function regresarBorrador(polizaId) {
  return update('poliza', polizaId, { estado: 'borrador' });
}

export async function fetchPolizasConDetalle(filter) {
  if (supabase) {
    let query = supabase.from('poliza').select('*, movimiento_contable(count)')
      .order('fecha', { ascending: false }).order('numero_poliza', { ascending: false });
    for (const [key, value] of Object.entries(filter)) {
      if (value) query = query.eq(key, value);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  return fetchAll('poliza', { filter, order: { column: 'fecha', ascending: false } });
}

export async function fetchPolizaConMovimientos(polizaId) {
  if (supabase) {
    const { data: poliza, error: pError } = await supabase.from('poliza').select('*').eq('id', polizaId).single();
    if (pError) throw pError;
    const { data: movimientos, error: mError } = await supabase.from('movimiento_contable')
      .select('*, plan_de_cuentas(id, codigo, nombre, naturaleza, tipo_cuenta)')
      .eq('poliza_id', polizaId).order('numero_linea');
    if (mError) throw mError;
    return { ...poliza, movimientos };
  }
  const poliza = await fetchOne('poliza', polizaId);
  const allMovs = await fetchAll('movimiento_contable', { filter: { poliza_id: polizaId } });
  return { ...poliza, movimientos: allMovs.sort((a, b) => a.numero_linea - b.numero_linea) };
}

export async function fetchLibroDiario(enteId, ejercicioId, periodoId) {
  if (supabase) {
    const { data, error } = await supabase.from('poliza')
      .select('*, movimiento_contable(*, plan_de_cuentas(codigo, nombre))')
      .eq('ente_id', enteId).eq('ejercicio_id', ejercicioId).eq('periodo_id', periodoId)
      .eq('estado', 'aprobada').order('fecha').order('numero_poliza');
    if (error) throw error;
    return data;
  }
  const polizas = await fetchAll('poliza', { filter: { ente_id: enteId, ejercicio_id: ejercicioId, periodo_id: periodoId, estado: 'aprobada' } });
  return polizas;
}

export async function fetchLibroMayor(enteId, ejercicioId, periodoId) {
  if (supabase) {
    const { data, error } = await supabase.from('movimiento_contable')
      .select('*, poliza!inner(fecha, tipo, numero_poliza, descripcion, estado, ente_id, ejercicio_id, periodo_id), plan_de_cuentas(codigo, nombre, naturaleza, tipo_cuenta)')
      .eq('poliza.ente_id', enteId).eq('poliza.ejercicio_id', ejercicioId)
      .eq('poliza.periodo_id', periodoId).eq('poliza.estado', 'aprobada');
    if (error) throw error;
    return data;
  }
  // localStorage fallback: fetch all approved polizas for period, then their movimientos
  const polizas = await fetchAll('poliza', { filter: { ente_id: enteId, ejercicio_id: ejercicioId, periodo_id: periodoId, estado: 'aprobada' } });
  const allMovs = [];
  for (const p of polizas) {
    const movs = await fetchAll('movimiento_contable', { filter: { poliza_id: p.id } });
    movs.forEach(m => allMovs.push({ ...m, poliza: p }));
  }
  return allMovs;
}
