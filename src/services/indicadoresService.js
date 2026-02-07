import { supabase } from '../config/supabase';
import { INDICADORES_PREDEFINIDOS } from '../config/constants';
import { fetchResumenEgresos, fetchResumenIngresos } from './presupuestoService';

export async function fetchIndicadoresFiscales(enteId, ejercicioId, periodoId) {
  const { data, error } = await supabase
    .from('indicador_postura_fiscal')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('periodo_id', periodoId)
    .order('clave');
  if (error) throw error;
  return data;
}

export async function calcularIndicadoresFiscales(enteId, ejercicioId, periodoId) {
  // Fetch current period data
  const resumenEgresos = await fetchResumenEgresos(enteId, ejercicioId);
  const resumenIngresos = await fetchResumenIngresos(enteId, ejercicioId);

  const ingresoTotal = resumenIngresos.recaudado || 0;
  const gastoTotal = resumenEgresos.pagado || 0;

  // Fetch debt summary
  const { data: instrumentos } = await supabase
    .from('instrumento_deuda')
    .select('saldo_vigente')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .eq('estado', 'vigente');
  const deudaTotal = (instrumentos || []).reduce((s, i) => s + Number(i.saldo_vigente || 0), 0);

  const indicadores = INDICADORES_PREDEFINIDOS.map(def => {
    let valor = 0;
    switch (def.clave) {
      case 'ING_TOTAL': valor = ingresoTotal; break;
      case 'GAS_TOTAL': valor = gastoTotal; break;
      case 'BAL_PRES': valor = ingresoTotal - gastoTotal; break;
      case 'AHORRO': valor = ingresoTotal - gastoTotal; break;
      case 'BAL_PRIM': valor = ingresoTotal - gastoTotal + deudaTotal; break;
      case 'END_NETO': valor = deudaTotal; break;
      case 'INV_PUB': valor = resumenEgresos.ejercido || 0; break;
    }
    return {
      ente_id: enteId,
      ejercicio_id: ejercicioId,
      periodo_id: periodoId,
      clave: def.clave,
      nombre: def.nombre,
      categoria: def.categoria,
      valor,
      valor_anterior: 0,
      variacion: 0,
    };
  });

  // Upsert all indicators
  const { data, error } = await supabase
    .from('indicador_postura_fiscal')
    .upsert(indicadores, { onConflict: 'ente_id,ejercicio_id,periodo_id,clave' })
    .select();
  if (error) throw error;
  return data;
}
