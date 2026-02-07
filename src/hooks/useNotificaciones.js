/**
 * useNotificaciones.js
 * ---------------------------------------------------------------------------
 * React Query mutation hooks for the notification service.
 * Each hook returns a standard useMutation result with { mutate, mutateAsync,
 * isPending, isError, ... } that components can consume directly.
 * ---------------------------------------------------------------------------
 */

import { useMutation } from '@tanstack/react-query';
import {
  enviarNotificacion,
  notificarPolizaPendiente,
  notificarCierrePeriodo,
  notificarCierreEjercicio,
  notificarVencimientoCertificado,
  notificarAlerta,
  notificarRecordatorio,
} from '../services/notificacionService';

/**
 * Generic notification sender.
 * Usage: mutate({ to, subject, tipo, datos })
 */
export function useEnviarNotificacion() {
  return useMutation({
    mutationFn: ({ to, subject, tipo, datos }) =>
      enviarNotificacion(to, subject, tipo, datos),
  });
}

/**
 * Notify approvers about a pending poliza.
 * Usage: mutate({ poliza, destinatarios })
 */
export function useNotificarPoliza() {
  return useMutation({
    mutationFn: ({ poliza, destinatarios }) =>
      notificarPolizaPendiente(poliza, destinatarios),
  });
}

/**
 * Notify about period or fiscal-year closing.
 * Usage: mutate({ tipo: 'periodo' | 'ejercicio', data, destinatarios })
 */
export function useNotificarCierre() {
  return useMutation({
    mutationFn: ({ tipo, data, destinatarios }) => {
      if (tipo === 'periodo') return notificarCierrePeriodo(data, destinatarios);
      if (tipo === 'ejercicio')
        return notificarCierreEjercicio(data.ejercicio, data.resumen, destinatarios);
      throw new Error(`Tipo de cierre no soportado: ${tipo}`);
    },
  });
}

/**
 * Warn about expiring certificates.
 * Usage: mutate({ certificado, destinatarios })
 */
export function useNotificarVencimiento() {
  return useMutation({
    mutationFn: ({ certificado, destinatarios }) =>
      notificarVencimientoCertificado(certificado, destinatarios),
  });
}

/**
 * Send a generic alert.
 * Usage: mutate({ titulo, mensaje, detalles, destinatarios })
 */
export function useNotificarAlerta() {
  return useMutation({
    mutationFn: ({ titulo, mensaje, detalles, destinatarios }) =>
      notificarAlerta(titulo, mensaje, detalles, destinatarios),
  });
}

/**
 * Send a reminder.
 * Usage: mutate({ titulo, mensaje, detalles, destinatarios })
 */
export function useNotificarRecordatorio() {
  return useMutation({
    mutationFn: ({ titulo, mensaje, detalles, destinatarios }) =>
      notificarRecordatorio(titulo, mensaje, detalles, destinatarios),
  });
}
