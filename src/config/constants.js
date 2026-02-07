export const APP_NAME = 'SCGMEX';
export const APP_FULL_NAME = 'Sistema de Contabilidad Gubernamental de Mexico';

export const NIVELES_GOBIERNO = {
  federal: { label: 'Federal', value: 'federal' },
  estatal: { label: 'Estatal', value: 'estatal' },
  municipal: { label: 'Municipal', value: 'municipal' },
};

export const TIPOS_ENTE = {
  poder_ejecutivo: 'Poder Ejecutivo',
  poder_legislativo: 'Poder Legislativo',
  poder_judicial: 'Poder Judicial',
  organismo_autonomo: 'Organismo Autonomo',
  paraestatal: 'Entidad Paraestatal',
  fideicomiso: 'Fideicomiso',
  municipio: 'Municipio',
};

export const TIPOS_CUENTA = {
  activo: { label: 'Activo', naturaleza: 'deudora', genero: '1' },
  pasivo: { label: 'Pasivo', naturaleza: 'acreedora', genero: '2' },
  hacienda_publica: { label: 'Hacienda Publica', naturaleza: 'acreedora', genero: '3' },
  ingresos: { label: 'Ingresos y Otros Beneficios', naturaleza: 'acreedora', genero: '4' },
  gastos: { label: 'Gastos y Otras Perdidas', naturaleza: 'deudora', genero: '5' },
  cuentas_orden: { label: 'Cuentas de Orden', naturaleza: 'deudora', genero: '6' },
  cierre: { label: 'Cuentas de Cierre', naturaleza: 'deudora', genero: '7' },
};

export const MOMENTOS_GASTO = [
  { key: 'aprobado', label: 'Aprobado', order: 1 },
  { key: 'modificado', label: 'Modificado', order: 2 },
  { key: 'comprometido', label: 'Comprometido', order: 3 },
  { key: 'devengado', label: 'Devengado', order: 4 },
  { key: 'ejercido', label: 'Ejercido', order: 5 },
  { key: 'pagado', label: 'Pagado', order: 6 },
];

export const MOMENTOS_INGRESO = [
  { key: 'estimado', label: 'Estimado', order: 1 },
  { key: 'modificado', label: 'Modificado', order: 2 },
  { key: 'devengado', label: 'Devengado', order: 3 },
  { key: 'recaudado', label: 'Recaudado', order: 4 },
];

export const TIPOS_POLIZA = {
  ingreso: 'Ingreso',
  egreso: 'Egreso',
  diario: 'Diario',
  ajuste: 'Ajuste',
  cierre: 'Cierre',
};

export const ESTADOS_POLIZA = {
  borrador: { label: 'Borrador', color: 'text-muted' },
  pendiente: { label: 'Pendiente', color: 'warning' },
  aprobada: { label: 'Aprobada', color: 'success' },
  cancelada: { label: 'Cancelada', color: 'danger' },
};

export const TIPOS_MOVIMIENTO_PRESUPUESTAL = [
  { key: 'original', label: 'Original' },
  { key: 'adicion', label: 'Adicion' },
  { key: 'reduccion', label: 'Reduccion' },
];

export const TIPOS_BIEN = {
  mueble: 'Bien Mueble',
  inmueble: 'Bien Inmueble',
  intangible: 'Intangible',
};

export const ESTADOS_BIEN = {
  activo: { label: 'Activo', variant: 'success' },
  baja: { label: 'Baja', variant: 'danger' },
  transferido: { label: 'Transferido', variant: 'warning' },
  en_comodato: { label: 'En Comodato', variant: 'info' },
};

export const ESTADOS_INVENTARIO = {
  borrador: { label: 'Borrador', variant: 'default' },
  en_proceso: { label: 'En Proceso', variant: 'warning' },
  finalizado: { label: 'Finalizado', variant: 'success' },
};

export const TIPOS_FIDEICOMISO = {
  administracion: 'Administracion',
  inversion: 'Inversion',
  garantia: 'Garantia',
  traslativo: 'Traslativo',
  otro: 'Otro',
};

export const ESTADOS_FIDEICOMISO = {
  vigente: { label: 'Vigente', variant: 'success' },
  en_extincion: { label: 'En Extincion', variant: 'warning' },
  extinto: { label: 'Extinto', variant: 'danger' },
};

export const TIPOS_DEUDA = {
  credito: 'Credito Bancario',
  emision: 'Emision de Deuda',
  otro: 'Otro',
};

export const ESTADOS_DEUDA = {
  vigente: { label: 'Vigente', variant: 'success' },
  pagado: { label: 'Pagado', variant: 'info' },
  reestructurado: { label: 'Reestructurado', variant: 'warning' },
  refinanciado: { label: 'Refinanciado', variant: 'warning' },
};

export const TIPOS_MOVIMIENTO_DEUDA = [
  { key: 'disposicion', label: 'Disposicion' },
  { key: 'amortizacion', label: 'Amortizacion' },
  { key: 'pago_intereses', label: 'Pago de Intereses' },
  { key: 'comision', label: 'Comision' },
  { key: 'reestructura', label: 'Reestructura' },
  { key: 'otro', label: 'Otro' },
];

export const TIPOS_FONDO_FEDERAL = {
  participacion: 'Participacion',
  aportacion: 'Aportacion',
  subsidio: 'Subsidio',
  convenio: 'Convenio',
  otro: 'Otro',
};

export const ESTADOS_FONDO = {
  activo: { label: 'Activo', variant: 'success' },
  cerrado: { label: 'Cerrado', variant: 'default' },
  reintegrado: { label: 'Reintegrado', variant: 'warning' },
};

export const CLASIFICADORES = {
  administrativo: 'Administrativo',
  economico: 'Economico',
  funcional: 'Funcional',
  programatico: 'Programatico',
  objeto_gasto: 'Objeto del Gasto',
  geografico: 'Geografico',
  fuente_financiamiento: 'Fuente de Financiamiento',
};

export const ROLES = {
  super_admin: 'Super Administrador',
  admin_ente: 'Administrador de Ente',
  contador_general: 'Contador General',
  contador: 'Contador',
  presupuesto: 'Presupuesto',
  tesorero: 'Tesorero',
  patrimonio: 'Patrimonio',
  auditor: 'Auditor',
  transparencia: 'Transparencia',
  consulta: 'Consulta',
};

// ── Batch 1: LGCG Compliance ──────────────────────────────────────

export const ESTADOS_CONCILIACION = {
  borrador: { label: 'Borrador', variant: 'default' },
  revisado: { label: 'Revisado', variant: 'warning' },
  aprobado: { label: 'Aprobado', variant: 'success' },
};

export const NIVELES_MIR = [
  { key: 'fin', label: 'Fin', order: 1 },
  { key: 'proposito', label: 'Proposito', order: 2 },
  { key: 'componente', label: 'Componente', order: 3 },
  { key: 'actividad', label: 'Actividad', order: 4 },
];

export const TIPOS_PROGRAMA = {
  programa: 'Programa',
  proyecto: 'Proyecto',
  actividad: 'Actividad',
};

export const TIPOS_INDICADOR_MIR = {
  eficiencia: 'Eficiencia',
  eficacia: 'Eficacia',
  economia: 'Economia',
  calidad: 'Calidad',
};

export const FRECUENCIAS_MEDICION = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

export const DIMENSIONES_INDICADOR = {
  gestion: 'Gestion',
  estrategico: 'Estrategico',
};

export const CATEGORIAS_INDICADOR_FISCAL = {
  ingreso: { label: 'Ingresos', variant: 'success' },
  gasto: { label: 'Gastos', variant: 'danger' },
  balance: { label: 'Balance', variant: 'primary' },
  deuda: { label: 'Deuda', variant: 'warning' },
  financiero: { label: 'Financiero', variant: 'info' },
};

export const INDICADORES_PREDEFINIDOS = [
  { clave: 'ING_TOTAL', nombre: 'Ingresos Totales', categoria: 'ingreso' },
  { clave: 'GAS_TOTAL', nombre: 'Gastos Totales', categoria: 'gasto' },
  { clave: 'BAL_PRES', nombre: 'Balance Presupuestal', categoria: 'balance' },
  { clave: 'AHORRO', nombre: 'Ahorro/Desahorro', categoria: 'balance' },
  { clave: 'BAL_PRIM', nombre: 'Balance Primario', categoria: 'balance' },
  { clave: 'END_NETO', nombre: 'Endeudamiento Neto', categoria: 'deuda' },
  { clave: 'INV_PUB', nombre: 'Inversion Publica Productiva', categoria: 'financiero' },
];

export const TIPOS_NOTA_EF = {
  desglose: 'Notas de Desglose',
  memoria: 'Notas de Memoria',
  gestion: 'Notas de Gestion Administrativa',
};

export const ESTADOS_NOTA = {
  borrador: { label: 'Borrador', variant: 'default' },
  revisado: { label: 'Revisado', variant: 'warning' },
  aprobado: { label: 'Aprobado', variant: 'success' },
};

export const ESTADOS_FINANCIEROS_NOTA = {
  situacion_financiera: 'Estado de Situacion Financiera',
  actividades: 'Estado de Actividades',
  variacion_hacienda: 'Estado de Variacion en la Hacienda Publica',
  analitico_activo: 'Estado Analitico del Activo',
  flujo_efectivo: 'Estado de Flujos de Efectivo',
  general: 'General',
};

export const ESTADOS_APERTURA = {
  pendiente: { label: 'Pendiente', variant: 'default' },
  procesando: { label: 'Procesando', variant: 'warning' },
  completado: { label: 'Completado', variant: 'success' },
  error: { label: 'Error', variant: 'danger' },
};

// ── Batch 2: Tesoreria + Conciliacion Bancaria ─────────────────────

export const TIPOS_CUENTA_BANCARIA = {
  cheques: 'Cheques',
  inversion: 'Inversion',
  fideicomiso: 'Fideicomiso',
  otro: 'Otro',
};

export const TIPOS_MOVIMIENTO_BANCARIO = [
  { key: 'deposito', label: 'Deposito' },
  { key: 'retiro', label: 'Retiro' },
  { key: 'transferencia', label: 'Transferencia' },
  { key: 'comision', label: 'Comision' },
  { key: 'interes', label: 'Interes' },
  { key: 'otro', label: 'Otro' },
];

export const ESTADOS_CXC = {
  pendiente: { label: 'Pendiente', variant: 'warning' },
  parcial: { label: 'Parcial', variant: 'info' },
  cobrada: { label: 'Cobrada', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
  vencida: { label: 'Vencida', variant: 'danger' },
};

export const ESTADOS_CXP = {
  pendiente: { label: 'Pendiente', variant: 'warning' },
  parcial: { label: 'Parcial', variant: 'info' },
  pagada: { label: 'Pagada', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
  vencida: { label: 'Vencida', variant: 'danger' },
};

export const CATEGORIAS_FLUJO = {
  operacion: { label: 'Operacion', variant: 'primary' },
  inversion: { label: 'Inversion', variant: 'info' },
  financiamiento: { label: 'Financiamiento', variant: 'warning' },
};

export const ESTADOS_CONCILIACION_BANCARIA = {
  importado: { label: 'Importado', variant: 'default' },
  en_conciliacion: { label: 'En Conciliacion', variant: 'warning' },
  conciliado: { label: 'Conciliado', variant: 'success' },
  aprobado: { label: 'Aprobado', variant: 'primary' },
};

// ── Batch 3: Adquisiciones + Nomina ───────────────────────────────

export const ESTADOS_REQUISICION = {
  borrador: { label: 'Borrador', variant: 'default' },
  enviada: { label: 'Enviada', variant: 'info' },
  autorizada: { label: 'Autorizada', variant: 'success' },
  en_cotizacion: { label: 'En Cotizacion', variant: 'warning' },
  adjudicada: { label: 'Adjudicada', variant: 'primary' },
  rechazada: { label: 'Rechazada', variant: 'danger' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

export const ESTADOS_ORDEN_COMPRA = {
  borrador: { label: 'Borrador', variant: 'default' },
  enviada: { label: 'Enviada', variant: 'info' },
  recibida: { label: 'Recibida', variant: 'warning' },
  parcial: { label: 'Parcial', variant: 'warning' },
  completa: { label: 'Completa', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

export const TIPOS_CONTRATO = {
  base: 'Base',
  confianza: 'Confianza',
  eventual: 'Eventual',
  honorarios: 'Honorarios',
};

export const ESTADOS_EMPLEADO = {
  activo: { label: 'Activo', variant: 'success' },
  baja: { label: 'Baja', variant: 'danger' },
  licencia: { label: 'Licencia', variant: 'warning' },
  jubilado: { label: 'Jubilado', variant: 'info' },
};

export const TIPOS_CONCEPTO_NOMINA = {
  percepcion: 'Percepcion',
  deduccion: 'Deduccion',
};

export const ESTADOS_NOMINA = {
  borrador: { label: 'Borrador', variant: 'default' },
  calculada: { label: 'Calculada', variant: 'info' },
  autorizada: { label: 'Autorizada', variant: 'success' },
  pagada: { label: 'Pagada', variant: 'primary' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

// ── Batch 4: Obra Publica + Recaudacion + Envio ───────────────────

export const TIPOS_PROYECTO_OBRA = {
  obra_publica: 'Obra Publica',
  servicios_relacionados: 'Servicios Relacionados',
  adquisicion: 'Adquisicion',
};

export const MODALIDADES_CONTRATACION = {
  licitacion_publica: 'Licitacion Publica',
  invitacion_restringida: 'Invitacion Restringida',
  adjudicacion_directa: 'Adjudicacion Directa',
};

export const ESTADOS_PROYECTO = {
  planeacion: { label: 'Planeacion', variant: 'default' },
  en_proceso: { label: 'En Proceso', variant: 'warning' },
  suspendida: { label: 'Suspendida', variant: 'danger' },
  terminada: { label: 'Terminada', variant: 'success' },
  en_operacion: { label: 'En Operacion', variant: 'primary' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

export const ESTADOS_ESTIMACION = {
  pendiente: { label: 'Pendiente', variant: 'default' },
  revisada: { label: 'Revisada', variant: 'warning' },
  aprobada: { label: 'Aprobada', variant: 'success' },
  pagada: { label: 'Pagada', variant: 'primary' },
};

export const TIPOS_CONTRIBUYENTE = {
  persona_fisica: 'Persona Fisica',
  persona_moral: 'Persona Moral',
};

export const FORMAS_PAGO = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

export const ESTADOS_COBRO = {
  pendiente: { label: 'Pendiente', variant: 'warning' },
  aplicado: { label: 'Aplicado', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
};

export const TIPOS_ENVIO_OBLIGACION = {
  conac_trimestral: 'CONAC Trimestral',
  conac_anual: 'CONAC Anual',
  asf_cuenta_publica: 'ASF Cuenta Publica',
  shcp_disciplina: 'SHCP Disciplina Financiera',
  sipot: 'SIPOT',
  otro: 'Otro',
};

export const ESTADOS_ENVIO = {
  pendiente: { label: 'Pendiente', variant: 'warning' },
  generando: { label: 'Generando', variant: 'info' },
  generado: { label: 'Generado', variant: 'default' },
  enviado: { label: 'Enviado', variant: 'success' },
  confirmado: { label: 'Confirmado', variant: 'primary' },
  rechazado: { label: 'Rechazado', variant: 'danger' },
};

// ── Batch 5: Portal Ciudadano + CFDI + Dashboard RT + Benchmarking + Reportes Avanzados ──

export const TIPOS_PUBLICACION_PORTAL = {
  estado_financiero: 'Estado Financiero',
  presupuesto: 'Presupuesto',
  cuenta_publica: 'Cuenta Publica',
  indicador: 'Indicador',
  informe: 'Informe',
  otro: 'Otro',
};

export const ESTADOS_PUBLICACION = {
  borrador: { label: 'Borrador', variant: 'default' },
  revision: { label: 'En Revision', variant: 'warning' },
  publicado: { label: 'Publicado', variant: 'success' },
  retirado: { label: 'Retirado', variant: 'danger' },
};

export const TIPOS_CFDI = {
  ingreso: 'Ingreso',
  egreso: 'Egreso',
  traslado: 'Traslado',
  nomina: 'Nomina',
  pago: 'Pago',
};

export const ESTADOS_CFDI = {
  vigente: { label: 'Vigente', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
  pendiente: { label: 'Pendiente', variant: 'warning' },
};

export const USOS_CFDI = {
  G01: 'Adquisicion de mercancias',
  G02: 'Devoluciones, descuentos o bonificaciones',
  G03: 'Gastos en general',
  I01: 'Construcciones',
  I02: 'Mobiliario y equipo de oficina',
  I03: 'Equipo de transporte',
  I04: 'Equipo de computo',
  P01: 'Por definir',
  S01: 'Sin efectos fiscales',
};

export const METODOS_PAGO_CFDI = {
  PUE: 'Pago en una sola exhibicion',
  PPD: 'Pago en parcialidades o diferido',
};

export const TIPOS_BENCHMARK = {
  periodo: 'Comparativo por Periodo',
  ente: 'Comparativo entre Entes',
  indicador: 'Indicador vs Meta',
  historico: 'Tendencia Historica',
};

export const TIPOS_REPORTE_AVANZADO = {
  financiero: 'Financiero',
  presupuestal: 'Presupuestal',
  patrimonial: 'Patrimonial',
  fiscal: 'Fiscal',
  personalizado: 'Personalizado',
};

export const ESTADOS_REPORTE = {
  borrador: { label: 'Borrador', variant: 'default' },
  generado: { label: 'Generado', variant: 'info' },
  aprobado: { label: 'Aprobado', variant: 'success' },
  exportado: { label: 'Exportado', variant: 'primary' },
};

// ── Batch 6: PWA/Offline + e.firma/FIEL + IA Anomaly Detection ──

export const ESTADOS_PWA = {
  online: { label: 'En Linea', variant: 'success' },
  offline: { label: 'Sin Conexion', variant: 'danger' },
  sincronizando: { label: 'Sincronizando', variant: 'warning' },
};

export const TIPOS_CACHE = {
  catalogo: 'Catalogos',
  poliza: 'Polizas',
  presupuesto: 'Presupuesto',
  reporte: 'Reportes',
  configuracion: 'Configuracion',
};

export const TIPOS_CERTIFICADO = {
  fiel: 'FIEL (e.firma)',
  sello: 'Sello Digital',
  csd: 'CSD (Comprobantes)',
};

export const ESTADOS_CERTIFICADO = {
  vigente: { label: 'Vigente', variant: 'success' },
  por_vencer: { label: 'Por Vencer', variant: 'warning' },
  vencido: { label: 'Vencido', variant: 'danger' },
  revocado: { label: 'Revocado', variant: 'danger' },
};

export const TIPOS_DOCUMENTO_FIRMA = {
  poliza: 'Poliza Contable',
  estado_financiero: 'Estado Financiero',
  cuenta_publica: 'Cuenta Publica',
  contrato: 'Contrato',
  oficio: 'Oficio',
  otro: 'Otro',
};

export const ESTADOS_FIRMA = {
  pendiente: { label: 'Pendiente', variant: 'warning' },
  firmado: { label: 'Firmado', variant: 'success' },
  rechazado: { label: 'Rechazado', variant: 'danger' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
};

export const TIPOS_ANOMALIA = {
  monto_inusual: 'Monto Inusual',
  patron_duplicado: 'Patron Duplicado',
  horario_sospechoso: 'Horario Sospechoso',
  desviacion_presupuestal: 'Desviacion Presupuestal',
  secuencia_irregular: 'Secuencia Irregular',
  proveedor_concentrado: 'Proveedor Concentrado',
  otro: 'Otro',
};

export const NIVELES_RIESGO = {
  bajo: { label: 'Bajo', variant: 'info' },
  medio: { label: 'Medio', variant: 'warning' },
  alto: { label: 'Alto', variant: 'danger' },
  critico: { label: 'Critico', variant: 'danger' },
};

export const ESTADOS_ANOMALIA = {
  detectada: { label: 'Detectada', variant: 'danger' },
  en_revision: { label: 'En Revision', variant: 'warning' },
  confirmada: { label: 'Confirmada', variant: 'danger' },
  descartada: { label: 'Descartada', variant: 'default' },
  resuelta: { label: 'Resuelta', variant: 'success' },
};
