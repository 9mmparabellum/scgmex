import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchCuentasBancarias,
  fetchMovimientosBancarios,
  fetchCuentasPorCobrar,
  fetchCuentasPorPagar,
  fetchFlujoEfectivo,
  fetchResumenTesoreria,
  registrarCobroCxC,
  registrarPagoCxP,
} from '../services/tesoreriaService';

export function useCuentasBancarias() {
  const { entePublico } = useAppStore();
  return useQuery({
    queryKey: ['cuentas_bancarias', entePublico?.id],
    queryFn: () => fetchCuentasBancarias(entePublico.id),
    enabled: !!entePublico?.id,
  });
}

export function useMovimientosBancarios(cuentaBancariaId, periodoId) {
  return useQuery({
    queryKey: ['movimientos_bancarios', cuentaBancariaId, periodoId],
    queryFn: () => fetchMovimientosBancarios(cuentaBancariaId, periodoId),
    enabled: !!cuentaBancariaId,
  });
}

export function useCuentasPorCobrar() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['cuentas_por_cobrar', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchCuentasPorCobrar(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useCuentasPorPagar() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['cuentas_por_pagar', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchCuentasPorPagar(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useFlujoEfectivo(periodoId) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['flujo_efectivo', entePublico?.id, ejercicioFiscal?.id, periodoId],
    queryFn: () => fetchFlujoEfectivo(entePublico.id, ejercicioFiscal.id, periodoId),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useResumenTesoreria() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['resumen_tesoreria', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchResumenTesoreria(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useRegistrarCobro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cxcId, montoCobro }) => registrarCobroCxC(cxcId, montoCobro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas_por_cobrar'] });
      queryClient.invalidateQueries({ queryKey: ['resumen_tesoreria'] });
    },
  });
}

export function useRegistrarPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cxpId, montoPago }) => registrarPagoCxP(cxpId, montoPago),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas_por_pagar'] });
      queryClient.invalidateQueries({ queryKey: ['resumen_tesoreria'] });
    },
  });
}
