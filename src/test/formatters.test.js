import { describe, it, expect } from 'vitest';
import {
  formatMXN,
  formatNumber,
  formatDate,
  formatDateTime,
  formatPeriodo,
} from '../utils/formatters';

// ===========================================================================
// formatMXN
// ===========================================================================
describe('formatMXN', () => {
  it('formats positive numbers as MXN currency', () => {
    const result = formatMXN(1234.5);
    expect(result).toContain('1,234.50');
  });

  it('formats large numbers correctly', () => {
    const result = formatMXN(1000000);
    expect(result).toContain('1,000,000.00');
  });

  it('formats zero', () => {
    expect(formatMXN(0)).toContain('0.00');
  });

  it('formats negative numbers', () => {
    const result = formatMXN(-500.25);
    expect(result).toContain('500.25');
  });

  it('rounds to 2 decimal places', () => {
    const result = formatMXN(99.999);
    expect(result).toContain('100.00');
  });

  it('handles null returning $0.00', () => {
    expect(formatMXN(null)).toContain('0.00');
  });

  it('handles undefined returning $0.00', () => {
    expect(formatMXN(undefined)).toContain('0.00');
  });

  it('handles NaN returning $0.00', () => {
    expect(formatMXN(NaN)).toContain('0.00');
  });

  it('handles string-that-is-NaN returning $0.00', () => {
    expect(formatMXN('abc')).toContain('0.00');
  });

  it('formats very small amounts', () => {
    const result = formatMXN(0.01);
    expect(result).toContain('0.01');
  });

  it('formats centavos properly', () => {
    const result = formatMXN(1.1);
    expect(result).toContain('1.10');
  });
});

// ===========================================================================
// formatNumber
// ===========================================================================
describe('formatNumber', () => {
  it('formats a number with 2 decimal places by default', () => {
    const result = formatNumber(1234.567);
    expect(result).toContain('1,234.57');
  });

  it('formats with 0 decimal places', () => {
    const result = formatNumber(1234.5, 0);
    expect(result).toMatch(/1,23[45]/);
  });

  it('formats with 4 decimal places', () => {
    const result = formatNumber(1.23456, 4);
    expect(result).toContain('1.2346');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toContain('0.00');
  });

  it('returns "0" for null', () => {
    expect(formatNumber(null)).toBe('0');
  });

  it('returns "0" for undefined', () => {
    expect(formatNumber(undefined)).toBe('0');
  });

  it('returns "0" for NaN', () => {
    expect(formatNumber(NaN)).toBe('0');
  });

  it('formats negative numbers', () => {
    const result = formatNumber(-9876.54);
    expect(result).toContain('9,876.54');
  });

  it('handles very large numbers', () => {
    const result = formatNumber(999999999.99);
    expect(result).toContain('999,999,999.99');
  });
});

// ===========================================================================
// formatDate
// ===========================================================================
describe('formatDate', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2025-03-15T12:00:00');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/03/);
    expect(result).toMatch(/2025/);
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date(2025, 0, 1));
    expect(result).toMatch(/01/);
    expect(result).toMatch(/2025/);
  });

  it('returns "--" for null', () => {
    expect(formatDate(null)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatDate('')).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatDate(undefined)).toBe('--');
  });

  it('returns "--" for zero (falsy)', () => {
    expect(formatDate(0)).toBe('--');
  });
});

// ===========================================================================
// formatDateTime
// ===========================================================================
describe('formatDateTime', () => {
  it('formats an ISO datetime string with time', () => {
    const result = formatDateTime('2025-06-15T14:30:00');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/06/);
    expect(result).toMatch(/2025/);
    // Should include time portion
    expect(result).toMatch(/[0-9]{1,2}:[0-9]{2}/);
  });

  it('returns "--" for null', () => {
    expect(formatDateTime(null)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatDateTime('')).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatDateTime(undefined)).toBe('--');
  });
});

// ===========================================================================
// formatPeriodo
// ===========================================================================
describe('formatPeriodo', () => {
  it('returns "Enero" for period 1', () => {
    expect(formatPeriodo(1)).toBe('Enero');
  });

  it('returns "Febrero" for period 2', () => {
    expect(formatPeriodo(2)).toBe('Febrero');
  });

  it('returns "Marzo" for period 3', () => {
    expect(formatPeriodo(3)).toBe('Marzo');
  });

  it('returns "Abril" for period 4', () => {
    expect(formatPeriodo(4)).toBe('Abril');
  });

  it('returns "Mayo" for period 5', () => {
    expect(formatPeriodo(5)).toBe('Mayo');
  });

  it('returns "Junio" for period 6', () => {
    expect(formatPeriodo(6)).toBe('Junio');
  });

  it('returns "Julio" for period 7', () => {
    expect(formatPeriodo(7)).toBe('Julio');
  });

  it('returns "Agosto" for period 8', () => {
    expect(formatPeriodo(8)).toBe('Agosto');
  });

  it('returns "Septiembre" for period 9', () => {
    expect(formatPeriodo(9)).toBe('Septiembre');
  });

  it('returns "Octubre" for period 10', () => {
    expect(formatPeriodo(10)).toBe('Octubre');
  });

  it('returns "Noviembre" for period 11', () => {
    expect(formatPeriodo(11)).toBe('Noviembre');
  });

  it('returns "Diciembre" for period 12', () => {
    expect(formatPeriodo(12)).toBe('Diciembre');
  });

  it('returns "Ajustes" for period 13', () => {
    expect(formatPeriodo(13)).toBe('Ajustes');
  });

  it('returns fallback for period 14', () => {
    expect(formatPeriodo(14)).toBe('Periodo 14');
  });

  it('returns fallback for period 0', () => {
    expect(formatPeriodo(0)).toBe('Periodo 0');
  });

  it('returns fallback for negative period', () => {
    expect(formatPeriodo(-1)).toBe('Periodo -1');
  });
});
