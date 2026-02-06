import { describe, it, expect } from 'vitest';
import { canAccess, canEdit } from '../rbac';

describe('canAccess', () => {
  it('super_admin can access any module', () => {
    expect(canAccess('super_admin', 'contabilidad')).toBe(true);
    expect(canAccess('super_admin', 'transparencia')).toBe(true);
    expect(canAccess('super_admin', 'anything')).toBe(true);
  });

  it('admin_ente can access any module', () => {
    expect(canAccess('admin_ente', 'contabilidad')).toBe(true);
  });

  it('contador can access catalogo, contabilidad, reportes', () => {
    expect(canAccess('contador', 'catalogo')).toBe(true);
    expect(canAccess('contador', 'contabilidad')).toBe(true);
    expect(canAccess('contador', 'reportes')).toBe(true);
  });

  it('contador cannot access presupuesto', () => {
    expect(canAccess('contador', 'presupuesto')).toBe(false);
  });

  it('consulta can only access reportes and cuenta_publica', () => {
    expect(canAccess('consulta', 'reportes')).toBe(true);
    expect(canAccess('consulta', 'cuenta_publica')).toBe(true);
    expect(canAccess('consulta', 'contabilidad')).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(canAccess('unknown', 'contabilidad')).toBe(false);
  });
});

describe('canEdit', () => {
  it('super_admin can edit any module', () => {
    expect(canEdit('super_admin', 'contabilidad')).toBe(true);
    expect(canEdit('super_admin', 'patrimonio')).toBe(true);
  });

  it('contador can edit contabilidad only', () => {
    expect(canEdit('contador', 'contabilidad')).toBe(true);
    expect(canEdit('contador', 'presupuesto')).toBe(false);
    expect(canEdit('contador', 'catalogo')).toBe(false);
  });

  it('auditor cannot edit anything', () => {
    expect(canEdit('auditor', 'contabilidad')).toBe(false);
    expect(canEdit('auditor', 'reportes')).toBe(false);
  });

  it('consulta cannot edit anything', () => {
    expect(canEdit('consulta', 'reportes')).toBe(false);
  });

  it('patrimonio can only edit patrimonio', () => {
    expect(canEdit('patrimonio', 'patrimonio')).toBe(true);
    expect(canEdit('patrimonio', 'contabilidad')).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(canEdit('nonexistent', 'anything')).toBe(false);
  });
});
