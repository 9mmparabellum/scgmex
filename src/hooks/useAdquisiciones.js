import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchProveedores,
  fetchRequisiciones,
  fetchRequisicionDetalle,
  fetchOrdenesCompra,
  fetchCotizaciones,
  fetchResumenAdquisiciones,
} from '../services/adquisicionesService';

export function useProveedores() {
  const { entePublico } = useAppStore();
  return useQuery({
    queryKey: ['proveedores', entePublico?.id],
    queryFn: () => fetchProveedores(entePublico.id),
    enabled: !!entePublico?.id,
  });
}

export function useRequisiciones() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['requisiciones', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchRequisiciones(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useRequisicionDetalle(requisicionId) {
  return useQuery({
    queryKey: ['requisicion_detalle', requisicionId],
    queryFn: () => fetchRequisicionDetalle(requisicionId),
    enabled: !!requisicionId,
  });
}

export function useOrdenesCompra() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['ordenes_compra', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchOrdenesCompra(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useCotizaciones(requisicionId) {
  return useQuery({
    queryKey: ['cotizaciones', requisicionId],
    queryFn: () => fetchCotizaciones(requisicionId),
    enabled: !!requisicionId,
  });
}

export function useResumenAdquisiciones() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['resumen_adquisiciones', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchResumenAdquisiciones(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}
