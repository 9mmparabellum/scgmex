import { describe, it, expect } from 'vitest';
import { formatMXN, formatNumber, formatDate, formatPeriodo } from '../formatters';

describe('formatMXN', () => {
  it('formats positive numbers as MXN currency', () => {
    const result = formatMXN(1234.5);
    expect(result).toContain('1,234.50');
  });

  it('formats zero', () => {
    expect(formatMXN(0)).toContain('0.00');
  });

  it('handles null/undefined', () => {
    expect(formatMXN(null)).toContain('0.00');
    expect(formatMXN(undefined)).toContain('0.00');
  });

  it('handles NaN', () => {
    expect(formatMXN(NaN)).toContain('0.00');
  });
});

describe('formatNumber', () => {
  it('formats a number with 2 decimal places by default', () => {
    const result = formatNumber(1234.567);
    expect(result).toContain('1,234.57');
  });

  it('handles custom decimal places', () => {
    const result = formatNumber(1234.5, 0);
    // With 0 decimals, 1234.5 rounds to 1,234 or 1,235 depending on locale
    expect(result).toMatch(/1,23[45]/);
  });

  it('returns "0" for null', () => {
    expect(formatNumber(null)).toBe('0');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2025-03-15T12:00:00');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/03/);
    expect(result).toMatch(/2025/);
  });

  it('returns "--" for falsy input', () => {
    expect(formatDate(null)).toBe('--');
    expect(formatDate('')).toBe('--');
  });
});

describe('formatPeriodo', () => {
  it('returns month name for valid period numbers', () => {
    expect(formatPeriodo(1)).toBe('Enero');
    expect(formatPeriodo(6)).toBe('Junio');
    expect(formatPeriodo(12)).toBe('Diciembre');
  });

  it('returns "Ajustes" for period 13', () => {
    expect(formatPeriodo(13)).toBe('Ajustes');
  });

  it('returns fallback for out-of-range', () => {
    expect(formatPeriodo(14)).toBe('Periodo 14');
  });
});
