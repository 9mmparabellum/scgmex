import { useState, useMemo } from 'react';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { exportToExcel } from '../../utils/exportHelpers';
import { exportToPdf } from '../../utils/exportPdfHelpers';
import { useSaldosCuenta } from '../../hooks/usePoliza';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function BalanzaComprobacion() {
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

  const { data: saldos = [], isLoading } = useSaldosCuenta(periodoId);

  const { data: cuentas = [] } = useList('plan_de_cuentas', {
    filter: { ente_id: entePublico?.id },
    order: { column: 'codigo', ascending: true },
  });

  /* Merge saldos with cuenta info */
  const balanzaData = useMemo(() => {
    const cuentaMap = {};
    cuentas.forEach((c) => {
      cuentaMap[c.id] = c;
    });

    return saldos
      .map((s) => {
        const cuenta = cuentaMap[s.cuenta_id] || {};
        return {
          ...s,
          codigo: cuenta.codigo || '',
          nombre: cuenta.nombre || '',
          naturaleza: cuenta.naturaleza || 'deudora',
          tipo_cuenta: cuenta.tipo_cuenta || '',
        };
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [saldos, cuentas]);

  /* Totals row */
  const totales = useMemo(
    () =>
      balanzaData.reduce(
        (acc, r) => ({
          saldo_inicial: acc.saldo_inicial + (r.saldo_inicial || 0),
          total_debe: acc.total_debe + (r.total_debe || 0),
          total_haber: acc.total_haber + (r.total_haber || 0),
          saldo_final: acc.saldo_final + (r.saldo_final || 0),
        }),
        { saldo_inicial: 0, total_debe: 0, total_haber: 0, saldo_final: 0 }
      ),
    [balanzaData]
  );

  const handleExport = () => {
    exportToExcel(
      balanzaData,
      [
        { key: 'codigo', label: 'Codigo' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'saldo_inicial', label: 'Saldo Inicial' },
        { key: 'total_debe', label: 'Debe' },
        { key: 'total_haber', label: 'Haber' },
        { key: 'saldo_final', label: 'Saldo Final' },
      ],
      'balanza_comprobacion'
    );
  };

  const handleExportPdf = () => {
    exportToPdf(balanzaData, [
      { key: 'codigo', label: 'Codigo' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'saldo_inicial', label: 'Saldo Inicial' },
      { key: 'total_debe', label: 'Debe' },
      { key: 'total_haber', label: 'Haber' },
      { key: 'saldo_final', label: 'Saldo Final' },
    ], 'balanza_comprobacion', { title: 'Balanza de Comprobacion' });
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Balanza de Comprobacion</h1>
        <p className="text-sm text-text-muted mt-1">
          Art. 37 — Saldos por cuenta contable en el periodo
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
            <Button variant="ghost" onClick={handleExport} disabled={!balanzaData?.length}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar XLSX
            </Button>
            <Button variant="ghost" onClick={handleExportPdf} disabled={!balanzaData?.length}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Balanza table */}
      {isLoading ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16 text-text-muted text-sm">
            Cargando balanza...
          </div>
        </div>
      ) : !periodoId ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16 text-text-muted text-sm">
            Seleccione un periodo para ver la balanza
          </div>
        </div>
      ) : balanzaData.length === 0 ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16 text-text-muted text-sm">
            No hay saldos registrados para este periodo
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f9fafb]">
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Codigo
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Nombre
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Saldo Inicial
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Debe
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Haber
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Saldo Final
                  </th>
                </tr>
              </thead>
              <tbody>
                {balanzaData.map((row, i) => (
                  <tr key={i} className="border-b border-[#f0f0f0] hover:bg-[#f9fafb]">
                    <td className="px-5 py-3 font-mono text-sm">{row.codigo}</td>
                    <td className="px-5 py-3 text-sm">{row.nombre}</td>
                    <td className="px-5 py-3 text-sm text-right font-mono">
                      {fmtMoney(row.saldo_inicial)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-mono">
                      {fmtMoney(row.total_debe)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-mono">
                      {fmtMoney(row.total_haber)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-mono font-semibold">
                      {fmtMoney(row.saldo_final)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#f9fafb] font-bold border-t-2 border-guinda/20">
                  <td colSpan={2} className="px-5 py-3.5 text-sm text-right">
                    TOTALES
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono">
                    {fmtMoney(totales.saldo_inicial)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono">
                    {fmtMoney(totales.total_debe)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono">
                    {fmtMoney(totales.total_haber)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono">
                    {fmtMoney(totales.saldo_final)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
