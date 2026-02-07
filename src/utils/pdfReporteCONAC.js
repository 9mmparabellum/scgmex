/**
 * pdfReporteCONAC.js
 * ---------------------------------------------------------------------------
 * Genera PDFs con formato oficial CONAC para reportes del Art. 46 LGCG.
 * Usa jsPDF + jspdf-autotable (ya instalados en el proyecto).
 * ---------------------------------------------------------------------------
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  addSignatureBlock,
  addDigitalSignature,
  setPDFMetadata,
  generatePDFHash,
  addHashFooter,
} from './pdfSigner';

// ── Constantes ──────────────────────────────────────────────────────────────

const GUINDA = [157, 36, 73];     // #9D2449
const GRAY_LIGHT = [245, 245, 248];
const GRAY_MID = [233, 233, 237];
const WHITE = [255, 255, 255];
const TEXT_DARK = [43, 44, 64];   // #2b2c40

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const PROTESTA = 'Bajo protesta de decir verdad declaramos que los Estados Financieros y sus Notas son razonablemente correctos y responsabilidad del emisor.';

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtMoney(n) {
  if (n == null || isNaN(n)) return '';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fechaReporte(periodo, ejercicio) {
  const mes = periodo?.numero || 12;
  const anio = ejercicio?.anio || ejercicio?.year || new Date().getFullYear();
  const mesNombre = MESES[mes - 1] || 'Diciembre';
  return `DEL 1 DE ENERO AL 31 DE ${mesNombre.toUpperCase()} DE ${anio}`;
}

// ── Main Export ─────────────────────────────────────────────────────────────

/**
 * Generate an official CONAC-format PDF from structured report data.
 *
 * @param {Object} reporte  - Output from reportesCONAC.js generarReporte()
 * @param {Object} options  - { ente, ejercicio, periodo, nivelGobierno,
 *                              elaboro, reviso, autorizo,
 *                              selloDigital, cadenaOriginal, timestamp }
 */
export async function generarPdfCONAC(reporte, options = {}) {
  const { ente, ejercicio, periodo, nivelGobierno } = options;
  const orientation = reporte.orientacion === 'landscape' ? 'landscape' : 'portrait';
  const doc = new jsPDF(orientation, 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ── PDF Metadata ──────────────────────────────────────────────────────
  const enteLabel = ente?.nombre || ente?.razon_social || 'Ente Publico';
  setPDFMetadata(doc, {
    title: `${reporte.titulo} - ${enteLabel}`,
    subject: reporte.titulo,
    author: enteLabel,
    keywords: `CONAC, LGCG, contabilidad gubernamental, ${reporte.titulo}`,
  });

  // ── Header ──────────────────────────────────────────────────────────────

  let cursorY = margin;

  // Ente name
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...TEXT_DARK);
  const enteNombre = ente?.nombre || ente?.razon_social || 'Ente Publico';
  doc.text(`ENTE PUBLICO: ${enteNombre.toUpperCase()}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;

  // Nivel gobierno
  if (nivelGobierno) {
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text(`Nivel de Gobierno: ${nivelGobierno}`, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 4;
  }

  // Report title
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...GUINDA);
  doc.text(reporte.titulo.toUpperCase(), pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;

  // Period subtitle
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...TEXT_DARK);
  const periodoText = reporte.subtitulo || fechaReporte(periodo, ejercicio);
  doc.text(periodoText, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 3;

  // Pesos y centavos
  doc.setFontSize(7);
  doc.setFont(undefined, 'italic');
  doc.text('(Cifras en Pesos y Centavos)', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;

  // ── Build table data ────────────────────────────────────────────────────

  const columns = reporte.columnas || [];
  const head = [columns.map((c) => c.label)];
  const body = [];
  const sectionRowIndices = [];
  const subtotalRowIndices = [];
  let totalRowIndex = -1;

  for (const seccion of (reporte.secciones || [])) {
    // Section header row
    sectionRowIndices.push(body.length);
    const sectionRow = columns.map((_, i) => (i === 0 ? seccion.titulo : ''));
    body.push(sectionRow);

    // Data rows
    for (const fila of (seccion.filas || [])) {
      const row = columns.map((col) => {
        const val = fila[col.key];
        if (col.format && typeof val === 'number') return fmtMoney(val);
        if (typeof val === 'number' && col.align === 'right') return fmtMoney(val);
        return val ?? '';
      });
      body.push(row);
    }

    // Subtotal row
    if (seccion.subtotal != null) {
      subtotalRowIndices.push(body.length);
      const subtRow = columns.map((col, i) => {
        if (i === columns.length - 1) return fmtMoney(seccion.subtotal);
        if (i === 0) return '';
        if (i === 1) return `TOTAL ${seccion.titulo}`;
        return '';
      });
      body.push(subtRow);
    }
  }

  // Grand total row
  if (reporte.totales) {
    totalRowIndex = body.length;
    if (reporte.totales.valores) {
      // Multi-column totals
      const totalRow = columns.map((col, i) => {
        if (i === 0) return '';
        if (i === 1) return reporte.totales.label;
        const val = reporte.totales.valores[col.key];
        return val != null ? fmtMoney(val) : '';
      });
      body.push(totalRow);
    } else {
      // Single value total
      const totalRow = columns.map((col, i) => {
        if (i === columns.length - 1) return fmtMoney(reporte.totales.valor);
        if (i === 0) return '';
        if (i === 1) return reporte.totales.label;
        return '';
      });
      body.push(totalRow);
    }
  }

  // ── Column widths ───────────────────────────────────────────────────────

  const availableWidth = pageWidth - margin * 2;
  const numCols = columns.length;
  const colStyles = {};

  columns.forEach((col, i) => {
    colStyles[i] = {
      halign: col.align || 'left',
      fontStyle: 'normal',
    };
    // First column (codigo) narrower, second (nombre) wider
    if (i === 0) colStyles[i].cellWidth = Math.min(availableWidth * 0.10, 25);
    if (i === 1) colStyles[i].cellWidth = numCols <= 3 ? availableWidth * 0.55 : availableWidth * 0.25;
  });

  // ── Render table ────────────────────────────────────────────────────────

  autoTable(doc, {
    head,
    body,
    startY: cursorY,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: TEXT_DARK,
      lineWidth: 0.1,
      lineColor: GRAY_MID,
    },
    headStyles: {
      fillColor: GUINDA,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    columnStyles: colStyles,
    alternateRowStyles: { fillColor: [252, 252, 254] },
    didParseCell: (hookData) => {
      const rowIdx = hookData.row.index;
      const section = hookData.section;
      if (section !== 'body') return;

      // Section header rows
      if (sectionRowIndices.includes(rowIdx)) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = GRAY_LIGHT;
        hookData.cell.styles.textColor = TEXT_DARK;
        hookData.cell.styles.fontSize = 7.5;
      }
      // Subtotal rows
      if (subtotalRowIndices.includes(rowIdx)) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = GRAY_MID;
        hookData.cell.styles.textColor = TEXT_DARK;
      }
      // Grand total row
      if (rowIdx === totalRowIndex) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = GUINDA;
        hookData.cell.styles.textColor = WHITE;
        hookData.cell.styles.fontSize = 8;
      }
    },
    didDrawPage: (hookData) => {
      const pageCount = doc.getNumberOfPages();
      const pageNum = hookData.pageNumber;

      // Footer - page numbers
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...TEXT_DARK);
      doc.text(
        `Pagina ${pageNum} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );

      // Footer - system name
      doc.text('SCGMEX - Sistema de Contabilidad Gubernamental', margin, pageHeight - 8);

      // Footer - date
      doc.text(
        `Generado: ${new Date().toLocaleDateString('es-MX')}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  // ── Protesta footer ─────────────────────────────────────────────────────

  const finalY = doc.lastAutoTable?.finalY || (pageHeight - 30);
  let cursorAfterTable = finalY + 8;

  if (cursorAfterTable < pageHeight - 25) {
    doc.setFontSize(6.5);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(120, 120, 120);
    const lines = doc.splitTextToSize(PROTESTA, availableWidth);
    doc.text(lines, margin, cursorAfterTable);
    cursorAfterTable += lines.length * 3.5 + 2;
  }

  // ── Notes ─────────────────────────────────────────────────────────────

  if (reporte.notas && cursorAfterTable < pageHeight - 20) {
    doc.setFontSize(6.5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    const noteLines = doc.splitTextToSize(`Nota: ${reporte.notas}`, availableWidth);
    doc.text(noteLines, margin, cursorAfterTable);
    cursorAfterTable += noteLines.length * 3.5 + 2;
  }

  // ── Signature Block ───────────────────────────────────────────────────

  const hasSignatures = options.elaboro || options.reviso || options.autorizo;
  if (hasSignatures) {
    // If not enough room on current page, add a new page
    if (cursorAfterTable + 45 > pageHeight - 25) {
      doc.addPage();
      cursorAfterTable = margin + 10;
    }
    addSignatureBlock(
      doc,
      {
        elaboro: options.elaboro,
        reviso: options.reviso,
        autorizo: options.autorizo,
      },
      cursorAfterTable + 5,
    );
  }

  // ── Digital Signature / Sello Digital ─────────────────────────────────

  const hasSello = options.selloDigital || options.cadenaOriginal || options.timestamp;
  if (hasSello) {
    addDigitalSignature(doc, {
      selloDigital: options.selloDigital,
      cadenaOriginal: options.cadenaOriginal,
      timestamp: options.timestamp,
    });
  }

  // ── Integrity Hash ────────────────────────────────────────────────────
  // The hash is computed over the full PDF content (after all drawing is
  // done) and then appended as a tiny footer on the last page.  Note that
  // because the hash itself alters the PDF, the embedded value is a
  // reference hash of the pre-hash document — which is the standard
  // approach for self-contained integrity markers.

  try {
    const hash = await generatePDFHash(doc);
    addHashFooter(doc, hash);
  } catch (_) {
    // crypto.subtle may not be available in all environments; skip silently
  }

  // ── Download ──────────────────────────────────────────────────────────

  const safeTitle = reporte.titulo.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
  const anio = ejercicio?.anio || ejercicio?.year || new Date().getFullYear();
  doc.save(`${safeTitle}_${anio}.pdf`);
}

/**
 * Generate all applicable CONAC reports as individual PDFs.
 * Useful for batch export.
 *
 * @param {string[]} reportKeys - Array of report keys to generate
 * @param {Function} generarReporte - The master generarReporte function
 * @param {Object} data - Data payload
 * @param {Object} options - { ente, ejercicio, periodo, nivelGobierno }
 */
export async function generarTodosPdfCONAC(reportKeys, generarReporte, data, options) {
  for (const key of reportKeys) {
    try {
      const reporte = generarReporte(key, data, options.ente, options.periodo, options.ejercicio);
      await generarPdfCONAC(reporte, options);
    } catch (err) {
      console.warn(`No se pudo generar PDF para ${key}:`, err.message);
    }
  }
}
