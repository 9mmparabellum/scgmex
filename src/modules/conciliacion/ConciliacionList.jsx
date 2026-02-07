import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConciliaciones, useGenerarConciliacion } from '../../hooks/useConciliacion';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { ESTADOS_CONCILIACION } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';

/* -------------------------------------------------------------------------- */
/*  ConciliacionList — Lista de conciliaciones contable-presupuestales        */
/*  Art. 48 LGCG — Conciliacion entre registros contables y presupuestales    */
/* -------------------------------------------------------------------------- */

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function ConciliacionList() {
  const navigate = useNavigate();
  const { entePublico, ejercicioFiscal, user } = useAppStore();

  /* ---- Modal state -------------------------------------------------------- */
  const [showModal, setShowModal] = useState(false);
  const [periodoId, setPeriodoId] = useState('');

  /* ---- Data --------------------------------------------------------------- */
  const { data: conciliaciones = [], isLoading } = useConciliaciones();

  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: p.nombre || `Periodo ${p.numero}` })),
    [periodos]
  );

  const generar = useGenerarConciliacion();

  /* ---- Columns ------------------------------------------------------------ */
  const columns = useMemo(
    () => [
      {
        key: 'periodo',
        label: 'Periodo',
        width: '160px',
        render: (_val, row) => row.periodo?.nombre || '\u2014',
      },
      {
        key: 'fecha_elaboracion',
        label: 'Fecha Elaboracion',
        width: '150px',
        render: (val) =>
          val ? new Date(val).toLocaleDateString('es-MX') : '\u2014',
      },
      {
        key: 'total_contable',
        label: 'Total Contable',
        width: '160px',
        render: (val) => (
          <span className="font-mono text-sm">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'total_presupuestal_egreso',
        label: 'Total Pres. Egreso',
        width: '170px',
        render: (val) => (
          <span className="font-mono text-sm">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'diferencia_egreso',
        label: 'Diferencia Egreso',
        width: '160px',
        render: (val) => {
          const diff = val || 0;
          return (
            <span
              className={`font-mono text-sm font-semibold ${
                diff !== 0 ? 'text-[#e0360a]' : 'text-text-primary'
              }`}
            >
              {fmtMoney(diff)}
            </span>
          );
        },
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '130px',
        render: (val) => {
          const estado = ESTADOS_CONCILIACION[val];
          return (
            <Badge variant={estado?.variant || 'default'}>
              {estado?.label || val || '\u2014'}
            </Badge>
          );
        },
      },
      {
        key: 'elaborador',
        label: 'Elaborado Por',
        width: '160px',
        render: (_val, row) => row.elaborador?.nombre || '\u2014',
      },
    ],
    []
  );

  /* ---- Handlers ----------------------------------------------------------- */
  const handleRowClick = (row) => {
    navigate(`/contabilidad/conciliacion/${row.id}`);
  };

  const handleGenerar = async () => {
    if (!periodoId) return;
    try {
      await generar.mutateAsync({
        enteId: entePublico.id,
        ejercicioId: ejercicioFiscal.id,
        periodoId,
        elaboradoPor: user?.id,
      });
      setShowModal(false);
      setPeriodoId('');
    } catch {
      // mutation error handled by React Query
    }
  };

  const handleOpenModal = () => {
    setPeriodoId('');
    setShowModal(true);
  };

  /* ---- Render ------------------------------------------------------------- */
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Conciliacion Contable-Presupuestal
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Conciliacion entre registros contables y presupuestales (Art. 48 LGCG)
          </p>
        </div>
        <Button onClick={handleOpenModal}>
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
          Generar Conciliacion
        </Button>
      </div>

      {/* Table */}
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
        ) : (
          <DataTable
            columns={columns}
            data={conciliaciones}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      {/* Modal — Generar Conciliacion */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Generar Conciliacion"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Periodo Contable"
            placeholder="Seleccionar periodo..."
            options={periodoOptions}
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
          />
          <p className="text-xs text-text-muted">
            Se generara la conciliacion comparando los registros contables con los
            presupuestales del periodo seleccionado.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleGenerar}
              loading={generar.isPending}
              disabled={!periodoId}
            >
              Generar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
