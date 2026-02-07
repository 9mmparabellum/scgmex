import { supabase } from '../config/supabase';
import {
  timbrarCFDI,
  cancelarCFDI,
  descargarXML,
  descargarPDF,
  validarCFDISAT,
  verificarConexionPAC,
  consultarCSDEnte,
  subirCSDEnte,
  buildCFDIRequest,
} from './facturamaPACService';

// ── CFDI Emitidos ──
export async function fetchCFDIEmitidos(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('cfdi_emitido')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_emision', { ascending: false });
  if (error) throw error;
  return data;
}

// ── CFDI Recibidos ──
export async function fetchCFDIRecibidos(enteId, ejercicioId) {
  const { data, error } = await supabase
    .from('cfdi_recibido')
    .select('*')
    .eq('ente_id', enteId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha_recepcion', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Resumen CFDI ──
export async function fetchResumenCFDI(enteId, ejercicioId) {
  const [emitidos, recibidos] = await Promise.all([
    supabase
      .from('cfdi_emitido')
      .select('id, subtotal, total, estado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
    supabase
      .from('cfdi_recibido')
      .select('id, subtotal, total, estado')
      .eq('ente_id', enteId)
      .eq('ejercicio_id', ejercicioId),
  ]);

  const em = emitidos.data || [];
  const re = recibidos.data || [];

  return {
    totalEmitidos: em.length,
    montoEmitidos: em
      .filter((e) => e.estado !== 'cancelado')
      .reduce((s, e) => s + Number(e.total || 0), 0),
    totalRecibidos: re.length,
    montoRecibidos: re
      .filter((r) => r.estado !== 'cancelado')
      .reduce((s, r) => s + Number(r.total || 0), 0),
    timbrados: em.filter((e) => e.estado === 'timbrado').length,
  };
}

// ── Timbrado via Facturama PAC ──

export async function timbrarCFDIEmitido(cfdiId, formData, emisor) {
  // 1. Build request for Facturama
  const cfdiRequest = buildCFDIRequest(formData, emisor);
  // 2. Send to PAC for timbrado
  const resultado = await timbrarCFDI(cfdiRequest);
  // 3. Update our record with PAC response
  const { error } = await supabase
    .from('cfdi_emitido')
    .update({
      uuid: resultado.Complement?.TaxStamp?.Uuid || resultado.Id,
      estado: 'timbrado',
      pac_id: resultado.Id,
      sello_sat: resultado.Complement?.TaxStamp?.SatSign || '',
      sello_emisor: resultado.Complement?.TaxStamp?.CfdiSign || '',
      certificado_sat: resultado.Complement?.TaxStamp?.SatCertNumber || '',
      fecha_timbrado: resultado.Complement?.TaxStamp?.Date || new Date().toISOString(),
      cadena_original: resultado.OriginalString || '',
    })
    .eq('id', cfdiId);
  if (error) throw error;
  return resultado;
}

export async function cancelarCFDIEmitido(cfdiId, motivo, uuidSustitucion) {
  // Get the PAC ID
  const { data: cfdi } = await supabase
    .from('cfdi_emitido')
    .select('pac_id')
    .eq('id', cfdiId)
    .single();
  if (!cfdi?.pac_id) throw new Error('Este CFDI no ha sido timbrado con el PAC.');

  const resultado = await cancelarCFDI(cfdi.pac_id, motivo, uuidSustitucion);

  await supabase
    .from('cfdi_emitido')
    .update({
      estado: 'cancelado',
      motivo_cancelacion: motivo,
      fecha_cancelacion: new Date().toISOString(),
    })
    .eq('id', cfdiId);

  return resultado;
}

export async function descargarCFDIXML(cfdiId) {
  const { data: cfdi } = await supabase
    .from('cfdi_emitido')
    .select('pac_id')
    .eq('id', cfdiId)
    .single();
  if (!cfdi?.pac_id) throw new Error('Este CFDI no ha sido timbrado.');
  return descargarXML(cfdi.pac_id);
}

export async function descargarCFDIPDF(cfdiId) {
  const { data: cfdi } = await supabase
    .from('cfdi_emitido')
    .select('pac_id')
    .eq('id', cfdiId)
    .single();
  if (!cfdi?.pac_id) throw new Error('Este CFDI no ha sido timbrado.');
  return descargarPDF(cfdi.pac_id);
}

export async function validarCFDIRecibido(cfdiId) {
  const { data: cfdi } = await supabase
    .from('cfdi_recibido')
    .select('*')
    .eq('id', cfdiId)
    .single();
  if (!cfdi) throw new Error('CFDI no encontrado.');

  const resultado = await validarCFDISAT(
    cfdi.emisor_rfc,
    cfdi.receptor_rfc || '',
    String(cfdi.total),
    cfdi.uuid
  );

  await supabase
    .from('cfdi_recibido')
    .update({
      validado_sat: true,
      estado_sat: resultado.Estado || resultado.status,
      fecha_validacion: new Date().toISOString(),
    })
    .eq('id', cfdiId);

  return resultado;
}

export { verificarConexionPAC, consultarCSDEnte, subirCSDEnte };
