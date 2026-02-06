import { supabase } from '../config/supabase';
import { fetchAll } from './dataService';

// ── Helpers ─────────────────────────────────────────────────────────

function emptyResumenPatrimonio() {
  return {
    total_muebles: 0,
    total_inmuebles: 0,
    total_intangibles: 0,
    valor_total: 0,
    depreciacion_total: 0,
    valor_neto_total: 0,
  };
}

// ═════════════════════════════════════════════════════════════════════
// BIENES PATRIMONIALES
// ═════════════════════════════════════════════════════════════════════

/**
 * Fetch bienes patrimoniales with LEFT JOIN on plan_de_cuentas.
 */
export async function fetchBienesConCuenta(enteId, ejercicioId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('bien_patrimonial')
      .select('*, cuenta:plan_de_cuentas!cuenta_contable_id(codigo, nombre)')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId)
      .order('clave');
    if (error) throw error;
    return data;
  }

  // localStorage fallback
  const data = await fetchAll('bien_patrimonial', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
    order: { column: 'clave', ascending: true },
  });
  return data;
}

/**
 * Fetch a summary of patrimonio: counts by tipo, valor total,
 * depreciacion total, and valor neto.
 */
export async function fetchResumenPatrimonio(enteId, ejercicioId) {
  if (supabase) {
    const { data: bienes, error } = await supabase
      .from('bien_patrimonial')
      .select('tipo, valor_adquisicion, depreciacion_acumulada')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId);
    if (error) throw error;
    return computeResumen(bienes);
  }

  // localStorage fallback
  const bienes = await fetchAll('bien_patrimonial', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
  });
  return computeResumen(bienes);
}

function computeResumen(bienes) {
  const resumen = emptyResumenPatrimonio();
  for (const b of bienes) {
    const tipo = b.tipo;
    if (tipo === 'mueble') resumen.total_muebles++;
    else if (tipo === 'inmueble') resumen.total_inmuebles++;
    else if (tipo === 'intangible') resumen.total_intangibles++;
    resumen.valor_total += Number(b.valor_adquisicion) || 0;
    resumen.depreciacion_total += Number(b.depreciacion_acumulada) || 0;
  }
  resumen.valor_neto_total = resumen.valor_total - resumen.depreciacion_total;
  return resumen;
}

// ═════════════════════════════════════════════════════════════════════
// INVENTARIOS
// ═════════════════════════════════════════════════════════════════════

/**
 * Fetch inventario_conteo records for the given ente/ejercicio.
 */
export async function fetchInventarios(enteId, ejercicioId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('inventario_conteo')
      .select('*')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId)
      .order('fecha_conteo', { ascending: false });
    if (error) throw error;
    return data;
  }

  // localStorage fallback
  const data = await fetchAll('inventario_conteo', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
    order: { column: 'fecha_conteo', ascending: false },
  });
  return data;
}

// ═════════════════════════════════════════════════════════════════════
// FIDEICOMISOS
// ═════════════════════════════════════════════════════════════════════

/**
 * Fetch fideicomisos with LEFT JOIN on plan_de_cuentas.
 */
export async function fetchFideicomisos(enteId, ejercicioId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('fideicomiso')
      .select('*, cuenta:plan_de_cuentas!cuenta_contable_id(codigo, nombre)')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId)
      .order('clave');
    if (error) throw error;
    return data;
  }

  // localStorage fallback
  const data = await fetchAll('fideicomiso', {
    filter: { ente_id: enteId, ejercicio_id: ejercicioId },
    order: { column: 'clave', ascending: true },
  });
  return data;
}
