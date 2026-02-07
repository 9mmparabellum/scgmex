import { supabase } from '../config/supabase';

const NOTAS_TEMPLATE = [
  { tipo_nota: 'desglose', estado_financiero: 'situacion_financiera', numero: 1, titulo: 'Notas al Estado de Situacion Financiera', contenido: '' },
  { tipo_nota: 'desglose', estado_financiero: 'actividades', numero: 2, titulo: 'Notas al Estado de Actividades', contenido: '' },
  { tipo_nota: 'desglose', estado_financiero: 'variacion_hacienda', numero: 3, titulo: 'Notas al Estado de Variacion en la Hacienda Publica', contenido: '' },
  { tipo_nota: 'desglose', estado_financiero: 'flujo_efectivo', numero: 4, titulo: 'Notas al Estado de Flujos de Efectivo', contenido: '' },
  { tipo_nota: 'memoria', estado_financiero: 'general', numero: 1, titulo: 'Notas de Memoria (Cuentas de Orden)', contenido: '' },
  { tipo_nota: 'gestion', estado_financiero: 'general', numero: 1, titulo: 'Notas de Gestion Administrativa', contenido: '' },
  { tipo_nota: 'gestion', estado_financiero: 'general', numero: 2, titulo: 'Politicas de Contabilidad Significativas', contenido: '' },
  { tipo_nota: 'gestion', estado_financiero: 'general', numero: 3, titulo: 'Partes Relacionadas', contenido: '' },
];

export async function fetchNotas(enteId, ejercicioId, periodoId, tipoNota) {
  let query = supabase
    .from('nota_estado_financiero')
    .select('*, elaborador:usuarios!elaborado_por(nombre)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('periodo_id', periodoId)
    .order('tipo_nota')
    .order('numero');
  if (tipoNota) query = query.eq('tipo_nota', tipoNota);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchNotasPorEstadoFinanciero(enteId, ejercicioId, periodoId, estadoFinanciero) {
  const { data, error } = await supabase
    .from('nota_estado_financiero')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('periodo_id', periodoId)
    .eq('estado_financiero', estadoFinanciero)
    .order('numero');
  if (error) throw error;
  return data;
}

export async function generarNotasTemplate(enteId, ejercicioId, periodoId, elaboradoPor) {
  const records = NOTAS_TEMPLATE.map(t => ({
    ente_id: enteId,
    ejercicio_id: ejercicioId,
    periodo_id: periodoId,
    tipo_nota: t.tipo_nota,
    estado_financiero: t.estado_financiero,
    numero: t.numero,
    titulo: t.titulo,
    contenido: t.contenido,
    estado: 'borrador',
    elaborado_por: elaboradoPor,
  }));

  const { data, error } = await supabase
    .from('nota_estado_financiero')
    .insert(records)
    .select();
  if (error) throw error;
  return data;
}
