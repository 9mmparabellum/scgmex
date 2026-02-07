import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchContribuyentes,
  fetchPadron,
  fetchCobros,
  fetchResumenRecaudacion,
} from '../services/recaudacionService';

export function useContribuyentes() {
  const { entePublico } = useAppStore();
  return useQuery({
    queryKey: ['contribuyentes', entePublico?.id],
    queryFn: () => fetchContribuyentes(entePublico.id),
    enabled: !!entePublico?.id,
  });
}

export function usePadron() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['padron_fiscal', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchPadron(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useCobros() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['cobros', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchCobros(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useResumenRecaudacion() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['resumen_recaudacion', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchResumenRecaudacion(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}
