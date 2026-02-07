import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchReportesPersonalizados,
  fetchResumenReportes,
} from '../services/reportesAvanzadosService';

export function useReportesPersonalizados() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['reporte_personalizado', enteId, ejercicioId],
    queryFn: () => fetchReportesPersonalizados(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}

export function useResumenReportes() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['resumen_reportes', enteId, ejercicioId],
    queryFn: () => fetchResumenReportes(enteId, ejercicioId),
    enabled: !!enteId && !!ejercicioId,
  });
}
