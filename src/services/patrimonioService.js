import { supabase } from '../config/supabase';
import { createPolizaCompleta, getNextNumeroPoliza } from './polizaService';

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

export async function fetchBienesConCuenta(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('bien_patrimonial')
    .select('*, cuenta:plan_de_cuentas!cuenta_contable_id(codigo, nombre)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('clave');
  if (error) throw error;
  return data;
}

export async function fetchResumenPatrimonio(enteId, ejercicioId) {
  const { data: bienes, error } = await supabase
    .from('bien_patrimonial')
    .select('tipo, valor_adquisicion, depreciacion_acumulada')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId);
  if (error) throw error;
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

export async function fetchInventarios(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('inventario_conteo')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_conteo', { ascending: false });
  if (error) throw error;
  return data;
}

// ═════════════════════════════════════════════════════════════════════
// FIDEICOMISOS
// ═════════════════════════════════════════════════════════════════════

export async function fetchFideicomisos(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('fideicomiso')
    .select('*, cuenta:plan_de_cuentas!cuenta_contable_id(codigo, nombre)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('clave');
  if (error) throw error;
  return data;
}

// ═════════════════════════════════════════════════════════════════════
// REGISTRO DUAL ART. 40 LGCG
// ═════════════════════════════════════════════════════════════════════

/**
 * Determine the contra-cuenta based on tipo_adquisicion.
 * - 'compra' / 'donacion' / default => looks for 2.1.1 (Cuentas por Pagar)
 * - 'gasto' => looks for 5.x.x (Gasto)
 * Falls back to searching by codigo prefix in the ente's plan de cuentas.
 */
async function resolveContraCuenta(enteId, ejercicioId, tipoAdquisicion) {
  // Map tipo_adquisicion to the prefix of the contra-cuenta
  let prefijo;
  if (tipoAdquisicion === 'gasto') {
    prefijo = '5.';
  } else {
    // compra, donacion, default => cuentas por pagar
    prefijo = '2.1.1';
  }

  const { data, error } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, naturaleza')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('es_detalle', true)
    .like('codigo', `${prefijo}%`)
    .order('codigo')
    .limit(1);
  if (error) throw error;
  if (!data?.length) {
    throw new Error(`No se encontro contra-cuenta con prefijo ${prefijo} para el registro dual.`);
  }
  return data[0];
}

/**
 * Resolve the cuenta de baja (depreciation/expense account for asset decommission).
 * Looks for a detail account with prefix 5.5 (Depreciacion) or 5. (Gastos).
 */
async function resolveCuentaBaja(enteId, ejercicioId) {
  // Try specific depreciation account first
  const { data: depCuentas } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, naturaleza')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('es_detalle', true)
    .like('codigo', '5.5%')
    .order('codigo')
    .limit(1);

  if (depCuentas?.length) return depCuentas[0];

  // Fallback: any expense account
  const { data: gastoCuentas, error } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, naturaleza')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('es_detalle', true)
    .like('codigo', '5.%')
    .order('codigo')
    .limit(1);
  if (error) throw error;
  if (!gastoCuentas?.length) {
    throw new Error('No se encontro cuenta de baja/depreciacion (genero 5) para el registro dual.');
  }
  return gastoCuentas[0];
}

/**
 * Resolve the depreciation contra-cuenta (accumulated depreciation, typically 1.2.6.x).
 * This is a deduction from the asset value.
 */
async function resolveCuentaDepreciacionAcumulada(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('plan_de_cuentas')
    .select('id, codigo, nombre, naturaleza')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('es_detalle', true)
    .like('codigo', '1.2.6%')
    .order('codigo')
    .limit(1);
  if (error) throw error;
  if (!data?.length) {
    throw new Error('No se encontro cuenta de depreciacion acumulada (1.2.6.x) para el registro dual.');
  }
  return data[0];
}

/**
 * Registro Dual Art. 40 - Alta de bien patrimonial
 * When a new bien is registered, auto-generate accounting poliza:
 * - CARGO: cuenta contable del bien (activo - e.g., 1.2.4.x Bienes Muebles)
 * - ABONO: cuenta de origen (e.g., 2.1.1.x Cuentas por Pagar or 5.x.x.x Gasto)
 *
 * @param {Object} bien - The bien record to create (must include cuenta_contable_id, valor_adquisicion)
 * @param {string} enteId - Ente publico ID
 * @param {string} ejercicioId - Ejercicio fiscal ID
 * @param {string} periodoId - Periodo contable ID
 * @param {string} userId - ID of the user performing the operation
 * @returns {{ bien: Object, poliza: Object }}
 */
export async function registrarBienConPoliza(bien, enteId, ejercicioId, periodoId, userId) {
  // 1. Create the bien record
  const { data: newBien, error: bienErr } = await supabase
    .from('bien_patrimonial')
    .insert({
      ...bien,
      ente_id: enteId,
      ejercicio_id: ejercicioId,
      estado: bien.estado || 'activo',
    })
    .select('*, cuenta:plan_de_cuentas!cuenta_contable_id(id, codigo, nombre, naturaleza)')
    .single();
  if (bienErr) throw bienErr;

  // 2. Look up cuenta_contable from the bien's assigned account
  const cuentaActivo = newBien.cuenta;
  if (!cuentaActivo) {
    throw new Error('El bien no tiene una cuenta contable asignada.');
  }

  // 3. Find matching contra-cuenta based on tipo_adquisicion
  const tipoAdquisicion = bien.tipo_adquisicion || 'compra';
  const contraCuenta = await resolveContraCuenta(enteId, ejercicioId, tipoAdquisicion);

  // 4. Create poliza via polizaService.createPolizaCompleta()
  const monto = Number(bien.valor_adquisicion) || 0;
  if (monto <= 0) {
    throw new Error('El valor de adquisicion debe ser mayor a cero para generar poliza.');
  }

  const numeroPoliza = await getNextNumeroPoliza(enteId, ejercicioId, 'diario');
  const today = new Date().toISOString().slice(0, 10);

  const polizaHeader = {
    ente_id: enteId,
    ejercicio_id: ejercicioId,
    periodo_id: periodoId,
    tipo: 'diario',
    numero_poliza: numeroPoliza,
    fecha: today,
    descripcion: `Alta de bien patrimonial: ${newBien.descripcion || newBien.clave} (Registro Dual Art. 40 LGCG)`,
    estado: 'borrador',
    creado_por: userId,
  };

  const movimientos = [
    {
      cuenta_id: cuentaActivo.id,
      concepto: `Alta bien ${newBien.clave} - ${cuentaActivo.codigo} ${cuentaActivo.nombre}`,
      debe: monto,
      haber: 0,
    },
    {
      cuenta_id: contraCuenta.id,
      concepto: `Alta bien ${newBien.clave} - ${contraCuenta.codigo} ${contraCuenta.nombre}`,
      debe: 0,
      haber: monto,
    },
  ];

  const poliza = await createPolizaCompleta(polizaHeader, movimientos);

  // 5. Return { bien, poliza }
  return { bien: newBien, poliza };
}

/**
 * Registro Dual Art. 40 - Baja de bien patrimonial
 * When a bien is decommissioned, auto-generate reverse poliza:
 * - CARGO: cuenta de baja (gasto/depreciacion)
 * - ABONO: cuenta contable del bien (reducing asset)
 *
 * @param {string} bienId - ID of the bien to decommission
 * @param {string} motivoBaja - Reason for decommission
 * @param {string} enteId - Ente publico ID
 * @param {string} ejercicioId - Ejercicio fiscal ID
 * @param {string} periodoId - Periodo contable ID
 * @param {string} userId - ID of the user performing the operation
 * @returns {{ bien: Object, poliza: Object }}
 */
export async function darBajaBienConPoliza(bienId, motivoBaja, enteId, ejercicioId, periodoId, userId) {
  // 1. Fetch the bien record with its cuenta contable
  const { data: bien, error: fetchErr } = await supabase
    .from('bien_patrimonial')
    .select('*, cuenta:plan_de_cuentas!cuenta_contable_id(id, codigo, nombre, naturaleza)')
    .eq('id', bienId)
    .single();
  if (fetchErr) throw fetchErr;
  if (!bien) throw new Error('Bien patrimonial no encontrado.');
  if (bien.estado === 'baja') throw new Error('El bien ya se encuentra dado de baja.');

  const cuentaActivo = bien.cuenta;
  if (!cuentaActivo) {
    throw new Error('El bien no tiene una cuenta contable asignada.');
  }

  // 2. Update estado to 'baja'
  const { data: updatedBien, error: updateErr } = await supabase
    .from('bien_patrimonial')
    .update({
      estado: 'baja',
      fecha_baja: new Date().toISOString().slice(0, 10),
      motivo_baja: motivoBaja,
    })
    .eq('id', bienId)
    .select()
    .single();
  if (updateErr) throw updateErr;

  // 3. Create reverse poliza
  // Calculate net book value (valor_adquisicion - depreciacion_acumulada)
  const valorAdquisicion = Number(bien.valor_adquisicion) || 0;
  const depreciacionAcumulada = Number(bien.depreciacion_acumulada) || 0;
  const valorNeto = valorAdquisicion - depreciacionAcumulada;

  const cuentaBaja = await resolveCuentaBaja(enteId, ejercicioId);

  const numeroPoliza = await getNextNumeroPoliza(enteId, ejercicioId, 'diario');
  const today = new Date().toISOString().slice(0, 10);

  const polizaHeader = {
    ente_id: enteId,
    ejercicio_id: ejercicioId,
    periodo_id: periodoId,
    tipo: 'diario',
    numero_poliza: numeroPoliza,
    fecha: today,
    descripcion: `Baja de bien patrimonial: ${bien.descripcion || bien.clave} - ${motivoBaja} (Registro Dual Art. 40 LGCG)`,
    estado: 'borrador',
    creado_por: userId,
  };

  const movimientos = [];

  // If there is accumulated depreciation, we need to debit that account too
  if (depreciacionAcumulada > 0) {
    let cuentaDepAcum;
    try {
      cuentaDepAcum = await resolveCuentaDepreciacionAcumulada(enteId, ejercicioId);
    } catch {
      // If no specific depreciation account exists, include full amount in expense
      cuentaDepAcum = null;
    }

    if (cuentaDepAcum) {
      // Debit: Depreciation accumulated (remove from balance)
      movimientos.push({
        cuenta_id: cuentaDepAcum.id,
        concepto: `Baja bien ${bien.clave} - Depreciacion acumulada`,
        debe: depreciacionAcumulada,
        haber: 0,
      });
    }
  }

  // Debit: Expense/loss account for net book value
  if (valorNeto > 0) {
    movimientos.push({
      cuenta_id: cuentaBaja.id,
      concepto: `Baja bien ${bien.clave} - ${cuentaBaja.codigo} ${cuentaBaja.nombre}`,
      debe: valorNeto,
      haber: 0,
    });
  }

  // Credit: Asset account for full acquisition value
  movimientos.push({
    cuenta_id: cuentaActivo.id,
    concepto: `Baja bien ${bien.clave} - ${cuentaActivo.codigo} ${cuentaActivo.nombre}`,
    debe: 0,
    haber: valorAdquisicion,
  });

  const poliza = await createPolizaCompleta(polizaHeader, movimientos);

  // 4. Return { bien, poliza }
  return { bien: updatedBien, poliza };
}

/**
 * Registro Dual - Depreciacion mensual
 * Generate depreciation poliza for all active bienes with depreciable value.
 * Creates a single poliza with one line per bien:
 * - CARGO: cuenta de depreciacion/gasto (5.5.x)
 * - ABONO: cuenta de depreciacion acumulada (1.2.6.x)
 * Then updates each bien's depreciacion_acumulada.
 *
 * @param {string} enteId - Ente publico ID
 * @param {string} ejercicioId - Ejercicio fiscal ID
 * @param {string} periodoId - Periodo contable ID
 * @param {string} userId - ID of the user performing the operation
 * @returns {{ poliza: Object, bienesAfectados: number }}
 */
export async function registrarDepreciacionMensual(enteId, ejercicioId, periodoId, userId) {
  // 1. Fetch all active bienes with depreciable life
  const { data: bienes, error: fetchErr } = await supabase
    .from('bien_patrimonial')
    .select('*, cuenta:plan_de_cuentas!cuenta_contable_id(id, codigo, nombre)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('estado', 'activo');
  if (fetchErr) throw fetchErr;

  // Filter bienes that have depreciable value remaining
  const bienesDepreciables = (bienes || []).filter((b) => {
    const valor = Number(b.valor_adquisicion) || 0;
    const depAcum = Number(b.depreciacion_acumulada) || 0;
    const vidaUtil = Number(b.vida_util_anios) || 0;
    // Must have positive value, defined useful life, and remaining value
    return valor > 0 && vidaUtil > 0 && depAcum < valor;
  });

  if (!bienesDepreciables.length) {
    return { poliza: null, bienesAfectados: 0 };
  }

  // 2. Resolve accounting accounts for depreciation entries
  const cuentaGastoDep = await resolveCuentaBaja(enteId, ejercicioId);
  const cuentaDepAcumulada = await resolveCuentaDepreciacionAcumulada(enteId, ejercicioId);

  // 3. Calculate monthly depreciation for each bien and build movimientos
  const movimientos = [];
  const updatesPromises = [];
  let totalDepreciacion = 0;

  for (const bien of bienesDepreciables) {
    const valor = Number(bien.valor_adquisicion);
    const depAcum = Number(bien.depreciacion_acumulada) || 0;
    const vidaUtil = Number(bien.vida_util_anios);

    // Monthly depreciation using straight-line method
    // If tasa_depreciacion is set, use it; otherwise calculate from vida_util
    let depMensual;
    const tasa = Number(bien.tasa_depreciacion) || 0;
    if (tasa > 0) {
      depMensual = (valor * (tasa / 100)) / 12;
    } else {
      depMensual = valor / (vidaUtil * 12);
    }

    // Cap at remaining depreciable value
    const remaining = valor - depAcum;
    depMensual = Math.min(depMensual, remaining);
    depMensual = Math.round(depMensual * 100) / 100; // Round to 2 decimals

    if (depMensual <= 0) continue;

    totalDepreciacion += depMensual;

    // CARGO: Gasto por depreciacion
    movimientos.push({
      cuenta_id: cuentaGastoDep.id,
      concepto: `Depreciacion mensual - ${bien.clave} ${bien.descripcion || ''}`.trim(),
      debe: depMensual,
      haber: 0,
    });

    // ABONO: Depreciacion acumulada
    movimientos.push({
      cuenta_id: cuentaDepAcumulada.id,
      concepto: `Depreciacion mensual - ${bien.clave} ${bien.descripcion || ''}`.trim(),
      debe: 0,
      haber: depMensual,
    });

    // Queue update for bien's depreciacion_acumulada
    const newDepAcum = Math.round((depAcum + depMensual) * 100) / 100;
    updatesPromises.push(
      supabase
        .from('bien_patrimonial')
        .update({ depreciacion_acumulada: newDepAcum })
        .eq('id', bien.id)
    );
  }

  if (!movimientos.length) {
    return { poliza: null, bienesAfectados: 0 };
  }

  // 4. Create single poliza with all depreciation movimientos
  const numeroPoliza = await getNextNumeroPoliza(enteId, ejercicioId, 'diario');
  const today = new Date().toISOString().slice(0, 10);

  const polizaHeader = {
    ente_id: enteId,
    ejercicio_id: ejercicioId,
    periodo_id: periodoId,
    tipo: 'diario',
    numero_poliza: numeroPoliza,
    fecha: today,
    descripcion: `Depreciacion mensual de bienes patrimoniales (Registro Dual Art. 40 LGCG) - ${bienesDepreciables.length} bienes`,
    estado: 'borrador',
    creado_por: userId,
  };

  const poliza = await createPolizaCompleta(polizaHeader, movimientos);

  // 5. Update bien.depreciacion_acumulada for each affected bien
  await Promise.all(updatesPromises);

  return { poliza, bienesAfectados: movimientos.length / 2 };
}
