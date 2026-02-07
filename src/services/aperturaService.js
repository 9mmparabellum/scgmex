import { supabase } from '../config/supabase';

export async function fetchAperturas(enteId) {
  const { data, error } = await supabase
    .from('apertura_ejercicio')
    .select('*, ejercicio_origen:ejercicio_fiscal!ejercicio_origen_id(anio, estado), ejercicio_destino:ejercicio_fiscal!ejercicio_destino_id(anio, estado), ejecutador:usuarios!ejecutado_por(nombre)')
    .eq('ente_id', enteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function verificarApertura(enteId, ejercicioOrigenId, ejercicioDestinoId) {
  const checks = { origenExiste: false, origenCerrado: false, destinoExiste: false, destinoAbierto: false, noExisteApertura: true };

  const { data: origen } = await supabase
    .from('ejercicio_fiscal')
    .select('id, anio, estado')
    .eq('id', ejercicioOrigenId)
    .eq('ente_id', enteId)
    .single();
  if (origen) {
    checks.origenExiste = true;
    checks.origenCerrado = origen.estado === 'cerrado';
  }

  const { data: destino } = await supabase
    .from('ejercicio_fiscal')
    .select('id, anio, estado')
    .eq('id', ejercicioDestinoId)
    .eq('ente_id', enteId)
    .single();
  if (destino) {
    checks.destinoExiste = true;
    checks.destinoAbierto = destino.estado === 'abierto';
  }

  const { data: existing } = await supabase
    .from('apertura_ejercicio')
    .select('id')
    .eq('ente_id', enteId)
    .eq('ejercicio_origen_id', ejercicioOrigenId)
    .eq('ejercicio_destino_id', ejercicioDestinoId)
    .maybeSingle();
  if (existing) checks.noExisteApertura = false;

  return checks;
}

export async function ejecutarApertura(enteId, ejercicioOrigenId, ejercicioDestinoId, ejecutadoPor) {
  // Create apertura record
  const { data: apertura, error: aErr } = await supabase
    .from('apertura_ejercicio')
    .insert({
      ente_id: enteId,
      ejercicio_origen_id: ejercicioOrigenId,
      ejercicio_destino_id: ejercicioDestinoId,
      fecha_apertura: new Date().toISOString().slice(0, 10),
      estado: 'procesando',
      ejecutado_por: ejecutadoPor,
    })
    .select()
    .single();
  if (aErr) throw aErr;

  try {
    // Get last periodo of origen for final balances
    const { data: periodosOrigen } = await supabase
      .from('periodo_contable')
      .select('id')
      .eq('ejercicio_id', ejercicioOrigenId)
      .order('numero', { ascending: false })
      .limit(1);

    if (!periodosOrigen?.length) throw new Error('No se encontraron periodos en el ejercicio origen');
    const ultimoPeriodoId = periodosOrigen[0].id;

    // Fetch saldos finales from last period of origin
    const { data: saldosOrigen, error: sErr } = await supabase
      .from('saldo_cuenta')
      .select('cuenta_id, saldo_final')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioOrigenId)
      .eq('periodo_id', ultimoPeriodoId);
    if (sErr) throw sErr;

    // Get first periodo of destino
    const { data: periodosDestino } = await supabase
      .from('periodo_contable')
      .select('id')
      .eq('ejercicio_id', ejercicioDestinoId)
      .order('numero', { ascending: true })
      .limit(1);

    if (!periodosDestino?.length) throw new Error('No se encontraron periodos en el ejercicio destino');
    const primerPeriodoId = periodosDestino[0].id;

    // Create saldo_cuenta records in destino with saldo_inicial = saldo_final from origen
    const newSaldos = saldosOrigen
      .filter(s => Number(s.saldo_final) !== 0)
      .map(s => ({
        ente_id: enteId,
        ejercicio_id: ejercicioDestinoId,
        periodo_id: primerPeriodoId,
        cuenta_id: s.cuenta_id,
        saldo_inicial: Number(s.saldo_final),
        total_debe: 0,
        total_haber: 0,
        saldo_final: Number(s.saldo_final),
      }));

    if (newSaldos.length) {
      const { error: insertErr } = await supabase
        .from('saldo_cuenta')
        .insert(newSaldos);
      if (insertErr) throw insertErr;
    }

    // Compute totals
    let totalDeudor = 0;
    let totalAcreedor = 0;
    for (const s of saldosOrigen) {
      const val = Number(s.saldo_final);
      if (val > 0) totalDeudor += val;
      else totalAcreedor += Math.abs(val);
    }

    // Update apertura as completado
    const { data: updated, error: uErr } = await supabase
      .from('apertura_ejercicio')
      .update({
        estado: 'completado',
        total_cuentas_transferidas: newSaldos.length,
        total_saldo_deudor: totalDeudor,
        total_saldo_acreedor: totalAcreedor,
      })
      .eq('id', apertura.id)
      .select()
      .single();
    if (uErr) throw uErr;

    return updated;
  } catch (err) {
    // Mark as error
    await supabase
      .from('apertura_ejercicio')
      .update({ estado: 'error', observaciones: err.message })
      .eq('id', apertura.id);
    throw err;
  }
}
