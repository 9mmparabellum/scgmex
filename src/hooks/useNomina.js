import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchEmpleados,
  fetchTabulador,
  fetchConceptosNomina,
  fetchNominaPeriodos,
  fetchNominaDetalle,
  fetchResumenNomina,
} from '../services/nominaService';

export function useEmpleados() {
  const { entePublico } = useAppStore();
  return useQuery({
    queryKey: ['empleados', entePublico?.id],
    queryFn: () => fetchEmpleados(entePublico.id),
    enabled: !!entePublico?.id,
  });
}

export function useTabulador() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['tabulador', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchTabulador(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useConceptosNomina() {
  const { entePublico } = useAppStore();
  return useQuery({
    queryKey: ['conceptos_nomina', entePublico?.id],
    queryFn: () => fetchConceptosNomina(entePublico.id),
    enabled: !!entePublico?.id,
  });
}

export function useNominaPeriodos() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['nomina_periodos', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchNominaPeriodos(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useNominaDetalle(nominaPeriodoId) {
  return useQuery({
    queryKey: ['nomina_detalle', nominaPeriodoId],
    queryFn: () => fetchNominaDetalle(nominaPeriodoId),
    enabled: !!nominaPeriodoId,
  });
}

export function useResumenNomina() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['resumen_nomina', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchResumenNomina(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}
