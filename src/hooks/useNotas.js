import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchNotas,
  fetchNotasPorEstadoFinanciero,
  generarNotasTemplate,
} from '../services/notasService';

export function useNotas(periodoId, tipoNota) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['notas_ef', entePublico?.id, ejercicioFiscal?.id, periodoId, tipoNota],
    queryFn: () => fetchNotas(entePublico.id, ejercicioFiscal.id, periodoId, tipoNota),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id && !!periodoId,
  });
}

export function useNotasPorEF(periodoId, estadoFinanciero) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['notas_ef_por_estado', entePublico?.id, ejercicioFiscal?.id, periodoId, estadoFinanciero],
    queryFn: () => fetchNotasPorEstadoFinanciero(entePublico.id, ejercicioFiscal.id, periodoId, estadoFinanciero),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id && !!periodoId && !!estadoFinanciero,
  });
}

export function useGenerarNotasTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enteId, ejercicioId, periodoId, elaboradoPor }) =>
      generarNotasTemplate(enteId, ejercicioId, periodoId, elaboradoPor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas_ef'] });
    },
  });
}
