import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchBienesConCuenta,
  fetchResumenPatrimonio,
  fetchInventarios,
  fetchFideicomisos,
} from '../services/patrimonioService';

// ── Bienes patrimoniales ────────────────────────────────────────────

export function useBienes() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['bienes', enteId, ejercicioId],
    queryFn: () => fetchBienesConCuenta(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

export function useResumenPatrimonio() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['resumen_patrimonio', enteId, ejercicioId],
    queryFn: () => fetchResumenPatrimonio(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

// ── Inventarios ─────────────────────────────────────────────────────

export function useInventarios() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['inventarios', enteId, ejercicioId],
    queryFn: () => fetchInventarios(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

// ── Fideicomisos ────────────────────────────────────────────────────

export function useFideicomisos() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['fideicomisos', enteId, ejercicioId],
    queryFn: () => fetchFideicomisos(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}
