import { supabase } from '../config/supabase';

// ── Fetch all custom reports for an ente + ejercicio ────────────────

export async function fetchReportesPersonalizados(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('reporte_personalizado')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Summary counts by estado ────────────────────────────────────────

export async function fetchResumenReportes(enteId, ejercicioId) {
  const { data } = await supabase
    .from('reporte_personalizado')
    .select('id, tipo, estado')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId);
  const reps = data || [];
  return {
    total: reps.length,
    generados: reps.filter(r => r.estado === 'generado').length,
    aprobados: reps.filter(r => r.estado === 'aprobado').length,
    exportados: reps.filter(r => r.estado === 'exportado').length,
  };
}
