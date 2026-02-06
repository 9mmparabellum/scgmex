import { useList, useUpdate } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const ESTADO_BADGE_MAP = {
  abierto: 'success',
  cerrado: 'danger',
};

const ESTADO_LABEL_MAP = {
  abierto: 'Abierto',
  cerrado: 'Cerrado',
};

export default function PeriodosContables() {
  const { ejercicioFiscal, entePublico } = useAppStore();

  const { data: periodos = [], isLoading } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const updatePeriodo = useUpdate('periodo_contable');

  const handleToggleEstado = async (periodo) => {
    const nuevoEstado = periodo.estado === 'abierto' ? 'cerrado' : 'abierto';
    try {
      await updatePeriodo.mutateAsync({
        id: periodo.id,
        estado: nuevoEstado,
      });
    } catch (err) {
      console.error('Error al actualizar periodo contable:', err);
    }
  };

  const columns = [
    {
      key: 'numero',
      label: 'No.',
      width: '70px',
      render: (value) => (
        <span className="font-mono text-text-secondary">{value}</span>
      ),
    },
    {
      key: 'nombre',
      label: 'Nombre',
    },
    {
      key: 'fecha_inicio',
      label: 'Fecha Inicio',
    },
    {
      key: 'fecha_fin',
      label: 'Fecha Fin',
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Badge variant={ESTADO_BADGE_MAP[value] || 'default'}>
            {ESTADO_LABEL_MAP[value] || value}
          </Badge>
          <Button
            size="sm"
            variant={value === 'abierto' ? 'danger' : 'primary'}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleEstado(row);
            }}
            loading={updatePeriodo.isPending && updatePeriodo.variables?.id === row.id}
            disabled={updatePeriodo.isPending}
          >
            {value === 'abierto' ? 'Cerrar' : 'Abrir'}
          </Button>
        </div>
      ),
    },
  ];

  // Guard: no ejercicio selected
  if (!ejercicioFiscal?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">
          Seleccione un ejercicio fiscal para ver los periodos contables.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Periodos Contables</h1>
        <p className="text-sm text-text-muted mt-1">
          Periodos del ejercicio fiscal {ejercicioFiscal?.anio}
          {entePublico?.nombre ? ` — ${entePublico.nombre}` : ''}
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-4 p-3 rounded-lg border border-info/30 bg-info/5 text-info text-sm">
        Los periodos contables se generan automaticamente al crear un ejercicio fiscal.
        Utilice los botones para abrir o cerrar cada periodo segun sea necesario.
      </div>

      {/* Table */}
      <div className="bg-bg-card rounded-xl border border-border p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg
              className="animate-spin h-6 w-6 text-primary"
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
            <span className="ml-3 text-text-muted text-sm">Cargando periodos...</span>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={periodos}
            searchable={false}
          />
        )}
      </div>

      {/* Summary footer */}
      {!isLoading && periodos.length > 0 && (
        <div className="mt-4 flex items-center gap-6 text-sm text-text-secondary">
          <span>
            Total de periodos: <span className="font-semibold text-text-primary">{periodos.length}</span>
          </span>
          <span>
            Abiertos:{' '}
            <span className="font-semibold text-success">
              {periodos.filter((p) => p.estado === 'abierto').length}
            </span>
          </span>
          <span>
            Cerrados:{' '}
            <span className="font-semibold text-danger">
              {periodos.filter((p) => p.estado === 'cerrado').length}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
