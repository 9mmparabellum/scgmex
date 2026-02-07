import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchProyectos,
  fetchProyectoById,
  fetchEstimaciones,
  fetchResumenObraPublica,
} from '../services/obraPublicaService';

export function useProyectos() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['proyectos_obra', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchProyectos(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useProyectoById(id) {
  return useQuery({
    queryKey: ['proyecto_obra', id],
    queryFn: () => fetchProyectoById(id),
    enabled: !!id,
  });
}

export function useEstimaciones(proyectoId) {
  return useQuery({
    queryKey: ['estimaciones_obra', proyectoId],
    queryFn: () => fetchEstimaciones(proyectoId),
    enabled: !!proyectoId,
  });
}

export function useResumenObraPublica() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['resumen_obra_publica', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchResumenObraPublica(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}
