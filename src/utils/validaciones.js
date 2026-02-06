/**
 * validaciones.js
 * Validaciones LGCG para el sistema contable gubernamental.
 */

export const SECUENCIA_MOMENTOS_EGRESO = [
  'aprobado',
  'modificado',
  'comprometido',
  'devengado',
  'ejercido',
  'pagado',
];

export const SECUENCIA_MOMENTOS_INGRESO = [
  'estimado',
  'modificado',
  'devengado',
  'recaudado',
];

/**
 * Valida que la poliza este cuadrada (partida doble).
 * Sum(debe) === Sum(haber)
 */
export function validarPolizaCuadrada(movimientos) {
  const totalDebe = movimientos.reduce((s, m) => s + (parseFloat(m.debe) || 0), 0);
  const totalHaber = movimientos.reduce((s, m) => s + (parseFloat(m.haber) || 0), 0);
  const diferencia = Math.abs(totalDebe - totalHaber);
  return {
    valido: diferencia < 0.01,
    totalDebe,
    totalHaber,
    diferencia,
    mensaje: diferencia < 0.01
      ? null
      : `La poliza no cuadra. Debe: ${totalDebe.toFixed(2)}, Haber: ${totalHaber.toFixed(2)}, Diferencia: ${diferencia.toFixed(2)}`,
  };
}

/**
 * Valida que el periodo este abierto para registrar operaciones.
 */
export function validarPeriodoAbierto(periodo) {
  if (!periodo) return { valido: false, mensaje: 'No se ha seleccionado un periodo' };
  const estado = periodo.estado || periodo.status;
  return {
    valido: estado === 'abierto',
    mensaje: estado === 'abierto' ? null : `El periodo esta ${estado || 'cerrado'}. No se pueden registrar operaciones.`,
  };
}

/**
 * Valida que la cuenta sea de detalle (puede recibir movimientos).
 */
export function validarCuentaDetalle(cuenta) {
  if (!cuenta) return { valido: false, mensaje: 'Cuenta no seleccionada' };
  const esDetalle = cuenta.es_detalle === true || (cuenta.nivel && cuenta.nivel >= 3);
  return {
    valido: esDetalle,
    mensaje: esDetalle ? null : 'Solo se pueden registrar movimientos en cuentas de detalle',
  };
}

/**
 * Valida la secuencia de momentos presupuestales.
 * Un momento solo puede registrarse si el momento anterior en la secuencia
 * ya tiene movimientos registrados.
 */
export function validarMomentoPresupuestal(momentoActual, secuencia) {
  const idx = secuencia.indexOf(momentoActual);
  if (idx === -1) return { valido: false, mensaje: `Momento "${momentoActual}" no reconocido` };
  if (idx === 0) return { valido: true, mensaje: null };
  const momentoPrevio = secuencia[idx - 1];
  return {
    valido: true,
    momentoPrevio,
    mensaje: null,
    advertencia: `Verifique que existan movimientos de "${momentoPrevio}" antes de registrar "${momentoActual}"`,
  };
}
