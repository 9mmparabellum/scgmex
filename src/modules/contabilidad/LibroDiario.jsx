import { useState, useMemo } from 'react';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { exportToExcel } from '../../utils/exportHelpers';
import { useLibroDiario } from '../../hooks/usePoliza';
import { TIPOS_POLIZA } from '../../config/constants';
import { formatNumeroPoliza } from '../../utils/polizaHelpers';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function LibroDiario() {
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

  const { data: polizas = [], isLoading } = useLibroDiario(periodoId);

  const handleExport = () => {
    const rows = [];
    polizas.forEach((p) => {
      (p.movimiento_contable || p.movimientos || []).forEach((m) => {
        rows.push({
          poliza: formatNumeroPoliza(p.tipo, p.numero_poliza),
          fecha: p.fecha,
          tipo: TIPOS_POLIZA[p.tipo] || p.tipo,
          cuenta: m.plan_de_cuentas?.codigo || '',
          nombre_cuenta: m.plan_de_cuentas?.nombre || '',
          concepto: m.concepto || '',
          debe: m.debe || 0,
          haber: m.haber || 0,
        });
      });
    });
    const columns = [
      { key: 'poliza', label: 'Poliza' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'cuenta', label: 'Cuenta' },
      { key: 'nombre_cuenta', label: 'Nombre Cuenta' },
      { key: 'concepto', label: 'Concepto' },
      { key: 'debe', label: 'Debe' },
      { key: 'haber', label: 'Haber' },
    ];
    exportToExcel(rows, columns, 'libro_diario');
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Libro Diario</h1>
        <p className="text-sm text-text-muted mt-1">
          Art. 36 — Registro cronologico de polizas aprobadas
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
            <Button variant="ghost" onClick={handleExport} disabled={!polizas?.length}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar XLSX
            </Button>
          </div>
        </div>
      </div>

      {/* Polizas list */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">
          Libro Diario{' '}
          <span className="text-text-muted font-normal">({polizas.length} polizas)</span>
        </h2>

        {isLoading ? (
          <div className="text-center py-16 text-text-muted text-sm">
            Cargando libro diario...
          </div>
        ) : !periodoId ? (
          <div className="text-center py-16 text-text-muted text-sm">
            Seleccione un periodo para ver el libro diario
          </div>
        ) : polizas.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">
            No hay polizas aprobadas en este periodo
          </div>
        ) : (
          <div className="space-y-4">
            {polizas.map((poliza) => (
              <div key={poliza.id} className="border border-border rounded-lg overflow-hidden">
                {/* Poliza header */}
                <div className="bg-[#f9fafb] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-primary">
                      {formatNumeroPoliza(poliza.tipo, poliza.numero_poliza)}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {poliza.descripcion || '\u2014'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted">
                      {new Date(poliza.fecha).toLocaleDateString('es-MX')}
                    </span>
                    <Badge variant="info">
                      {TIPOS_POLIZA[poliza.tipo] || poliza.tipo}
                    </Badge>
                  </div>
                </div>

                {/* Movimientos table */}
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-text-muted uppercase">
                      <th className="text-left px-4 py-2">Cuenta</th>
                      <th className="text-left px-4 py-2">Concepto</th>
                      <th className="text-right px-4 py-2">Debe</th>
                      <th className="text-right px-4 py-2">Haber</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(poliza.movimiento_contable || poliza.movimientos || []).map((mov, i) => (
                      <tr key={i} className="border-t border-[#f0f0f0]">
                        <td className="px-4 py-2 text-sm">
                          <span className="font-mono text-xs text-text-muted">
                            {mov.plan_de_cuentas?.codigo || mov.cuenta_codigo || ''}
                          </span>{' '}
                          {mov.plan_de_cuentas?.nombre || mov.cuenta_nombre || ''}
                        </td>
                        <td className="px-4 py-2 text-sm text-text-secondary">
                          {mov.concepto || '\u2014'}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-mono">
                          {mov.debe > 0 ? fmtMoney(mov.debe) : ''}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-mono">
                          {mov.haber > 0 ? fmtMoney(mov.haber) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-[#f9fafb] font-semibold">
                      <td colSpan={2} className="px-4 py-2 text-sm text-right">
                        Totales:
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-mono">
                        {fmtMoney(poliza.total_debe)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-mono">
                        {fmtMoney(poliza.total_haber)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
