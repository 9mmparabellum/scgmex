import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchProgramas,
  fetchIndicadoresMIR,
  fetchMIRCompleta,
  fetchAvancesIndicador,
  fetchResumenProgramatico,
} from '../services/mirService';

export function useProgramas() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['programas', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchProgramas(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useIndicadoresMIR(programaId) {
  return useQuery({
    queryKey: ['indicadores_mir', programaId],
    queryFn: () => fetchIndicadoresMIR(programaId),
    enabled: !!programaId,
  });
}

export function useMIRCompleta(programaId) {
  return useQuery({
    queryKey: ['mir_completa', programaId],
    queryFn: () => fetchMIRCompleta(programaId),
    enabled: !!programaId,
  });
}

export function useAvancesIndicador(indicadorId) {
  return useQuery({
    queryKey: ['avances_indicador', indicadorId],
    queryFn: () => fetchAvancesIndicador(indicadorId),
    enabled: !!indicadorId,
  });
}

export function useResumenProgramatico() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['resumen_programatico', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchResumenProgramatico(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}
