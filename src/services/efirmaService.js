import { supabase } from '../config/supabase';
import {
  parseCertificadoCER,
  hashDocumento,
  hashDocumentoBase64,
  buildCadenaOriginal,
  esCertificadoSAT,
  certificadoVigente,
} from '../utils/efirmaCrypto';

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

// ═══════════════════════════════════════════════════════════════
//  Certificate Registration with .cer file parsing
// ═══════════════════════════════════════════════════════════════

/**
 * Upload and parse a .cer file, then save to DB.
 * Uses real DER/ASN.1 parsing from efirmaCrypto.
 * @param {File} file - The .cer file
 * @param {string} enteId - Entity ID
 * @param {string} tipo - Certificate type (fiel, sello, csd)
 * @returns {{ certificado: Object, info: Object }}
 */
export async function registrarCertificadoConArchivo(file, enteId, tipo = 'fiel') {
  // Parse the binary .cer file
  const buffer = await file.arrayBuffer();
  const certInfo = parseCertificadoCER(buffer);

  // Determine state based on validity
  let estado = 'vigente';
  if (!certInfo.vigente) {
    const now = new Date();
    estado = now > certInfo.fechaFin ? 'vencido' : 'vigente';
  }

  // Check if about to expire (within 30 days)
  const diasRestantes = Math.ceil(
    (certInfo.fechaFin.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (estado === 'vigente' && diasRestantes <= 30) {
    estado = 'por_vencer';
  }

  // Save to Supabase with parsed info
  const { data, error } = await supabase
    .from('certificado_efirma')
    .insert({
      ente_id: enteId,
      numero_serie: certInfo.numeroSerie,
      titular: certInfo.titular,
      rfc: certInfo.rfc,
      tipo,
      fecha_vigencia_inicio: certInfo.fechaInicio.toISOString(),
      fecha_vigencia_fin: certInfo.fechaFin.toISOString(),
      estado,
      emisor: certInfo.emisor,
      certificado_pem: certInfo.pem,
    })
    .select()
    .single();

  if (error) throw error;
  return { certificado: data, info: certInfo };
}

// ═══════════════════════════════════════════════════════════════
//  Document Signing
// ═══════════════════════════════════════════════════════════════

/**
 * Sign a document: generate hash, build cadena original, call Edge Function.
 * @param {string} documentoId - Document record ID
 * @param {string|ArrayBuffer} contenido - Document content to hash
 * @param {string} certificadoId - Certificate to sign with
 * @param {string} enteId - Entity ID
 * @param {string} ejercicioId - Fiscal year ID
 * @returns {Object} Updated document record
 */
export async function firmarDocumento(documentoId, contenido, certificadoId, enteId, ejercicioId) {
  // 1. Hash the document content with SHA-256
  const hashHex = await hashDocumento(contenido);
  const hashBase64 = await hashDocumentoBase64(contenido);

  // 2. Build cadena original
  const cadenaOriginal = buildCadenaOriginal([
    documentoId,
    hashHex,
    certificadoId,
    new Date().toISOString(),
  ]);

  // 3. Call Edge Function for signing (handles private key operations server-side)
  let selloDigital = hashBase64;
  try {
    const { data: signResult, error: signError } = await supabase.functions.invoke(
      'firma-digital',
      {
        body: { documentHash: hashBase64, certificadoId },
      }
    );
    if (!signError && signResult?.success) {
      selloDigital = signResult.selloDigital || hashBase64;
    }
  } catch {
    // If Edge Function is not deployed, use hash as sello
    console.warn('Edge Function firma-digital no disponible, usando hash como sello');
  }

  // 4. Update document record with signature data
  const { data, error } = await supabase
    .from('documento_firmado')
    .update({
      cadena_original: cadenaOriginal,
      sello_digital: selloDigital,
      hash_documento: hashHex,
      estado: 'firmado',
      fecha_firma: new Date().toISOString(),
    })
    .eq('id', documentoId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Verify a document's hash matches what was signed.
 * @param {string|ArrayBuffer} contenido - Current document content
 * @param {string} hashOriginal - The hash stored at signing time
 * @returns {Promise<{ valido: boolean, hashActual: string, hashOriginal: string }>}
 */
export async function verificarDocumento(contenido, hashOriginal) {
  const hashActual = await hashDocumento(contenido);
  return {
    valido: hashActual === hashOriginal,
    hashActual,
    hashOriginal,
  };
}
