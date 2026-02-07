/**
 * notificacionService.js
 * ---------------------------------------------------------------------------
 * Frontend service for triggering email notifications via the
 * `enviar-notificacion` Supabase Edge Function.
 * ---------------------------------------------------------------------------
 */

import { supabase } from '../config/supabase';

// ── Core sender ────────────────────────────────────────────────────────────

/**
 * Send a notification by invoking the Edge Function.
 *
 * @param {string|string[]} to          - Recipient email(s)
 * @param {string}          subject     - Email subject (prefixed with [SCGMEX] server-side)
 * @param {'alerta'|'recordatorio'|'aprobacion'|'cierre'|'vencimiento'} tipo - Template type
 * @param {Object}          datos       - Template-specific data payload
 * @returns {Promise<Object>} Response from the Edge Function
 */
export async function enviarNotificacion(to, subject, tipo, datos) {
  if (!supabase) {
    console.warn('[notificacionService] Supabase no configurado; notificacion omitida.');
    return { success: false, error: 'Supabase no configurado' };
  }

  const { data, error } = await supabase.functions.invoke('enviar-notificacion', {
    body: {
      to: Array.isArray(to) ? to : [to],
      subject,
      tipo,
      datos,
    },
  });

  if (error) throw error;
  return data;
}

// ── Pre-built notification helpers ─────────────────────────────────────────

/**
 * Notify approvers that a poliza is pending review.
 */
export async function notificarPolizaPendiente(poliza, destinatarios) {
  return enviarNotificacion(
    destinatarios,
    `Poliza ${poliza.numero_poliza} pendiente de aprobacion`,
    'aprobacion',
    {
      titulo: 'Poliza Pendiente de Aprobacion',
      mensaje: `La poliza ${poliza.tipo} #${poliza.numero_poliza} por $${Number(poliza.total).toLocaleString('es-MX')} requiere su aprobacion.`,
      detalles: {
        Tipo: poliza.tipo,
        Numero: poliza.numero_poliza,
        Fecha: poliza.fecha,
        Total: `$${Number(poliza.total).toLocaleString('es-MX')}`,
      },
    },
  );
}

/**
 * Notify stakeholders that a contable period has been closed.
 */
export async function notificarCierrePeriodo(periodo, destinatarios) {
  return enviarNotificacion(
    destinatarios,
    `Periodo ${periodo.nombre} cerrado`,
    'cierre',
    {
      titulo: 'Periodo Contable Cerrado',
      mensaje: `El periodo ${periodo.nombre} ha sido cerrado exitosamente.`,
      detalles: {
        Periodo: periodo.nombre,
        'Fecha de cierre': new Date().toLocaleDateString('es-MX'),
      },
    },
  );
}

/**
 * Notify stakeholders that a fiscal year has been closed.
 */
export async function notificarCierreEjercicio(ejercicio, resumen, destinatarios) {
  return enviarNotificacion(
    destinatarios,
    `Ejercicio ${ejercicio.anio} cerrado`,
    'cierre',
    {
      titulo: `Cierre del Ejercicio Fiscal ${ejercicio.anio}`,
      mensaje: `El ejercicio fiscal ${ejercicio.anio} ha sido cerrado. Resultado: ${resumen.tipo} por $${Math.abs(resumen.resultado).toLocaleString('es-MX')}.`,
      detalles: {
        Ejercicio: ejercicio.anio,
        Resultado: resumen.tipo,
        Monto: `$${Math.abs(resumen.resultado).toLocaleString('es-MX')}`,
        'Fecha de cierre': new Date().toLocaleDateString('es-MX'),
        ...resumen,
      },
    },
  );
}

/**
 * Warn about an e.Firma certificate nearing its expiration date.
 */
export async function notificarVencimientoCertificado(certificado, destinatarios) {
  return enviarNotificacion(
    destinatarios,
    `Certificado ${certificado.numero_serie} proximo a vencer`,
    'vencimiento',
    {
      titulo: 'Certificado e.Firma Proximo a Vencer',
      mensaje: `El certificado ${certificado.numero_serie} del titular ${certificado.titular} vence el ${certificado.fecha_vigencia_fin}.`,
      detalles: {
        'Numero de serie': certificado.numero_serie,
        Titular: certificado.titular,
        Vencimiento: certificado.fecha_vigencia_fin,
      },
    },
  );
}

/**
 * Send a generic system alert.
 */
export async function notificarAlerta(titulo, mensaje, detalles, destinatarios) {
  return enviarNotificacion(destinatarios, titulo, 'alerta', {
    titulo,
    mensaje,
    detalles,
  });
}

/**
 * Send a reminder notification.
 */
export async function notificarRecordatorio(titulo, mensaje, detalles, destinatarios) {
  return enviarNotificacion(destinatarios, titulo, 'recordatorio', {
    titulo,
    mensaje,
    detalles,
  });
}
