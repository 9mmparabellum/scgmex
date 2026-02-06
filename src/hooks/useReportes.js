import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchEstadoSituacionFinanciera,
  fetchEstadoActividades,
  fetchEstadoVariacionHacienda,
  fetchEstadoAnaliticoActivo,
} from '../services/reportesService';

// ── Estado de Situación Financiera ───────────────────────────────────

export function useEstadoSituacionFinanciera(periodoId) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['estado_situacion', enteId, ejercicioId, periodoId],
    queryFn: () => fetchEstadoSituacionFinanciera(enteId, ejercicioId, periodoId),
    enabled: !!enteId && !!ejercicioId && !!periodoId,
  });
}

// ── Estado de Actividades ────────────────────────────────────────────

export function useEstadoActividades(periodoId) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['estado_actividades', enteId, ejercicioId, periodoId],
    queryFn: () => fetchEstadoActividades(enteId, ejercicioId, periodoId),
    enabled: !!enteId && !!ejercicioId && !!periodoId,
  });
}

// ── Estado de Variación en la Hacienda Pública ───────────────────────

export function useEstadoVariacionHacienda(periodoId) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['estado_variacion', enteId, ejercicioId, periodoId],
    queryFn: () => fetchEstadoVariacionHacienda(enteId, ejercicioId, periodoId),
    enabled: !!enteId && !!ejercicioId && !!periodoId,
  });
}

// ── Estado Analítico del Activo ──────────────────────────────────────

export function useEstadoAnaliticoActivo(periodoId) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  return useQuery({
    queryKey: ['estado_analitico', enteId, ejercicioId, periodoId],
    queryFn: () => fetchEstadoAnaliticoActivo(enteId, ejercicioId, periodoId),
    enabled: !!enteId && !!ejercicioId && !!periodoId,
  });
}
