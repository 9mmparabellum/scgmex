import { useState, useMemo } from 'react';
import { useAperturas, useVerificarApertura, useEjecutarApertura } from '../../hooks/useApertura';
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
/*  AperturaEjercicio — Transferencia de saldos al nuevo ejercicio            */
/*  Art. 49 LGCG — Apertura del ejercicio fiscal                              */
/* -------------------------------------------------------------------------- */

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function AperturaEjercicio() {
  const { entePublico, user } = useAppStore();

  /* ---- Local state -------------------------------------------------------- */
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [verificacion, setVerificacion] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* ---- Data --------------------------------------------------------------- */
  const { data: aperturas = [], isLoading } = useAperturas();

  const { data: ejercicios = [] } = useList('ejercicio_fiscal', {
    filter: { ente_id: entePublico?.id },
    order: { column: 'anio', ascending: true },
  });

  const ejercicioOptions = useMemo(
    () => ejercicios.map((e) => ({ value: e.id, label: `${e.anio}` })),
    [ejercicios]
  );

  const verificarMut = useVerificarApertura();
  const ejecutarMut = useEjecutarApertura();

  /* ---- Verification checks ------------------------------------------------ */
  const allChecksPassed = useMemo(() => {
    if (!verificacion) return false;
    return (
      verificacion.origenExiste &&
      verificacion.origenCerrado &&
      verificacion.destinoExiste &&
      verificacion.destinoAbierto &&
      verificacion.noExisteApertura
    );
  }, [verificacion]);

  /* ---- Table columns ------------------------------------------------------ */
  const columns = useMemo(
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
        label: 'Fecha Apertura',
        width: '150px',
        render: (val) =>
          val ? new Date(val).toLocaleDateString('es-MX') : '\u2014',
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
        label: 'Cuentas Transferidas',
        width: '160px',
        render: (val) => (
          <span className="font-mono text-sm">{val ?? 0}</span>
        ),
      },
      {
        key: 'total_saldo_deudor',
        label: 'Saldo Deudor',
        width: '150px',
        render: (val) => (
          <span className="font-mono text-sm text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'total_saldo_acreedor',
        label: 'Saldo Acreedor',
        width: '150px',
        render: (val) => (
          <span className="font-mono text-sm text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'ejecutado_por',
        label: 'Ejecutado Por',
        width: '150px',
        render: (_val, row) => row.ejecutador?.nombre || row.ejecutado_por_nombre || '\u2014',
      },
    ],
    []
  );

  /* ---- Handlers ----------------------------------------------------------- */
  const openWorkflow = () => {
    setOrigenId('');
    setDestinoId('');
    setVerificacion(null);
    setShowWorkflow(true);
  };

  const handleVerificar = async () => {
    if (!origenId || !destinoId) return;
    try {
      const result = await verificarMut.mutateAsync({
        ejercicioOrigenId: origenId,
        ejercicioDestinoId: destinoId,
      });
      setVerificacion(result);
    } catch {
      setVerificacion(null);
    }
  };

  const handleEjecutar = async () => {
    try {
      await ejecutarMut.mutateAsync({
        enteId: entePublico?.id,
        ejercicioOrigenId: origenId,
        ejercicioDestinoId: destinoId,
        ejecutadoPor: user?.id,
      });
      setConfirmOpen(false);
      setShowWorkflow(false);
      setOrigenId('');
      setDestinoId('');
      setVerificacion(null);
    } catch {
      setConfirmOpen(false);
    }
  };

  /* ---- Verification panel component --------------------------------------- */
  const renderCheck = (label, passed) => (
    <div className="flex items-center gap-2.5 py-1.5">
      {passed ? (
        <div className="w-5 h-5 rounded-full bg-[#71dd37]/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-[#71dd37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-[#ff3e1d]/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-[#ff3e1d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      )}
      <span className={`text-sm ${passed ? 'text-text-primary' : 'text-[#ff3e1d] font-medium'}`}>
        {label}
      </span>
    </div>
  );

  /* ---- Render ------------------------------------------------------------- */
  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Apertura del Ejercicio
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Transferencia de saldos del ejercicio anterior al nuevo ejercicio (Art. 49 LGCG)
          </p>
        </div>
        <Button onClick={openWorkflow}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1.5 inline-block"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Nueva Apertura
        </Button>
      </div>

      {/* History table */}
      <div className="bg-white rounded-lg card-shadow p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
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
        ) : aperturas.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#f5f5f9] flex items-center justify-center text-text-muted">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
              </div>
            </div>
            <h3 className="text-[0.9375rem] font-semibold text-text-heading mb-1">
              Sin aperturas registradas
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              No se han realizado aperturas de ejercicio. Presione &quot;Nueva Apertura&quot; para iniciar el proceso.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={aperturas}
          />
        )}
      </div>

      {/* Workflow modal */}
      <Modal
        open={showWorkflow}
        onClose={() => setShowWorkflow(false)}
        title="Nueva Apertura de Ejercicio"
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
                label="Ejercicio Origen"
                placeholder="Seleccionar..."
                options={ejercicioOptions}
                value={origenId}
                onChange={(e) => {
                  setOrigenId(e.target.value);
                  setVerificacion(null);
                }}
              />
              <Select
                label="Ejercicio Destino"
                placeholder="Seleccionar..."
                options={ejercicioOptions}
                value={destinoId}
                onChange={(e) => {
                  setDestinoId(e.target.value);
                  setVerificacion(null);
                }}
              />
            </div>
          </div>

          {/* Step 2: Verify */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-guinda text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Verificar condiciones
            </h3>
            <Button
              variant="outline-primary"
              onClick={handleVerificar}
              loading={verificarMut.isPending}
              disabled={!origenId || !destinoId || origenId === destinoId}
              size="sm"
            >
              <svg
                className="w-4 h-4 mr-1.5 inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verificar
            </Button>

            {origenId && destinoId && origenId === destinoId && (
              <p className="text-xs text-[#ff3e1d] mt-2">
                El ejercicio origen y destino deben ser diferentes.
              </p>
            )}

            {/* Verification results */}
            {verificacion && (
              <div className="mt-4 bg-[#f9fafb] rounded-lg p-4 border border-border">
                <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-2">
                  Resultado de verificacion
                </p>
                {renderCheck('Ejercicio origen existe', verificacion.origenExiste)}
                {renderCheck('Ejercicio origen esta cerrado', verificacion.origenCerrado)}
                {renderCheck('Ejercicio destino existe', verificacion.destinoExiste)}
                {renderCheck('Ejercicio destino esta abierto', verificacion.destinoAbierto)}
                {renderCheck('No existe apertura previa entre estos ejercicios', verificacion.noExisteApertura)}

                {allChecksPassed && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-[#71dd37] font-medium">
                      Todas las verificaciones pasaron correctamente. Puede proceder con la apertura.
                    </p>
                  </div>
                )}
                {!allChecksPassed && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-[#ff3e1d] font-medium">
                      Algunas verificaciones no pasaron. Corrija las condiciones antes de continuar.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Execute */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-guinda text-white text-xs flex items-center justify-center font-bold">
                3
              </span>
              Ejecutar apertura
            </h3>
            <p className="text-xs text-text-muted mb-3">
              Esta operacion transferira los saldos finales del ejercicio origen como saldos iniciales del ejercicio destino. Esta accion no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setShowWorkflow(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={() => setConfirmOpen(true)}
                disabled={!allChecksPassed}
              >
                <svg
                  className="w-4 h-4 mr-1.5 inline-block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ejecutar Apertura
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleEjecutar}
        title="Confirmar apertura del ejercicio"
        message={`Se transferiran los saldos del ejercicio ${
          ejercicios.find((e) => e.id === origenId)?.anio || ''
        } al ejercicio ${
          ejercicios.find((e) => e.id === destinoId)?.anio || ''
        }. Esta operacion no se puede deshacer. ¿Desea continuar?`}
        confirmText="Ejecutar Apertura"
        loading={ejecutarMut.isPending}
      />
    </div>
  );
}
