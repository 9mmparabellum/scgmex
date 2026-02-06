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
