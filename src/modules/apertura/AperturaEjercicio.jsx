import { useState, useMemo } from 'react';
import {
  useValidarCierre,
  usePrevisualizarCierre,
  useEjecutarCierre,
  useGenerarApertura,
} from '../../hooks/useCierreEjercicio';
import { useAperturas } from '../../hooks/useApertura';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { ESTADOS_APERTURA } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

/* -------------------------------------------------------------------------- */
/*  Cierre y Apertura del Ejercicio                                           */
/*  Art. 49 LGCG — Cierre contable y apertura del nuevo ejercicio             */
/* -------------------------------------------------------------------------- */

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const ESTADOS_EJERCICIO = {
  abierto: { label: 'Abierto', variant: 'primary' },
  en_cierre: { label: 'En Cierre', variant: 'warning' },
  cerrado: { label: 'Cerrado', variant: 'success' },
};

/* ── Inline SVG Icons ────────────────────────────────────────────────────── */

function IconCheck({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconSpinner({ className = 'h-8 w-8' }) {
  return (
    <svg className={`animate-spin ${className} text-guinda`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function IconLock({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function IconBolt({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function IconEye({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function IconPlus({ className = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  );
}

function IconChart({ className = 'w-7 h-7' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
    </svg>
  );
}

/* ── Check / X Indicator ─────────────────────────────────────────────────── */

function CheckIndicator({ label, passed, loading = false }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {loading ? (
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          <IconSpinner className="h-4 w-4" />
        </div>
      ) : passed ? (
        <div className="w-5 h-5 rounded-full bg-[#71dd37]/15 flex items-center justify-center flex-shrink-0">
          <IconCheck className="w-3.5 h-3.5 text-[#71dd37]" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-[#ff3e1d]/15 flex items-center justify-center flex-shrink-0">
          <IconX className="w-3.5 h-3.5 text-[#ff3e1d]" />
        </div>
      )}
      <span className={`text-sm ${loading ? 'text-text-muted' : passed ? 'text-text-primary' : 'text-[#ff3e1d] font-medium'}`}>
        {label}
      </span>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function AperturaEjercicio() {
  const { entePublico, ejercicioFiscal, user } = useAppStore();
  const enteId = entePublico?.id;

  /* ── Local state ──────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('cierre'); // 'cierre' | 'apertura'
  const [selectedEjercicioId, setSelectedEjercicioId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [confirmCierreOpen, setConfirmCierreOpen] = useState(false);

  // Apertura state
  const [showAperturaWorkflow, setShowAperturaWorkflow] = useState(false);
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [confirmAperturaOpen, setConfirmAperturaOpen] = useState(false);

  /* ── Data hooks ───────────────────────────────────────────────────────── */
  const { data: aperturas = [], isLoading: aperturasLoading } = useAperturas();

  const { data: ejercicios = [] } = useList('ejercicio_fiscal', {
    filter: { ente_id: enteId },
    order: { column: 'anio', ascending: true },
  });

  const ejercicioOptions = useMemo(
    () => ejercicios.map((e) => ({ value: e.id, label: `${e.anio}` })),
    [ejercicios]
  );

  const ejerciciosCerradosOptions = useMemo(
    () => ejercicios.filter((e) => e.estado === 'cerrado').map((e) => ({ value: e.id, label: `${e.anio}` })),
    [ejercicios]
  );

  const ejerciciosAbiertosOptions = useMemo(
    () => ejercicios.filter((e) => e.estado !== 'cerrado').map((e) => ({ value: e.id, label: `${e.anio}` })),
    [ejercicios]
  );

  // Use the selected ejercicio or fallback to the active one
  const cierreEjercicioId = selectedEjercicioId || ejercicioFiscal?.id;

  // Validation and preview queries
  const {
    data: validacion,
    isLoading: validacionLoading,
    refetch: refetchValidacion,
  } = useValidarCierre(enteId, cierreEjercicioId);

  const {
    data: previsualizacion,
    isLoading: previewLoading,
    refetch: refetchPreview,
  } = usePrevisualizarCierre(
    showPreview ? enteId : null,
    showPreview ? cierreEjercicioId : null
  );

  // Mutations
  const ejecutarCierreMut = useEjecutarCierre();
  const generarAperturaMut = useGenerarApertura();

  /* ── Selected ejercicio info ──────────────────────────────────────────── */
  const selectedEjercicio = useMemo(
    () => ejercicios.find((e) => e.id === cierreEjercicioId),
    [ejercicios, cierreEjercicioId]
  );

  const estadoEjercicio = selectedEjercicio?.estado
    ? ESTADOS_EJERCICIO[selectedEjercicio.estado] || { label: selectedEjercicio.estado, variant: 'default' }
    : null;

  /* ── Handlers ─────────────────────────────────────────────────────────── */

  const handlePrevisualizar = () => {
    setShowPreview(true);
    refetchPreview();
  };

  const handleEjecutarCierre = async () => {
    try {
      await ejecutarCierreMut.mutateAsync({
        enteId,
        ejercicioId: cierreEjercicioId,
        userId: user?.id,
      });
      setConfirmCierreOpen(false);
      setShowPreview(false);
      refetchValidacion();
    } catch {
      setConfirmCierreOpen(false);
    }
  };

  const handleGenerarApertura = async () => {
    try {
      await generarAperturaMut.mutateAsync({
        enteId,
        ejercicioOrigenId: origenId,
        ejercicioDestinoId: destinoId,
        userId: user?.id,
      });
      setConfirmAperturaOpen(false);
      setShowAperturaWorkflow(false);
      setOrigenId('');
      setDestinoId('');
    } catch {
      setConfirmAperturaOpen(false);
    }
  };

  /* ── History table columns ────────────────────────────────────────────── */
  const historyColumns = useMemo(
    () => [
      {
        key: 'ejercicio_origen',
        label: 'Ejercicio Origen',
        width: '140px',
        render: (_val, row) => row.ejercicio_origen?.anio || '\u2014',
      },
      {
        key: 'ejercicio_destino',
        label: 'Ejercicio Destino',
        width: '140px',
        render: (_val, row) => row.ejercicio_destino?.anio || '\u2014',
      },
      {
        key: 'fecha_apertura',
        label: 'Fecha',
        width: '130px',
        render: (val) => (val ? new Date(val).toLocaleDateString('es-MX') : '\u2014'),
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '130px',
        render: (val) => {
          const estado = ESTADOS_APERTURA[val];
          return (
            <Badge variant={estado?.variant || 'default'}>
              {estado?.label || val || '\u2014'}
            </Badge>
          );
        },
      },
      {
        key: 'total_cuentas_transferidas',
        label: 'Cuentas',
        width: '100px',
        render: (val) => <span className="font-mono text-sm">{val ?? 0}</span>,
      },
      {
        key: 'total_saldo_deudor',
        label: 'Saldo Deudor',
        width: '150px',
        render: (val) => (
          <span className="font-mono text-sm text-right block tabular-nums">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'total_saldo_acreedor',
        label: 'Saldo Acreedor',
        width: '150px',
        render: (val) => (
          <span className="font-mono text-sm text-right block tabular-nums">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'ejecutado_por',
        label: 'Ejecutado Por',
        width: '140px',
        render: (_val, row) => row.ejecutador?.nombre || row.ejecutado_por_nombre || '\u2014',
      },
    ],
    []
  );

  /* ── Ejercicios table columns ─────────────────────────────────────────── */
  const ejerciciosColumns = useMemo(
    () => [
      {
        key: 'anio',
        label: 'Ejercicio',
        width: '120px',
        render: (val) => <span className="font-semibold">{val}</span>,
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '140px',
        render: (val) => {
          const est = ESTADOS_EJERCICIO[val] || { label: val, variant: 'default' };
          return <Badge variant={est.variant}>{est.label}</Badge>;
        },
      },
      {
        key: 'fecha_cierre',
        label: 'Fecha Cierre',
        width: '140px',
        render: (val) => (val ? new Date(val).toLocaleDateString('es-MX') : '\u2014'),
      },
    ],
    []
  );

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Cierre y Apertura de Ejercicio
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Cierre contable del ejercicio fiscal y apertura del nuevo ejercicio (Art. 49 LGCG)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#f5f5f9] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('cierre')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            activeTab === 'cierre'
              ? 'bg-white text-guinda card-shadow'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <IconLock className="h-4 w-4 mr-1.5 inline-block" />
          Cierre de Ejercicio
        </button>
        <button
          onClick={() => setActiveTab('apertura')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            activeTab === 'apertura'
              ? 'bg-white text-guinda card-shadow'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <IconPlus className="h-4 w-4 mr-1.5 inline-block" />
          Apertura de Ejercicio
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: CIERRE DE EJERCICIO                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cierre' && (
        <div className="space-y-6">
          {/* Ejercicio selector */}
          <div className="bg-white rounded-lg card-shadow p-5">
            <div className="flex items-end gap-4">
              <div className="w-64">
                <Select
                  label="Ejercicio fiscal a cerrar"
                  placeholder="Seleccionar ejercicio..."
                  options={ejercicioOptions}
                  value={selectedEjercicioId || ejercicioFiscal?.id || ''}
                  onChange={(e) => {
                    setSelectedEjercicioId(e.target.value);
                    setShowPreview(false);
                  }}
                />
              </div>
              {selectedEjercicio && estadoEjercicio && (
                <div className="flex items-center gap-3 pb-1">
                  <Badge variant={estadoEjercicio.variant}>{estadoEjercicio.label}</Badge>
                  <span className="text-sm text-text-muted">
                    Ejercicio {selectedEjercicio.anio}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Validation section */}
          {cierreEjercicioId && (
            <div className="bg-white rounded-lg card-shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[0.9375rem] font-semibold text-text-heading">
                  Validaciones Pre-Cierre
                </h2>
                <Button variant="outline-primary" size="sm" onClick={() => refetchValidacion()}>
                  Actualizar
                </Button>
              </div>

              {validacionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <IconSpinner className="h-6 w-6" />
                </div>
              ) : validacion ? (
                <div className="space-y-1">
                  <CheckIndicator
                    label="Ejercicio fiscal en estado abierto"
                    passed={validacion.checks?.ejercicioAbierto}
                  />
                  <CheckIndicator
                    label="Todos los periodos contables cerrados"
                    passed={validacion.checks?.periodossCerrados}
                  />
                  <CheckIndicator
                    label="Sin polizas pendientes (borrador/pendiente)"
                    passed={validacion.checks?.sinPolizasPendientes}
                  />
                  <CheckIndicator
                    label="Balanza de comprobacion cuadrada (Debe = Haber)"
                    passed={validacion.checks?.balanzaCuadrada}
                  />

                  {/* Errors list */}
                  {validacion.errors?.length > 0 && (
                    <div className="mt-4 bg-[#ff3e1d]/5 rounded-lg p-4 border border-[#ff3e1d]/20">
                      <p className="text-xs text-[#ff3e1d] font-semibold uppercase tracking-wide mb-2">
                        Errores encontrados
                      </p>
                      <ul className="space-y-1">
                        {validacion.errors.map((err, i) => (
                          <li key={i} className="text-sm text-[#ff3e1d] flex items-start gap-2">
                            <span className="flex-shrink-0 mt-0.5">
                              <IconX className="w-3 h-3 text-[#ff3e1d]" />
                            </span>
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validacion.canClose && (
                    <div className="mt-4 bg-[#71dd37]/5 rounded-lg p-4 border border-[#71dd37]/20">
                      <p className="text-sm text-[#56ca00] font-medium">
                        Todas las validaciones pasaron correctamente. Puede proceder con el cierre.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted py-4">
                  Seleccione un ejercicio fiscal para ver las validaciones.
                </p>
              )}
            </div>
          )}

          {/* Preview section */}
          {cierreEjercicioId && (
            <div className="bg-white rounded-lg card-shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[0.9375rem] font-semibold text-text-heading">
                  Previsualizacion del Cierre
                </h2>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handlePrevisualizar}
                  loading={previewLoading}
                >
                  <IconEye className="w-4 h-4 mr-1.5 inline-block" />
                  Previsualizar Cierre
                </Button>
              </div>

              {showPreview && previewLoading && (
                <div className="flex items-center justify-center py-8">
                  <IconSpinner className="h-6 w-6" />
                </div>
              )}

              {showPreview && previsualizacion && !previewLoading && (
                <div className="space-y-5">
                  {/* Summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#71dd37]/5 rounded-lg p-4 border border-[#71dd37]/20">
                      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                        Total Ingresos
                      </p>
                      <p className="text-lg font-bold text-[#56ca00] tabular-nums">
                        {fmtMoney(previsualizacion.resumen?.totalIngresos)}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {previsualizacion.resumen?.cuentasIngreso} cuentas
                      </p>
                    </div>
                    <div className="bg-[#ff3e1d]/5 rounded-lg p-4 border border-[#ff3e1d]/20">
                      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                        Total Gastos
                      </p>
                      <p className="text-lg font-bold text-[#e0360a] tabular-nums">
                        {fmtMoney(previsualizacion.resumen?.totalGastos)}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {previsualizacion.resumen?.cuentasGasto} cuentas
                      </p>
                    </div>
                    <div className={`rounded-lg p-4 border ${
                      previsualizacion.resumen?.resultado >= 0
                        ? 'bg-[#03c3ec]/5 border-[#03c3ec]/20'
                        : 'bg-[#ffab00]/5 border-[#ffab00]/20'
                    }`}>
                      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                        Resultado del Ejercicio
                      </p>
                      <p className={`text-lg font-bold tabular-nums ${
                        previsualizacion.resumen?.resultado >= 0 ? 'text-[#03a9ce]' : 'text-[#e09600]'
                      }`}>
                        {fmtMoney(previsualizacion.resumen?.resultado)}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        <Badge variant={previsualizacion.resumen?.tipo === 'superavit' ? 'success' : 'warning'}>
                          {previsualizacion.resumen?.tipo === 'superavit' ? 'Superavit' : 'Deficit'}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  {/* Poliza previews */}
                  <div className="space-y-4">
                    {/* Income closing */}
                    {previsualizacion.polizaIngresos && (
                      <details className="border border-border rounded-lg">
                        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-text-heading hover:bg-[#f5f5f9] rounded-lg">
                          Poliza de Cierre de Ingresos ({previsualizacion.polizaIngresos.movimientos?.length || 0} movimientos)
                        </summary>
                        <div className="px-4 pb-3">
                          <p className="text-xs text-text-muted mb-2">{previsualizacion.polizaIngresos.descripcion}</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 pr-4 text-xs text-text-muted font-medium">Cuenta</th>
                                  <th className="text-left py-2 pr-4 text-xs text-text-muted font-medium">Concepto</th>
                                  <th className="text-right py-2 pr-4 text-xs text-text-muted font-medium">Debe</th>
                                  <th className="text-right py-2 text-xs text-text-muted font-medium">Haber</th>
                                </tr>
                              </thead>
                              <tbody>
                                {previsualizacion.polizaIngresos.movimientos?.map((m, i) => (
                                  <tr key={i} className="border-b border-border/50">
                                    <td className="py-1.5 pr-4 font-mono text-xs">{m.cuenta_codigo}</td>
                                    <td className="py-1.5 pr-4 text-xs">{m.concepto}</td>
                                    <td className="py-1.5 pr-4 text-right font-mono text-xs tabular-nums">{m.debe > 0 ? fmtMoney(m.debe) : ''}</td>
                                    <td className="py-1.5 text-right font-mono text-xs tabular-nums">{m.haber > 0 ? fmtMoney(m.haber) : ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="font-semibold border-t-2 border-border">
                                  <td colSpan="2" className="py-2 text-xs">Totales</td>
                                  <td className="py-2 text-right font-mono text-xs tabular-nums">{fmtMoney(previsualizacion.polizaIngresos.totalDebe)}</td>
                                  <td className="py-2 text-right font-mono text-xs tabular-nums">{fmtMoney(previsualizacion.polizaIngresos.totalHaber)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </details>
                    )}

                    {/* Expense closing */}
                    {previsualizacion.polizaGastos && (
                      <details className="border border-border rounded-lg">
                        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-text-heading hover:bg-[#f5f5f9] rounded-lg">
                          Poliza de Cierre de Gastos ({previsualizacion.polizaGastos.movimientos?.length || 0} movimientos)
                        </summary>
                        <div className="px-4 pb-3">
                          <p className="text-xs text-text-muted mb-2">{previsualizacion.polizaGastos.descripcion}</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 pr-4 text-xs text-text-muted font-medium">Cuenta</th>
                                  <th className="text-left py-2 pr-4 text-xs text-text-muted font-medium">Concepto</th>
                                  <th className="text-right py-2 pr-4 text-xs text-text-muted font-medium">Debe</th>
                                  <th className="text-right py-2 text-xs text-text-muted font-medium">Haber</th>
                                </tr>
                              </thead>
                              <tbody>
                                {previsualizacion.polizaGastos.movimientos?.map((m, i) => (
                                  <tr key={i} className="border-b border-border/50">
                                    <td className="py-1.5 pr-4 font-mono text-xs">{m.cuenta_codigo}</td>
                                    <td className="py-1.5 pr-4 text-xs">{m.concepto}</td>
                                    <td className="py-1.5 pr-4 text-right font-mono text-xs tabular-nums">{m.debe > 0 ? fmtMoney(m.debe) : ''}</td>
                                    <td className="py-1.5 text-right font-mono text-xs tabular-nums">{m.haber > 0 ? fmtMoney(m.haber) : ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="font-semibold border-t-2 border-border">
                                  <td colSpan="2" className="py-2 text-xs">Totales</td>
                                  <td className="py-2 text-right font-mono text-xs tabular-nums">{fmtMoney(previsualizacion.polizaGastos.totalDebe)}</td>
                                  <td className="py-2 text-right font-mono text-xs tabular-nums">{fmtMoney(previsualizacion.polizaGastos.totalHaber)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </details>
                    )}

                    {/* Result transfer */}
                    {previsualizacion.polizaResultado && (
                      <details className="border border-border rounded-lg">
                        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-text-heading hover:bg-[#f5f5f9] rounded-lg">
                          Poliza de Traspaso a Hacienda Publica ({previsualizacion.polizaResultado.movimientos?.length || 0} movimientos)
                        </summary>
                        <div className="px-4 pb-3">
                          <p className="text-xs text-text-muted mb-2">{previsualizacion.polizaResultado.descripcion}</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 pr-4 text-xs text-text-muted font-medium">Cuenta</th>
                                  <th className="text-left py-2 pr-4 text-xs text-text-muted font-medium">Concepto</th>
                                  <th className="text-right py-2 pr-4 text-xs text-text-muted font-medium">Debe</th>
                                  <th className="text-right py-2 text-xs text-text-muted font-medium">Haber</th>
                                </tr>
                              </thead>
                              <tbody>
                                {previsualizacion.polizaResultado.movimientos?.map((m, i) => (
                                  <tr key={i} className="border-b border-border/50">
                                    <td className="py-1.5 pr-4 font-mono text-xs">{m.cuenta_codigo}</td>
                                    <td className="py-1.5 pr-4 text-xs">{m.concepto}</td>
                                    <td className="py-1.5 pr-4 text-right font-mono text-xs tabular-nums">{m.debe > 0 ? fmtMoney(m.debe) : ''}</td>
                                    <td className="py-1.5 text-right font-mono text-xs tabular-nums">{m.haber > 0 ? fmtMoney(m.haber) : ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="font-semibold border-t-2 border-border">
                                  <td colSpan="2" className="py-2 text-xs">Totales</td>
                                  <td className="py-2 text-right font-mono text-xs tabular-nums">{fmtMoney(previsualizacion.polizaResultado.totalDebe)}</td>
                                  <td className="py-2 text-right font-mono text-xs tabular-nums">{fmtMoney(previsualizacion.polizaResultado.totalHaber)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </details>
                    )}

                    {/* Target accounts info */}
                    {previsualizacion.resumen && (
                      <div className="bg-[#f5f5f9] rounded-lg p-4 text-xs text-text-muted space-y-1">
                        <p>
                          <span className="font-medium text-text-secondary">Cuenta Resultado del Ejercicio:</span>{' '}
                          {previsualizacion.resumen.cuentaResultado}
                        </p>
                        <p>
                          <span className="font-medium text-text-secondary">Cuenta Hacienda Publica:</span>{' '}
                          {previsualizacion.resumen.cuentaHacienda}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!showPreview && (
                <p className="text-sm text-text-muted py-4">
                  Presione &quot;Previsualizar Cierre&quot; para ver las polizas que se generaran.
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          {cierreEjercicioId && (
            <div className="bg-white rounded-lg card-shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[0.9375rem] font-semibold text-text-heading mb-1">
                    Ejecutar Cierre
                  </h2>
                  <p className="text-xs text-text-muted">
                    Esta operacion generara las polizas de cierre y marcara el ejercicio como cerrado.
                    Esta accion no se puede deshacer.
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => setConfirmCierreOpen(true)}
                  disabled={!validacion?.canClose || ejecutarCierreMut.isPending}
                  loading={ejecutarCierreMut.isPending}
                >
                  <IconLock className="w-4 h-4 mr-1.5 inline-block" />
                  Ejecutar Cierre
                </Button>
              </div>
            </div>
          )}

          {/* Ejercicios status table */}
          <div className="bg-white rounded-lg card-shadow p-5">
            <h2 className="text-[0.9375rem] font-semibold text-text-heading mb-4">
              Estado de Ejercicios Fiscales
            </h2>
            {ejercicios.length === 0 ? (
              <p className="text-sm text-text-muted py-4">No se encontraron ejercicios fiscales.</p>
            ) : (
              <DataTable columns={ejerciciosColumns} data={ejercicios} />
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: APERTURA DE EJERCICIO                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'apertura' && (
        <div className="space-y-6">
          {/* Action header */}
          <div className="flex items-center justify-between">
            <div />
            <Button onClick={() => {
              setOrigenId('');
              setDestinoId('');
              setShowAperturaWorkflow(true);
            }}>
              <IconPlus className="h-4 w-4 mr-1.5 inline-block" />
              Nueva Apertura
            </Button>
          </div>

          {/* History table */}
          <div className="bg-white rounded-lg card-shadow p-5">
            <h2 className="text-[0.9375rem] font-semibold text-text-heading mb-4">
              Historial de Aperturas
            </h2>
            {aperturasLoading ? (
              <div className="flex items-center justify-center py-16">
                <IconSpinner />
              </div>
            ) : aperturas.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#f5f5f9] flex items-center justify-center text-text-muted">
                    <IconChart />
                  </div>
                </div>
                <h3 className="text-[0.9375rem] font-semibold text-text-heading mb-1">
                  Sin aperturas registradas
                </h3>
                <p className="text-sm text-text-muted max-w-sm mx-auto">
                  No se han realizado aperturas de ejercicio. Presione &quot;Nueva Apertura&quot; para
                  iniciar el proceso.
                </p>
              </div>
            ) : (
              <DataTable columns={historyColumns} data={aperturas} />
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* APERTURA WORKFLOW MODAL                                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showAperturaWorkflow}
        onClose={() => setShowAperturaWorkflow(false)}
        title="Generar Poliza de Apertura"
        size="md"
      >
        <div className="space-y-5">
          {/* Step 1: Select exercises */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-guinda text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              Seleccionar ejercicios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Ejercicio Origen (cerrado)"
                placeholder="Seleccionar..."
                options={ejerciciosCerradosOptions}
                value={origenId}
                onChange={(e) => setOrigenId(e.target.value)}
              />
              <Select
                label="Ejercicio Destino (abierto)"
                placeholder="Seleccionar..."
                options={ejerciciosAbiertosOptions}
                value={destinoId}
                onChange={(e) => setDestinoId(e.target.value)}
              />
            </div>
            {origenId && destinoId && origenId === destinoId && (
              <p className="text-xs text-[#ff3e1d] mt-2">
                El ejercicio origen y destino deben ser diferentes.
              </p>
            )}
          </div>

          {/* Step 2: Info */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-guinda text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Informacion
            </h3>
            <div className="bg-[#f5f5f9] rounded-lg p-4 text-xs text-text-muted space-y-2">
              <p>La poliza de apertura transferira los saldos finales de las cuentas de balance
                (Activo 1.x, Pasivo 2.x, Hacienda Publica 3.x) del ejercicio origen como saldos
                iniciales del ejercicio destino.</p>
              <p>Se creara una poliza contable tipo diario en el primer periodo del ejercicio destino
                con todos los saldos de apertura.</p>
              <p className="font-medium text-text-secondary">Esta operacion no se puede deshacer.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setShowAperturaWorkflow(false)}>
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={() => setConfirmAperturaOpen(true)}
              disabled={!origenId || !destinoId || origenId === destinoId}
              loading={generarAperturaMut.isPending}
            >
              <IconBolt className="w-4 h-4 mr-1.5 inline-block" />
              Generar Poliza de Apertura
            </Button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* CONFIRM DIALOGS                                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* Confirm cierre */}
      <ConfirmDialog
        open={confirmCierreOpen}
        onClose={() => setConfirmCierreOpen(false)}
        onConfirm={handleEjecutarCierre}
        title="Confirmar cierre del ejercicio"
        message={`Se generaran las polizas de cierre para el ejercicio ${
          selectedEjercicio?.anio || ''
        } y se marcara como cerrado. Las cuentas de ingresos y gastos se cerraran contra Resultado del Ejercicio, y el resultado se trasladara a Hacienda Publica. Esta operacion no se puede deshacer. ¿Desea continuar?`}
        confirmText="Ejecutar Cierre"
        loading={ejecutarCierreMut.isPending}
      />

      {/* Confirm apertura */}
      <ConfirmDialog
        open={confirmAperturaOpen}
        onClose={() => setConfirmAperturaOpen(false)}
        onConfirm={handleGenerarApertura}
        title="Confirmar generacion de apertura"
        message={`Se transferiran los saldos de balance del ejercicio ${
          ejercicios.find((e) => e.id === origenId)?.anio || ''
        } al ejercicio ${
          ejercicios.find((e) => e.id === destinoId)?.anio || ''
        } mediante una poliza de apertura. Esta operacion no se puede deshacer. ¿Desea continuar?`}
        confirmText="Generar Apertura"
        loading={generarAperturaMut.isPending}
      />
    </div>
  );
}
