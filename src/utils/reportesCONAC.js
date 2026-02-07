/**
 * reportesCONAC.js
 * ---------------------------------------------------------------------------
 * Generador de reportes financieros conforme al Art. 46 LGCG y normas CONAC.
 * Cubre los 19 reportes federales: 7 contables, 8 presupuestales, 4 programaticos.
 * ---------------------------------------------------------------------------
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(2) : '0.00');

const sum = (arr, key) => arr.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function periodoLabel(periodo, ejercicio) {
  const mes = periodo?.numero || periodo?.mes || 12;
  const anio = ejercicio?.anio || ejercicio?.year || new Date().getFullYear();
  return `DEL 1 DE ENERO AL ${periodo?.nombre || (MESES[mes - 1] ? `${mes} DE ${MESES[mes - 1].toUpperCase()}` : `31 DE DICIEMBRE`)} DE ${anio}`;
}

function filterByTipo(cuentas, tipos) {
  return (cuentas || []).filter((c) => tipos.includes(c.tipo_cuenta));
}

function filterByCodigo(cuentas, prefix) {
  return (cuentas || []).filter((c) => c.codigo && c.codigo.startsWith(prefix));
}

function buildRows(cuentas, saldoMap, valueKey = 'saldo_final') {
  return cuentas.map((c) => {
    const s = saldoMap?.[c.id] || {};
    return {
      codigo: c.codigo,
      nombre: c.nombre,
      nivel: c.nivel || 1,
      saldo_inicial: Number(s.saldo_inicial) || 0,
      debe: Number(s.total_debe) || Number(s.debe) || 0,
      haber: Number(s.total_haber) || Number(s.haber) || 0,
      saldo_final: Number(s.saldo_final) || 0,
      monto: Number(s[valueKey]) || Number(s.saldo_final) || 0,
    };
  });
}

function buildSaldoMap(saldos) {
  const map = {};
  for (const s of (saldos || [])) {
    map[s.cuenta_id] = s;
  }
  return map;
}

// ── Catalogo de Reportes ─────────────────────────────────────────────────────

export const CATALOGO_REPORTES = {
  // CONTABLES (7)
  EA:       { key: 'EA',       nombre: 'Estado de Actividades',                                    categoria: 'contable',      orden: 1 },
  ESF:      { key: 'ESF',      nombre: 'Estado de Situacion Financiera',                           categoria: 'contable',      orden: 2 },
  EVHP:     { key: 'EVHP',     nombre: 'Estado de Variacion en la Hacienda Publica',               categoria: 'contable',      orden: 3 },
  ECSF:     { key: 'ECSF',     nombre: 'Estado de Cambios en la Situacion Financiera',             categoria: 'contable',      orden: 4 },
  EFE:      { key: 'EFE',      nombre: 'Estado de Flujos de Efectivo',                             categoria: 'contable',      orden: 5 },
  EAA:      { key: 'EAA',      nombre: 'Estado Analitico del Activo',                              categoria: 'contable',      orden: 6 },
  NOTAS:    { key: 'NOTAS',    nombre: 'Notas a los Estados Financieros',                          categoria: 'contable',      orden: 7 },
  // PRESUPUESTALES (8)
  EAI:      { key: 'EAI',      nombre: 'Estado Analitico de Ingresos',                             categoria: 'presupuestal',  orden: 8 },
  EAEPE_CA: { key: 'EAEPE_CA', nombre: 'EAEPE - Clasificacion Administrativa',                     categoria: 'presupuestal',  orden: 9 },
  EAEPE_CE: { key: 'EAEPE_CE', nombre: 'EAEPE - Clasificacion Economica',                          categoria: 'presupuestal',  orden: 10 },
  EAEPE_COG:{ key: 'EAEPE_COG',nombre: 'EAEPE - Clasificacion por Objeto del Gasto',               categoria: 'presupuestal',  orden: 11 },
  EAEPE_CF: { key: 'EAEPE_CF', nombre: 'EAEPE - Clasificacion Funcional',                          categoria: 'presupuestal',  orden: 12 },
  END:      { key: 'END',      nombre: 'Endeudamiento Neto',                                       categoria: 'presupuestal',  orden: 13 },
  ID:       { key: 'ID',       nombre: 'Intereses de la Deuda',                                    categoria: 'presupuestal',  orden: 14 },
  FF:       { key: 'FF',       nombre: 'Flujo de Fondos',                                          categoria: 'presupuestal',  orden: 15 },
  // PROGRAMATICOS (4)
  GCP:      { key: 'GCP',      nombre: 'Gasto por Categoria Programatica',                         categoria: 'programatico',  orden: 16 },
  PPI:      { key: 'PPI',      nombre: 'Programas y Proyectos de Inversion',                       categoria: 'programatico',  orden: 17 },
  IR:       { key: 'IR',       nombre: 'Indicadores de Resultados (PbR)',                           categoria: 'programatico',  orden: 18 },
  IPF:      { key: 'IPF',      nombre: 'Indicadores de Postura Fiscal',                            categoria: 'programatico',  orden: 19 },
};

// ── Reportes por nivel de gobierno ──────────────────────────────────────────

const REPORTES_FEDERAL = Object.keys(CATALOGO_REPORTES);

const REPORTES_ESTATAL = [
  'EA', 'ESF', 'EVHP', 'ECSF', 'EFE', 'EAA', 'NOTAS',
  'EAI', 'EAEPE_CA', 'EAEPE_CE', 'EAEPE_COG', 'EAEPE_CF',
  'END', 'ID', 'FF',
  'GCP', 'PPI',
];

const REPORTES_MUNICIPAL = [
  'EA', 'ESF', 'EVHP', 'EAA', 'NOTAS',
  'EAI', 'EAEPE_COG',
  'END', 'ID',
  'GCP',
];

export function getReportesPorNivel(nivelGobierno) {
  switch ((nivelGobierno || '').toLowerCase()) {
    case 'federal':   return REPORTES_FEDERAL;
    case 'estatal':   return REPORTES_ESTATAL;
    case 'municipal': return REPORTES_MUNICIPAL;
    default:          return REPORTES_FEDERAL;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  CONTABLES
// ═════════════════════════════════════════════════════════════════════════════

// 1. Estado de Actividades ────────────────────────────────────────────────────

export function generarEstadoActividades(data, ente, periodo, ejercicio) {
  const { saldos = [], cuentas = [] } = data;
  const saldoMap = buildSaldoMap(saldos);

  const ingresosRows = buildRows(filterByTipo(cuentas, ['ingresos']), saldoMap);
  const gastosRows   = buildRows(filterByTipo(cuentas, ['gastos']), saldoMap);

  const totalIngresos = sum(ingresosRows, 'saldo_final');
  const totalGastos   = sum(gastosRows, 'saldo_final');
  const resultado     = totalIngresos - totalGastos;

  return {
    key: 'EA',
    titulo: 'Estado de Actividades',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'portrait',
    columnas: [
      { key: 'codigo', label: 'Codigo', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'saldo_final', label: 'Monto ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'I. INGRESOS Y OTROS BENEFICIOS', filas: ingresosRows, subtotal: totalIngresos },
      { titulo: 'II. GASTOS Y OTRAS PERDIDAS', filas: gastosRows, subtotal: totalGastos },
    ],
    totales: {
      label: 'III. RESULTADO DEL EJERCICIO (AHORRO / DESAHORRO)',
      valor: resultado,
    },
    notas: resultado >= 0 ? 'El ente publico presenta ahorro en el ejercicio.' : 'El ente publico presenta desahorro en el ejercicio.',
  };
}

// 2. Estado de Situacion Financiera ──────────────────────────────────────────

export function generarEstadoSituacionFinanciera(data, ente, periodo, ejercicio) {
  const { saldos = [], cuentas = [] } = data;
  const saldoMap = buildSaldoMap(saldos);

  const activoRows   = buildRows(filterByTipo(cuentas, ['activo']), saldoMap);
  const pasivoRows   = buildRows(filterByTipo(cuentas, ['pasivo']), saldoMap);
  const haciendaRows = buildRows(filterByTipo(cuentas, ['hacienda', 'hacienda_publica']), saldoMap);

  const totalActivo   = sum(activoRows, 'saldo_final');
  const totalPasivo   = sum(pasivoRows, 'saldo_final');
  const totalHacienda = sum(haciendaRows, 'saldo_final');
  const cuadra = Math.abs(totalActivo - (totalPasivo + totalHacienda)) < 0.01;

  return {
    key: 'ESF',
    titulo: 'Estado de Situacion Financiera',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'portrait',
    columnas: [
      { key: 'codigo', label: 'Codigo', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'saldo_final', label: 'Importe ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'I. ACTIVO', filas: activoRows, subtotal: totalActivo },
      { titulo: 'II. PASIVO', filas: pasivoRows, subtotal: totalPasivo },
      { titulo: 'III. HACIENDA PUBLICA', filas: haciendaRows, subtotal: totalHacienda },
    ],
    totales: {
      label: 'TOTAL PASIVO + HACIENDA PUBLICA',
      valor: totalPasivo + totalHacienda,
    },
    notas: cuadra
      ? 'La ecuacion contable cuadra correctamente: Activo = Pasivo + Hacienda.'
      : `Diferencia detectada: Activo (${fmtMoney(totalActivo)}) != Pasivo + Hacienda (${fmtMoney(totalPasivo + totalHacienda)}).`,
    metadata: { totalActivo, totalPasivo, totalHacienda, cuadra },
  };
}

// 3. Estado de Variacion en la Hacienda Publica ──────────────────────────────

export function generarEstadoVariacionHacienda(data, ente, periodo, ejercicio) {
  const { saldos = [], cuentas = [] } = data;
  const saldoMap = buildSaldoMap(saldos);
  const haciendaCuentas = filterByTipo(cuentas, ['hacienda', 'hacienda_publica']);

  const contribuidaRows = buildRows(filterByCodigo(haciendaCuentas, '3.1'), saldoMap);
  const generadaRows    = buildRows(filterByCodigo(haciendaCuentas, '3.2'), saldoMap);
  const excesoRows      = buildRows(filterByCodigo(haciendaCuentas, '3.3'), saldoMap);

  const totalContribuida = sum(contribuidaRows, 'saldo_final');
  const totalGenerada    = sum(generadaRows, 'saldo_final');
  const totalExceso      = sum(excesoRows, 'saldo_final');

  return {
    key: 'EVHP',
    titulo: 'Estado de Variacion en la Hacienda Publica',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'portrait',
    columnas: [
      { key: 'codigo', label: 'Codigo', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'saldo_final', label: 'Importe ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'I. HACIENDA PUBLICA CONTRIBUIDA', filas: contribuidaRows, subtotal: totalContribuida },
      { titulo: 'II. HACIENDA PUBLICA GENERADA', filas: generadaRows, subtotal: totalGenerada },
      { titulo: 'III. EXCESO O INSUFICIENCIA EN LA ACTUALIZACION DE LA HACIENDA PUBLICA', filas: excesoRows, subtotal: totalExceso },
    ],
    totales: {
      label: 'TOTAL HACIENDA PUBLICA',
      valor: totalContribuida + totalGenerada + totalExceso,
    },
  };
}

// 4. Estado de Cambios en la Situacion Financiera ────────────────────────────

export function generarEstadoCambiosSituacionFinanciera(data, ente, periodo, ejercicio) {
  const { saldos = [], cuentas = [] } = data;
  const saldoMap = buildSaldoMap(saldos);

  const activoRows   = buildRows(filterByTipo(cuentas, ['activo']), saldoMap);
  const pasivoRows   = buildRows(filterByTipo(cuentas, ['pasivo']), saldoMap);
  const haciendaRows = buildRows(filterByTipo(cuentas, ['hacienda', 'hacienda_publica']), saldoMap);

  const origenOp  = activoRows.filter(r => r.saldo_final - r.saldo_inicial !== 0).map(r => ({
    ...r, variacion: r.saldo_final - r.saldo_inicial,
  }));
  const origenNoOp = pasivoRows.filter(r => r.saldo_final - r.saldo_inicial !== 0).map(r => ({
    ...r, variacion: r.saldo_final - r.saldo_inicial,
  }));

  const totalOrigenOp  = sum(origenOp, 'variacion');
  const totalOrigenNoOp = sum(origenNoOp, 'variacion');

  return {
    key: 'ECSF',
    titulo: 'Estado de Cambios en la Situacion Financiera',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'portrait',
    columnas: [
      { key: 'codigo', label: 'Codigo', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'saldo_inicial', label: 'Saldo Inicio ($)', align: 'right', format: fmtMoney },
      { key: 'saldo_final', label: 'Saldo Final ($)', align: 'right', format: fmtMoney },
      { key: 'variacion', label: 'Variacion ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'I. ORIGEN DE RECURSOS - OPERATIVOS', filas: origenOp, subtotal: totalOrigenOp },
      { titulo: 'II. ORIGEN DE RECURSOS - NO OPERATIVOS', filas: origenNoOp, subtotal: totalOrigenNoOp },
    ],
    totales: {
      label: 'VARIACION NETA EN LA SITUACION FINANCIERA',
      valor: totalOrigenOp + totalOrigenNoOp,
    },
  };
}

// 5. Estado de Flujos de Efectivo ────────────────────────────────────────────

export function generarEstadoFlujosEfectivo(data, ente, periodo, ejercicio) {
  const { saldos = [], cuentas = [] } = data;
  const saldoMap = buildSaldoMap(saldos);

  // Cuentas de efectivo: 1.1.1.x (Efectivo y equivalentes)
  const efectivoRows = buildRows(filterByCodigo(cuentas, '1.1.1'), saldoMap);
  const operativas   = buildRows(filterByTipo(cuentas, ['ingresos', 'gastos']), saldoMap);

  const flujoOperativo    = sum(operativas.filter(r => r.codigo?.startsWith('4')), 'saldo_final')
                          - sum(operativas.filter(r => r.codigo?.startsWith('5')), 'saldo_final');
  const efectivoInicial   = sum(efectivoRows, 'saldo_inicial');
  const efectivoFinal     = sum(efectivoRows, 'saldo_final');

  return {
    key: 'EFE',
    titulo: 'Estado de Flujos de Efectivo',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'portrait',
    columnas: [
      { key: 'codigo', label: 'Codigo', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'saldo_final', label: 'Importe ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'I. FLUJOS DE EFECTIVO POR ACTIVIDADES DE OPERACION', filas: operativas.filter(r => r.codigo?.startsWith('4') || r.codigo?.startsWith('5')), subtotal: flujoOperativo },
      { titulo: 'II. EFECTIVO Y EQUIVALENTES', filas: efectivoRows, subtotal: efectivoFinal },
    ],
    totales: {
      label: 'INCREMENTO / DISMINUCION NETA EN EFECTIVO',
      valor: efectivoFinal - efectivoInicial,
    },
    metadata: { efectivoInicial, efectivoFinal, flujoOperativo },
  };
}

// 6. Estado Analitico del Activo ─────────────────────────────────────────────

export function generarEstadoAnaliticoActivo(data, ente, periodo, ejercicio) {
  const { saldos = [], cuentas = [] } = data;
  const saldoMap = buildSaldoMap(saldos);
  const activoCuentas = filterByTipo(cuentas, ['activo']);
  const rows = buildRows(activoCuentas, saldoMap);

  return {
    key: 'EAA',
    titulo: 'Estado Analitico del Activo',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'landscape',
    columnas: [
      { key: 'codigo', label: 'Codigo', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'saldo_inicial', label: 'Saldo Inicial ($)', align: 'right', format: fmtMoney },
      { key: 'debe', label: 'Cargos ($)', align: 'right', format: fmtMoney },
      { key: 'haber', label: 'Abonos ($)', align: 'right', format: fmtMoney },
      { key: 'saldo_final', label: 'Saldo Final ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'ACTIVO', filas: rows, subtotal: null },
    ],
    totales: {
      label: 'TOTALES',
      valores: {
        saldo_inicial: sum(rows, 'saldo_inicial'),
        debe: sum(rows, 'debe'),
        haber: sum(rows, 'haber'),
        saldo_final: sum(rows, 'saldo_final'),
      },
    },
  };
}

// 7. Notas a los Estados Financieros ─────────────────────────────────────────

export function generarNotasEstadosFinancieros(data, ente, periodo, ejercicio) {
  return {
    key: 'NOTAS',
    titulo: 'Notas a los Estados Financieros',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'portrait',
    columnas: [
      { key: 'seccion', label: 'Seccion', align: 'left' },
      { key: 'descripcion', label: 'Descripcion', align: 'left' },
    ],
    secciones: [
      {
        titulo: 'NOTAS DE DESGLOSE',
        filas: [
          { seccion: 'a)', descripcion: 'Notas al Estado de Situacion Financiera' },
          { seccion: 'b)', descripcion: 'Notas al Estado de Actividades' },
          { seccion: 'c)', descripcion: 'Notas al Estado de Variacion en la Hacienda Publica' },
          { seccion: 'd)', descripcion: 'Notas al Estado de Flujos de Efectivo' },
        ],
        subtotal: null,
      },
      {
        titulo: 'NOTAS DE MEMORIA (CUENTAS DE ORDEN)',
        filas: [
          { seccion: 'e)', descripcion: 'Cuentas de orden contables y presupuestales' },
        ],
        subtotal: null,
      },
      {
        titulo: 'NOTAS DE GESTION ADMINISTRATIVA',
        filas: [
          { seccion: 'f)', descripcion: 'Introduccion, descripcion de actividades y organizacion del ente' },
          { seccion: 'g)', descripcion: 'Bases de preparacion de los estados financieros' },
          { seccion: 'h)', descripcion: 'Politicas de contabilidad significativas' },
          { seccion: 'i)', descripcion: 'Posicion en moneda extranjera y proteccion por riesgo cambiario' },
          { seccion: 'j)', descripcion: 'Reporte de la recaudacion' },
          { seccion: 'k)', descripcion: 'Informacion sobre la deuda y el reporte analitico de la deuda' },
          { seccion: 'l)', descripcion: 'Calificaciones otorgadas' },
          { seccion: 'm)', descripcion: 'Proceso de mejora' },
          { seccion: 'n)', descripcion: 'Informacion por segmentos' },
        ],
        subtotal: null,
      },
    ],
    totales: null,
    notas: 'Las notas a los estados financieros son parte integral de los mismos y proporcionan informacion adicional sobre las cifras presentadas.',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  PRESUPUESTALES
// ═════════════════════════════════════════════════════════════════════════════

// 8. Estado Analitico de Ingresos ────────────────────────────────────────────

export function generarEstadoAnaliticoIngresos(data, ente, periodo, ejercicio) {
  const { presupuesto = [] } = data;
  const ingresosRows = presupuesto.filter(r => r.tipo === 'ingreso' || r.clasificacion === 'ingreso');

  const rows = ingresosRows.map(r => ({
    codigo: r.codigo || r.clave || '',
    nombre: r.nombre || r.concepto || '',
    estimado: Number(r.estimado) || 0,
    ampliacion: Number(r.ampliacion) || 0,
    reduccion: Number(r.reduccion) || 0,
    modificado: (Number(r.estimado) || 0) + (Number(r.ampliacion) || 0) - (Number(r.reduccion) || 0),
    recaudado: Number(r.recaudado) || Number(r.devengado) || 0,
    diferencia: ((Number(r.estimado) || 0) + (Number(r.ampliacion) || 0) - (Number(r.reduccion) || 0)) - (Number(r.recaudado) || Number(r.devengado) || 0),
  }));

  return {
    key: 'EAI',
    titulo: 'Estado Analitico de Ingresos',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'landscape',
    columnas: [
      { key: 'codigo', label: 'Rubro', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'estimado', label: 'Estimado ($)', align: 'right', format: fmtMoney },
      { key: 'ampliacion', label: 'Ampliacion ($)', align: 'right', format: fmtMoney },
      { key: 'reduccion', label: 'Reduccion ($)', align: 'right', format: fmtMoney },
      { key: 'modificado', label: 'Modificado ($)', align: 'right', format: fmtMoney },
      { key: 'recaudado', label: 'Recaudado ($)', align: 'right', format: fmtMoney },
      { key: 'diferencia', label: 'Diferencia ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'INGRESOS', filas: rows, subtotal: null },
    ],
    totales: {
      label: 'TOTAL',
      valores: {
        estimado: sum(rows, 'estimado'),
        ampliacion: sum(rows, 'ampliacion'),
        reduccion: sum(rows, 'reduccion'),
        modificado: sum(rows, 'modificado'),
        recaudado: sum(rows, 'recaudado'),
        diferencia: sum(rows, 'diferencia'),
      },
    },
  };
}

// Helper generico para los 4 EAEPE ───────────────────────────────────────────

function generarEAEPE(data, clasificacion, titulo, ente, periodo, ejercicio) {
  const { presupuesto = [] } = data;
  const egresosRows = presupuesto.filter(r =>
    (r.tipo === 'egreso' || r.clasificacion_tipo === clasificacion || r.tipo === clasificacion)
  );

  const rows = egresosRows.map(r => ({
    codigo: r.codigo || r.clave || '',
    nombre: r.nombre || r.concepto || '',
    aprobado: Number(r.aprobado) || Number(r.estimado) || 0,
    pef: Number(r.pef) || 0,
    modificado: Number(r.modificado) || (Number(r.aprobado || r.estimado || 0) + Number(r.ampliacion || 0) - Number(r.reduccion || 0)),
    devengado: Number(r.devengado) || 0,
    pagado: Number(r.pagado) || 0,
    subejercicio: (Number(r.modificado) || (Number(r.aprobado || r.estimado || 0))) - (Number(r.pagado) || 0),
  }));

  return {
    key: `EAEPE_${clasificacion.toUpperCase()}`,
    titulo,
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'landscape',
    columnas: [
      { key: 'codigo', label: 'Clave', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'aprobado', label: 'Aprobado ($)', align: 'right', format: fmtMoney },
      { key: 'pef', label: 'PEF ($)', align: 'right', format: fmtMoney },
      { key: 'modificado', label: 'Modificado ($)', align: 'right', format: fmtMoney },
      { key: 'devengado', label: 'Devengado ($)', align: 'right', format: fmtMoney },
      { key: 'pagado', label: 'Pagado ($)', align: 'right', format: fmtMoney },
      { key: 'subejercicio', label: 'Subejercicio ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'EGRESOS', filas: rows, subtotal: null },
    ],
    totales: {
      label: 'TOTAL',
      valores: {
        aprobado: sum(rows, 'aprobado'),
        pef: sum(rows, 'pef'),
        modificado: sum(rows, 'modificado'),
        devengado: sum(rows, 'devengado'),
        pagado: sum(rows, 'pagado'),
        subejercicio: sum(rows, 'subejercicio'),
      },
    },
  };
}

// 9-12. EAEPE Variants ───────────────────────────────────────────────────────

export function generarEAEPE_CA(data, ente, periodo, ejercicio) {
  return generarEAEPE(data, 'CA', 'Estado Analitico del Ejercicio del Presupuesto de Egresos - Clasificacion Administrativa', ente, periodo, ejercicio);
}

export function generarEAEPE_CE(data, ente, periodo, ejercicio) {
  return generarEAEPE(data, 'CE', 'Estado Analitico del Ejercicio del Presupuesto de Egresos - Clasificacion Economica', ente, periodo, ejercicio);
}

export function generarEAEPE_COG(data, ente, periodo, ejercicio) {
  return generarEAEPE(data, 'COG', 'Estado Analitico del Ejercicio del Presupuesto de Egresos - Clasificacion por Objeto del Gasto', ente, periodo, ejercicio);
}

export function generarEAEPE_CF(data, ente, periodo, ejercicio) {
  return generarEAEPE(data, 'CF', 'Estado Analitico del Ejercicio del Presupuesto de Egresos - Clasificacion Funcional', ente, periodo, ejercicio);
}

// 13. Endeudamiento Neto ─────────────────────────────────────────────────────

export function generarEndeudamientoNeto(data, ente, periodo, ejercicio) {
  const { presupuesto = [] } = data;
  const deudaRows = presupuesto.filter(r => r.tipo === 'deuda' || r.clasificacion === 'deuda');

  const rows = deudaRows.map(r => ({
    codigo: r.codigo || r.clave || '',
    nombre: r.nombre || r.concepto || '',
    moneda_nacional: Number(r.moneda_nacional) || Number(r.monto) || 0,
    moneda_extranjera: Number(r.moneda_extranjera) || 0,
    total: (Number(r.moneda_nacional) || Number(r.monto) || 0) + (Number(r.moneda_extranjera) || 0),
  }));

  return {
    key: 'END',
    titulo: 'Endeudamiento Neto',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'landscape',
    columnas: [
      { key: 'codigo', label: 'Identificador', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'moneda_nacional', label: 'Moneda Nacional ($)', align: 'right', format: fmtMoney },
      { key: 'moneda_extranjera', label: 'Moneda Extranjera ($)', align: 'right', format: fmtMoney },
      { key: 'total', label: 'Total ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'ENDEUDAMIENTO NETO', filas: rows, subtotal: sum(rows, 'total') },
    ],
    totales: {
      label: 'ENDEUDAMIENTO NETO TOTAL',
      valor: sum(rows, 'total'),
    },
  };
}

// 14. Intereses de la Deuda ──────────────────────────────────────────────────

export function generarInteresesDeuda(data, ente, periodo, ejercicio) {
  const { presupuesto = [] } = data;
  const interesRows = presupuesto.filter(r => r.tipo === 'interes' || r.clasificacion === 'interes_deuda');

  const rows = interesRows.map(r => ({
    codigo: r.codigo || r.clave || '',
    nombre: r.nombre || r.concepto || '',
    pagado: Number(r.pagado) || Number(r.monto) || 0,
    devengado: Number(r.devengado) || 0,
  }));

  return {
    key: 'ID',
    titulo: 'Intereses de la Deuda',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'portrait',
    columnas: [
      { key: 'codigo', label: 'Identificador', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'devengado', label: 'Devengado ($)', align: 'right', format: fmtMoney },
      { key: 'pagado', label: 'Pagado ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'INTERESES DE LA DEUDA', filas: rows, subtotal: null },
    ],
    totales: {
      label: 'TOTAL INTERESES',
      valores: {
        devengado: sum(rows, 'devengado'),
        pagado: sum(rows, 'pagado'),
      },
    },
  };
}

// 15. Flujo de Fondos ────────────────────────────────────────────────────────

export function generarFlujoDeFondos(data, ente, periodo, ejercicio) {
  const { presupuesto = [] } = data;
  const ingresos = presupuesto.filter(r => r.tipo === 'ingreso' || r.clasificacion === 'ingreso');
  const egresos  = presupuesto.filter(r => r.tipo === 'egreso' || r.clasificacion === 'egreso');

  const ingRows = ingresos.map(r => ({
    codigo: r.codigo || '', nombre: r.nombre || '', monto: Number(r.recaudado) || Number(r.devengado) || 0,
  }));
  const egrRows = egresos.map(r => ({
    codigo: r.codigo || '', nombre: r.nombre || '', monto: Number(r.pagado) || Number(r.devengado) || 0,
  }));

  const totalIng = sum(ingRows, 'monto');
  const totalEgr = sum(egrRows, 'monto');

  return {
    key: 'FF',
    titulo: 'Flujo de Fondos',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'portrait',
    columnas: [
      { key: 'codigo', label: 'Rubro', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'monto', label: 'Importe ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'A. INGRESOS PRESUPUESTARIOS', filas: ingRows, subtotal: totalIng },
      { titulo: 'B. EGRESOS PRESUPUESTARIOS', filas: egrRows, subtotal: totalEgr },
    ],
    totales: {
      label: 'C. FLUJO NETO DE FONDOS (A - B)',
      valor: totalIng - totalEgr,
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  PROGRAMATICOS
// ═════════════════════════════════════════════════════════════════════════════

// 16. Gasto por Categoria Programatica ───────────────────────────────────────

export function generarGastoCategoriaProgramatica(data, ente, periodo, ejercicio) {
  const { presupuesto = [] } = data;
  const programas = presupuesto.filter(r => r.tipo === 'programa' || r.programa);

  const rows = programas.map(r => ({
    codigo: r.codigo || r.programa || '',
    nombre: r.nombre || r.concepto || '',
    aprobado: Number(r.aprobado) || 0,
    modificado: Number(r.modificado) || 0,
    devengado: Number(r.devengado) || 0,
    pagado: Number(r.pagado) || 0,
  }));

  return {
    key: 'GCP',
    titulo: 'Gasto por Categoria Programatica',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'landscape',
    columnas: [
      { key: 'codigo', label: 'Programa', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'aprobado', label: 'Aprobado ($)', align: 'right', format: fmtMoney },
      { key: 'modificado', label: 'Modificado ($)', align: 'right', format: fmtMoney },
      { key: 'devengado', label: 'Devengado ($)', align: 'right', format: fmtMoney },
      { key: 'pagado', label: 'Pagado ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'GASTO POR CATEGORIA PROGRAMATICA', filas: rows, subtotal: null },
    ],
    totales: {
      label: 'TOTAL',
      valores: {
        aprobado: sum(rows, 'aprobado'),
        modificado: sum(rows, 'modificado'),
        devengado: sum(rows, 'devengado'),
        pagado: sum(rows, 'pagado'),
      },
    },
  };
}

// 17. Programas y Proyectos de Inversion ─────────────────────────────────────

export function generarProgramasProyectosInversion(data, ente, periodo, ejercicio) {
  const { presupuesto = [] } = data;
  const proyectos = presupuesto.filter(r => r.tipo === 'proyecto' || r.tipo === 'inversion');

  const rows = proyectos.map(r => ({
    codigo: r.codigo || r.clave || '',
    nombre: r.nombre || r.proyecto || '',
    aprobado: Number(r.aprobado) || 0,
    modificado: Number(r.modificado) || 0,
    devengado: Number(r.devengado) || 0,
    pagado: Number(r.pagado) || 0,
    avance: pct(Number(r.devengado) || 0, Number(r.modificado) || Number(r.aprobado) || 1) + '%',
  }));

  return {
    key: 'PPI',
    titulo: 'Programas y Proyectos de Inversion',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'landscape',
    columnas: [
      { key: 'codigo', label: 'Proyecto', align: 'left' },
      { key: 'nombre', label: 'Descripcion', align: 'left' },
      { key: 'aprobado', label: 'Aprobado ($)', align: 'right', format: fmtMoney },
      { key: 'modificado', label: 'Modificado ($)', align: 'right', format: fmtMoney },
      { key: 'devengado', label: 'Devengado ($)', align: 'right', format: fmtMoney },
      { key: 'pagado', label: 'Pagado ($)', align: 'right', format: fmtMoney },
      { key: 'avance', label: '% Avance', align: 'right' },
    ],
    secciones: [
      { titulo: 'PROGRAMAS Y PROYECTOS', filas: rows, subtotal: null },
    ],
    totales: {
      label: 'TOTAL',
      valores: {
        aprobado: sum(rows, 'aprobado'),
        modificado: sum(rows, 'modificado'),
        devengado: sum(rows, 'devengado'),
        pagado: sum(rows, 'pagado'),
      },
    },
  };
}

// 18. Indicadores de Resultados (PbR) ────────────────────────────────────────

export function generarIndicadoresResultados(data, ente, periodo, ejercicio) {
  const { indicadores = [] } = data;

  const rows = indicadores.map(r => ({
    codigo: r.codigo || r.clave || '',
    nombre: r.nombre || r.indicador || '',
    meta: Number(r.meta) || 0,
    resultado: Number(r.resultado) || 0,
    avance: pct(Number(r.resultado) || 0, Number(r.meta) || 1) + '%',
    semaforo: Number(r.resultado || 0) >= Number(r.meta || 0) ? 'Verde' : Number(r.resultado || 0) >= (Number(r.meta || 0) * 0.7) ? 'Amarillo' : 'Rojo',
  }));

  return {
    key: 'IR',
    titulo: 'Indicadores de Resultados (PbR)',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'landscape',
    columnas: [
      { key: 'codigo', label: 'Clave', align: 'left' },
      { key: 'nombre', label: 'Indicador', align: 'left' },
      { key: 'meta', label: 'Meta', align: 'right' },
      { key: 'resultado', label: 'Resultado', align: 'right' },
      { key: 'avance', label: '% Avance', align: 'right' },
      { key: 'semaforo', label: 'Semaforo', align: 'center' },
    ],
    secciones: [
      { titulo: 'INDICADORES DE DESEMPENO', filas: rows, subtotal: null },
    ],
    totales: null,
  };
}

// 19. Indicadores de Postura Fiscal ──────────────────────────────────────────

export function generarIndicadoresPosturaFiscal(data, ente, periodo, ejercicio) {
  const { presupuesto = [] } = data;
  const ingresos = presupuesto.filter(r => r.tipo === 'ingreso');
  const egresos  = presupuesto.filter(r => r.tipo === 'egreso');

  const totalIngRec = sum(ingresos, 'recaudado') || sum(ingresos, 'devengado');
  const totalIngEst = sum(ingresos, 'estimado') || sum(ingresos, 'aprobado');
  const totalEgrPag = sum(egresos, 'pagado') || sum(egresos, 'devengado');
  const totalEgrApr = sum(egresos, 'aprobado') || sum(egresos, 'estimado');

  const rows = [
    { codigo: 'I', nombre: 'Ingresos Presupuestarios', estimado: totalIngEst, recaudado: totalIngRec, diferencia: totalIngRec - totalIngEst },
    { codigo: 'II', nombre: 'Egresos Presupuestarios', estimado: totalEgrApr, recaudado: totalEgrPag, diferencia: totalEgrPag - totalEgrApr },
    { codigo: 'III', nombre: 'Balance Presupuestario (I - II)', estimado: totalIngEst - totalEgrApr, recaudado: totalIngRec - totalEgrPag, diferencia: (totalIngRec - totalEgrPag) - (totalIngEst - totalEgrApr) },
  ];

  return {
    key: 'IPF',
    titulo: 'Indicadores de Postura Fiscal',
    subtitulo: periodoLabel(periodo, ejercicio),
    orientacion: 'landscape',
    columnas: [
      { key: 'codigo', label: 'Num.', align: 'left' },
      { key: 'nombre', label: 'Concepto', align: 'left' },
      { key: 'estimado', label: 'Estimado / Aprobado ($)', align: 'right', format: fmtMoney },
      { key: 'recaudado', label: 'Recaudado / Pagado ($)', align: 'right', format: fmtMoney },
      { key: 'diferencia', label: 'Diferencia ($)', align: 'right', format: fmtMoney },
    ],
    secciones: [
      { titulo: 'INDICADORES DE POSTURA FISCAL', filas: rows, subtotal: null },
    ],
    totales: null,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  MASTER FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

const GENERADORES = {
  EA:        generarEstadoActividades,
  ESF:       generarEstadoSituacionFinanciera,
  EVHP:      generarEstadoVariacionHacienda,
  ECSF:      generarEstadoCambiosSituacionFinanciera,
  EFE:       generarEstadoFlujosEfectivo,
  EAA:       generarEstadoAnaliticoActivo,
  NOTAS:     generarNotasEstadosFinancieros,
  EAI:       generarEstadoAnaliticoIngresos,
  EAEPE_CA:  generarEAEPE_CA,
  EAEPE_CE:  generarEAEPE_CE,
  EAEPE_COG: generarEAEPE_COG,
  EAEPE_CF:  generarEAEPE_CF,
  END:       generarEndeudamientoNeto,
  ID:        generarInteresesDeuda,
  FF:        generarFlujoDeFondos,
  GCP:       generarGastoCategoriaProgramatica,
  PPI:       generarProgramasProyectosInversion,
  IR:        generarIndicadoresResultados,
  IPF:       generarIndicadoresPosturaFiscal,
};

/**
 * Generate any CONAC report by key.
 * @param {string} tipo   - Report key (e.g. 'EA', 'ESF', 'EAEPE_COG')
 * @param {Object} data   - { saldos, cuentas, presupuesto, indicadores, movimientos }
 * @param {Object} ente   - Ente publico object
 * @param {Object} periodo - Periodo contable object
 * @param {Object} ejercicio - Ejercicio fiscal object
 * @returns {Object} Structured report data
 */
export function generarReporte(tipo, data, ente, periodo, ejercicio) {
  const gen = GENERADORES[tipo];
  if (!gen) {
    throw new Error(`Tipo de reporte no reconocido: ${tipo}`);
  }
  return gen(data, ente, periodo, ejercicio);
}
