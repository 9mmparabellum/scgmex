import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import { fetchEnvios, fetchResumenEnvios } from '../services/envioObligacionesService';

export function useEnvios() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['envios_obligacion', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchEnvios(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useResumenEnvios() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['resumen_envios', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchResumenEnvios(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}
