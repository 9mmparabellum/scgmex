/**
 * polizaHelpers.js
 * ---------------------------------------------------------------------------
 * Utility functions related to polizas contables (journal entries) for the
 * SCGMEX government accounting system.
 * ---------------------------------------------------------------------------
 */

/**
 * Format a poliza number for display.
 * Examples: "I-001", "E-015", "D-003", "A-001", "C-001"
 *
 * @param {string} tipo    - Poliza type (ingreso | egreso | diario | ajuste | cierre).
 * @param {number} numero  - Sequential poliza number.
 * @returns {string} Formatted poliza identifier.
 */
export function formatNumeroPoliza(tipo, numero) {
  const prefixMap = {
    ingreso: 'I',
    egreso: 'E',
    diario: 'D',
    ajuste: 'A',
    cierre: 'C',
  };
  const prefix = prefixMap[tipo] || tipo.charAt(0).toUpperCase();
  return `${prefix}-${String(numero).padStart(3, '0')}`;
}

/**
 * Validate partida doble: the sum of debits must equal the sum of credits
 * within a small floating-point tolerance (0.01).
 *
 * @param {Array} movimientos - Array of objects with `debe` and `haber` properties.
 * @returns {boolean} `true` when debits and credits are balanced.
 */
export function validarPartidaDoble(movimientos) {
  const totalDebe = movimientos.reduce((s, m) => s + (parseFloat(m.debe) || 0), 0);
  const totalHaber = movimientos.reduce((s, m) => s + (parseFloat(m.haber) || 0), 0);
  return Math.abs(totalDebe - totalHaber) < 0.01;
}

/**
 * Check whether a poliza state transition is valid according to the workflow:
 *
 *   borrador  -> pendiente | cancelada
 *   pendiente -> aprobada  | borrador | cancelada
 *   aprobada  -> cancelada
 *   cancelada -> (none)
 *
 * @param {string} estadoActual - Current state of the poliza.
 * @param {string} estadoNuevo  - Desired new state.
 * @returns {boolean} `true` if the transition is allowed.
 */
export function transicionValida(estadoActual, estadoNuevo) {
  const transitions = {
    borrador: ['pendiente', 'cancelada'],
    pendiente: ['aprobada', 'borrador', 'cancelada'],
    aprobada: ['cancelada'],
    cancelada: [],
  };
  return (transitions[estadoActual] || []).includes(estadoNuevo);
}
