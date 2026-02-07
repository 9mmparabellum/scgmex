import { supabase } from '../config/supabase';

export async function fetchEstadosCuenta(cuentaBancariaId) {
  const { data, error } = await supabase
    .from('estado_cuenta_bancario')
    .select('*, periodo:periodo_contable(nombre, numero)')
    .eq('cuenta_bancaria_id', cuentaBancariaId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchMovimientosEstadoCuenta(estadoCuentaId) {
  const { data, error } = await supabase
    .from('movimiento_estado_cuenta')
    .select('*, movimiento_bancario:movimiento_bancario(referencia, concepto, monto)')
    .eq('estado_cuenta_id', estadoCuentaId)
    .order('fecha');
  if (error) throw error;
  return data;
}

export async function importarEstadoCuenta(cuentaBancariaId, periodoId, fechaCorte, saldoInicial, saldoFinal, archivoNombre, movimientos) {
  // Create estado_cuenta record
  const { data: estado, error: eErr } = await supabase
    .from('estado_cuenta_bancario')
    .insert({
      cuenta_bancaria_id: cuentaBancariaId,
      periodo_id: periodoId,
      fecha_corte: fechaCorte,
      saldo_inicial_banco: saldoInicial,
      saldo_final_banco: saldoFinal,
      archivo_nombre: archivoNombre,
      estado: 'importado',
    })
    .select()
    .single();
  if (eErr) throw eErr;

  // Insert movimientos
  if (movimientos.length) {
    const records = movimientos.map(m => ({
      estado_cuenta_id: estado.id,
      fecha: m.fecha,
      referencia: m.referencia || null,
      concepto: m.concepto || null,
      cargo: Number(m.cargo || 0),
      abono: Number(m.abono || 0),
      saldo: m.saldo != null ? Number(m.saldo) : null,
      conciliado: false,
    }));
    const { error: mErr } = await supabase
      .from('movimiento_estado_cuenta')
      .insert(records);
    if (mErr) throw mErr;
  }

  return estado;
}

export async function ejecutarConciliacionAutomatica(estadoCuentaId, cuentaBancariaId) {
  // Fetch movimientos del estado de cuenta no conciliados
  const { data: movEC, error: e1 } = await supabase
    .from('movimiento_estado_cuenta')
    .select('*')
    .eq('estado_cuenta_id', estadoCuentaId)
    .eq('conciliado', false);
  if (e1) throw e1;

  // Fetch movimientos bancarios no conciliados
  const { data: movBank, error: e2 } = await supabase
    .from('movimiento_bancario')
    .select('*')
    .eq('cuenta_bancaria_id', cuentaBancariaId)
    .eq('conciliado', false);
  if (e2) throw e2;

  let matched = 0;
  for (const ec of movEC) {
    const ecMonto = Math.abs(Number(ec.cargo || 0) - Number(ec.abono || 0));
    const match = movBank.find(b =>
      !b._matched &&
      b.referencia === ec.referencia &&
      Math.abs(Number(b.monto)) === ecMonto &&
      b.fecha === ec.fecha
    );
    if (match) {
      match._matched = true;
      // Update both as conciliado
      await supabase.from('movimiento_estado_cuenta').update({ conciliado: true, movimiento_bancario_id: match.id }).eq('id', ec.id);
      await supabase.from('movimiento_bancario').update({ conciliado: true }).eq('id', match.id);
      matched++;
    }
  }

  // Update estado_cuenta status
  if (matched > 0) {
    await supabase.from('estado_cuenta_bancario').update({ estado: 'en_conciliacion' }).eq('id', estadoCuentaId);
  }

  return { matched, total: movEC.length };
}

export async function fetchResumenConciliacion(estadoCuentaId) {
  const { data: estado, error: eErr } = await supabase
    .from('estado_cuenta_bancario')
    .select('*')
    .eq('id', estadoCuentaId)
    .single();
  if (eErr) throw eErr;

  const { data: movimientos, error: mErr } = await supabase
    .from('movimiento_estado_cuenta')
    .select('conciliado, cargo, abono')
    .eq('estado_cuenta_id', estadoCuentaId);
  if (mErr) throw mErr;

  const conciliados = movimientos.filter(m => m.conciliado);
  const noConciliados = movimientos.filter(m => !m.conciliado);

  return {
    ...estado,
    total_movimientos: movimientos.length,
    conciliados: conciliados.length,
    no_conciliados: noConciliados.length,
    monto_conciliado: conciliados.reduce((s, m) => s + Math.abs(Number(m.cargo || 0) - Number(m.abono || 0)), 0),
    monto_no_conciliado: noConciliados.reduce((s, m) => s + Math.abs(Number(m.cargo || 0) - Number(m.abono || 0)), 0),
  };
}
