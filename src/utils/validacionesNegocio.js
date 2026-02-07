/**
 * Validaciones de negocio para LGCG
 * Reglas que aseguran la integridad contable y presupuestal
 */

import { MOMENTOS_GASTO, MOMENTOS_INGRESO } from '../config/constants';

// ── Helpers ─────────────────────────────────────────────────────────

const SECUENCIA_GASTO = MOMENTOS_GASTO.map((m) => m.key);
// ['aprobado', 'modificado', 'comprometido', 'devengado', 'ejercido', 'pagado']

const SECUENCIA_INGRESO = MOMENTOS_INGRESO.map((m) => m.key);
// ['estimado', 'modificado', 'devengado', 'recaudado']

const GASTO_LABELS = Object.fromEntries(MOMENTOS_GASTO.map((m) => [m.key, m.label]));
const INGRESO_LABELS = Object.fromEntries(MOMENTOS_INGRESO.map((m) => [m.key, m.label]));

function getMonto(partida, momento) {
  if (!partida) return 0;
  // Support both partida.totales.momento and partida.momento patterns
  if (partida.totales && typeof partida.totales[momento] === 'number') {
    return partida.totales[momento];
  }
  if (typeof partida[momento] === 'number') {
    return partida[momento];
  }
  return 0;
}

// ═════════════════════════════════════════════════════════════════════
// PRESUPUESTO EGRESOS
// ═════════════════════════════════════════════════════════════════════

/**
 * Valida que los momentos del gasto sigan la secuencia correcta
 * Aprobado -> Modificado -> Comprometido -> Devengado -> Ejercido -> Pagado
 * No se puede registrar un momento si el anterior no existe
 * @param {string} momentoActual - El momento que se quiere registrar
 * @param {Object} partidaPresupuestal - La partida con sus montos por momento
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validarSecuenciaMomento(momentoActual, partidaPresupuestal) {
  const idx = SECUENCIA_GASTO.indexOf(momentoActual);

  if (idx === -1) {
    return { valid: false, error: `Momento "${momentoActual}" no es un momento de gasto valido.` };
  }

  // El primer momento (aprobado) siempre se puede registrar
  if (idx === 0) {
    return { valid: true, error: null };
  }

  // Verificar que todos los momentos anteriores tengan monto > 0
  for (let i = 0; i < idx; i++) {
    const momentoPrevio = SECUENCIA_GASTO[i];
    const montoPrevio = getMonto(partidaPresupuestal, momentoPrevio);
    if (montoPrevio <= 0) {
      return {
        valid: false,
        error: `No se puede registrar "${GASTO_LABELS[momentoActual]}" porque el momento "${GASTO_LABELS[momentoPrevio]}" no tiene monto registrado.`,
      };
    }
  }

  return { valid: true, error: null };
}

/**
 * Valida disponibilidad presupuestal antes de comprometer
 * Regla: comprometido no puede exceder modificado (o aprobado si no hay modificado)
 * @param {number} monto - Monto a comprometer
 * @param {Object} partidaPresupuestal - La partida con sus montos por momento
 * @returns {{ valid: boolean, disponible: number, error: string|null }}
 */
export function validarDisponibilidadPresupuestal(monto, partidaPresupuestal) {
  const modificado = getMonto(partidaPresupuestal, 'modificado');
  const aprobado = getMonto(partidaPresupuestal, 'aprobado');
  const comprometidoActual = getMonto(partidaPresupuestal, 'comprometido');

  // El techo es modificado si existe, de lo contrario aprobado
  const techo = modificado > 0 ? modificado : aprobado;
  const disponible = techo - comprometidoActual;
  const montoNum = Number(monto) || 0;

  if (montoNum <= 0) {
    return { valid: false, disponible, error: 'El monto debe ser mayor a cero.' };
  }

  if (montoNum > disponible) {
    return {
      valid: false,
      disponible,
      error: `Monto ($${montoNum.toLocaleString('es-MX')}) excede la disponibilidad presupuestal ($${disponible.toLocaleString('es-MX')}). Techo: $${techo.toLocaleString('es-MX')}, ya comprometido: $${comprometidoActual.toLocaleString('es-MX')}.`,
    };
  }

  return { valid: true, disponible, error: null };
}

/**
 * Valida que el monto devengado no exceda el comprometido
 * @param {number} montoDevengar - Monto que se quiere devengar
 * @param {Object} partidaPresupuestal - La partida con sus montos por momento
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validarDevengadoVsComprometido(montoDevengar, partidaPresupuestal) {
  const comprometido = getMonto(partidaPresupuestal, 'comprometido');
  const devengadoActual = getMonto(partidaPresupuestal, 'devengado');
  const disponible = comprometido - devengadoActual;
  const montoNum = Number(montoDevengar) || 0;

  if (montoNum <= 0) {
    return { valid: false, error: 'El monto a devengar debe ser mayor a cero.' };
  }

  if (montoNum > disponible) {
    return {
      valid: false,
      error: `El monto a devengar ($${montoNum.toLocaleString('es-MX')}) excede el comprometido disponible ($${disponible.toLocaleString('es-MX')}). Comprometido: $${comprometido.toLocaleString('es-MX')}, ya devengado: $${devengadoActual.toLocaleString('es-MX')}.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Valida que el monto pagado no exceda el devengado
 * @param {number} montoPagar - Monto que se quiere pagar
 * @param {Object} partidaPresupuestal - La partida con sus montos por momento
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validarPagadoVsDevengado(montoPagar, partidaPresupuestal) {
  const devengado = getMonto(partidaPresupuestal, 'devengado');
  const pagadoActual = getMonto(partidaPresupuestal, 'pagado');
  const disponible = devengado - pagadoActual;
  const montoNum = Number(montoPagar) || 0;

  if (montoNum <= 0) {
    return { valid: false, error: 'El monto a pagar debe ser mayor a cero.' };
  }

  if (montoNum > disponible) {
    return {
      valid: false,
      error: `El monto a pagar ($${montoNum.toLocaleString('es-MX')}) excede el devengado disponible ($${disponible.toLocaleString('es-MX')}). Devengado: $${devengado.toLocaleString('es-MX')}, ya pagado: $${pagadoActual.toLocaleString('es-MX')}.`,
    };
  }

  return { valid: true, error: null };
}

// ═════════════════════════════════════════════════════════════════════
// PRESUPUESTO INGRESOS
// ═════════════════════════════════════════════════════════════════════

/**
 * Valida que los montos de ingreso sigan secuencia
 * Estimado -> Modificado -> Devengado -> Recaudado
 * @param {string} momentoActual - El momento que se quiere registrar
 * @param {Object} conceptoIngreso - El concepto con sus montos por momento
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validarSecuenciaMomentoIngreso(momentoActual, conceptoIngreso) {
  const idx = SECUENCIA_INGRESO.indexOf(momentoActual);

  if (idx === -1) {
    return { valid: false, error: `Momento "${momentoActual}" no es un momento de ingreso valido.` };
  }

  // El primer momento (estimado) siempre se puede registrar
  if (idx === 0) {
    return { valid: true, error: null };
  }

  // Verificar que todos los momentos anteriores tengan monto > 0
  for (let i = 0; i < idx; i++) {
    const momentoPrevio = SECUENCIA_INGRESO[i];
    const montoPrevio = getMonto(conceptoIngreso, momentoPrevio);
    if (montoPrevio <= 0) {
      return {
        valid: false,
        error: `No se puede registrar "${INGRESO_LABELS[momentoActual]}" porque el momento "${INGRESO_LABELS[momentoPrevio]}" no tiene monto registrado.`,
      };
    }
  }

  return { valid: true, error: null };
}

// ═════════════════════════════════════════════════════════════════════
// PATRIMONIO
// ═════════════════════════════════════════════════════════════════════

/**
 * Art. 27 LGCG: Los bienes deben registrarse dentro de 30 dias
 * @param {Date|string} fechaAdquisicion
 * @returns {{ valid: boolean, diasRestantes: number, error: string|null }}
 */
export function validarPlazoRegistroBien(fechaAdquisicion) {
  const PLAZO_DIAS = 30;
  const fecha = fechaAdquisicion instanceof Date ? fechaAdquisicion : new Date(fechaAdquisicion);

  if (isNaN(fecha.getTime())) {
    return { valid: false, diasRestantes: 0, error: 'La fecha de adquisicion no es valida.' };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);

  const diffMs = hoy.getTime() - fecha.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diasRestantes = PLAZO_DIAS - diffDias;

  if (diasRestantes < 0) {
    return {
      valid: false,
      diasRestantes,
      error: `El plazo de ${PLAZO_DIAS} dias para registrar el bien ha vencido. Han transcurrido ${diffDias} dias desde la adquisicion (Art. 27 LGCG).`,
    };
  }

  return { valid: true, diasRestantes, error: null };
}

// ═════════════════════════════════════════════════════════════════════
// PERIODO Y EJERCICIO
// ═════════════════════════════════════════════════════════════════════

/**
 * Valida que el periodo contable este abierto antes de registrar
 * @param {Object} periodo - { estado: string, ... }
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validarPeriodoAbierto(periodo) {
  if (!periodo) {
    return { valid: false, error: 'No se ha seleccionado un periodo contable.' };
  }

  const estadosAbiertos = ['abierto', 'activo'];
  const estado = (periodo.estado || '').toLowerCase();

  if (!estadosAbiertos.includes(estado)) {
    return {
      valid: false,
      error: `El periodo contable "${periodo.nombre || periodo.clave || ''}" se encuentra en estado "${estado}". Solo se pueden registrar operaciones en periodos abiertos.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Valida que el ejercicio fiscal este abierto
 * @param {Object} ejercicio - { estado: string, ... }
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validarEjercicioAbierto(ejercicio) {
  if (!ejercicio) {
    return { valid: false, error: 'No se ha seleccionado un ejercicio fiscal.' };
  }

  const estadosAbiertos = ['abierto', 'activo', 'vigente'];
  const estado = (ejercicio.estado || '').toLowerCase();

  if (!estadosAbiertos.includes(estado)) {
    return {
      valid: false,
      error: `El ejercicio fiscal "${ejercicio.anio || ejercicio.nombre || ''}" se encuentra en estado "${estado}". Solo se pueden registrar operaciones en ejercicios abiertos.`,
    };
  }

  return { valid: true, error: null };
}

// ═════════════════════════════════════════════════════════════════════
// POLIZAS CONTABLES
// ═════════════════════════════════════════════════════════════════════

/**
 * Valida partida doble (cargos = abonos)
 * @param {Array} movimientos - [{tipo: 'cargo'|'abono', monto: number}]
 * @returns {{ valid: boolean, diferencia: number, error: string|null }}
 */
export function validarPartidaDoble(movimientos) {
  if (!Array.isArray(movimientos) || movimientos.length === 0) {
    return { valid: false, diferencia: 0, error: 'La poliza no tiene movimientos.' };
  }

  let totalCargos = 0;
  let totalAbonos = 0;

  for (const mov of movimientos) {
    const monto = Number(mov.monto) || 0;
    if (mov.tipo === 'cargo') {
      totalCargos += monto;
    } else if (mov.tipo === 'abono') {
      totalAbonos += monto;
    }
  }

  // Use rounding to avoid floating-point issues (2 decimal precision)
  const diferencia = Math.round((totalCargos - totalAbonos) * 100) / 100;

  if (diferencia !== 0) {
    return {
      valid: false,
      diferencia,
      error: `La poliza no cumple partida doble. Cargos: $${totalCargos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}, Abonos: $${totalAbonos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}. Diferencia: $${Math.abs(diferencia).toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`,
    };
  }

  return { valid: true, diferencia: 0, error: null };
}

/**
 * Valida que la poliza tenga al menos 2 movimientos
 * @param {Array} movimientos
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validarMinMovimientos(movimientos) {
  if (!Array.isArray(movimientos) || movimientos.length < 2) {
    return {
      valid: false,
      error: `La poliza debe tener al menos 2 movimientos (un cargo y un abono). Movimientos actuales: ${Array.isArray(movimientos) ? movimientos.length : 0}.`,
    };
  }

  const tieneCargo = movimientos.some((m) => m.tipo === 'cargo');
  const tieneAbono = movimientos.some((m) => m.tipo === 'abono');

  if (!tieneCargo || !tieneAbono) {
    return {
      valid: false,
      error: 'La poliza debe tener al menos un movimiento de cargo y uno de abono.',
    };
  }

  return { valid: true, error: null };
}

// ═════════════════════════════════════════════════════════════════════
// VALIDACIONES DE IDENTIDAD (RFC, CURP, CLABE)
// ═════════════════════════════════════════════════════════════════════

/**
 * Valida que un proveedor tenga RFC valido (formato SAT)
 * Persona moral: 3 letras + 6 digitos + 3 alfanumericos (12 chars)
 * Persona fisica: 4 letras + 6 digitos + 3 alfanumericos (13 chars)
 * @param {string} rfc
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validarRFC(rfc) {
  if (!rfc || typeof rfc !== 'string') {
    return { valid: false, error: 'El RFC es requerido.' };
  }

  const rfcTrimmed = rfc.trim().toUpperCase();

  // RFC regex: 3-4 letters (including N with tilde and &), 6 digits, 3 alphanumeric
  const rfcRegex = /^[A-Z\u00D1&]{3,4}\d{6}[A-Z0-9]{3}$/;

  if (!rfcRegex.test(rfcTrimmed)) {
    return {
      valid: false,
      error: `El RFC "${rfc}" no tiene un formato valido. Formato esperado: persona fisica (13 caracteres) o persona moral (12 caracteres). Ejemplo: XAXX010101000.`,
    };
  }

  // Validate the date portion (positions vary by type)
  const isPersonaMoral = rfcTrimmed.length === 12;
  const dateStr = isPersonaMoral ? rfcTrimmed.substring(3, 9) : rfcTrimmed.substring(4, 10);

  const anio = parseInt(dateStr.substring(0, 2), 10);
  const mes = parseInt(dateStr.substring(2, 4), 10);
  const dia = parseInt(dateStr.substring(4, 6), 10);

  if (mes < 1 || mes > 12) {
    return { valid: false, error: `El RFC contiene un mes invalido (${mes}).` };
  }

  if (dia < 1 || dia > 31) {
    return { valid: false, error: `El RFC contiene un dia invalido (${dia}).` };
  }

  // Basic date validation (considering month days)
  const fullYear = anio >= 0 && anio <= 30 ? 2000 + anio : 1900 + anio;
  const testDate = new Date(fullYear, mes - 1, dia);
  if (testDate.getMonth() !== mes - 1 || testDate.getDate() !== dia) {
    return { valid: false, error: `El RFC contiene una fecha invalida (${dateStr}).` };
  }

  return { valid: true, error: null };
}

/**
 * Valida CURP (formato oficial)
 * 18 caracteres: 4 letras + 6 digitos + 1 letra sexo + 2 letras estado + 3 consonantes + 1 alfanumerico + 1 digito
 * @param {string} curp
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validarCURP(curp) {
  if (!curp || typeof curp !== 'string') {
    return { valid: false, error: 'La CURP es requerida.' };
  }

  const curpTrimmed = curp.trim().toUpperCase();

  if (curpTrimmed.length !== 18) {
    return { valid: false, error: `La CURP debe tener 18 caracteres. Se recibieron ${curpTrimmed.length}.` };
  }

  // Official CURP regex
  // Pos 1-4: First letter of last name, first vowel of last name, first letter of second last name, first letter of first name
  // Pos 5-10: Date of birth YYMMDD
  // Pos 11: Sex (H/M)
  // Pos 12-13: State code (2 letters)
  // Pos 14-16: First consonant (not initial) of each name component
  // Pos 17: Homoclave (letter A-Z or digit 0-9)
  // Pos 18: Verification digit (0-9)
  const ESTADOS_VALIDOS = [
    'AS', 'BC', 'BS', 'CC', 'CL', 'CM', 'CS', 'CH', 'DF', 'DG',
    'GT', 'GR', 'HG', 'JC', 'MC', 'MN', 'MS', 'NT', 'NL', 'OC',
    'PL', 'QT', 'QR', 'SP', 'SL', 'SR', 'TC', 'TS', 'TL', 'VZ',
    'YN', 'ZS', 'NE', // NE = nacido en el extranjero
  ];

  const curpRegex = /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;

  if (!curpRegex.test(curpTrimmed)) {
    return {
      valid: false,
      error: `La CURP "${curp}" no tiene un formato valido. Formato: 4 letras + 6 digitos + sexo (H/M) + estado (2 letras) + 3 consonantes + homoclave + digito.`,
    };
  }

  // Validate state code
  const estadoCodigo = curpTrimmed.substring(11, 13);
  if (!ESTADOS_VALIDOS.includes(estadoCodigo)) {
    return { valid: false, error: `La CURP contiene un codigo de estado invalido (${estadoCodigo}).` };
  }

  // Validate date portion
  const dateStr = curpTrimmed.substring(4, 10);
  const anio = parseInt(dateStr.substring(0, 2), 10);
  const mes = parseInt(dateStr.substring(2, 4), 10);
  const dia = parseInt(dateStr.substring(4, 6), 10);

  if (mes < 1 || mes > 12) {
    return { valid: false, error: `La CURP contiene un mes invalido (${mes}).` };
  }

  if (dia < 1 || dia > 31) {
    return { valid: false, error: `La CURP contiene un dia invalido (${dia}).` };
  }

  const fullYear = anio >= 0 && anio <= 30 ? 2000 + anio : 1900 + anio;
  const testDate = new Date(fullYear, mes - 1, dia);
  if (testDate.getMonth() !== mes - 1 || testDate.getDate() !== dia) {
    return { valid: false, error: `La CURP contiene una fecha de nacimiento invalida.` };
  }

  return { valid: true, error: null };
}

/**
 * Valida cuenta CLABE (18 digitos con digito verificador)
 * Estructura: 3 digitos banco + 3 digitos plaza + 11 digitos cuenta + 1 digito control
 * @param {string} clabe
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validarCLABE(clabe) {
  if (!clabe || typeof clabe !== 'string') {
    return { valid: false, error: 'La CLABE es requerida.' };
  }

  const clabeTrimmed = clabe.trim().replace(/\s/g, '');

  if (clabeTrimmed.length !== 18) {
    return { valid: false, error: `La CLABE debe tener 18 digitos. Se recibieron ${clabeTrimmed.length}.` };
  }

  if (!/^\d{18}$/.test(clabeTrimmed)) {
    return { valid: false, error: 'La CLABE solo debe contener digitos.' };
  }

  // CLABE verification digit algorithm
  // Weights: repeat [3, 7, 1] for positions 0-16
  const WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    const digit = parseInt(clabeTrimmed[i], 10);
    const product = (digit * WEIGHTS[i]) % 10;
    sum += product;
  }

  const controlDigit = (10 - (sum % 10)) % 10;
  const lastDigit = parseInt(clabeTrimmed[17], 10);

  if (controlDigit !== lastDigit) {
    return {
      valid: false,
      error: `La CLABE tiene un digito verificador invalido. Se esperaba ${controlDigit}, se recibio ${lastDigit}.`,
    };
  }

  // Validate bank code (first 3 digits should be a known bank)
  const bancoCodigo = clabeTrimmed.substring(0, 3);
  const bancoNum = parseInt(bancoCodigo, 10);
  if (bancoNum < 1 || bancoNum > 999) {
    return { valid: false, error: `Codigo de banco invalido (${bancoCodigo}).` };
  }

  return { valid: true, error: null };
}

// ═════════════════════════════════════════════════════════════════════
// MASTER VALIDATION
// ═════════════════════════════════════════════════════════════════════

/**
 * Master validation: runs all applicable validations for a given operation
 * @param {string} operacion - 'momento_gasto', 'momento_ingreso', 'poliza', 'bien', 'rfc', 'curp', 'clabe'
 * @param {Object} datos - Data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validarOperacion(operacion, datos) {
  const errors = [];

  switch (operacion) {
    case 'momento_gasto': {
      // datos: { momento, partida, monto, periodo, ejercicio }
      if (datos.ejercicio) {
        const ejRes = validarEjercicioAbierto(datos.ejercicio);
        if (!ejRes.valid) errors.push(ejRes.error);
      }
      if (datos.periodo) {
        const perRes = validarPeriodoAbierto(datos.periodo);
        if (!perRes.valid) errors.push(perRes.error);
      }
      if (datos.momento && datos.partida) {
        const secRes = validarSecuenciaMomento(datos.momento, datos.partida);
        if (!secRes.valid) errors.push(secRes.error);
      }
      if (datos.momento === 'comprometido' && datos.monto != null && datos.partida) {
        const dispRes = validarDisponibilidadPresupuestal(datos.monto, datos.partida);
        if (!dispRes.valid) errors.push(dispRes.error);
      }
      if (datos.momento === 'devengado' && datos.monto != null && datos.partida) {
        const devRes = validarDevengadoVsComprometido(datos.monto, datos.partida);
        if (!devRes.valid) errors.push(devRes.error);
      }
      if (datos.momento === 'pagado' && datos.monto != null && datos.partida) {
        const pagRes = validarPagadoVsDevengado(datos.monto, datos.partida);
        if (!pagRes.valid) errors.push(pagRes.error);
      }
      break;
    }

    case 'momento_ingreso': {
      // datos: { momento, concepto, periodo, ejercicio }
      if (datos.ejercicio) {
        const ejRes = validarEjercicioAbierto(datos.ejercicio);
        if (!ejRes.valid) errors.push(ejRes.error);
      }
      if (datos.periodo) {
        const perRes = validarPeriodoAbierto(datos.periodo);
        if (!perRes.valid) errors.push(perRes.error);
      }
      if (datos.momento && datos.concepto) {
        const secRes = validarSecuenciaMomentoIngreso(datos.momento, datos.concepto);
        if (!secRes.valid) errors.push(secRes.error);
      }
      break;
    }

    case 'poliza': {
      // datos: { movimientos, periodo, ejercicio }
      if (datos.ejercicio) {
        const ejRes = validarEjercicioAbierto(datos.ejercicio);
        if (!ejRes.valid) errors.push(ejRes.error);
      }
      if (datos.periodo) {
        const perRes = validarPeriodoAbierto(datos.periodo);
        if (!perRes.valid) errors.push(perRes.error);
      }
      if (datos.movimientos) {
        const minRes = validarMinMovimientos(datos.movimientos);
        if (!minRes.valid) errors.push(minRes.error);

        const pdRes = validarPartidaDoble(datos.movimientos);
        if (!pdRes.valid) errors.push(pdRes.error);
      }
      break;
    }

    case 'bien': {
      // datos: { fechaAdquisicion, periodo, ejercicio }
      if (datos.ejercicio) {
        const ejRes = validarEjercicioAbierto(datos.ejercicio);
        if (!ejRes.valid) errors.push(ejRes.error);
      }
      if (datos.fechaAdquisicion) {
        const plazoRes = validarPlazoRegistroBien(datos.fechaAdquisicion);
        if (!plazoRes.valid) errors.push(plazoRes.error);
      }
      break;
    }

    case 'rfc': {
      // datos: { rfc }
      if (datos.rfc) {
        const rfcRes = validarRFC(datos.rfc);
        if (!rfcRes.valid) errors.push(rfcRes.error);
      }
      break;
    }

    case 'curp': {
      // datos: { curp }
      if (datos.curp) {
        const curpRes = validarCURP(datos.curp);
        if (!curpRes.valid) errors.push(curpRes.error);
      }
      break;
    }

    case 'clabe': {
      // datos: { clabe }
      if (datos.clabe) {
        const clabeRes = validarCLABE(datos.clabe);
        if (!clabeRes.valid) errors.push(clabeRes.error);
      }
      break;
    }

    default:
      errors.push(`Operacion "${operacion}" no reconocida.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
