import { supabase } from '../config/supabase';

// ── Cuentas Bancarias ──
export async function fetchCuentasBancarias(enteId) {
  const { data, error } = await supabase
    .from('cuenta_bancaria')
    .select('*, cuenta_contable:plan_de_cuentas!cuenta_contable_id(codigo, nombre)')
    .eq('ente_id', enteId)
    .order('numero_cuenta');
  if (error) throw error;
  return data;
}

// ── Movimientos Bancarios ──
export async function fetchMovimientosBancarios(cuentaBancariaId, periodoId) {
  let query = supabase
    .from('movimiento_bancario')
    .select('*, poliza:poliza!poliza_id(numero, tipo)')
    .eq('cuenta_bancaria_id', cuentaBancariaId)
    .order('fecha', { ascending: false });
  if (periodoId) query = query.eq('periodo_id', periodoId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ── Cuentas por Cobrar ──
export async function fetchCuentasPorCobrar(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('cuenta_por_cobrar')
    .select('*, cuenta_contable:plan_de_cuentas!cuenta_contable_id(codigo, nombre)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_emision', { ascending: false });
  if (error) throw error;
  return data;
}

export async function registrarCobroCxC(cxcId, montoCobro) {
  // Fetch current CxC
  const { data: cxc, error: fErr } = await supabase
    .from('cuenta_por_cobrar')
    .select('*')
    .eq('id', cxcId)
    .single();
  if (fErr) throw fErr;

  const nuevoMontoCobrado = Number(cxc.monto_cobrado) + Number(montoCobro);
  const nuevoSaldo = Number(cxc.monto_original) - nuevoMontoCobrado;
  const nuevoEstado = nuevoSaldo <= 0 ? 'cobrada' : 'parcial';

  const { data, error } = await supabase
    .from('cuenta_por_cobrar')
    .update({
      monto_cobrado: nuevoMontoCobrado,
      saldo_pendiente: Math.max(0, nuevoSaldo),
      estado: nuevoEstado,
    })
    .eq('id', cxcId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Cuentas por Pagar ──
export async function fetchCuentasPorPagar(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('cuenta_por_pagar')
    .select('*, cuenta_contable:plan_de_cuentas!cuenta_contable_id(codigo, nombre), partida:partida_egreso!partida_egreso_id(clave, descripcion)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_recepcion', { ascending: false });
  if (error) throw error;
  return data;
}

export async function registrarPagoCxP(cxpId, montoPago) {
  const { data: cxp, error: fErr } = await supabase
    .from('cuenta_por_pagar')
    .select('*')
    .eq('id', cxpId)
    .single();
  if (fErr) throw fErr;

  const nuevoMontoPagado = Number(cxp.monto_pagado) + Number(montoPago);
  const nuevoSaldo = Number(cxp.monto_original) - nuevoMontoPagado;
  const nuevoEstado = nuevoSaldo <= 0 ? 'pagada' : 'parcial';

  const { data, error } = await supabase
    .from('cuenta_por_pagar')
    .update({
      monto_pagado: nuevoMontoPagado,
      saldo_pendiente: Math.max(0, nuevoSaldo),
      estado: nuevoEstado,
    })
    .eq('id', cxpId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Flujo de Efectivo ──
export async function fetchFlujoEfectivo(enteId, ejercicioId, periodoId) {
  let query = supabase
    .from('flujo_efectivo')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('categoria')
    .order('concepto');
  if (periodoId) query = query.eq('periodo_id', periodoId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ── Resumen Tesoreria ──
export async function fetchResumenTesoreria(enteId, ejercicioId) {
  const [bancos, cxc, cxp] = await Promise.all([
    supabase.from('cuenta_bancaria').select('saldo_actual').eq('ente_id', enteId).eq('activo', true),
    supabase.from('cuenta_por_cobrar').select('saldo_pendiente').eq('ente_id', enteId).eq('ejercicio_id', ejercicioId).neq('estado', 'cancelada'),
    supabase.from('cuenta_por_pagar').select('saldo_pendiente').eq('ente_id', enteId).eq('ejercicio_id', ejercicioId).neq('estado', 'cancelada'),
  ]);

  return {
    saldoBancos: (bancos.data || []).reduce((s, b) => s + Number(b.saldo_actual || 0), 0),
    totalCxC: (cxc.data || []).reduce((s, c) => s + Number(c.saldo_pendiente || 0), 0),
    totalCxP: (cxp.data || []).reduce((s, c) => s + Number(c.saldo_pendiente || 0), 0),
  };
}
