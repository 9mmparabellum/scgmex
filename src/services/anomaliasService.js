/**
 * anomaliasService.js
 * ---------------------------------------------------------------------------
 * Service layer for the IA Anomaly Detection module.
 * Provides queries against `anomalia_detectada` and `regla_anomalia` tables.
 * ---------------------------------------------------------------------------
 */

import { supabase } from '../config/supabase';

/**
 * Fetch all detected anomalies for a given ente + ejercicio, with the related
 * rule information joined via `regla_anomalia`.
 */
export async function fetchAnomalias(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('anomalia_detectada')
    .select('*, regla:regla_anomalia!regla_id(nombre, tipo)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_deteccion', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Fetch all anomaly detection rules for a given ente.
 */
export async function fetchReglas(enteId) {
  const { data, error } = await supabase
    .from('regla_anomalia')
    .select('*')
    .eq('ente_id', enteId)
    .order('nombre');
  if (error) throw error;
  return data;
}

/**
 * Build a summary object from the anomalies list — counts by estado and
 * nivel_riesgo for the dashboard cards.
 */
export async function fetchResumenAnomalias(enteId, ejercicioId) {
  const { data } = await supabase
    .from('anomalia_detectada')
    .select('id, tipo, nivel_riesgo, estado')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId);
  const anomalias = data || [];
  return {
    total: anomalias.length,
    detectadas: anomalias.filter((a) => a.estado === 'detectada').length,
    enRevision: anomalias.filter((a) => a.estado === 'en_revision').length,
    confirmadas: anomalias.filter((a) => a.estado === 'confirmada').length,
    resueltas: anomalias.filter((a) => a.estado === 'resuelta').length,
    descartadas: anomalias.filter((a) => a.estado === 'descartada').length,
    criticas: anomalias.filter((a) => a.nivel_riesgo === 'critico').length,
    altas: anomalias.filter((a) => a.nivel_riesgo === 'alto').length,
    medias: anomalias.filter((a) => a.nivel_riesgo === 'medio').length,
    bajas: anomalias.filter((a) => a.nivel_riesgo === 'bajo').length,
  };
}

/**
 * Trigger the AI analysis engine. In production this would call an RPC or
 * Supabase Edge Function. Falls back to a simulated delay for development.
 */
export async function ejecutarAnalisis(enteId, ejercicioId) {
  try {
    const { data, error } = await supabase.rpc('ejecutar_analisis_anomalias', {
      p_ente_id: enteId,
      p_ejercicio_id: ejercicioId,
    });
    if (error) throw error;
    return data;
  } catch (err) {
    // Fallback: if RPC does not exist yet, return a simulated result
    console.warn('ejecutar_analisis_anomalias RPC not available, simulating:', err.message);
    return { nuevas: 0, mensaje: 'Analisis simulado completado' };
  }
}
