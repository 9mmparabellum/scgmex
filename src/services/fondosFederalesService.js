import { supabase } from '../config/supabase';
import { fetchAll } from './dataService';

// ═════════════════════════════════════════════════════════════════════
// Fondos Federales
// ═════════════════════════════════════════════════════════════════════

/**
 * Fetch fondos federales with clasificador join and computed pct_ejercido.
 */
export async function fetchFondosConTotales(enteId, ejercicioId) {
  if (supabase) {
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

  // localStorage fallback
  const fondos = await fetchAll('fondo_federal', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
    order: { column: 'clave', ascending: true },
  });

  return fondos.map((f) => ({
    ...f,
    pct_ejercido: Number(f.monto_asignado) > 0
      ? (Number(f.monto_ejercido) / Number(f.monto_asignado)) * 100
      : 0,
  }));
}

/**
 * Fetch a summary of all fondos federales with aggregated totals.
 * Returns: { total_asignado, total_recibido, total_ejercido, total_reintegrado, pct_avance }
 */
export async function fetchResumenFondos(enteId, ejercicioId) {
  if (supabase) {
    const { data: fondos, error } = await supabase
      .from('fondo_federal')
      .select('monto_asignado, monto_recibido, monto_ejercido, monto_reintegrado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId);
    if (error) throw error;

    return buildResumenFondos(fondos);
  }

  // localStorage fallback
  const fondos = await fetchAll('fondo_federal', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
  });

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
