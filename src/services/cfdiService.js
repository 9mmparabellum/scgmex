import { supabase } from '../config/supabase';

// ── CFDI Emitidos ──
export async function fetchCFDIEmitidos(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('cfdi_emitido')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_emision', { ascending: false });
  if (error) throw error;
  return data;
}

// ── CFDI Recibidos ──
export async function fetchCFDIRecibidos(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('cfdi_recibido')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_recepcion', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Resumen CFDI ──
export async function fetchResumenCFDI(enteId, ejercicioId) {
  const [emitidos, recibidos] = await Promise.all([
    supabase
      .from('cfdi_emitido')
      .select('id, subtotal, total, estado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
    supabase
      .from('cfdi_recibido')
      .select('id, subtotal, total, estado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
  ]);

  const em = emitidos.data || [];
  const re = recibidos.data || [];

  return {
    totalEmitidos: em.length,
    montoEmitidos: em
      .filter((e) => e.estado !== 'cancelado')
      .reduce((s, e) => s + Number(e.total || 0), 0),
    totalRecibidos: re.length,
    montoRecibidos: re
      .filter((r) => r.estado !== 'cancelado')
      .reduce((s, r) => s + Number(r.total || 0), 0),
  };
}
