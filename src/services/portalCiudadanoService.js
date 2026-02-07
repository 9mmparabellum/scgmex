import { supabase } from '../config/supabase';

export async function fetchPublicaciones(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('publicacion_portal')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_publicacion', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchResumenPortal(enteId, ejercicioId) {
  const { data } = await supabase
    .from('publicacion_portal')
    .select('id, tipo, estado')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId);
  const pubs = data || [];
  return {
    total: pubs.length,
    publicados: pubs.filter((p) => p.estado === 'publicado').length,
    enRevision: pubs.filter((p) => p.estado === 'revision').length,
    borradores: pubs.filter((p) => p.estado === 'borrador').length,
  };
}
