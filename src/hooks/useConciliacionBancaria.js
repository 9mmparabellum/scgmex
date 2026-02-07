import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEstadosCuenta,
  fetchMovimientosEstadoCuenta,
  importarEstadoCuenta,
  ejecutarConciliacionAutomatica,
  fetchResumenConciliacion,
} from '../services/conciliacionBancariaService';

export function useEstadosCuenta(cuentaBancariaId) {
  return useQuery({
    queryKey: ['estados_cuenta', cuentaBancariaId],
    queryFn: () => fetchEstadosCuenta(cuentaBancariaId),
    enabled: !!cuentaBancariaId,
  });
}

export function useMovimientosEstadoCuenta(estadoCuentaId) {
  return useQuery({
    queryKey: ['movimientos_estado_cuenta', estadoCuentaId],
    queryFn: () => fetchMovimientosEstadoCuenta(estadoCuentaId),
    enabled: !!estadoCuentaId,
  });
}

export function useImportarEstadoCuenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cuentaBancariaId, periodoId, fechaCorte, saldoInicial, saldoFinal, archivoNombre, movimientos }) =>
      importarEstadoCuenta(cuentaBancariaId, periodoId, fechaCorte, saldoInicial, saldoFinal, archivoNombre, movimientos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados_cuenta'] });
    },
  });
}

export function useConciliacionAutomatica() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ estadoCuentaId, cuentaBancariaId }) =>
      ejecutarConciliacionAutomatica(estadoCuentaId, cuentaBancariaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados_cuenta'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos_estado_cuenta'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos_bancarios'] });
    },
  });
}

export function useResumenConciliacion(estadoCuentaId) {
  return useQuery({
    queryKey: ['resumen_conciliacion', estadoCuentaId],
    queryFn: () => fetchResumenConciliacion(estadoCuentaId),
    enabled: !!estadoCuentaId,
  });
}
