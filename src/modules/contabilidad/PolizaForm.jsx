import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useList } from '../../hooks/useCrud';
import {
  usePolizaDetalle,
  useCreatePoliza,
  useUpdatePoliza,
  useNextNumeroPoliza,
  useEnviarAprobacion,
  useAprobarPoliza,
  useCancelarPoliza,
  useRegresarBorrador,
} from '../../hooks/usePoliza';
import { useAppStore } from '../../stores/appStore';
import { TIPOS_POLIZA, ESTADOS_POLIZA } from '../../config/constants';
import { ROUTES } from '../../config/routes';
import { formatNumeroPoliza, validarPartidaDoble } from '../../utils/polizaHelpers';
import { validarPolizaCuadrada } from '../../utils/validaciones';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CuentaSelector from '../../components/shared/CuentaSelector';

/* -------------------------------------------------------------------------- */
/*  PolizaForm — Crear / editar / aprobar polizas contables                   */
/*  Partida doble (Art. 36 LGCG)                                              */
/* -------------------------------------------------------------------------- */

const badgeMap = {
  borrador: 'default',
  pendiente: 'warning',
  aprobada: 'success',
  cancelada: 'danger',
};

const emptyMov = {
  cuenta_id: '',
  cuenta_codigo: '',
  cuenta_nombre: '',
  concepto: '',
  debe: '',
  haber: '',
};

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(n);

export default function PolizaForm() {
  /* ---- Routing ----------------------------------------------------------- */
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  /* ---- Store ------------------------------------------------------------- */
  const { entePublico, ejercicioFiscal, periodoContable, user, rol } =
    useAppStore();

  /* ---- Data hooks -------------------------------------------------------- */
  const { data: polizaData, isLoading: loadingPoliza } = usePolizaDetalle(id);

  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const createMut = useCreatePoliza();
  const updateMut = useUpdatePoliza();
  const enviarMut = useEnviarAprobacion();
  const aprobarMut = useAprobarPoliza();
  const cancelarMut = useCancelarPoliza();
  const regresarMut = useRegresarBorrador();

  /* ---- Header form state ------------------------------------------------- */
  const [tipo, setTipo] = useState('diario');
  const [fecha, setFecha] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [periodoId, setPeriodoId] = useState(periodoContable?.id || '');
  const [descripcion, setDescripcion] = useState('');

  /* ---- Auto-number ------------------------------------------------------- */
  const { data: nextNumero } = useNextNumeroPoliza(isNew ? tipo : null);

  /* ---- Movimientos state ------------------------------------------------- */
  const [movimientos, setMovimientos] = useState([
    { ...emptyMov },
    { ...emptyMov },
  ]);

  /* ---- CuentaSelector state ---------------------------------------------- */
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorIdx, setSelectorIdx] = useState(null);

  /* ---- Validation error state -------------------------------------------- */
  const [validationError, setValidationError] = useState('');

  /* ---- Cancel dialog state ----------------------------------------------- */
  const [cancelOpen, setCancelOpen] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  /* ---- Load existing poliza data ----------------------------------------- */
  useEffect(() => {
    if (polizaData && !isNew) {
      setTipo(polizaData.tipo);
      setFecha(polizaData.fecha);
      setPeriodoId(polizaData.periodo_id || '');
      setDescripcion(polizaData.descripcion || '');
      if (polizaData.movimientos?.length > 0) {
        setMovimientos(
          polizaData.movimientos.map((m) => ({
            cuenta_id: m.cuenta_id || '',
            cuenta_codigo: m.plan_de_cuentas?.codigo || '',
            cuenta_nombre: m.plan_de_cuentas?.nombre || '',
            concepto: m.concepto || '',
            debe: m.debe > 0 ? String(m.debe) : '',
            haber: m.haber > 0 ? String(m.haber) : '',
          })),
        );
      }
    }
  }, [polizaData, isNew]);

  /* ---- Computed values --------------------------------------------------- */
  const totalDebe = movimientos.reduce(
    (s, m) => s + (parseFloat(m.debe) || 0),
    0,
  );
  const totalHaber = movimientos.reduce(
    (s, m) => s + (parseFloat(m.haber) || 0),
    0,
  );
  const diferencia = Math.abs(totalDebe - totalHaber);
  const isBalanced = diferencia < 0.01;
  const estado = polizaData?.estado || 'borrador';
  const isReadOnly =
    estado === 'aprobada' ||
    estado === 'cancelada' ||
    estado === 'pendiente';

  /* ---- Options ----------------------------------------------------------- */
  const periodoOptions = useMemo(
    () =>
      periodos.map((p) => ({
        value: p.id,
        label: `${p.numero} \u2014 ${p.nombre || p.mes}`,
      })),
    [periodos],
  );

  const tipoOptions = useMemo(
    () =>
      Object.entries(TIPOS_POLIZA).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  /* ---- Movimiento handlers ----------------------------------------------- */
  const updateMov = useCallback((idx, field, value) => {
    setMovimientos((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // Auto-clear: if setting debe, clear haber and viceversa
      if (field === 'debe' && value) next[idx].haber = '';
      if (field === 'haber' && value) next[idx].debe = '';
      return next;
    });
  }, []);

  const addMov = useCallback(
    () => setMovimientos((prev) => [...prev, { ...emptyMov }]),
    [],
  );

  const removeMov = useCallback(
    (idx) => {
      if (movimientos.length <= 2) return; // minimum 2 lines
      setMovimientos((prev) => prev.filter((_, i) => i !== idx));
    },
    [movimientos.length],
  );

  const openSelector = useCallback((idx) => {
    setSelectorIdx(idx);
    setSelectorOpen(true);
  }, []);

  const handleCuentaSelected = useCallback((cuenta) => {
    if (cuenta == null) return;
    setSelectorIdx((currentIdx) => {
      if (currentIdx != null) {
        setMovimientos((prev) => {
          const next = [...prev];
          next[currentIdx] = {
            ...next[currentIdx],
            cuenta_id: cuenta.id,
            cuenta_codigo: cuenta.codigo,
            cuenta_nombre: cuenta.nombre,
          };
          return next;
        });
      }
      return currentIdx;
    });
    setSelectorOpen(false);
  }, []);

  /* ---- Save / Submit ----------------------------------------------------- */
  const canSave =
    tipo &&
    fecha &&
    periodoId &&
    movimientos.length >= 2 &&
    movimientos.every(
      (m) =>
        m.cuenta_id &&
        (parseFloat(m.debe) > 0 || parseFloat(m.haber) > 0),
    ) &&
    isBalanced;

  const handleSave = useCallback(async () => {
    setValidationError('');
    const resultado = validarPolizaCuadrada(movimientos);
    if (!resultado.valido) {
      setValidationError(resultado.mensaje);
      return;
    }
    const header = {
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      periodo_id: periodoId,
      tipo,
      numero_poliza: isNew ? nextNumero : polizaData?.numero_poliza,
      fecha,
      descripcion: descripcion.trim(),
      estado: 'borrador',
      total_debe: totalDebe,
      total_haber: totalHaber,
      creado_por: user?.id || user?.email,
    };
    const movsPayload = movimientos.map((m) => ({
      cuenta_id: m.cuenta_id,
      concepto: m.concepto || '',
      debe: parseFloat(m.debe) || 0,
      haber: parseFloat(m.haber) || 0,
    }));

    try {
      if (isNew) {
        const poliza = await createMut.mutateAsync({
          header,
          movimientos: movsPayload,
        });
        navigate(ROUTES.POLIZAS + '/' + poliza.id, { replace: true });
      } else {
        await updateMut.mutateAsync({
          id,
          changes: header,
          movimientos: movsPayload,
        });
      }
    } catch (err) {
      console.error('Error saving poliza:', err);
    }
  }, [
    entePublico,
    ejercicioFiscal,
    periodoId,
    tipo,
    isNew,
    nextNumero,
    polizaData,
    fecha,
    descripcion,
    totalDebe,
    totalHaber,
    user,
    movimientos,
    id,
    createMut,
    updateMut,
    navigate,
  ]);

  const handleEnviar = useCallback(async () => {
    if (isNew) await handleSave();
    await enviarMut.mutateAsync(id || polizaData?.id);
    navigate(ROUTES.POLIZAS);
  }, [isNew, handleSave, enviarMut, id, polizaData, navigate]);

  const handleAprobar = useCallback(async () => {
    await aprobarMut.mutateAsync({
      polizaId: id,
      aprobadoPor: user?.id || user?.email,
    });
    navigate(ROUTES.POLIZAS);
  }, [aprobarMut, id, user, navigate]);

  const handleRegresar = useCallback(async () => {
    await regresarMut.mutateAsync(id);
  }, [regresarMut, id]);

  const handleCancelar = useCallback(async () => {
    await cancelarMut.mutateAsync({
      polizaId: id,
      canceladoPor: user?.id || user?.email,
      motivo: motivoCancelacion,
    });
    setCancelOpen(false);
    navigate(ROUTES.POLIZAS);
  }, [cancelarMut, id, user, motivoCancelacion, navigate]);

  /* ---- Loading state ----------------------------------------------------- */
  if (!isNew && loadingPoliza) {
    return (
      <div className="flex items-center justify-center py-24">
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

  /* ---- Render ------------------------------------------------------------ */
  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Back button + Title                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(ROUTES.POLIZAS)}
          className="text-text-muted hover:text-text-heading transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">
              {isNew
                ? 'Nueva Poliza'
                : `Poliza ${formatNumeroPoliza(tipo, polizaData?.numero_poliza || nextNumero || 0)}`}
            </h1>
            {!isNew && (
              <Badge variant={badgeMap[estado] || 'default'}>
                {ESTADOS_POLIZA[estado]?.label || estado}
              </Badge>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1">
            {isNew
              ? 'Registre una nueva poliza contable con partida doble'
              : 'Detalle y movimientos de la poliza'}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Header Form                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg card-shadow p-5 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Tipo *"
            options={tipoOptions}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            disabled={!isNew || isReadOnly}
          />
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Numero
            </label>
            <div className="h-[40px] rounded-md border border-border bg-bg-hover text-text-muted text-[0.9375rem] px-3.5 flex items-center font-mono">
              {formatNumeroPoliza(
                tipo,
                isNew ? nextNumero || '...' : polizaData?.numero_poliza,
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Fecha *
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={isReadOnly}
              className="block w-full h-[40px] rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda transition-all duration-150"
            />
          </div>
          <Select
            label="Periodo *"
            options={periodoOptions}
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
            placeholder="Seleccionar..."
            disabled={isReadOnly}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-text-heading mb-1.5">
            Descripcion
          </label>
          <textarea
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={isReadOnly}
            placeholder="Descripcion de la poliza..."
            className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda transition-all duration-150 resize-none"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Movimientos Table                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg card-shadow p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary">
            Movimientos contables
          </h2>
          {!isReadOnly && (
            <Button size="sm" variant="outline-primary" onClick={addMov}>
              + Agregar linea
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f9fafb]">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-3 py-2.5 w-10">
                  #
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-3 py-2.5">
                  Cuenta
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-3 py-2.5">
                  Concepto
                </th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-3 py-2.5 w-40">
                  Debe
                </th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-3 py-2.5 w-40">
                  Haber
                </th>
                {!isReadOnly && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov, idx) => (
                <tr key={idx} className="border-b border-[#f0f0f0]">
                  {/* Row number */}
                  <td className="px-3 py-2 text-xs text-text-muted">
                    {idx + 1}
                  </td>

                  {/* Cuenta */}
                  <td className="px-3 py-2">
                    {isReadOnly ? (
                      <span className="text-sm">
                        {mov.cuenta_codigo} &mdash; {mov.cuenta_nombre}
                      </span>
                    ) : (
                      <button
                        onClick={() => openSelector(idx)}
                        className="text-left w-full text-sm hover:text-primary transition-colors cursor-pointer"
                      >
                        {mov.cuenta_id ? (
                          <span className="font-mono">
                            {mov.cuenta_codigo}{' '}
                            <span className="text-text-muted">
                              &mdash; {mov.cuenta_nombre}
                            </span>
                          </span>
                        ) : (
                          <span className="text-text-muted italic">
                            Seleccionar cuenta...
                          </span>
                        )}
                      </button>
                    )}
                  </td>

                  {/* Concepto */}
                  <td className="px-3 py-2">
                    {isReadOnly ? (
                      <span className="text-sm">
                        {mov.concepto || '\u2014'}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={mov.concepto}
                        onChange={(e) =>
                          updateMov(idx, 'concepto', e.target.value)
                        }
                        placeholder="Concepto..."
                        className="w-full text-sm border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-guinda/25 focus:border-guinda"
                      />
                    )}
                  </td>

                  {/* Debe */}
                  <td className="px-3 py-2">
                    {isReadOnly ? (
                      <span className="font-mono text-sm text-right block">
                        {parseFloat(mov.debe) > 0 ? fmtMoney(mov.debe) : ''}
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={mov.debe}
                        onChange={(e) =>
                          updateMov(idx, 'debe', e.target.value)
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full text-sm text-right font-mono border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-guinda/25 focus:border-guinda"
                      />
                    )}
                  </td>

                  {/* Haber */}
                  <td className="px-3 py-2">
                    {isReadOnly ? (
                      <span className="font-mono text-sm text-right block">
                        {parseFloat(mov.haber) > 0
                          ? fmtMoney(mov.haber)
                          : ''}
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={mov.haber}
                        onChange={(e) =>
                          updateMov(idx, 'haber', e.target.value)
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full text-sm text-right font-mono border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-guinda/25 focus:border-guinda"
                      />
                    )}
                  </td>

                  {/* Remove button */}
                  {!isReadOnly && (
                    <td className="px-3 py-2">
                      {movimientos.length > 2 && (
                        <button
                          onClick={() => removeMov(idx)}
                          className="text-danger hover:text-danger/80 transition-colors cursor-pointer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Balance Bar (sticky)                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="sticky bottom-0 bg-white rounded-lg card-shadow p-4 mb-4 border-t-2 border-guinda/20">
        {validationError && (
          <div className="mb-3 p-3 bg-danger/10 border border-danger/20 rounded-md text-danger text-sm">
            {validationError}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-text-muted uppercase">
                Total Debe
              </span>
              <p className="font-mono text-lg font-semibold text-text-primary">
                {fmtMoney(totalDebe)}
              </p>
            </div>
            <div>
              <span className="text-xs text-text-muted uppercase">
                Total Haber
              </span>
              <p className="font-mono text-lg font-semibold text-text-primary">
                {fmtMoney(totalHaber)}
              </p>
            </div>
            <div>
              <span className="text-xs text-text-muted uppercase">
                Diferencia
              </span>
              <p
                className={`font-mono text-lg font-semibold ${isBalanced ? 'text-success' : 'text-danger'}`}
              >
                {fmtMoney(diferencia)}
              </p>
            </div>
          </div>

          {/* Workflow action buttons */}
          <div className="flex items-center gap-3">
            {/* Borrador / New */}
            {(estado === 'borrador' || isNew) && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate(ROUTES.POLIZAS)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={handleSave}
                  disabled={!canSave}
                  loading={createMut.isPending || updateMut.isPending}
                >
                  Guardar Borrador
                </Button>
                {!isNew && (
                  <Button
                    onClick={handleEnviar}
                    disabled={!canSave}
                    loading={enviarMut.isPending}
                  >
                    Enviar a Aprobacion
                  </Button>
                )}
              </>
            )}

            {/* Pendiente */}
            {estado === 'pendiente' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancelar Poliza
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={handleRegresar}
                  loading={regresarMut.isPending}
                >
                  Regresar a Borrador
                </Button>
                {(rol === 'super_admin' || rol === 'contador_general') && (
                  <Button
                    variant="success"
                    onClick={handleAprobar}
                    loading={aprobarMut.isPending}
                  >
                    Aprobar
                  </Button>
                )}
              </>
            )}

            {/* Aprobada */}
            {estado === 'aprobada' && (
              <Button
                variant="danger"
                onClick={() => setCancelOpen(true)}
                loading={cancelarMut.isPending}
              >
                Cancelar Poliza
              </Button>
            )}

            {/* Cancelada */}
            {estado === 'cancelada' && (
              <Button
                variant="ghost"
                onClick={() => navigate(ROUTES.POLIZAS)}
              >
                Volver
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CuentaSelector modal                                                */}
      {/* ------------------------------------------------------------------ */}
      <CuentaSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleCuentaSelected}
        enteId={entePublico?.id}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Cancel Confirm Dialog                                               */}
      {/* ------------------------------------------------------------------ */}
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelar}
        title="Cancelar Poliza"
        message="Esta seguro de cancelar esta poliza? Esta accion no se puede deshacer."
        confirmText="Cancelar Poliza"
        variant="danger"
        loading={cancelarMut.isPending}
      />
    </div>
  );
}
