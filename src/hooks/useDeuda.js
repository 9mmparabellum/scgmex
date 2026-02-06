import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchInstrumentosConSaldo,
  fetchMovimientosDeuda,
  fetchResumenDeuda,
} from '../services/deudaService';

// ── Instrumentos de deuda ───────────────────────────────────────────

export function useInstrumentosDeuda() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['instrumentos_deuda', enteId, ejercicioId],
    queryFn: () => fetchInstrumentosConSaldo(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

// ── Movimientos de deuda ────────────────────────────────────────────

export function useMovimientosDeuda(instrumentoId) {
  return useQuery({
    queryKey: ['movimientos_deuda', instrumentoId],
    queryFn: () => fetchMovimientosDeuda(instrumentoId),
    enabled: !!instrumentoId,
  });
}

// ── Resumen de deuda ────────────────────────────────────────────────

export function useResumenDeuda() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['resumen_deuda', enteId, ejercicioId],
    queryFn: () => fetchResumenDeuda(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}
