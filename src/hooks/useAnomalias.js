/**
 * useAnomalias.js
 * ---------------------------------------------------------------------------
 * React Query hooks for the IA Anomaly Detection module.
 * ---------------------------------------------------------------------------
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAnomalias, fetchReglas, fetchResumenAnomalias, ejecutarAnalisis } from '../services/anomaliasService';
import { useToastStore } from '../stores/toastStore';

export function useAnomalias(enteId, ejercicioId) {
  return useQuery({
    queryKey: ['anomalias', enteId, ejercicioId],
    queryFn: () => fetchAnomalias(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

export function useReglas(enteId) {
  return useQuery({
    queryKey: ['reglas_anomalia', enteId],
    queryFn: () => fetchReglas(enteId),
    enabled: !!enteId,
  });
}

export function useResumenAnomalias(enteId, ejercicioId) {
  return useQuery({
    queryKey: ['resumen_anomalias', enteId, ejercicioId],
    queryFn: () => fetchResumenAnomalias(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

export function useEjecutarAnalisis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enteId, ejercicioId }) => ejecutarAnalisis(enteId, ejercicioId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['anomalias'] });
      qc.invalidateQueries({ queryKey: ['resumen_anomalias'] });
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Analisis completado',
        message: data?.mensaje || 'El analisis de anomalias se ejecuto correctamente',
      });
    },
    onError: (err) => {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Error en analisis',
        message: err.message || 'Ocurrio un error al ejecutar el analisis',
      });
    },
  });
}
