import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/appStore';
import {
  fetchCertificados,
  fetchDocumentosFirmados,
  fetchResumenEFirma,
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
