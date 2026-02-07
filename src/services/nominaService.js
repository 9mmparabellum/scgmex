import { supabase } from '../config/supabase';

// ── Empleados ──
export async function fetchEmpleados(enteId) {
  const { data, error } = await supabase
    .from('empleado')
    .select('*')
    .eq('ente_id', enteId)
    .order('numero_empleado');
  if (error) throw error;
  return data;
}

// ── Tabulador ──
export async function fetchTabulador(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('tabulador')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('nivel');
  if (error) throw error;
  return data;
}

// ── Conceptos de Nomina ──
export async function fetchConceptosNomina(enteId) {
  const { data, error } = await supabase
    .from('concepto_nomina')
    .select('*')
    .eq('ente_id', enteId)
    .order('clave');
  if (error) throw error;
  return data;
}

// ── Periodos de Nomina ──
export async function fetchNominaPeriodos(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('nomina_periodo')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('numero_quincena', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Detalle de Nomina ──
export async function fetchNominaDetalle(nominaPeriodoId) {
  const { data, error } = await supabase
    .from('nomina_detalle')
    .select(
      '*, empleado:empleado!empleado_id(numero_empleado, nombre), concepto:concepto_nomina!concepto_nomina_id(clave, nombre, tipo)'
    )
    .eq('nomina_periodo_id', nominaPeriodoId)
    .order('empleado_id');
  if (error) throw error;
  return data;
}

// ── Resumen de Nomina ──
export async function fetchResumenNomina(enteId, ejercicioId) {
  const [emps, periodos] = await Promise.all([
    supabase
      .from('empleado')
      .select('id, estado')
      .eq('ente_id', enteId),
    supabase
      .from('nomina_periodo')
      .select('total_percepciones, total_deducciones, total_neto, estado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
  ]);

  const empData = emps.data || [];
  const perData = periodos.data || [];

  return {
    totalEmpleados: empData.filter((e) => e.estado === 'activo').length,
    totalQuincenas: perData.length,
    totalPercepciones: perData.reduce(
      (s, p) => s + Number(p.total_percepciones || 0),
      0
    ),
    totalDeducciones: perData.reduce(
      (s, p) => s + Number(p.total_deducciones || 0),
      0
    ),
    totalNeto: perData.reduce((s, p) => s + Number(p.total_neto || 0), 0),
  };
}
