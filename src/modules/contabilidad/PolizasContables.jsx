import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useList } from '../../hooks/useCrud';
import { usePolizasList } from '../../hooks/usePoliza';
import { useAppStore } from '../../stores/appStore';
import { TIPOS_POLIZA, ESTADOS_POLIZA } from '../../config/constants';
import { ROUTES } from '../../config/routes';
import { formatNumeroPoliza } from '../../utils/polizaHelpers';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';

/* -------------------------------------------------------------------------- */
/*  PolizasContables — Lista de polizas contables                             */
/*  Art. 36 LGCG — Registro de operaciones mediante polizas de diario         */
/* -------------------------------------------------------------------------- */

export default function PolizasContables() {
  const navigate = useNavigate();
  const { ejercicioFiscal } = useAppStore();

  /* ---- Filtros ----------------------------------------------------------- */
  const [filters, setFilters] = useState({
    periodo_id: '',
    tipo: '',
    estado: '',
  });

  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () =>
    setFilters({ periodo_id: '', tipo: '', estado: '' });

  const hasActiveFilters = Object.values(filters).some(Boolean);

  /* ---- Opciones de seleccion --------------------------------------------- */
  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
  });

  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: `${p.numero} — ${p.nombre || p.mes}` })),
    [periodos],
  );

  const tipoOptions = useMemo(
    () => Object.entries(TIPOS_POLIZA).map(([value, label]) => ({ value, label })),
    [],
  );

  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_POLIZA).map(([value, { label }]) => ({ value, label })),
    [],
  );

  /* ---- Datos ------------------------------------------------------------- */
  const extraFilter = useMemo(() => {
    const f = {};
    if (filters.periodo_id) f.periodo_id = filters.periodo_id;
    if (filters.tipo) f.tipo = filters.tipo;
    if (filters.estado) f.estado = filters.estado;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [filters]);

  const { data: polizas = [], isLoading } = usePolizasList(extraFilter);

  /* ---- Columnas ---------------------------------------------------------- */
  const columns = useMemo(
    () => [
      {
        key: 'numero_poliza',
        label: 'Numero',
        width: '120px',
        render: (val, row) => (
          <span className="font-mono text-sm font-semibold text-primary">
            {formatNumeroPoliza(row.tipo, val)}
          </span>
        ),
      },
      {
        key: 'fecha',
        label: 'Fecha',
        width: '120px',
        render: (val) =>
          val ? new Date(val).toLocaleDateString('es-MX') : '\u2014',
      },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '120px',
        render: (val) => TIPOS_POLIZA[val] || val || '\u2014',
      },
      {
        key: 'descripcion',
        label: 'Descripcion',
      },
      {
        key: 'total_debe',
        label: 'Total',
        width: '140px',
        render: (val) => (
          <span className="font-mono text-sm">
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
            }).format(val || 0)}
          </span>
        ),
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '130px',
        render: (val) => {
          const badgeMap = {
            borrador: 'default',
            pendiente: 'warning',
            aprobada: 'success',
            cancelada: 'danger',
          };
          return (
            <Badge variant={badgeMap[val] || 'default'}>
              {ESTADOS_POLIZA[val]?.label || val || '\u2014'}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  /* ---- Handlers ---------------------------------------------------------- */
  const handleRowClick = (row) => {
    navigate(ROUTES.POLIZAS + '/' + row.id);
  };

  /* ---- Render ------------------------------------------------------------ */
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Polizas Contables
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Art. 36 &mdash; Registro de operaciones mediante polizas de diario
          </p>
        </div>
        <Button onClick={() => navigate(ROUTES.POLIZA_NUEVA)}>
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
          Nueva Poliza
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg card-shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Select
            label="Periodo"
            options={periodoOptions}
            value={filters.periodo_id}
            onChange={(e) => setFilter('periodo_id', e.target.value)}
            placeholder="Todos los periodos"
          />
          <Select
            label="Tipo"
            options={tipoOptions}
            value={filters.tipo}
            onChange={(e) => setFilter('tipo', e.target.value)}
            placeholder="Todos los tipos"
          />
          <Select
            label="Estado"
            options={estadoOptions}
            value={filters.estado}
            onChange={(e) => setFilter('estado', e.target.value)}
            placeholder="Todos los estados"
          />
          <div className="flex items-end">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
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
            data={polizas}
            onRowClick={handleRowClick}
          />
        )}
      </div>
    </div>
  );
}
