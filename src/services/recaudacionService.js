import { supabase } from '../config/supabase';

// ── Contribuyentes ──────────────────────────────────────────────────
export async function fetchContribuyentes(enteId) {
  const { data, error } = await supabase
    .from('contribuyente')
    .select('*')
    .eq('ente_id', enteId)
    .order('nombre');
  if (error) throw error;
  return data;
}

// ── Padron Fiscal ───────────────────────────────────────────────────
export async function fetchPadron(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('padron_fiscal')
    .select('*, contribuyente:contribuyente!contribuyente_id(nombre, rfc)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('clave_catastral');
  if (error) throw error;
  return data;
}

// ── Cobros ──────────────────────────────────────────────────────────
export async function fetchCobros(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('cobro')
    .select('*, contribuyente:contribuyente!contribuyente_id(nombre, rfc)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Resumen ─────────────────────────────────────────────────────────
export async function fetchResumenRecaudacion(enteId, ejercicioId) {
  const [contribs, padrones, cobrosData] = await Promise.all([
    supabase
      .from('contribuyente')
      .select('id', { count: 'exact' })
      .eq('ente_id', enteId),
    supabase
      .from('padron_fiscal')
      .select('id', { count: 'exact' })
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
    supabase
      .from('cobro')
      .select('id, monto, estado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
  ]);

  const cobros = cobrosData.data || [];
  return {
    totalContribuyentes: contribs.count || 0,
    totalPadron: padrones.count || 0,
    totalCobros: cobros.length,
    montoRecaudado: cobros
      .filter((c) => c.estado === 'aplicado')
      .reduce((s, c) => s + Number(c.monto || 0), 0),
    montoPendiente: cobros
      .filter((c) => c.estado === 'pendiente')
      .reduce((s, c) => s + Number(c.monto || 0), 0),
  };
}
