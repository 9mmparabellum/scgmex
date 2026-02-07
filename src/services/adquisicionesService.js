import { supabase } from '../config/supabase';

// ── Proveedores ──
export async function fetchProveedores(enteId) {
  const { data, error } = await supabase
    .from('proveedor')
    .select('*')
    .eq('ente_id', enteId)
    .order('razon_social');
  if (error) throw error;
  return data;
}

// ── Requisiciones ──
export async function fetchRequisiciones(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('requisicion')
    .select('*, solicitante:usuarios!solicitado_por(nombre), autorizador:usuarios!autorizado_por(nombre)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('numero', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchRequisicionDetalle(requisicionId) {
  const { data, error } = await supabase
    .from('requisicion_detalle')
    .select('*')
    .eq('requisicion_id', requisicionId)
    .order('numero_linea');
  if (error) throw error;
  return data;
}

// ── Ordenes de Compra ──
export async function fetchOrdenesCompra(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('orden_compra')
    .select('*, proveedor:proveedor!proveedor_id(razon_social, rfc), requisicion:requisicion!requisicion_id(numero)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('numero', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Cotizaciones ──
export async function fetchCotizaciones(requisicionId) {
  const { data, error } = await supabase
    .from('cotizacion')
    .select('*, proveedor:proveedor!proveedor_id(razon_social)')
    .eq('requisicion_id', requisicionId)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Resumen Adquisiciones ──
export async function fetchResumenAdquisiciones(enteId, ejercicioId) {
  const [provs, reqs, ocs] = await Promise.all([
    supabase.from('proveedor').select('id', { count: 'exact' }).eq('ente_id', enteId).eq('activo', true),
    supabase.from('requisicion').select('id, monto_estimado, estado').eq('ente_id', enteId).eq('ejercicio_id', ejercicioId),
    supabase.from('orden_compra').select('id, total, estado').eq('ente_id', enteId).eq('ejercicio_id', ejercicioId),
  ]);

  const reqData = reqs.data || [];
  const ocData = ocs.data || [];

  return {
    totalProveedores: provs.count || 0,
    totalRequisiciones: reqData.length,
    montoRequisiciones: reqData.reduce((s, r) => s + Number(r.monto_estimado || 0), 0),
    totalOrdenes: ocData.length,
    montoOrdenes: ocData.filter(o => o.estado !== 'cancelada').reduce((s, o) => s + Number(o.total || 0), 0),
  };
}
