import { supabase } from '../config/supabase';

// -- Certificados e.firma --
export async function fetchCertificados(enteId) {
  const { data, error } = await supabase
    .from('certificado_efirma')
    .select('*')
    .eq('ente_id', enteId)
    .order('fecha_vigencia_fin', { ascending: false });
  if (error) throw error;
  return data;
}

// -- Documentos firmados --
export async function fetchDocumentosFirmados(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('documento_firmado')
    .select('*, certificado:certificado_efirma!certificado_id(numero_serie, titular)')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_firma', { ascending: false });
  if (error) throw error;
  return data;
}

// -- Resumen e.firma --
export async function fetchResumenEFirma(enteId) {
  const [certs, docs] = await Promise.all([
    supabase
      .from('certificado_efirma')
      .select('id, tipo, estado, fecha_vigencia_fin')
      .eq('ente_id', enteId),
    supabase
      .from('documento_firmado')
      .select('id, estado')
      .eq('ente_id', enteId),
  ]);

  const certData = certs.data || [];
  const docData = docs.data || [];
  const now = new Date();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  return {
    totalCertificados: certData.length,
    vigentes: certData.filter((c) => c.estado === 'vigente').length,
    porVencer: certData.filter(
      (c) =>
        c.estado === 'vigente' &&
        new Date(c.fecha_vigencia_fin) < new Date(now.getTime() + thirtyDays)
    ).length,
    totalDocumentos: docData.length,
    firmados: docData.filter((d) => d.estado === 'firmado').length,
    pendientes: docData.filter((d) => d.estado === 'pendiente').length,
  };
}
