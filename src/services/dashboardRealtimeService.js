/**
 * dashboardRealtimeService.js
 * ---------------------------------------------------------------------------
 * Fetches real-time KPIs from existing Supabase tables for the Dashboard
 * Realtime module. No new tables are required.
 * ---------------------------------------------------------------------------
 */

import { supabase } from '../config/supabase';

/**
 * Fetch all KPI data for a given ente and ejercicio fiscal.
 *
 * @param {string} enteId       - UUID of the ente publico
 * @param {string} ejercicioId  - UUID of the ejercicio fiscal
 * @returns {Promise<Object>}   - Aggregated KPI object
 */
export async function fetchKPIsRealtime(enteId, ejercicioId) {
  const [polizas, presEgr, presIng, cxc, cxp, bancos] = await Promise.all([
    supabase
      .from('poliza')
      .select('id, estado, tipo')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
    supabase
      .from('presupuesto_egreso')
      .select('id, aprobado, ejercido, pagado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
    supabase
      .from('presupuesto_ingreso')
      .select('id, estimado, recaudado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
    supabase
      .from('cuenta_por_cobrar')
      .select('id, monto_original, monto_cobrado, estado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
    supabase
      .from('cuenta_por_pagar')
      .select('id, monto_original, monto_pagado, estado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
    supabase
      .from('cuenta_bancaria')
      .select('id, saldo_actual')
      .eq('ente_id', enteId)
      .eq('activo', true),
  ]);

  const polData = polizas.data || [];
  const egrData = presEgr.data || [];
  const ingData = presIng.data || [];
  const cxcData = cxc.data || [];
  const cxpData = cxp.data || [];
  const bancosData = bancos.data || [];

  return {
    polizas: {
      total: polData.length,
      aprobadas: polData.filter((p) => p.estado === 'aprobada').length,
      pendientes: polData.filter((p) => p.estado === 'pendiente').length,
    },
    presupuestoEgresos: {
      aprobado: egrData.reduce((s, e) => s + Number(e.aprobado || 0), 0),
      ejercido: egrData.reduce((s, e) => s + Number(e.ejercido || 0), 0),
      pagado: egrData.reduce((s, e) => s + Number(e.pagado || 0), 0),
    },
    presupuestoIngresos: {
      estimado: ingData.reduce((s, i) => s + Number(i.estimado || 0), 0),
      recaudado: ingData.reduce((s, i) => s + Number(i.recaudado || 0), 0),
    },
    cuentasPorCobrar: {
      total: cxcData.length,
      pendiente: cxcData
        .filter((c) => ['pendiente', 'parcial'].includes(c.estado))
        .reduce((s, c) => s + Number(c.monto_original || 0) - Number(c.monto_cobrado || 0), 0),
    },
    cuentasPorPagar: {
      total: cxpData.length,
      pendiente: cxpData
        .filter((c) => ['pendiente', 'parcial'].includes(c.estado))
        .reduce((s, c) => s + Number(c.monto_original || 0) - Number(c.monto_pagado || 0), 0),
    },
    tesoreria: {
      saldoBancos: bancosData.reduce((s, b) => s + Number(b.saldo_actual || 0), 0),
      cuentasActivas: bancosData.length,
    },
  };
}
