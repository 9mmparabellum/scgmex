import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchCFDIEmitidos,
  fetchCFDIRecibidos,
  fetchResumenCFDI,
} from '../services/cfdiService';

export function useCFDIEmitidos() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['cfdi_emitidos', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchCFDIEmitidos(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useCFDIRecibidos() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['cfdi_recibidos', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchCFDIRecibidos(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useResumenCFDI() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['resumen_cfdi', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchResumenCFDI(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}
