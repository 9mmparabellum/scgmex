import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchIndicadoresFiscales,
  calcularIndicadoresFiscales,
} from '../services/indicadoresService';

export function useIndicadoresFiscales(periodoId) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['indicadores_fiscales', entePublico?.id, ejercicioFiscal?.id, periodoId],
    queryFn: () => fetchIndicadoresFiscales(entePublico.id, ejercicioFiscal.id, periodoId),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id && !!periodoId,
  });
}

export function useCalcularIndicadores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enteId, ejercicioId, periodoId }) =>
      calcularIndicadoresFiscales(enteId, ejercicioId, periodoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_fiscales'] });
    },
  });
}
