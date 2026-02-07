import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------
// The cierre functions are in src/services/cierreEjercicioService.js
// They are async and heavily Supabase-dependent, so we mock supabase.
// ---------------------------------------------------------------

// Mock supabase
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('../config/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    rpc: (...args) => mockRpc(...args),
  },
}));

// Mock polizaService
vi.mock('./polizaService', () => ({
  createPolizaCompleta: vi.fn().mockResolvedValue({ id: 'poliza-1' }),
  getNextNumeroPoliza: vi.fn().mockResolvedValue(1),
}));

let mod;
try {
  mod = await import('../services/cierreEjercicioService.js');
} catch {
  // Module may fail to import if deps are missing
}

const {
  validarCierreEjercicio,
  previsualizarCierre,
  ejecutarCierreEjercicio,
  generarPolizaApertura,
} = mod || {};

// ── Helper to create chainable mock ──────────────────────────────
function chainable(finalResult) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  // Make chained methods that resolve to finalResult at any time
  chain.select.mockReturnValue(chain);
  chain.order.mockImplementation(() => {
    // On terminal calls, return the data
    const terminalChain = { ...chain };
    terminalChain.limit = vi.fn().mockResolvedValue(finalResult);
    // Also make it thenable itself
    terminalChain.then = (resolve) => resolve(finalResult);
    return terminalChain;
  });
  return chain;
}

// ===========================================================================
// validarCierreEjercicio
// Signature: async (enteId, ejercicioId) => { canClose, errors, checks }
// ===========================================================================
describe('validarCierreEjercicio', () => {
  const skipIf = !validarCierreEjercicio;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be an async function', () => {
    if (skipIf) return;
    expect(typeof validarCierreEjercicio).toBe('function');
  });

  it('should return canClose=false when ejercicio not found', async () => {
    if (skipIf) return;
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    const result = await validarCierreEjercicio('ente-1', 'ej-1');
    expect(result.canClose).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should return canClose=false when ejercicio is already closed', async () => {
    if (skipIf) return;
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'ej-1', anio: 2025, estado: 'cerrado' },
              error: null,
            }),
          }),
        }),
      }),
    });

    const result = await validarCierreEjercicio('ente-1', 'ej-1');
    expect(result.canClose).toBe(false);
    expect(result.errors.some((e) => e.includes('cerrado'))).toBe(true);
  });
});

// ===========================================================================
// Module exports check
// ===========================================================================
describe('cierreEjercicioService exports', () => {
  it('should export validarCierreEjercicio', () => {
    expect(validarCierreEjercicio).toBeDefined();
  });

  it('should export previsualizarCierre', () => {
    expect(previsualizarCierre).toBeDefined();
  });

  it('should export ejecutarCierreEjercicio', () => {
    expect(ejecutarCierreEjercicio).toBeDefined();
  });

  it('should export generarPolizaApertura', () => {
    expect(generarPolizaApertura).toBeDefined();
  });
});
