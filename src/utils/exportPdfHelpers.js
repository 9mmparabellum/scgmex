import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export tabular data to a PDF file and trigger a browser download.
 *
 * @param {Array}  data     - Array of row objects.
 * @param {Array}  columns  - Column definitions (same format as exportToExcel).
 *                             Each should have: { key, label, getValue? }
 * @param {string} filename - Desired filename (without extension).
 * @param {Object} options  - Optional config: { title, subtitle, ente, fecha, orientation }
 */
export function exportToPdf(data, columns, filename, options = {}) {
  const {
    title = filename,
    subtitle = '',
    ente = '',
    fecha = new Date().toLocaleDateString('es-MX'),
    orientation = 'landscape',
  } = options;

  const doc = new jsPDF(orientation, 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(title, pageWidth / 2, 15, { align: 'center' });

  if (ente) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(ente, pageWidth / 2, 22, { align: 'center' });
  }

  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, pageWidth / 2, ente ? 28 : 22, { align: 'center' });
  }

  doc.setFontSize(8);
  doc.text(`Fecha: ${fecha}`, pageWidth - 14, 15, { align: 'right' });

  // Table
  const head = [columns.map((c) => c.label)];
  const body = data.map((row) =>
    columns.map((c) => {
      const val = c.getValue ? c.getValue(row) : row[c.key];
      if (typeof val === 'number') {
        return new Intl.NumberFormat('es-MX', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val);
      }
      return val ?? '';
    })
  );

  autoTable(doc, {
    head,
    body,
    startY: ente ? 33 : subtitle ? 27 : 22,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: {
      fillColor: [157, 36, 73], // guinda
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didDrawPage: (hookData) => {
      // Footer with page numbers
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.text(
        `Pagina ${hookData.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
      doc.text(
        'SCGMEX — Sistema de Contabilidad Gubernamental',
        14,
        doc.internal.pageSize.getHeight() - 8
      );
    },
  });

  doc.save(`${filename}.pdf`);
}
