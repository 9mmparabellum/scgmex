import { supabase } from '../config/supabase';
import { update } from './dataService';

export async function getNextNumeroPoliza(enteId, ejercicioId, tipo) {
  const { data, error } = await supabase.rpc('fn_siguiente_numero_poliza', {
    p_ente_id: enteId, p_ejercicio_id: ejercicioId, p_tipo: tipo,
  });
  if (error) throw error;
  return data;
}

export async function createPolizaCompleta(polizaHeader, movimientos) {
  const { data: poliza, error: pError } = await supabase.from('poliza').insert(polizaHeader).select().single();
  if (pError) throw pError;
  const movsWithId = movimientos.map((m, i) => ({ ...m, poliza_id: poliza.id, numero_linea: i + 1 }));
  const { error: mError } = await supabase.from('movimiento_contable').insert(movsWithId);
  if (mError) throw mError;
  return poliza;
}

export async function updatePolizaCompleta(polizaId, polizaChanges, movimientos) {
  const { data: poliza, error: pError } = await supabase.from('poliza').update(polizaChanges).eq('id', polizaId).select().single();
  if (pError) throw pError;
  await supabase.from('movimiento_contable').delete().eq('poliza_id', polizaId);
  const movsWithId = movimientos.map((m, i) => ({ ...m, poliza_id: polizaId, numero_linea: i + 1 }));
  const { error: mError } = await supabase.from('movimiento_contable').insert(movsWithId);
  if (mError) throw mError;
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
  const { error } = await supabase.rpc('fn_actualizar_saldos', { p_poliza_id: polizaId });
  if (error) console.error('Error updating saldos:', error);
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
  let query = supabase.from('poliza').select('*, movimiento_contable(count)')
    .order('fecha', { ascending: false }).order('numero_poliza', { ascending: false });
  for (const [key, value] of Object.entries(filter)) {
    if (value) query = query.eq(key, value);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchPolizaConMovimientos(polizaId) {
  const { data: poliza, error: pError } = await supabase.from('poliza').select('*').eq('id', polizaId).single();
  if (pError) throw pError;
  const { data: movimientos, error: mError } = await supabase.from('movimiento_contable')
    .select('*, plan_de_cuentas(id, codigo, nombre, naturaleza, tipo_cuenta)')
    .eq('poliza_id', polizaId).order('numero_linea');
  if (mError) throw mError;
  return { ...poliza, movimientos };
}

export async function fetchLibroDiario(enteId, ejercicioId, periodoId) {
  const { data, error } = await supabase.from('poliza')
    .select('*, movimiento_contable(*, plan_de_cuentas(codigo, nombre))')
    .eq('ente_id', enteId).eq('ejercicio_id', ejercicioId).eq('periodo_id', periodoId)
    .eq('estado', 'aprobada').order('fecha').order('numero_poliza');
  if (error) throw error;
  return data;
}

export async function fetchLibroMayor(enteId, ejercicioId, periodoId) {
  const { data, error } = await supabase.from('movimiento_contable')
    .select('*, poliza!inner(fecha, tipo, numero_poliza, descripcion, estado, ente_id, ejercicio_id, periodo_id), plan_de_cuentas(codigo, nombre, naturaleza, tipo_cuenta)')
    .eq('poliza.ente_id', enteId).eq('poliza.ejercicio_id', ejercicioId)
    .eq('poliza.periodo_id', periodoId).eq('poliza.estado', 'aprobada');
  if (error) throw error;
  return data;
}
