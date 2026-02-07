import { supabase } from '../config/supabase';

export async function fetchProgramas(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('programa_presupuestario')
    .select('*, clasificador:clasificador_presupuestal!clasificador_programatico_id(codigo, nombre)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('clave');
  if (error) throw error;
  return data;
}

export async function fetchIndicadoresMIR(programaId) {
  const { data, error } = await supabase
    .from('indicador_mir')
    .select('*')
    .eq('programa_id', programaId)
    .order('nivel')
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function fetchMIRCompleta(programaId) {
  const { data: programa, error: pErr } = await supabase
    .from('programa_presupuestario')
    .select('*')
    .eq('id', programaId)
    .single();
  if (pErr) throw pErr;

  const { data: indicadores, error: iErr } = await supabase
    .from('indicador_mir')
    .select('*, avances:avance_indicador(*, periodo:periodo_contable(nombre, numero))')
    .eq('programa_id', programaId)
    .order('nivel')
    .order('created_at');
  if (iErr) throw iErr;

  return { ...programa, indicadores };
}

export async function fetchAvancesIndicador(indicadorId) {
  const { data, error } = await supabase
    .from('avance_indicador')
    .select('*, periodo:periodo_contable(nombre, numero)')
    .eq('indicador_id', indicadorId)
    .order('periodo_contable.numero');
  if (error) throw error;
  return data;
}

export async function fetchResumenProgramatico(enteId, ejercicioId) {
  const { data: programas, error } = await supabase
    .from('programa_presupuestario')
    .select('*, indicadores:indicador_mir(id, nivel, nombre_indicador, meta_programada, meta_alcanzada)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('clave');
  if (error) throw error;
  return programas;
}
