import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchPartidasConTotales,
  fetchMovimientosEgreso,
  fetchResumenEgresos,
  fetchConceptosConTotales,
  fetchMovimientosIngreso,
  fetchResumenIngresos,
} from '../services/presupuestoService';

// ── Egresos ─────────────────────────────────────────────────────────

export function usePartidasEgreso() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['partidas_egreso', enteId, ejercicioId],
    queryFn: () => fetchPartidasConTotales(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

export function useMovimientosEgreso(partidaId, periodoId) {
  return useQuery({
    queryKey: ['movimientos_egreso', partidaId, periodoId],
    queryFn: () => fetchMovimientosEgreso({ partida_id: partidaId, periodo_id: periodoId }),
    enabled: !!partidaId || !!periodoId,
  });
}

export function useResumenEgresos() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['resumen_egresos', enteId, ejercicioId],
    queryFn: () => fetchResumenEgresos(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

// ── Ingresos ────────────────────────────────────────────────────────

export function useConceptosIngreso() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['conceptos_ingreso', enteId, ejercicioId],
    queryFn: () => fetchConceptosConTotales(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

export function useMovimientosIngreso(conceptoId, periodoId) {
  return useQuery({
    queryKey: ['movimientos_ingreso', conceptoId, periodoId],
    queryFn: () => fetchMovimientosIngreso({ concepto_id: conceptoId, periodo_id: periodoId }),
    enabled: !!conceptoId || !!periodoId,
  });
}

export function useResumenIngresos() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['resumen_ingresos', enteId, ejercicioId],
    queryFn: () => fetchResumenIngresos(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}
