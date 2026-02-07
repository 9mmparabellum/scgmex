/**
 * RBAC – Role-Based Access Control
 * Controla el acceso y edición por módulo según el rol del usuario.
 */

const PERMISOS_ROL = {
  super_admin: { access: '*', edit: '*' },
  admin_ente: { access: '*', edit: '*' },
  contador_general: {
    access: ['configuracion', 'catalogo', 'contabilidad', 'presupuesto', 'patrimonio', 'deuda', 'reportes', 'cuenta_publica', 'transparencia', 'fondos', 'conciliacion', 'indicadores', 'tesoreria', 'cfdi', 'portal'],
    edit: ['catalogo', 'contabilidad', 'presupuesto', 'conciliacion', 'cfdi'],
  },
  contador: {
    access: ['catalogo', 'contabilidad', 'reportes', 'conciliacion'],
    edit: ['contabilidad'],
  },
  presupuesto: {
    access: ['catalogo', 'presupuesto', 'reportes', 'cuenta_publica', 'mir', 'adquisiciones', 'obra_publica', 'obligaciones'],
    edit: ['presupuesto', 'mir'],
  },
  tesorero: {
    access: ['contabilidad', 'presupuesto', 'deuda', 'reportes', 'cuenta_publica', 'tesoreria', 'conciliacion', 'recaudacion', 'obligaciones'],
    edit: ['deuda', 'tesoreria', 'recaudacion'],
  },
  patrimonio: {
    access: ['catalogo', 'patrimonio', 'reportes', 'obra_publica'],
    edit: ['patrimonio'],
  },
  auditor: {
    access: ['catalogo', 'contabilidad', 'presupuesto', 'patrimonio', 'deuda', 'reportes', 'cuenta_publica', 'transparencia', 'fondos', 'conciliacion', 'mir', 'indicadores', 'tesoreria', 'adquisiciones', 'nomina', 'obra_publica', 'recaudacion', 'obligaciones', 'cfdi', 'portal'],
    edit: [],
  },
  transparencia: {
    access: ['reportes', 'cuenta_publica', 'transparencia', 'portal'],
    edit: ['transparencia', 'portal'],
  },
  consulta: {
    access: ['reportes', 'cuenta_publica', 'portal'],
    edit: [],
  },
  nomina: {
    access: ['nomina', 'reportes'],
    edit: ['nomina'],
  },
  adquisiciones: {
    access: ['adquisiciones', 'reportes'],
    edit: ['adquisiciones'],
  },
};

export function canAccess(rol, modulo) {
  const permisos = PERMISOS_ROL[rol];
  if (!permisos) return false;
  if (permisos.access === '*') return true;
  return permisos.access.includes(modulo);
}

export function canEdit(rol, modulo) {
  const permisos = PERMISOS_ROL[rol];
  if (!permisos) return false;
  if (permisos.edit === '*') return true;
  return permisos.edit.includes(modulo);
}
