import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchAperturas,
  verificarApertura,
  ejecutarApertura,
} from '../services/aperturaService';

export function useAperturas() {
  const { entePublico } = useAppStore();
  return useQuery({
    queryKey: ['aperturas', entePublico?.id],
    queryFn: () => fetchAperturas(entePublico.id),
    enabled: !!entePublico?.id,
  });
}

export function useVerificarApertura() {
  const { entePublico } = useAppStore();
  return useMutation({
    mutationFn: ({ ejercicioOrigenId, ejercicioDestinoId }) =>
      verificarApertura(entePublico.id, ejercicioOrigenId, ejercicioDestinoId),
  });
}

export function useEjecutarApertura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enteId, ejercicioOrigenId, ejercicioDestinoId, ejecutadoPor }) =>
      ejecutarApertura(enteId, ejercicioOrigenId, ejercicioDestinoId, ejecutadoPor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aperturas'] });
      queryClient.invalidateQueries({ queryKey: ['saldos_cuenta'] });
    },
  });
}
