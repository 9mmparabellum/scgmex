/**
 * exportHelpers.js
 * ---------------------------------------------------------------------------
 * Utility for exporting tabular data to Excel (.xlsx) files.
 * Depends on the `xlsx` (SheetJS) library.
 * ---------------------------------------------------------------------------
 */

import * as XLSX from 'xlsx';

/**
 * Export an array of data rows to an Excel file and trigger a browser download.
 *
 * @param {Array}  data     - Array of row objects.
 * @param {Array}  columns  - Column definitions. Each column should have:
 *                             - `label` {string}  — Header text.
 *                             - `key`   {string}  — Property name on the row object (used when `getValue` is not provided).
 *                             - `getValue` {Function} (optional) — Custom accessor `(row) => value`.
 * @param {string} filename - Desired filename (without extension).
 */
export function exportToExcel(data, columns, filename) {
  const wsData = [
    columns.map((c) => c.label),
    ...data.map((row) =>
      columns.map((c) => (c.getValue ? c.getValue(row) : row[c.key]))
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns (default width of 20 characters)
  ws['!cols'] = columns.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
