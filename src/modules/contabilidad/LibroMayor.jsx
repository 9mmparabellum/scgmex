import { useState, useMemo } from 'react';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { exportToExcel } from '../../utils/exportHelpers';
import { exportToPdf } from '../../utils/exportPdfHelpers';
import { useLibroMayor } from '../../hooks/usePoliza';
import { TIPOS_POLIZA } from '../../config/constants';
import { formatNumeroPoliza } from '../../utils/polizaHelpers';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function LibroMayor() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const [periodoId, setPeriodoId] = useState('');

  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: p.nombre || `Periodo ${p.numero}` })),
    [periodos]
  );

  const { data: movimientos = [], isLoading } = useLibroMayor(periodoId);

  /* Group movimientos by account */
  const cuentasAgrupadas = useMemo(() => {
    const groups = {};
    movimientos.forEach((m) => {
      const cuentaId = m.cuenta_id;
      if (!groups[cuentaId]) {
        groups[cuentaId] = {
          codigo: m.plan_de_cuentas?.codigo || '',
          nombre: m.plan_de_cuentas?.nombre || '',
          naturaleza: m.plan_de_cuentas?.naturaleza || 'deudora',
          movimientos: [],
        };
      }
      groups[cuentaId].movimientos.push(m);
    });
    // Sort by account code
    return Object.values(groups).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [movimientos]);

  const handleExport = () => {
    const rows = [];
    cuentasAgrupadas.forEach((cuenta) => {
      let saldo = 0;
      cuenta.movimientos.forEach((m) => {
        saldo +=
          cuenta.naturaleza === 'deudora'
            ? (m.debe || 0) - (m.haber || 0)
            : (m.haber || 0) - (m.debe || 0);
        rows.push({
          cuenta: cuenta.codigo,
          nombre_cuenta: cuenta.nombre,
          fecha: m.poliza?.fecha || '',
          poliza: m.poliza ? formatNumeroPoliza(m.poliza.tipo, m.poliza.numero_poliza) : '',
          concepto: m.concepto || '',
          debe: m.debe || 0,
          haber: m.haber || 0,
          saldo,
        });
      });
    });
    exportToExcel(
      rows,
      [
        { key: 'cuenta', label: 'Cuenta' },
        { key: 'nombre_cuenta', label: 'Nombre' },
        { key: 'fecha', label: 'Fecha' },
        { key: 'poliza', label: 'Poliza' },
        { key: 'concepto', label: 'Concepto' },
        { key: 'debe', label: 'Debe' },
        { key: 'haber', label: 'Haber' },
        { key: 'saldo', label: 'Saldo' },
      ],
      'libro_mayor'
    );
  };

  const handleExportPdf = () => {
    const rows = [];
    cuentasAgrupadas.forEach((cuenta) => {
      let saldo = 0;
      cuenta.movimientos.forEach((m) => {
        saldo += cuenta.naturaleza === 'deudora'
          ? (m.debe || 0) - (m.haber || 0)
          : (m.haber || 0) - (m.debe || 0);
        rows.push({
          cuenta: cuenta.codigo,
          nombre_cuenta: cuenta.nombre,
          fecha: m.poliza?.fecha || '',
          poliza: m.poliza ? formatNumeroPoliza(m.poliza.tipo, m.poliza.numero_poliza) : '',
          concepto: m.concepto || '',
          debe: m.debe || 0,
          haber: m.haber || 0,
          saldo,
        });
      });
    });
    exportToPdf(rows, [
      { key: 'cuenta', label: 'Cuenta' },
      { key: 'nombre_cuenta', label: 'Nombre' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'poliza', label: 'Poliza' },
      { key: 'concepto', label: 'Concepto' },
      { key: 'debe', label: 'Debe' },
      { key: 'haber', label: 'Haber' },
      { key: 'saldo', label: 'Saldo' },
    ], 'libro_mayor', { title: 'Libro Mayor' });
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Libro Mayor</h1>
        <p className="text-sm text-text-muted mt-1">
          Art. 37 — Movimientos agrupados por cuenta contable
        </p>
      </div>

      {/* Periodo selector */}
      <div className="bg-white rounded-lg card-shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Select
            label="Periodo"
            placeholder="Seleccionar periodo..."
            options={periodoOptions}
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
          />
          <div>{/* spacer */}</div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={handleExport} disabled={!movimientos?.length}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar XLSX
            </Button>
            <Button variant="ghost" onClick={handleExportPdf} disabled={!movimientos?.length}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Account groups */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">
          Libro Mayor{' '}
          <span className="text-text-muted font-normal">
            ({cuentasAgrupadas.length} cuentas)
          </span>
        </h2>

        {isLoading ? (
          <div className="text-center py-16 text-text-muted text-sm">
            Cargando libro mayor...
          </div>
        ) : !periodoId ? (
          <div className="text-center py-16 text-text-muted text-sm">
            Seleccione un periodo para ver el libro mayor
          </div>
        ) : cuentasAgrupadas.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">
            No hay movimientos en este periodo
          </div>
        ) : (
          <div className="space-y-4">
            {cuentasAgrupadas.map((cuenta, idx) => {
              let saldoAcum = 0;
              const totalDebe = cuenta.movimientos.reduce((s, m) => s + (m.debe || 0), 0);
              const totalHaber = cuenta.movimientos.reduce((s, m) => s + (m.haber || 0), 0);

              return (
                <div key={idx} className="border border-border rounded-lg overflow-hidden">
                  {/* Account header */}
                  <div className="bg-[#f9fafb] px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{cuenta.codigo}</span>
                      <span className="text-sm text-text-secondary">{cuenta.nombre}</span>
                    </div>
                    <Badge variant={cuenta.naturaleza === 'deudora' ? 'info' : 'warning'}>
                      {cuenta.naturaleza}
                    </Badge>
                  </div>

                  {/* Movimientos table */}
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-text-muted uppercase">
                        <th className="text-left px-4 py-2">Fecha</th>
                        <th className="text-left px-4 py-2">Poliza</th>
                        <th className="text-left px-4 py-2">Concepto</th>
                        <th className="text-right px-4 py-2">Debe</th>
                        <th className="text-right px-4 py-2">Haber</th>
                        <th className="text-right px-4 py-2">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuenta.movimientos.map((m, i) => {
                        if (cuenta.naturaleza === 'deudora') {
                          saldoAcum += (m.debe || 0) - (m.haber || 0);
                        } else {
                          saldoAcum += (m.haber || 0) - (m.debe || 0);
                        }
                        return (
                          <tr key={i} className="border-t border-[#f0f0f0]">
                            <td className="px-4 py-2 text-sm text-text-muted">
                              {m.poliza?.fecha
                                ? new Date(m.poliza.fecha).toLocaleDateString('es-MX')
                                : '\u2014'}
                            </td>
                            <td className="px-4 py-2 text-sm font-mono text-primary">
                              {m.poliza
                                ? formatNumeroPoliza(m.poliza.tipo, m.poliza.numero_poliza)
                                : '\u2014'}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {m.concepto || m.poliza?.descripcion || '\u2014'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-mono">
                              {m.debe > 0 ? fmtMoney(m.debe) : ''}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-mono">
                              {m.haber > 0 ? fmtMoney(m.haber) : ''}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-mono font-semibold">
                              {fmtMoney(saldoAcum)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-[#f9fafb] font-semibold">
                        <td colSpan={3} className="px-4 py-2 text-sm text-right">
                          Totales:
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-mono">
                          {fmtMoney(totalDebe)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-mono">
                          {fmtMoney(totalHaber)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-mono">
                          {fmtMoney(saldoAcum)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
