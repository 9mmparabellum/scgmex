import { supabase } from '../config/supabase';

// ── Proyectos ──
export async function fetchProyectos(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('proyecto_obra')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('nombre');
  if (error) throw error;
  return data;
}

export async function fetchProyectoById(id) {
  const { data, error } = await supabase
    .from('proyecto_obra')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ── Estimaciones ──
export async function fetchEstimaciones(proyectoId) {
  const { data, error } = await supabase
    .from('estimacion_obra')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('numero');
  if (error) throw error;
  return data;
}

// ── Resumen ──
export async function fetchResumenObraPublica(enteId, ejercicioId) {
  const [proys, ests] = await Promise.all([
    supabase.from('proyecto_obra').select('id, monto_contratado, estado, avance_fisico').eq('ente_id', enteId).eq('ejercicio_id', ejercicioId),
    supabase.from('estimacion_obra').select('id, monto, estado, proyecto_id').eq('ente_id', enteId).eq('ejercicio_id', ejercicioId),
  ]);

  const proyData = proys.data || [];
  const estData = ests.data || [];

  return {
    totalProyectos: proyData.length,
    montoContratado: proyData.reduce((s, p) => s + Number(p.monto_contratado || 0), 0),
    avanceFisicoPromedio: proyData.length > 0 ? proyData.reduce((s, p) => s + Number(p.avance_fisico || 0), 0) / proyData.length : 0,
    enProceso: proyData.filter(p => p.estado === 'en_proceso').length,
    totalEstimaciones: estData.length,
    montoEstimaciones: estData.reduce((s, e) => s + Number(e.monto || 0), 0),
  };
}
