import { useMemo } from 'react';
import { useCuentasBancarias, useResumenTesoreria } from '../../hooks/useTesoreria';
import { TIPOS_CUENTA_BANCARIA } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function TesoreriaMain() {
  const { data: resumen = {} } = useResumenTesoreria();
  const { data: cuentas = [], isLoading } = useCuentasBancarias();

  const saldoBancos = resumen.saldoBancos || 0;
  const totalCxC = resumen.totalCxC || 0;
  const totalCxP = resumen.totalCxP || 0;
  const liquidez = saldoBancos + totalCxC - totalCxP;

  const cards = [
    { label: 'Saldo en Bancos', value: saldoBancos },
    { label: 'Cuentas por Cobrar', value: totalCxC },
    { label: 'Cuentas por Pagar', value: totalCxP },
    { label: 'Liquidez Neta', value: liquidez },
  ];

  const tipoBadge = (tipo) => {
    const variants = { cheques: 'primary', inversion: 'info', fideicomiso: 'warning', otro: 'default' };
    return variants[tipo] || 'default';
  };

  const tipoLabel = (tipo) => TIPOS_CUENTA_BANCARIA[tipo] || tipo;

  const columns = useMemo(
    () => [
      { key: 'numero_cuenta', label: 'No. Cuenta', width: '160px' },
      { key: 'banco', label: 'Banco' },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '130px',
        render: (val) => (
          <Badge variant={tipoBadge(val)}>
            {tipoLabel(val)}
          </Badge>
        ),
      },
      {
        key: 'saldo_actual',
        label: 'Saldo Actual',
        width: '160px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'activo',
        label: 'Estado',
        width: '100px',
        render: (val) => (
          <Badge variant={val ? 'success' : 'default'}>
            {val ? 'Activa' : 'Inactiva'}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Tesoreria</h1>
        <p className="text-sm text-text-muted mt-1">
          Resumen de tesoreria — Saldos bancarios, cuentas por cobrar y pagar
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg card-shadow p-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{card.label}</p>
            <p className="text-lg font-bold text-text-primary">{fmtMoney(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Cuentas Bancarias
          <span className="ml-2 text-text-muted font-normal">
            ({cuentas.length} registros)
          </span>
        </h2>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando cuentas bancarias...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={cuentas}
        />
      )}
    </div>
  );
}
