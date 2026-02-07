import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  validarCierreEjercicio,
  previsualizarCierre,
  ejecutarCierreEjercicio,
  generarPolizaApertura,
} from '../services/cierreEjercicioService';
import { useToastStore } from '../stores/toastStore';

/**
 * Hook to validate whether an ejercicio can be closed.
 * Runs automatically when enteId and ejercicioId are provided.
 */
export function useValidarCierre(enteId, ejercicioId) {
  return useQuery({
    queryKey: ['validar_cierre', enteId, ejercicioId],
    queryFn: () => validarCierreEjercicio(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to preview the closing entries (dry run).
 * Runs automatically when enteId and ejercicioId are provided.
 */
export function usePrevisualizarCierre(enteId, ejercicioId) {
  return useQuery({
    queryKey: ['previsualizar_cierre', enteId, ejercicioId],
    queryFn: () => previsualizarCierre(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Mutation hook to execute the fiscal year closing.
 * Invalidates relevant queries on success.
 */
export function useEjecutarCierre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enteId, ejercicioId, userId }) =>
      ejecutarCierreEjercicio(enteId, ejercicioId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['validar_cierre'] });
      queryClient.invalidateQueries({ queryKey: ['previsualizar_cierre'] });
      queryClient.invalidateQueries({ queryKey: ['ejercicio_fiscal'] });
      queryClient.invalidateQueries({ queryKey: ['poliza'] });
      queryClient.invalidateQueries({ queryKey: ['saldos_cuenta'] });
      queryClient.invalidateQueries({ queryKey: ['aperturas'] });
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Cierre ejecutado',
        message: 'El cierre del ejercicio se realizo correctamente.',
      });
    },
    onError: (err) => {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Error en cierre',
        message: err.message || 'Ocurrio un error al ejecutar el cierre.',
        duration: 8000,
      });
    },
  });
}

/**
 * Mutation hook to generate the opening poliza for a new fiscal year.
 * Invalidates relevant queries on success.
 */
export function useGenerarApertura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enteId, ejercicioOrigenId, ejercicioDestinoId, userId }) =>
      generarPolizaApertura(enteId, ejercicioOrigenId, ejercicioDestinoId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aperturas'] });
      queryClient.invalidateQueries({ queryKey: ['saldos_cuenta'] });
      queryClient.invalidateQueries({ queryKey: ['poliza'] });
      queryClient.invalidateQueries({ queryKey: ['ejercicio_fiscal'] });
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Apertura generada',
        message: 'La poliza de apertura del nuevo ejercicio se genero correctamente.',
      });
    },
    onError: (err) => {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Error en apertura',
        message: err.message || 'Ocurrio un error al generar la poliza de apertura.',
        duration: 8000,
      });
    },
  });
}
