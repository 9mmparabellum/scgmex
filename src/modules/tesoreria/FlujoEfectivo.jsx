import { useState, useMemo } from 'react';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useFlujoEfectivo } from '../../hooks/useTesoreria';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { exportToExcel } from '../../utils/exportHelpers';
import { CATEGORIAS_FLUJO } from '../../config/constants';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function FlujoEfectivo() {
  const { ejercicioFiscal } = useAppStore();
  const [periodoId, setPeriodoId] = useState('');

  // --- Load periodos ---
  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: p.nombre || `Periodo ${p.numero}` })),
    [periodos]
  );

  // --- Load flujo data ---
  const { data: flujoData = [], isLoading } = useFlujoEfectivo(periodoId);

  // --- Group data by categoria ---
  const grouped = useMemo(() => {
    const groups = {};
    Object.keys(CATEGORIAS_FLUJO).forEach((cat) => {
      groups[cat] = [];
    });
    flujoData.forEach((row) => {
      const cat = row.categoria;
      if (groups[cat]) {
        groups[cat].push(row);
      } else {
        // fallback for unknown categories
        if (!groups._otros) groups._otros = [];
        groups._otros.push(row);
      }
    });
    return groups;
  }, [flujoData]);

  // --- Category subtotals ---
  const categoryTotals = useMemo(() => {
    const totals = {};
    Object.entries(grouped).forEach(([cat, rows]) => {
      totals[cat] = rows.reduce(
        (acc, r) => ({
          entradas: acc.entradas + (r.monto_entrada || 0),
          salidas: acc.salidas + (r.monto_salida || 0),
        }),
        { entradas: 0, salidas: 0 }
      );
      totals[cat].neto = totals[cat].entradas - totals[cat].salidas;
    });
    return totals;
  }, [grouped]);

  // --- Grand totals ---
  const grandTotals = useMemo(() => {
    const totals = flujoData.reduce(
      (acc, r) => ({
        entradas: acc.entradas + (r.monto_entrada || 0),
        salidas: acc.salidas + (r.monto_salida || 0),
      }),
      { entradas: 0, salidas: 0 }
    );
    totals.neto = totals.entradas - totals.salidas;
    return totals;
  }, [flujoData]);

  // --- Table columns for each category ---
  const columns = [
    { key: 'concepto', label: 'Concepto' },
    {
      key: 'monto_entrada',
      label: 'Entradas',
      width: '160px',
      render: (val) => (
        <span className="text-right block tabular-nums text-green-600">
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'monto_salida',
      label: 'Salidas',
      width: '160px',
      render: (val) => (
        <span className="text-right block tabular-nums text-red-600">
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'neto',
      label: 'Neto',
      width: '160px',
      render: (_val, row) => {
        const neto = (row.monto_entrada || 0) - (row.monto_salida || 0);
        return (
          <span className={`text-right block tabular-nums font-bold ${neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmtMoney(neto)}
          </span>
        );
      },
    },
  ];

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'categoria', label: 'Categoria', getValue: (row) => CATEGORIAS_FLUJO[row.categoria]?.label || row.categoria },
      { key: 'concepto', label: 'Concepto' },
      { key: 'monto_entrada', label: 'Entradas', getValue: (row) => Number(row.monto_entrada || 0) },
      { key: 'monto_salida', label: 'Salidas', getValue: (row) => Number(row.monto_salida || 0) },
      { key: 'neto', label: 'Neto', getValue: (row) => (Number(row.monto_entrada || 0) - Number(row.monto_salida || 0)) },
    ];
    exportToExcel(flujoData, excelCols, 'flujo_efectivo');
  };

  // --- Categories to render (only those defined in CATEGORIAS_FLUJO) ---
  const categoriasToRender = Object.entries(CATEGORIAS_FLUJO);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Flujo de Efectivo</h1>
        <p className="text-sm text-text-muted mt-1">
          Estado de flujos de efectivo por periodo contable
        </p>
      </div>

      {/* Period selector */}
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
            <Button onClick={handleExport} variant="outline-primary" size="sm" disabled={!flujoData.length}>
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando flujo de efectivo...
        </div>
      ) : !periodoId ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16 text-text-muted text-sm">
            Seleccione un periodo para ver el flujo de efectivo
          </div>
        </div>
      ) : flujoData.length === 0 ? (
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16 text-text-muted text-sm">
            No hay movimientos de flujo de efectivo para este periodo
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category sections */}
          {categoriasToRender.map(([catKey, catCfg]) => {
            const rows = grouped[catKey] || [];
            const totals = categoryTotals[catKey] || { entradas: 0, salidas: 0, neto: 0 };

            if (rows.length === 0) return null;

            return (
              <div key={catKey} className="bg-white rounded-lg card-shadow p-5">
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={catCfg.variant}>{catCfg.label}</Badge>
                  <span className="text-sm text-text-muted">
                    ({rows.length} {rows.length === 1 ? 'concepto' : 'conceptos'})
                  </span>
                </div>

                {/* Category table */}
                <DataTable
                  columns={columns}
                  data={rows}
                />

                {/* Subtotal row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-sm font-semibold text-text-secondary">
                    Subtotal {catCfg.label}
                  </span>
                  <div className="flex items-center gap-6">
                    <span className="text-sm tabular-nums text-green-600">
                      {fmtMoney(totals.entradas)}
                    </span>
                    <span className="text-sm tabular-nums text-red-600">
                      {fmtMoney(totals.salidas)}
                    </span>
                    <span className={`text-sm tabular-nums font-bold ${totals.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmtMoney(totals.neto)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Entradas</p>
              <p className="text-lg font-bold text-green-600">{fmtMoney(grandTotals.entradas)}</p>
            </div>
            <div className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Salidas</p>
              <p className="text-lg font-bold text-red-600">{fmtMoney(grandTotals.salidas)}</p>
            </div>
            <div className="bg-white rounded-lg card-shadow p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Flujo Neto</p>
              <p className={`text-lg font-bold ${grandTotals.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmtMoney(grandTotals.neto)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
