import { supabase } from '../config/supabase';

// ═════════════════════════════════════════════════════════════════════
// Fondos Federales
// ═════════════════════════════════════════════════════════════════════

export async function fetchFondosConTotales(enteId, ejercicioId) {
  const { data: fondos, error } = await supabase
    .from('fondo_federal')
    .select('*, clasificador:clasificador_presupuestal!clasificador_id(codigo, nombre)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('clave');
  if (error) throw error;

  return fondos.map((f) => ({
    ...f,
    pct_ejercido: Number(f.monto_asignado) > 0
      ? (Number(f.monto_ejercido) / Number(f.monto_asignado)) * 100
      : 0,
  }));
}

export async function fetchResumenFondos(enteId, ejercicioId) {
  const { data: fondos, error } = await supabase
    .from('fondo_federal')
    .select('monto_asignado, monto_recibido, monto_ejercido, monto_reintegrado')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId);
  if (error) throw error;

  return buildResumenFondos(fondos);
}

function buildResumenFondos(fondos) {
  let total_asignado = 0;
  let total_recibido = 0;
  let total_ejercido = 0;
  let total_reintegrado = 0;

  for (const f of fondos) {
    total_asignado += Number(f.monto_asignado) || 0;
    total_recibido += Number(f.monto_recibido) || 0;
    total_ejercido += Number(f.monto_ejercido) || 0;
    total_reintegrado += Number(f.monto_reintegrado) || 0;
  }

  return {
    total_asignado,
    total_recibido,
    total_ejercido,
    total_reintegrado,
    pct_avance: total_asignado > 0 ? (total_ejercido / total_asignado) * 100 : 0,
  };
}
