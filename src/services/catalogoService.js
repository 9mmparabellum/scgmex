import { supabase } from '../config/supabase';
import CONAC_PLAN_CUENTAS from '../data/conacPlanCuentas';

/**
 * Seeds the complete CONAC Plan de Cuentas (niveles 1-3) for a new ente.
 * Inserts level by level so padre_id references are valid.
 * Returns the number of accounts created.
 */
export async function seedPlanCuentasCONAC(enteId) {
  const codigoToId = {};

  // Group by level
  const nivel1 = CONAC_PLAN_CUENTAS.filter((c) => c.nivel === 1);
  const nivel2 = CONAC_PLAN_CUENTAS.filter((c) => c.nivel === 2);
  const nivel3 = CONAC_PLAN_CUENTAS.filter((c) => c.nivel === 3);

  // Insert nivel 1 (Generos)
  const records1 = nivel1.map((c) => ({
    ente_id: enteId,
    codigo: c.codigo,
    nombre: c.nombre,
    nivel: c.nivel,
    tipo_cuenta: c.tipo,
    naturaleza: c.nat,
    padre_id: null,
    es_detalle: false,
    activo: true,
  }));

  const { data: inserted1, error: err1 } = await supabase
    .from('plan_de_cuentas')
    .insert(records1)
    .select('id, codigo');
  if (err1) throw err1;

  for (const row of inserted1) {
    codigoToId[row.codigo] = row.id;
  }

  // Insert nivel 2 (Grupos)
  const records2 = nivel2.map((c) => {
    const parentCodigo = c.codigo.split('.')[0]; // "1.1" → "1"
    return {
      ente_id: enteId,
      codigo: c.codigo,
      nombre: c.nombre,
      nivel: c.nivel,
      tipo_cuenta: c.tipo,
      naturaleza: c.nat,
      padre_id: codigoToId[parentCodigo] || null,
      es_detalle: false,
      activo: true,
    };
  });

  const { data: inserted2, error: err2 } = await supabase
    .from('plan_de_cuentas')
    .insert(records2)
    .select('id, codigo');
  if (err2) throw err2;

  for (const row of inserted2) {
    codigoToId[row.codigo] = row.id;
  }

  // Insert nivel 3 (Rubros)
  const records3 = nivel3.map((c) => {
    const parts = c.codigo.split('.');
    const parentCodigo = `${parts[0]}.${parts[1]}`; // "1.1.1" → "1.1"
    return {
      ente_id: enteId,
      codigo: c.codigo,
      nombre: c.nombre,
      nivel: c.nivel,
      tipo_cuenta: c.tipo,
      naturaleza: c.nat,
      padre_id: codigoToId[parentCodigo] || null,
      es_detalle: false,
      activo: true,
    };
  });

  const { data: inserted3, error: err3 } = await supabase
    .from('plan_de_cuentas')
    .insert(records3)
    .select('id, codigo');
  if (err3) throw err3;

  return inserted1.length + inserted2.length + inserted3.length;
}

/**
 * Checks if a given ente already has a plan de cuentas.
 */
export async function hasPlanCuentas(enteId) {
  const { count, error } = await supabase
    .from('plan_de_cuentas')
    .select('id', { count: 'exact', head: true })
    .eq('ente_id', enteId);
  if (error) throw error;
  return count > 0;
}
