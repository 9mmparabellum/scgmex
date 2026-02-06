/**
 * RBAC – Role-Based Access Control
 * Controla el acceso y edición por módulo según el rol del usuario.
 */

const PERMISOS_ROL = {
  super_admin: { access: '*', edit: '*' },
  admin_ente: { access: '*', edit: '*' },
  contador_general: {
    access: ['configuracion', 'catalogo', 'contabilidad', 'presupuesto', 'patrimonio', 'deuda', 'reportes', 'cuenta_publica', 'transparencia', 'fondos'],
    edit: ['catalogo', 'contabilidad', 'presupuesto'],
  },
  contador: {
    access: ['catalogo', 'contabilidad', 'reportes'],
    edit: ['contabilidad'],
  },
  presupuesto: {
    access: ['catalogo', 'presupuesto', 'reportes', 'cuenta_publica'],
    edit: ['presupuesto'],
  },
  tesorero: {
    access: ['contabilidad', 'presupuesto', 'deuda', 'reportes', 'cuenta_publica'],
    edit: ['deuda'],
  },
  patrimonio: {
    access: ['catalogo', 'patrimonio', 'reportes'],
    edit: ['patrimonio'],
  },
  auditor: {
    access: ['catalogo', 'contabilidad', 'presupuesto', 'patrimonio', 'deuda', 'reportes', 'cuenta_publica', 'transparencia', 'fondos'],
    edit: [],
  },
  transparencia: {
    access: ['reportes', 'cuenta_publica', 'transparencia'],
    edit: ['transparencia'],
  },
  consulta: {
    access: ['reportes', 'cuenta_publica'],
    edit: [],
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
