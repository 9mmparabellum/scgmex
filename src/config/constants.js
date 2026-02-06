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
