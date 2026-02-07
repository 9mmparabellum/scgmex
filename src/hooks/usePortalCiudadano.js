import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchPublicaciones,
  fetchResumenPortal,
} from '../services/portalCiudadanoService';

export function usePublicaciones() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['publicaciones_portal', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchPublicaciones(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useResumenPortal() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['resumen_portal', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchResumenPortal(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}
