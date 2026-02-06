import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import { fetchAll } from '../services/dataService';
import {
  fetchPolizasConDetalle, fetchPolizaConMovimientos,
  createPolizaCompleta, updatePolizaCompleta,
  aprobarPoliza, cancelarPoliza, enviarAprobacion, regresarBorrador,
  getNextNumeroPoliza, fetchLibroDiario, fetchLibroMayor,
} from '../services/polizaService';

export function usePolizasList(extraFilter = {}) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const filter = { ente_id: entePublico?.id, ejercicio_id: ejercicioFiscal?.id, ...extraFilter };
  return useQuery({
    queryKey: ['polizas', filter],
    queryFn: () => fetchPolizasConDetalle(filter),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function usePolizaDetalle(polizaId) {
  return useQuery({
    queryKey: ['poliza', polizaId],
    queryFn: () => fetchPolizaConMovimientos(polizaId),
    enabled: !!polizaId,
  });
}

export function useNextNumeroPoliza(tipo) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['next_numero_poliza', entePublico?.id, ejercicioFiscal?.id, tipo],
    queryFn: () => getNextNumeroPoliza(entePublico?.id, ejercicioFiscal?.id, tipo),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id && !!tipo,
  });
}

export function useCreatePoliza() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ header, movimientos }) => createPolizaCompleta(header, movimientos),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['polizas'] }); qc.invalidateQueries({ queryKey: ['next_numero_poliza'] }); },
  });
}

export function useUpdatePoliza() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes, movimientos }) => updatePolizaCompleta(id, changes, movimientos),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['polizas'] }); qc.invalidateQueries({ queryKey: ['poliza', vars.id] }); },
  });
}

export function useAprobarPoliza() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ polizaId, aprobadoPor }) => aprobarPoliza(polizaId, aprobadoPor),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['polizas'] }); qc.invalidateQueries({ queryKey: ['saldos'] }); },
  });
}

export function useEnviarAprobacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (polizaId) => enviarAprobacion(polizaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polizas'] }),
  });
}

export function useRegresarBorrador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (polizaId) => regresarBorrador(polizaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polizas'] }),
  });
}

export function useCancelarPoliza() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ polizaId, canceladoPor, motivo }) => cancelarPoliza(polizaId, canceladoPor, motivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polizas'] }),
  });
}

export function useSaldosCuenta(periodoId) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['saldos', entePublico?.id, ejercicioFiscal?.id, periodoId],
    queryFn: () => fetchAll('saldo_cuenta', { filter: { ente_id: entePublico?.id, ejercicio_id: ejercicioFiscal?.id, periodo_id: periodoId } }),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id && !!periodoId,
  });
}

export function useLibroDiario(periodoId) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['libro_diario', entePublico?.id, ejercicioFiscal?.id, periodoId],
    queryFn: () => fetchLibroDiario(entePublico?.id, ejercicioFiscal?.id, periodoId),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id && !!periodoId,
  });
}

export function useLibroMayor(periodoId) {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['libro_mayor', entePublico?.id, ejercicioFiscal?.id, periodoId],
    queryFn: () => fetchLibroMayor(entePublico?.id, ejercicioFiscal?.id, periodoId),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id && !!periodoId,
  });
}
