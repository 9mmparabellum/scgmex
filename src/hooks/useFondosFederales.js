import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchFondosConTotales,
  fetchResumenFondos,
} from '../services/fondosFederalesService';

// ── Fondos Federales ─────────────────────────────────────────────────

export function useFondosFederales() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['fondos_federales', enteId, ejercicioId],
    queryFn: () => fetchFondosConTotales(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

export function useResumenFondos() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['resumen_fondos', enteId, ejercicioId],
    queryFn: () => fetchResumenFondos(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}
