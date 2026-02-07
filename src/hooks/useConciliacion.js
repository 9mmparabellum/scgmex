import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchConciliaciones,
  fetchConciliacionDetalle,
  generarConciliacion,
  aprobarConciliacion,
} from '../services/conciliacionService';

export function useConciliaciones() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['conciliaciones', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchConciliaciones(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useConciliacionDetalle(conciliacionId) {
  return useQuery({
    queryKey: ['conciliacion_detalle', conciliacionId],
    queryFn: () => fetchConciliacionDetalle(conciliacionId),
    enabled: !!conciliacionId,
  });
}

export function useGenerarConciliacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enteId, ejercicioId, periodoId, elaboradoPor }) =>
      generarConciliacion(enteId, ejercicioId, periodoId, elaboradoPor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conciliaciones'] });
    },
  });
}

export function useAprobarConciliacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conciliacionId, aprobadoPor }) =>
      aprobarConciliacion(conciliacionId, aprobadoPor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conciliaciones'] });
      queryClient.invalidateQueries({ queryKey: ['conciliacion_detalle'] });
    },
  });
}
