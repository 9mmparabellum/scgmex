import { supabase } from '../config/supabase';

export async function fetchConciliaciones(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('conciliacion_contable_presupuestal')
    .select('*, periodo:periodo_contable(nombre, numero), elaborador:usuarios!elaborado_por(nombre), aprobador:usuarios!aprobado_por(nombre)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchConciliacionDetalle(conciliacionId) {
  const { data: conciliacion, error: cErr } = await supabase
    .from('conciliacion_contable_presupuestal')
    .select('*, periodo:periodo_contable(nombre, numero)')
    .eq('id', conciliacionId)
    .single();
  if (cErr) throw cErr;

  const { data: detalle, error: dErr } = await supabase
    .from('conciliacion_detalle')
    .select('*, cuenta:plan_de_cuentas(codigo, nombre), partida:partida_egreso(clave, descripcion), concepto:concepto_ingreso(clave, descripcion)')
    .eq('conciliacion_id', conciliacionId)
    .order('tipo')
    .order('created_at');
  if (dErr) throw dErr;

  return { ...conciliacion, detalle };
}

export async function generarConciliacion(enteId, ejercicioId, periodoId, elaboradoPor) {
  // Fetch saldo_cuenta totals for the period
  const { data: saldos, error: sErr } = await supabase
    .from('saldo_cuenta')
    .select('cuenta_id, total_debe, total_haber, cuenta:plan_de_cuentas(codigo, nombre, tipo_cuenta)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('periodo_id', periodoId);
  if (sErr) throw sErr;

  // Fetch presupuestal egreso totals
  const { data: partidasData, error: pErr } = await supabase
    .from('partida_egreso')
    .select('id, clave, descripcion')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId);
  if (pErr) throw pErr;

  let movEgresos = [];
  if (partidasData.length) {
    const partidaIds = partidasData.map(p => p.id);
    const { data, error } = await supabase
      .from('movimiento_presupuestal_egreso')
      .select('partida_id, momento, monto')
      .in('partida_id', partidaIds)
      .eq('periodo_id', periodoId);
    if (error) throw error;
    movEgresos = data;
  }

  // Fetch presupuestal ingreso totals
  const { data: conceptosData, error: cErr2 } = await supabase
    .from('concepto_ingreso')
    .select('id, clave, descripcion')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId);
  if (cErr2) throw cErr2;

  let movIngresos = [];
  if (conceptosData.length) {
    const conceptoIds = conceptosData.map(c => c.id);
    const { data, error } = await supabase
      .from('movimiento_presupuestal_ingreso')
      .select('concepto_id, momento, monto')
      .in('concepto_id', conceptoIds)
      .eq('periodo_id', periodoId);
    if (error) throw error;
    movIngresos = data;
  }

  // Compute totals
  const totalContable = saldos.reduce((sum, s) => sum + Number(s.total_debe || 0) + Number(s.total_haber || 0), 0);
  const totalPresEgreso = movEgresos.reduce((sum, m) => sum + Number(m.monto || 0), 0);
  const totalPresIngreso = movIngresos.reduce((sum, m) => sum + Number(m.monto || 0), 0);

  // Create conciliacion record
  const { data: conciliacion, error: createErr } = await supabase
    .from('conciliacion_contable_presupuestal')
    .insert({
      ente_id: enteId,
      ejercicio_id: ejercicioId,
      periodo_id: periodoId,
      fecha_elaboracion: new Date().toISOString().slice(0, 10),
      total_contable: totalContable,
      total_presupuestal_egreso: totalPresEgreso,
      total_presupuestal_ingreso: totalPresIngreso,
      diferencia_egreso: totalContable - totalPresEgreso,
      diferencia_ingreso: totalContable - totalPresIngreso,
      estado: 'borrador',
      elaborado_por: elaboradoPor,
    })
    .select()
    .single();
  if (createErr) throw createErr;

  // Create detalle rows for egresos
  const detalleEgresos = partidasData.map(p => {
    const presTotal = movEgresos
      .filter(m => m.partida_id === p.id)
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
    return {
      conciliacion_id: conciliacion.id,
      tipo: 'egreso',
      partida_egreso_id: p.id,
      monto_contable: 0,
      monto_presupuestal: presTotal,
      diferencia: -presTotal,
      conciliado: false,
    };
  }).filter(d => d.monto_presupuestal !== 0);

  // Create detalle rows for ingresos
  const detalleIngresos = conceptosData.map(c => {
    const presTotal = movIngresos
      .filter(m => m.concepto_id === c.id)
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
    return {
      conciliacion_id: conciliacion.id,
      tipo: 'ingreso',
      concepto_ingreso_id: c.id,
      monto_contable: 0,
      monto_presupuestal: presTotal,
      diferencia: -presTotal,
      conciliado: false,
    };
  }).filter(d => d.monto_presupuestal !== 0);

  const allDetalle = [...detalleEgresos, ...detalleIngresos];
  if (allDetalle.length) {
    const { error: dErr } = await supabase
      .from('conciliacion_detalle')
      .insert(allDetalle);
    if (dErr) throw dErr;
  }

  return conciliacion;
}

export async function aprobarConciliacion(conciliacionId, aprobadoPor) {
  const { data, error } = await supabase
    .from('conciliacion_contable_presupuestal')
    .update({ estado: 'aprobado', aprobado_por: aprobadoPor })
    .eq('id', conciliacionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
