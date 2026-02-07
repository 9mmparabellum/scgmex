import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useMovimientosEstadoCuenta,
  useConciliacionAutomatica,
  useResumenConciliacion,
} from '../../hooks/useConciliacionBancaria';
import { useMovimientosBancarios } from '../../hooks/useTesoreria';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

/* -------------------------------------------------------------------------- */
/*  ConciliacionBancariaDetalle — Detalle de conciliacion de un estado de     */
/*  cuenta bancario: movimientos de libros vs estado de cuenta                */
/* -------------------------------------------------------------------------- */

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function ConciliacionBancariaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cuenta = new URLSearchParams(window.location.search).get('cuenta');

  /* ---- Data --------------------------------------------------------------- */
  const { data: resumen = {} } = useResumenConciliacion(id);
  const { data: movimientosEC = [], isLoading: loadingEC } =
    useMovimientosEstadoCuenta(id);
  const { data: movimientosLibros = [], isLoading: loadingLibros } =
    useMovimientosBancarios(cuenta);
  const conciliarAuto = useConciliacionAutomatica();

  /* ---- Summary cards data ------------------------------------------------- */
  const totalMovimientos = resumen.total_movimientos || 0;
  const conciliados = resumen.conciliados || 0;
  const noConciliados = resumen.no_conciliados || 0;
  const porcentaje =
    totalMovimientos > 0
      ? ((conciliados / totalMovimientos) * 100).toFixed(1)
      : '0.0';

  const summaryCards = [
    { label: 'Saldo Inicial Banco', value: fmtMoney(resumen.saldo_inicial_banco) },
    { label: 'Saldo Final Banco', value: fmtMoney(resumen.saldo_final_banco) },
    { label: 'Movimientos Totales', value: totalMovimientos },
    { label: 'Conciliados', value: conciliados },
    { label: 'No Conciliados', value: noConciliados },
    { label: '% Conciliacion', value: `${porcentaje}%` },
  ];

  /* ---- Columns: Movimientos Libros ---------------------------------------- */
  const columnsLibros = useMemo(
    () => [
      {
        key: 'fecha',
        label: 'Fecha',
        width: '110px',
        render: (val) =>
          val ? new Date(val).toLocaleDateString('es-MX') : '\u2014',
      },
      {
        key: 'referencia',
        label: 'Referencia',
        width: '120px',
        render: (val) => val || '\u2014',
      },
      {
        key: 'concepto',
        label: 'Concepto',
        render: (val) => val || '\u2014',
      },
      {
        key: 'monto',
        label: 'Monto',
        width: '140px',
        render: (val) => (
          <span className="text-right block tabular-nums">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'conciliado',
        label: 'Conciliado',
        width: '110px',
        render: (val) => (
          <Badge variant={val ? 'success' : 'default'}>
            {val ? 'Si' : 'No'}
          </Badge>
        ),
      },
    ],
    []
  );

  /* ---- Columns: Estado de Cuenta ------------------------------------------ */
  const columnsEC = useMemo(
    () => [
      {
        key: 'fecha',
        label: 'Fecha',
        width: '110px',
        render: (val) =>
          val ? new Date(val).toLocaleDateString('es-MX') : '\u2014',
      },
      {
        key: 'referencia',
        label: 'Referencia',
        width: '120px',
        render: (val) => val || '\u2014',
      },
      {
        key: 'concepto',
        label: 'Concepto',
        render: (val) => val || '\u2014',
      },
      {
        key: 'cargo',
        label: 'Cargo',
        width: '130px',
        render: (val) => (
          <span className="text-right block tabular-nums">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'abono',
        label: 'Abono',
        width: '130px',
        render: (val) => (
          <span className="text-right block tabular-nums">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'conciliado',
        label: 'Conciliado',
        width: '110px',
        render: (val) => (
          <Badge variant={val ? 'success' : 'default'}>
            {val ? 'Si' : 'No'}
          </Badge>
        ),
      },
    ],
    []
  );

  /* ---- Handlers ----------------------------------------------------------- */
  const handleConciliarAuto = async () => {
    try {
      await conciliarAuto.mutateAsync({
        estadoCuentaId: id,
        cuentaBancariaId: cuenta,
      });
    } catch {
      // mutation error handled by React Query
    }
  };

  /* ---- Render ------------------------------------------------------------- */
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tesoreria/conciliacion-bancaria')}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-heading transition-colors cursor-pointer"
            aria-label="Regresar"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Conciliacion Bancaria
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Detalle de conciliacion — Movimientos de libros vs estado de cuenta
            </p>
          </div>
        </div>
        <Button
          onClick={handleConciliarAuto}
          loading={conciliarAuto.isPending}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1.5 inline-block"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          Conciliar Automaticamente
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg card-shadow p-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
              {card.label}
            </p>
            <p className="text-lg font-bold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout: Libros vs Estado de Cuenta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left — Movimientos Libros */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary">
              Movimientos Libros
              <span className="ml-2 text-text-muted font-normal">
                ({movimientosLibros.length} registros)
              </span>
            </h2>
          </div>
          {loadingLibros ? (
            <div className="flex items-center justify-center py-16 text-text-muted text-sm">
              Cargando movimientos de libros...
            </div>
          ) : (
            <DataTable columns={columnsLibros} data={movimientosLibros} />
          )}
        </div>

        {/* Right — Estado de Cuenta */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary">
              Estado de Cuenta
              <span className="ml-2 text-text-muted font-normal">
                ({movimientosEC.length} registros)
              </span>
            </h2>
          </div>
          {loadingEC ? (
            <div className="flex items-center justify-center py-16 text-text-muted text-sm">
              Cargando movimientos del estado de cuenta...
            </div>
          ) : (
            <DataTable columns={columnsEC} data={movimientosEC} />
          )}
        </div>
      </div>
    </div>
  );
}
