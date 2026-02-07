import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchCFDIEmitidos,
  fetchCFDIRecibidos,
  fetchResumenCFDI,
  timbrarCFDIEmitido,
  cancelarCFDIEmitido,
  descargarCFDIXML,
  descargarCFDIPDF,
  validarCFDIRecibido,
  verificarConexionPAC,
  consultarCSDEnte,
  subirCSDEnte,
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

// ── PAC Mutation Hooks ──

export function useTimbrarCFDI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cfdiId, formData, emisor }) =>
      timbrarCFDIEmitido(cfdiId, formData, emisor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cfdi_emitidos'] });
      qc.invalidateQueries({ queryKey: ['resumen_cfdi'] });
    },
  });
}

export function useCancelarCFDI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cfdiId, motivo, uuidSustitucion }) =>
      cancelarCFDIEmitido(cfdiId, motivo, uuidSustitucion),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cfdi_emitidos'] });
      qc.invalidateQueries({ queryKey: ['resumen_cfdi'] });
    },
  });
}

export function useDescargarXML() {
  return useMutation({
    mutationFn: (cfdiId) => descargarCFDIXML(cfdiId),
  });
}

export function useDescargarPDF() {
  return useMutation({
    mutationFn: (cfdiId) => descargarCFDIPDF(cfdiId),
  });
}

export function useValidarCFDI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cfdiId) => validarCFDIRecibido(cfdiId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cfdi_recibidos'] });
    },
  });
}

export function useConexionPAC() {
  return useQuery({
    queryKey: ['pac_status'],
    queryFn: verificarConexionPAC,
    staleTime: 60000,
    retry: false,
  });
}

// ── CSD per Ente hooks ──

export function useCSDEnte(rfc) {
  return useQuery({
    queryKey: ['csd_ente', rfc],
    queryFn: () => consultarCSDEnte(rfc),
    enabled: !!rfc,
    staleTime: 120000,
    retry: false,
  });
}

export function useSubirCSD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rfc, cerBase64, keyBase64, password }) =>
      subirCSDEnte(rfc, cerBase64, keyBase64, password),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['csd_ente', variables.rfc] });
      qc.invalidateQueries({ queryKey: ['pac_status'] });
    },
  });
}
