import { supabase } from '../config/supabase';

export async function fetchEnvios(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('envio_obligacion')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_limite', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchResumenEnvios(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('envio_obligacion')
    .select('id, tipo, estado, fecha_limite, fecha_envio')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId);
  if (error) throw error;

  const envios = data || [];
  const now = new Date();
  return {
    total: envios.length,
    pendientes: envios.filter((e) => e.estado === 'pendiente').length,
    enviados: envios.filter((e) => ['enviado', 'confirmado'].includes(e.estado)).length,
    vencidos: envios.filter(
      (e) => e.estado === 'pendiente' && new Date(e.fecha_limite) < now
    ).length,
    rechazados: envios.filter((e) => e.estado === 'rechazado').length,
  };
}
