import { supabase } from '../config/supabase';

// ── Tipos de cuenta → secciones ─────────────────────────────────────
const TIPOS_ACTIVO = ['activo'];
const TIPOS_PASIVO = ['pasivo'];
const TIPOS_HACIENDA = ['hacienda', 'hacienda_publica'];
const TIPOS_INGRESOS = ['ingresos'];
const TIPOS_GASTOS = ['gastos'];

// ── Helpers ──────────────────────────────────────────────────────────

function buildSaldoMap(saldos) {
  const map = {};
  for (const s of saldos) {
    map[s.cuenta_id] = s;
  }
  return map;
}

function groupCuentasByTipo(cuentas, saldoMap, tipos) {
  const filtered = cuentas.filter((c) => tipos.includes(c.tipo_cuenta));
  let total = 0;
  const items = filtered.map((c) => {
    const saldo = saldoMap[c.id] || {};
    const saldoFinal = Number(saldo.saldo_final) || 0;
    total += saldoFinal;
    return { ...c, saldo_final: saldoFinal };
  });
  return { cuentas: items, total };
}

function attachFullSaldos(cuentas, saldoMap) {
  return cuentas.map((c) => {
    const s = saldoMap[c.id] || {};
    return {
      codigo: c.codigo,
      nombre: c.nombre,
      nivel: c.nivel,
      saldo_inicial: Number(s.saldo_inicial) || 0,
      total_debe: Number(s.total_debe) || 0,
      total_haber: Number(s.total_haber) || 0,
      saldo_final: Number(s.saldo_final) || 0,
    };
  });
}

// ═════════════════════════════════════════════════════════════════════
// Estado de Situacion Financiera (Balance Sheet)
// ═════════════════════════════════════════════════════════════════════

export async function fetchEstadoSituacionFinanciera(enteId, ejercicioId, periodoId) {
  const { data: cuentas, error: cError } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, tipo_cuenta, naturaleza, nivel')
    .eq('ente_id', enteId);
  if (cError) throw cError;

  const { data: saldos, error: sError } = await supabase
    .from('saldo_cuenta')
    .select('cuenta_id, saldo_final')
    .eq('periodo_id', periodoId);
  if (sError) throw sError;

  const saldoMap = buildSaldoMap(saldos);
  return {
    activo: groupCuentasByTipo(cuentas, saldoMap, TIPOS_ACTIVO),
    pasivo: groupCuentasByTipo(cuentas, saldoMap, TIPOS_PASIVO),
    hacienda: groupCuentasByTipo(cuentas, saldoMap, TIPOS_HACIENDA),
  };
}

// ═════════════════════════════════════════════════════════════════════
// Estado de Actividades (Income Statement)
// ═════════════════════════════════════════════════════════════════════

export async function fetchEstadoActividades(enteId, ejercicioId, periodoId) {
  const { data: cuentas, error: cError } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, tipo_cuenta, naturaleza, nivel')
    .eq('ente_id', enteId);
  if (cError) throw cError;

  const { data: saldos, error: sError } = await supabase
    .from('saldo_cuenta')
    .select('cuenta_id, saldo_final')
    .eq('periodo_id', periodoId);
  if (sError) throw sError;

  const saldoMap = buildSaldoMap(saldos);
  const ingresos = groupCuentasByTipo(cuentas, saldoMap, TIPOS_INGRESOS);
  const gastos = groupCuentasByTipo(cuentas, saldoMap, TIPOS_GASTOS);

  return {
    ingresos,
    gastos,
    resultado: ingresos.total - gastos.total,
  };
}

// ═════════════════════════════════════════════════════════════════════
// Estado de Variacion en la Hacienda Publica
// ═════════════════════════════════════════════════════════════════════

export async function fetchEstadoVariacionHacienda(enteId, ejercicioId, periodoId) {
  const { data: cuentas, error: cError } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, tipo_cuenta, naturaleza, nivel')
    .eq('ente_id', enteId)
    .in('tipo_cuenta', TIPOS_HACIENDA);
  if (cError) throw cError;

  const cuentaIds = cuentas.map((c) => c.id);
  const { data: saldos, error: sError } = await supabase
    .from('saldo_cuenta')
    .select('cuenta_id, saldo_final')
    .eq('periodo_id', periodoId)
    .in('cuenta_id', cuentaIds);
  if (sError) throw sError;

  const saldoMap = buildSaldoMap(saldos);
  return buildVariacionGroups(cuentas, saldoMap);
}

function buildVariacionGroups(cuentas, saldoMap) {
  const groups = {
    contribuida: { cuentas: [], total: 0 },
    generada: { cuentas: [], total: 0 },
    exceso: { cuentas: [], total: 0 },
  };

  for (const c of cuentas) {
    const saldo = saldoMap[c.id] || {};
    const saldoFinal = Number(saldo.saldo_final) || 0;
    const item = { ...c, saldo_final: saldoFinal };

    if (c.codigo.startsWith('3.1')) {
      groups.contribuida.cuentas.push(item);
      groups.contribuida.total += saldoFinal;
    } else if (c.codigo.startsWith('3.2')) {
      groups.generada.cuentas.push(item);
      groups.generada.total += saldoFinal;
    } else if (c.codigo.startsWith('3.3')) {
      groups.exceso.cuentas.push(item);
      groups.exceso.total += saldoFinal;
    }
  }

  return groups;
}

// ═════════════════════════════════════════════════════════════════════
// Estado Analitico del Activo
// ═════════════════════════════════════════════════════════════════════

export async function fetchEstadoAnaliticoActivo(enteId, ejercicioId, periodoId) {
  const { data: cuentas, error: cError } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, tipo_cuenta, naturaleza, nivel')
    .eq('ente_id', enteId)
    .eq('tipo_cuenta', 'activo');
  if (cError) throw cError;

  const cuentaIds = cuentas.map((c) => c.id);
  const { data: saldos, error: sError } = await supabase
    .from('saldo_cuenta')
    .select('cuenta_id, saldo_inicial, total_debe, total_haber, saldo_final')
    .eq('periodo_id', periodoId)
    .in('cuenta_id', cuentaIds);
  if (sError) throw sError;

  const saldoMap = buildSaldoMap(saldos);
  return attachFullSaldos(cuentas, saldoMap);
}
