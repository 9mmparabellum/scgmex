import { describe, it, expect } from 'vitest';
import { canAccess, canEdit } from '../utils/rbac';

// ===========================================================================
// canAccess
// ===========================================================================
describe('RBAC - canAccess', () => {
  // ---- super_admin ----
  it('super_admin can access any module', () => {
    expect(canAccess('super_admin', 'contabilidad')).toBe(true);
    expect(canAccess('super_admin', 'tesoreria')).toBe(true);
    expect(canAccess('super_admin', 'presupuesto')).toBe(true);
    expect(canAccess('super_admin', 'patrimonio')).toBe(true);
  });

  // ---- admin_ente ----
  it('admin_ente can access any module (wildcard)', () => {
    expect(canAccess('admin_ente', 'configuracion')).toBe(true);
    expect(canAccess('admin_ente', 'nomina')).toBe(true);
  });

  // ---- contador_general ----
  it('contador_general can access contabilidad', () => {
    expect(canAccess('contador_general', 'contabilidad')).toBe(true);
  });

  it('contador_general can access presupuesto', () => {
    expect(canAccess('contador_general', 'presupuesto')).toBe(true);
  });

  it('contador_general can access transparencia', () => {
    expect(canAccess('contador_general', 'transparencia')).toBe(true);
  });

  it('contador_general cannot access nomina', () => {
    expect(canAccess('contador_general', 'nomina')).toBe(false);
  });

  it('contador_general cannot access adquisiciones', () => {
    expect(canAccess('contador_general', 'adquisiciones')).toBe(false);
  });

  // ---- contador ----
  it('contador can access catalogo', () => {
    expect(canAccess('contador', 'catalogo')).toBe(true);
  });

  it('contador can access contabilidad', () => {
    expect(canAccess('contador', 'contabilidad')).toBe(true);
  });

  it('contador can access reportes', () => {
    expect(canAccess('contador', 'reportes')).toBe(true);
  });

  it('contador can access conciliacion', () => {
    expect(canAccess('contador', 'conciliacion')).toBe(true);
  });

  it('contador cannot access tesoreria', () => {
    expect(canAccess('contador', 'tesoreria')).toBe(false);
  });

  it('contador cannot access presupuesto', () => {
    expect(canAccess('contador', 'presupuesto')).toBe(false);
  });

  it('contador cannot access patrimonio', () => {
    expect(canAccess('contador', 'patrimonio')).toBe(false);
  });

  // ---- presupuesto ----
  it('presupuesto can access presupuesto', () => {
    expect(canAccess('presupuesto', 'presupuesto')).toBe(true);
  });

  it('presupuesto can access cuenta_publica', () => {
    expect(canAccess('presupuesto', 'cuenta_publica')).toBe(true);
  });

  it('presupuesto can access mir', () => {
    expect(canAccess('presupuesto', 'mir')).toBe(true);
  });

  it('presupuesto cannot access contabilidad', () => {
    expect(canAccess('presupuesto', 'contabilidad')).toBe(false);
  });

  // ---- tesorero ----
  it('tesorero can access tesoreria', () => {
    expect(canAccess('tesorero', 'tesoreria')).toBe(true);
  });

  it('tesorero can access deuda', () => {
    expect(canAccess('tesorero', 'deuda')).toBe(true);
  });

  it('tesorero can access recaudacion', () => {
    expect(canAccess('tesorero', 'recaudacion')).toBe(true);
  });

  it('tesorero cannot access patrimonio', () => {
    expect(canAccess('tesorero', 'patrimonio')).toBe(false);
  });

  // ---- patrimonio ----
  it('patrimonio can access patrimonio', () => {
    expect(canAccess('patrimonio', 'patrimonio')).toBe(true);
  });

  it('patrimonio can access obra_publica', () => {
    expect(canAccess('patrimonio', 'obra_publica')).toBe(true);
  });

  it('patrimonio cannot access tesoreria', () => {
    expect(canAccess('patrimonio', 'tesoreria')).toBe(false);
  });

  // ---- auditor ----
  it('auditor can access contabilidad (read-only)', () => {
    expect(canAccess('auditor', 'contabilidad')).toBe(true);
  });

  it('auditor can access presupuesto', () => {
    expect(canAccess('auditor', 'presupuesto')).toBe(true);
  });

  it('auditor can access nomina', () => {
    expect(canAccess('auditor', 'nomina')).toBe(true);
  });

  it('auditor can access all listed modules', () => {
    const modules = [
      'catalogo', 'contabilidad', 'presupuesto', 'patrimonio', 'deuda',
      'reportes', 'cuenta_publica', 'transparencia', 'fondos', 'conciliacion',
      'mir', 'indicadores', 'tesoreria', 'adquisiciones', 'nomina',
      'obra_publica', 'recaudacion', 'obligaciones', 'cfdi', 'portal', 'anomalias',
    ];
    modules.forEach((m) => {
      expect(canAccess('auditor', m)).toBe(true);
    });
  });

  // ---- transparencia ----
  it('transparencia can access transparencia', () => {
    expect(canAccess('transparencia', 'transparencia')).toBe(true);
  });

  it('transparencia can access portal', () => {
    expect(canAccess('transparencia', 'portal')).toBe(true);
  });

  it('transparencia cannot access contabilidad', () => {
    expect(canAccess('transparencia', 'contabilidad')).toBe(false);
  });

  // ---- consulta ----
  it('consulta can access reportes', () => {
    expect(canAccess('consulta', 'reportes')).toBe(true);
  });

  it('consulta can access cuenta_publica', () => {
    expect(canAccess('consulta', 'cuenta_publica')).toBe(true);
  });

  it('consulta cannot access contabilidad', () => {
    expect(canAccess('consulta', 'contabilidad')).toBe(false);
  });

  // ---- nomina ----
  it('nomina can access nomina', () => {
    expect(canAccess('nomina', 'nomina')).toBe(true);
  });

  it('nomina cannot access contabilidad', () => {
    expect(canAccess('nomina', 'contabilidad')).toBe(false);
  });

  // ---- adquisiciones ----
  it('adquisiciones can access adquisiciones', () => {
    expect(canAccess('adquisiciones', 'adquisiciones')).toBe(true);
  });

  it('adquisiciones cannot access contabilidad', () => {
    expect(canAccess('adquisiciones', 'contabilidad')).toBe(false);
  });

  // ---- edge cases ----
  it('unknown role returns false', () => {
    expect(canAccess('hacker', 'contabilidad')).toBe(false);
  });

  it('null role returns false', () => {
    expect(canAccess(null, 'contabilidad')).toBe(false);
  });

  it('undefined role returns false', () => {
    expect(canAccess(undefined, 'contabilidad')).toBe(false);
  });
});

// ===========================================================================
// canEdit
// ===========================================================================
describe('RBAC - canEdit', () => {
  // ---- super_admin ----
  it('super_admin can edit any module', () => {
    expect(canEdit('super_admin', 'contabilidad')).toBe(true);
    expect(canEdit('super_admin', 'tesoreria')).toBe(true);
    expect(canEdit('super_admin', 'presupuesto')).toBe(true);
  });

  // ---- admin_ente ----
  it('admin_ente can edit any module (wildcard)', () => {
    expect(canEdit('admin_ente', 'configuracion')).toBe(true);
    expect(canEdit('admin_ente', 'patrimonio')).toBe(true);
  });

  // ---- contador_general ----
  it('contador_general can edit catalogo', () => {
    expect(canEdit('contador_general', 'catalogo')).toBe(true);
  });

  it('contador_general can edit contabilidad', () => {
    expect(canEdit('contador_general', 'contabilidad')).toBe(true);
  });

  it('contador_general can edit presupuesto', () => {
    expect(canEdit('contador_general', 'presupuesto')).toBe(true);
  });

  it('contador_general can edit conciliacion', () => {
    expect(canEdit('contador_general', 'conciliacion')).toBe(true);
  });

  it('contador_general cannot edit tesoreria', () => {
    expect(canEdit('contador_general', 'tesoreria')).toBe(false);
  });

  it('contador_general cannot edit transparencia', () => {
    expect(canEdit('contador_general', 'transparencia')).toBe(false);
  });

  // ---- contador ----
  it('contador can edit contabilidad', () => {
    expect(canEdit('contador', 'contabilidad')).toBe(true);
  });

  it('contador cannot edit catalogo', () => {
    expect(canEdit('contador', 'catalogo')).toBe(false);
  });

  it('contador cannot edit presupuesto', () => {
    expect(canEdit('contador', 'presupuesto')).toBe(false);
  });

  // ---- presupuesto ----
  it('presupuesto can edit presupuesto', () => {
    expect(canEdit('presupuesto', 'presupuesto')).toBe(true);
  });

  it('presupuesto can edit mir', () => {
    expect(canEdit('presupuesto', 'mir')).toBe(true);
  });

  it('presupuesto cannot edit contabilidad', () => {
    expect(canEdit('presupuesto', 'contabilidad')).toBe(false);
  });

  // ---- tesorero ----
  it('tesorero can edit deuda', () => {
    expect(canEdit('tesorero', 'deuda')).toBe(true);
  });

  it('tesorero can edit tesoreria', () => {
    expect(canEdit('tesorero', 'tesoreria')).toBe(true);
  });

  it('tesorero can edit recaudacion', () => {
    expect(canEdit('tesorero', 'recaudacion')).toBe(true);
  });

  it('tesorero cannot edit contabilidad', () => {
    expect(canEdit('tesorero', 'contabilidad')).toBe(false);
  });

  // ---- patrimonio ----
  it('patrimonio can edit patrimonio', () => {
    expect(canEdit('patrimonio', 'patrimonio')).toBe(true);
  });

  it('patrimonio cannot edit contabilidad', () => {
    expect(canEdit('patrimonio', 'contabilidad')).toBe(false);
  });

  // ---- auditor ----
  it('auditor cannot edit anything', () => {
    expect(canEdit('auditor', 'contabilidad')).toBe(false);
    expect(canEdit('auditor', 'presupuesto')).toBe(false);
    expect(canEdit('auditor', 'patrimonio')).toBe(false);
    expect(canEdit('auditor', 'tesoreria')).toBe(false);
    expect(canEdit('auditor', 'nomina')).toBe(false);
  });

  // ---- transparencia ----
  it('transparencia can edit transparencia', () => {
    expect(canEdit('transparencia', 'transparencia')).toBe(true);
  });

  it('transparencia can edit portal', () => {
    expect(canEdit('transparencia', 'portal')).toBe(true);
  });

  it('transparencia cannot edit contabilidad', () => {
    expect(canEdit('transparencia', 'contabilidad')).toBe(false);
  });

  // ---- consulta ----
  it('consulta cannot edit anything', () => {
    expect(canEdit('consulta', 'reportes')).toBe(false);
    expect(canEdit('consulta', 'contabilidad')).toBe(false);
    expect(canEdit('consulta', 'portal')).toBe(false);
  });

  // ---- nomina ----
  it('nomina can edit nomina', () => {
    expect(canEdit('nomina', 'nomina')).toBe(true);
  });

  it('nomina cannot edit contabilidad', () => {
    expect(canEdit('nomina', 'contabilidad')).toBe(false);
  });

  // ---- adquisiciones ----
  it('adquisiciones can edit adquisiciones', () => {
    expect(canEdit('adquisiciones', 'adquisiciones')).toBe(true);
  });

  it('adquisiciones cannot edit contabilidad', () => {
    expect(canEdit('adquisiciones', 'contabilidad')).toBe(false);
  });

  // ---- edge cases ----
  it('unknown role returns false', () => {
    expect(canEdit('hacker', 'contabilidad')).toBe(false);
  });

  it('null role returns false', () => {
    expect(canEdit(null, 'contabilidad')).toBe(false);
  });

  it('undefined role returns false', () => {
    expect(canEdit(undefined, 'contabilidad')).toBe(false);
  });
});
