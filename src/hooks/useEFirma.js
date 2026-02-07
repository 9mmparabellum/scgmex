import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchCertificados,
  fetchDocumentosFirmados,
  fetchResumenEFirma,
  registrarCertificadoConArchivo,
  firmarDocumento,
  verificarDocumento,
} from '../services/efirmaService';

export function useCertificados() {
  const { entePublico } = useAppStore();
  return useQuery({
    queryKey: ['certificado_efirma', entePublico?.id],
    queryFn: () => fetchCertificados(entePublico.id),
    enabled: !!entePublico?.id,
  });
}

export function useDocumentosFirmados() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useQuery({
    queryKey: ['documento_firmado', entePublico?.id, ejercicioFiscal?.id],
    queryFn: () => fetchDocumentosFirmados(entePublico.id, ejercicioFiscal.id),
    enabled: !!entePublico?.id && !!ejercicioFiscal?.id,
  });
}

export function useResumenEFirma() {
  const { entePublico } = useAppStore();
  return useQuery({
    queryKey: ['resumen_efirma', entePublico?.id],
    queryFn: () => fetchResumenEFirma(entePublico.id),
    enabled: !!entePublico?.id,
  });
}

/**
 * Mutation hook: Upload + parse .cer file, save to DB.
 * mutationFn receives { file, tipo } where file is a File object and tipo is 'fiel'|'sello'|'csd'.
 */
export function useRegistrarCertificado() {
  const qc = useQueryClient();
  const { entePublico } = useAppStore();
  return useMutation({
    mutationFn: ({ file, tipo }) =>
      registrarCertificadoConArchivo(file, entePublico?.id, tipo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificado_efirma'] });
      qc.invalidateQueries({ queryKey: ['resumen_efirma'] });
    },
  });
}

/**
 * Mutation hook: Sign a document with e.firma.
 * mutationFn receives { documentoId, contenido, certificadoId }.
 */
export function useFirmarDocumento() {
  const qc = useQueryClient();
  const { entePublico, ejercicioFiscal } = useAppStore();
  return useMutation({
    mutationFn: ({ documentoId, contenido, certificadoId }) =>
      firmarDocumento(
        documentoId,
        contenido,
        certificadoId,
        entePublico?.id,
        ejercicioFiscal?.id
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documento_firmado'] });
      qc.invalidateQueries({ queryKey: ['resumen_efirma'] });
    },
  });
}

/**
 * Mutation hook: Verify a document's integrity by re-hashing.
 * mutationFn receives { contenido, hashOriginal }.
 */
export function useVerificarDocumento() {
  return useMutation({
    mutationFn: ({ contenido, hashOriginal }) =>
      verificarDocumento(contenido, hashOriginal),
  });
}
