import { useState, useMemo } from 'react';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { usePartidasEgreso, useResumenEgresos } from '../../hooks/usePresupuesto';
import { MOMENTOS_GASTO } from '../../config/constants';
import { exportToExcel } from '../../utils/exportHelpers';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

const fmtCurrency = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function PresupuestoEgresos() {
  const { ejercicioFiscal } = useAppStore();
  const [periodoId, setPeriodoId] = useState('');

  // --- Data hooks ---
  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
  });
  const { data: resumen = {}, isLoading: loadingResumen } = useResumenEgresos();
  const { data: partidas = [], isLoading: loadingPartidas } = usePartidasEgreso();

  // --- Periodo options ---
  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: p.nombre || p.clave })),
    [periodos]
  );

  // --- Totals per momento across all partidas ---
  const totalesMomento = useMemo(() => {
    const totals = {};
    MOMENTOS_GASTO.forEach((m) => {
      totals[m.key] = 0;
    });
    partidas.forEach((p) => {
      MOMENTOS_GASTO.forEach((m) => {
        totals[m.key] += Number(p.totales?.[m.key] || 0);
      });
    });
    return totals;
  }, [partidas]);

  // --- Use resumen if available, fallback to computed totals ---
  const summaryData = useMemo(() => {
    const src = resumen && Object.keys(resumen).length > 0 ? resumen : totalesMomento;
    return MOMENTOS_GASTO.map((m) => ({
      key: m.key,
      label: m.label,
      amount: Number(src[m.key] || 0),
    }));
  }, [resumen, totalesMomento]);

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'clave', label: 'Clave' },
      { key: 'descripcion', label: 'Descripcion' },
      {
        key: 'cog',
        label: 'COG',
        getValue: (row) =>
          row.clasificador
            ? `${row.clasificador.codigo} ${row.clasificador.nombre}`
            : '',
      },
      ...MOMENTOS_GASTO.map((m) => ({
        key: m.key,
        label: m.label,
        getValue: (row) => Number(row.totales?.[m.key] || 0),
      })),
    ];
    exportToExcel(partidas, excelCols, 'presupuesto_egresos');
  };

  const isLoading = loadingResumen || loadingPartidas;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Presupuesto de Egresos</h1>
        <p className="text-sm text-text-muted mt-1">
          Resumen del presupuesto de egresos por momento contable
        </p>
      </div>

      {/* Periodo filter */}
      <div className="mb-6 max-w-xs">
        <Select
          label="Periodo contable"
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          options={periodoOptions}
          placeholder="— Todos los periodos —"
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          <svg className="animate-spin h-5 w-5 mr-3 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando presupuesto de egresos...
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {summaryData.map((item) => (
              <div key={item.key} className="bg-white rounded-lg card-shadow p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                  {item.label}
                </p>
                <p className="text-lg font-bold text-text-primary">
                  {fmtCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>

          {/* Partidas table card */}
          <div className="bg-white rounded-lg card-shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-secondary">
                Partidas de Egreso
                <span className="ml-2 text-text-muted font-normal">
                  ({partidas.length} registros)
                </span>
              </h2>
              <Button onClick={handleExport} variant="outline-primary" size="sm">
                Exportar Excel
              </Button>
            </div>

            {partidas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                <svg
                  className="w-10 h-10 text-text-muted/50 mb-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                <p className="text-[0.9375rem]">No hay partidas registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f9fafb]">
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '100px' }}>
                        Clave
                      </th>
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                        Descripcion
                      </th>
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5" style={{ width: '200px' }}>
                        COG
                      </th>
                      {MOMENTOS_GASTO.map((m) => (
                        <th
                          key={m.key}
                          className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5"
                          style={{ width: '130px' }}
                        >
                          {m.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {partidas.map((partida, idx) => (
                      <tr
                        key={partida.id ?? idx}
                        className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#f9fafb] transition-colors"
                      >
                        <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary">
                          {partida.clave}
                        </td>
                        <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary">
                          {partida.descripcion}
                        </td>
                        <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary">
                          {partida.clasificador
                            ? `${partida.clasificador.codigo} ${partida.clasificador.nombre}`
                            : '\u2014'}
                        </td>
                        {MOMENTOS_GASTO.map((m) => (
                          <td
                            key={m.key}
                            className="px-5 py-3.5 text-[0.9375rem] text-text-primary text-right tabular-nums"
                          >
                            {fmtCurrency(partida.totales?.[m.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals footer row */}
                  <tfoot>
                    <tr className="bg-[#f9fafb] border-t-2 border-border font-semibold">
                      <td className="px-5 py-3.5 text-[0.9375rem] text-text-primary" colSpan={3}>
                        Total
                      </td>
                      {MOMENTOS_GASTO.map((m) => (
                        <td
                          key={m.key}
                          className="px-5 py-3.5 text-[0.9375rem] text-text-primary text-right tabular-nums"
                        >
                          {fmtCurrency(totalesMomento[m.key])}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
