import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConciliacionDetalle, useAprobarConciliacion } from '../../hooks/useConciliacion';
import { useAppStore } from '../../stores/appStore';
import { ESTADOS_CONCILIACION } from '../../config/constants';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

/* -------------------------------------------------------------------------- */
/*  ConciliacionDetalle — Detalle de una conciliacion contable-presupuestal   */
/*  Art. 48 LGCG                                                              */
/* -------------------------------------------------------------------------- */

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function ConciliacionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppStore();

  const { data: conciliacion, isLoading, isError } = useConciliacionDetalle(id);
  const aprobar = useAprobarConciliacion();

  /* ---- Derived data ------------------------------------------------------- */
  const detalle = conciliacion?.detalle || [];

  const totales = useMemo(
    () =>
      detalle.reduce(
        (acc, row) => ({
          monto_contable: acc.monto_contable + (row.monto_contable || 0),
          monto_presupuestal: acc.monto_presupuestal + (row.monto_presupuestal || 0),
          diferencia: acc.diferencia + (row.diferencia || 0),
        }),
        { monto_contable: 0, monto_presupuestal: 0, diferencia: 0 }
      ),
    [detalle]
  );

  const egresoRows = useMemo(() => detalle.filter((r) => r.tipo === 'egreso'), [detalle]);
  const ingresoRows = useMemo(() => detalle.filter((r) => r.tipo === 'ingreso'), [detalle]);

  const totalesEgreso = useMemo(
    () =>
      egresoRows.reduce(
        (acc, r) => ({
          contable: acc.contable + (r.monto_contable || 0),
          presupuestal: acc.presupuestal + (r.monto_presupuestal || 0),
          diferencia: acc.diferencia + (r.diferencia || 0),
        }),
        { contable: 0, presupuestal: 0, diferencia: 0 }
      ),
    [egresoRows]
  );

  const totalesIngreso = useMemo(
    () =>
      ingresoRows.reduce(
        (acc, r) => ({
          contable: acc.contable + (r.monto_contable || 0),
          presupuestal: acc.presupuestal + (r.monto_presupuestal || 0),
          diferencia: acc.diferencia + (r.diferencia || 0),
        }),
        { contable: 0, presupuestal: 0, diferencia: 0 }
      ),
    [ingresoRows]
  );

  /* ---- Handlers ----------------------------------------------------------- */
  const handleAprobar = async () => {
    try {
      await aprobar.mutateAsync({
        conciliacionId: id,
        aprobadoPor: user?.id,
      });
    } catch {
      // mutation error handled by React Query
    }
  };

  /* ---- Loading / Error states --------------------------------------------- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg
          className="animate-spin h-8 w-8 text-guinda"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (isError || !conciliacion) {
    return (
      <div className="bg-white rounded-lg card-shadow p-5">
        <div className="text-center py-16">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#f5f5f9] flex items-center justify-center text-text-muted">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <h3 className="text-[0.9375rem] font-semibold text-text-heading mb-1">
            Conciliacion no encontrada
          </h3>
          <p className="text-sm text-text-muted max-w-sm mx-auto">
            No se pudo cargar el detalle de la conciliacion solicitada.
          </p>
          <div className="mt-4">
            <Button variant="outline-primary" size="sm" onClick={() => navigate(-1)}>
              Regresar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const estadoInfo = ESTADOS_CONCILIACION[conciliacion.estado];

  /* ---- Render ------------------------------------------------------------- */
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-heading transition-colors cursor-pointer"
            aria-label="Regresar"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Detalle de Conciliacion
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {conciliacion.periodo?.nombre || 'Sin periodo'}
            </p>
          </div>
        </div>
        {conciliacion.estado !== 'aprobado' && (
          <Button
            variant="success"
            onClick={handleAprobar}
            loading={aprobar.isPending}
          >
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Aprobar
          </Button>
        )}
      </div>

      {/* Info card */}
      <div className="bg-white rounded-lg card-shadow p-5 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Periodo
            </span>
            <p className="text-sm text-text-primary mt-1">
              {conciliacion.periodo?.nombre || '\u2014'}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Fecha Elaboracion
            </span>
            <p className="text-sm text-text-primary mt-1">
              {conciliacion.fecha_elaboracion
                ? new Date(conciliacion.fecha_elaboracion).toLocaleDateString('es-MX')
                : '\u2014'}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Estado
            </span>
            <div className="mt-1">
              <Badge variant={estadoInfo?.variant || 'default'}>
                {estadoInfo?.label || conciliacion.estado || '\u2014'}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Elaborado Por
            </span>
            <p className="text-sm text-text-primary mt-1">
              {conciliacion.elaborador?.nombre || '\u2014'}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Aprobado Por
            </span>
            <p className="text-sm text-text-primary mt-1">
              {conciliacion.aprobador?.nombre || '\u2014'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards — two-column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Contable */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Contable
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-text-muted">Total Contable</span>
              <span className="text-sm font-mono font-semibold text-text-primary">
                {fmtMoney(conciliacion.total_contable)}
              </span>
            </div>
          </div>
        </div>

        {/* Presupuestal */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Presupuestal
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-text-muted">Total Pres. Egreso</span>
              <span className="text-sm font-mono font-semibold text-text-primary">
                {fmtMoney(conciliacion.total_presupuestal_egreso)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted">Total Pres. Ingreso</span>
              <span className="text-sm font-mono font-semibold text-text-primary">
                {fmtMoney(conciliacion.total_presupuestal_ingreso)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Differences summary */}
      <div className="bg-white rounded-lg card-shadow p-5 mb-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Resumen de Diferencias
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex justify-between items-center px-4 py-3 bg-[#f9fafb] rounded-lg">
            <span className="text-sm text-text-muted">Diferencia Egreso</span>
            <span
              className={`text-sm font-mono font-bold ${
                (conciliacion.diferencia_egreso || 0) !== 0
                  ? 'text-[#e0360a]'
                  : 'text-[#56ca00]'
              }`}
            >
              {fmtMoney(conciliacion.diferencia_egreso)}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-[#f9fafb] rounded-lg">
            <span className="text-sm text-text-muted">Diferencia Ingreso</span>
            <span
              className={`text-sm font-mono font-bold ${
                (conciliacion.diferencia_ingreso || 0) !== 0
                  ? 'text-[#e0360a]'
                  : 'text-[#56ca00]'
              }`}
            >
              {fmtMoney(conciliacion.diferencia_ingreso)}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-[#f9fafb] rounded-lg">
            <span className="text-sm text-text-muted">Diferencia Total</span>
            <span
              className={`text-sm font-mono font-bold ${
                (totales.diferencia || 0) !== 0
                  ? 'text-[#e0360a]'
                  : 'text-[#56ca00]'
              }`}
            >
              {fmtMoney(totales.diferencia)}
            </span>
          </div>
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-white rounded-lg card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-secondary">
            Detalle de Partidas{' '}
            <span className="text-text-muted font-normal">({detalle.length} registros)</span>
          </h2>
        </div>

        {detalle.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">
            No hay partidas de detalle para esta conciliacion
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f9fafb]">
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Tipo
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Cuenta / Partida / Concepto
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Monto Contable
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Monto Presupuestal
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Diferencia
                  </th>
                  <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3.5">
                    Conciliado
                  </th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((row, i) => {
                  const descripcion =
                    row.tipo === 'egreso'
                      ? `${row.cuenta?.codigo || ''} ${row.cuenta?.nombre || ''} / ${row.partida?.clave || ''} ${row.partida?.descripcion || ''}`
                      : `${row.cuenta?.codigo || ''} ${row.cuenta?.nombre || ''} / ${row.concepto?.clave || ''} ${row.concepto?.descripcion || ''}`;

                  return (
                    <tr
                      key={row.id ?? i}
                      className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#f9fafb] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <Badge variant={row.tipo === 'egreso' ? 'danger' : 'success'}>
                          {row.tipo === 'egreso' ? 'Egreso' : 'Ingreso'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-primary">
                        {descripcion.trim() || '\u2014'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right font-mono">
                        {fmtMoney(row.monto_contable)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right font-mono">
                        {fmtMoney(row.monto_presupuestal)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right font-mono">
                        <span
                          className={`font-semibold ${
                            (row.diferencia || 0) !== 0
                              ? 'text-[#e0360a]'
                              : 'text-text-primary'
                          }`}
                        >
                          {fmtMoney(row.diferencia)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {row.conciliado ? (
                          <svg
                            className="w-5 h-5 text-[#56ca00] mx-auto"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-text-muted/40 mx-auto"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {/* Egreso totals */}
                <tr className="bg-[#f9fafb] border-t-2 border-guinda/20">
                  <td className="px-5 py-3.5">
                    <Badge variant="danger">Egreso</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-right">
                    SUBTOTAL EGRESOS
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono font-bold">
                    {fmtMoney(totalesEgreso.contable)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono font-bold">
                    {fmtMoney(totalesEgreso.presupuestal)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono font-bold">
                    <span
                      className={
                        totalesEgreso.diferencia !== 0
                          ? 'text-[#e0360a]'
                          : 'text-text-primary'
                      }
                    >
                      {fmtMoney(totalesEgreso.diferencia)}
                    </span>
                  </td>
                  <td />
                </tr>
                {/* Ingreso totals */}
                <tr className="bg-[#f9fafb]">
                  <td className="px-5 py-3.5">
                    <Badge variant="success">Ingreso</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-right">
                    SUBTOTAL INGRESOS
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono font-bold">
                    {fmtMoney(totalesIngreso.contable)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono font-bold">
                    {fmtMoney(totalesIngreso.presupuestal)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono font-bold">
                    <span
                      className={
                        totalesIngreso.diferencia !== 0
                          ? 'text-[#e0360a]'
                          : 'text-text-primary'
                      }
                    >
                      {fmtMoney(totalesIngreso.diferencia)}
                    </span>
                  </td>
                  <td />
                </tr>
                {/* Grand total */}
                <tr className="bg-[#f5f5f9] border-t-2 border-guinda/30 font-bold">
                  <td />
                  <td className="px-5 py-3.5 text-sm text-right">
                    TOTAL GENERAL
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono">
                    {fmtMoney(totales.monto_contable)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono">
                    {fmtMoney(totales.monto_presupuestal)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-mono">
                    <span
                      className={
                        totales.diferencia !== 0
                          ? 'text-[#e0360a]'
                          : 'text-[#56ca00]'
                      }
                    >
                      {fmtMoney(totales.diferencia)}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
