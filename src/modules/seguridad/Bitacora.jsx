import { useState, useMemo } from 'react';
import { useList } from '../../hooks/useCrud';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';

const TABLE = 'bitacora';

const ACCION_OPTIONS = [
  { value: 'INSERT', label: 'INSERT' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
];

const ACCION_BADGE_MAP = {
  INSERT: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
};

function formatDateTime(date) {
  if (!date) return '--';
  const d = new Date(date);
  return d.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatJSON(value) {
  if (!value) return null;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
}

function truncateId(id) {
  if (!id) return '--';
  const str = String(id);
  if (str.length <= 12) return str;
  return str.slice(0, 8) + '...';
}

const columns = [
  {
    key: 'created_at',
    label: 'Fecha / Hora',
    width: '180px',
    render: (value) => (
      <span className="text-xs font-mono text-text-secondary">
        {formatDateTime(value)}
      </span>
    ),
  },
  {
    key: 'usuario_email',
    label: 'Usuario',
    render: (value) => value || '--',
  },
  {
    key: 'accion',
    label: 'Accion',
    width: '120px',
    render: (value) => (
      <Badge variant={ACCION_BADGE_MAP[value] || 'default'}>
        {value || '--'}
      </Badge>
    ),
  },
  {
    key: 'tabla',
    label: 'Tabla',
    width: '180px',
    render: (value) => (
      <span className="font-mono text-xs text-text-secondary">{value || '--'}</span>
    ),
  },
  {
    key: 'registro_id',
    label: 'Registro ID',
    width: '140px',
    render: (value) => (
      <span className="font-mono text-xs text-text-muted" title={String(value || '')}>
        {truncateId(value)}
      </span>
    ),
  },
];

export default function Bitacora() {
  const { data: entries = [], isLoading } = useList(TABLE, {
    order: { column: 'created_at', ascending: false },
  });

  // Filter state
  const [filterTabla, setFilterTabla] = useState('');
  const [filterAccion, setFilterAccion] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');

  // Detail modal state
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Derive unique table names for the dropdown
  const tablaOptions = useMemo(() => {
    const uniqueTablas = [...new Set(entries.map((e) => e.tabla).filter(Boolean))].sort();
    return uniqueTablas.map((t) => ({ value: t, label: t }));
  }, [entries]);

  // Apply filters
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (filterTabla) {
      result = result.filter((e) => e.tabla === filterTabla);
    }

    if (filterAccion) {
      result = result.filter((e) => e.accion === filterAccion);
    }

    if (filterFechaDesde) {
      const desde = new Date(filterFechaDesde);
      desde.setHours(0, 0, 0, 0);
      result = result.filter((e) => {
        const d = new Date(e.created_at);
        return d >= desde;
      });
    }

    if (filterFechaHasta) {
      const hasta = new Date(filterFechaHasta);
      hasta.setHours(23, 59, 59, 999);
      result = result.filter((e) => {
        const d = new Date(e.created_at);
        return d <= hasta;
      });
    }

    return result;
  }, [entries, filterTabla, filterAccion, filterFechaDesde, filterFechaHasta]);

  // Handlers
  const openDetail = (row) => {
    setSelectedEntry(row);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedEntry(null);
  };

  const clearFilters = () => {
    setFilterTabla('');
    setFilterAccion('');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
  };

  const hasActiveFilters = filterTabla || filterAccion || filterFechaDesde || filterFechaHasta;

  const handleExport = () => {
    // Placeholder para funcionalidad de exportacion futura
    alert('Funcionalidad de exportacion en desarrollo.');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Bitacora de Auditoria</h1>
          <p className="text-sm text-text-muted mt-1">
            Art. 84-86 — Registro completo de operaciones del sistema
          </p>
        </div>
        <Button variant="ghost" onClick={handleExport}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-bg-card rounded-xl border border-border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <Select
            label="Tabla"
            placeholder="Todas las tablas"
            options={tablaOptions}
            value={filterTabla}
            onChange={(e) => setFilterTabla(e.target.value)}
          />
          <Select
            label="Accion"
            placeholder="Todas las acciones"
            options={ACCION_OPTIONS}
            value={filterAccion}
            onChange={(e) => setFilterAccion(e.target.value)}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              value={filterFechaDesde}
              onChange={(e) => setFilterFechaDesde(e.target.value)}
              className="block w-full rounded-lg border border-border bg-bg-input text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              value={filterFechaHasta}
              onChange={(e) => setFilterFechaHasta(e.target.value)}
              className="block w-full rounded-lg border border-border bg-bg-input text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-end">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-3 text-xs text-text-muted">
            Mostrando {filteredEntries.length} de {entries.length} registros
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-bg-card rounded-xl border border-border p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
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
            <span className="ml-3 text-sm text-text-muted">Cargando bitacora...</span>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredEntries}
            onRowClick={openDetail}
          />
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title="Detalle de Registro"
        size="lg"
      >
        {selectedEntry && (
          <div className="space-y-4">
            {/* Metadata grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  Fecha y Hora
                </label>
                <p className="text-sm text-text-primary font-mono">
                  {formatDateTime(selectedEntry.created_at)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  Usuario
                </label>
                <p className="text-sm text-text-primary">
                  {selectedEntry.usuario_email || '--'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  Accion
                </label>
                <Badge variant={ACCION_BADGE_MAP[selectedEntry.accion] || 'default'}>
                  {selectedEntry.accion || '--'}
                </Badge>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  Tabla
                </label>
                <p className="text-sm text-text-primary font-mono">
                  {selectedEntry.tabla || '--'}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  Registro ID
                </label>
                <p className="text-sm text-text-primary font-mono">
                  {selectedEntry.registro_id || '--'}
                </p>
              </div>
            </div>

            {/* Datos Anteriores */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Datos Anteriores
              </label>
              {selectedEntry.datos_anteriores ? (
                <pre className="bg-bg-hover rounded-lg border border-border p-3 text-xs text-text-secondary font-mono overflow-x-auto max-h-60 overflow-y-auto">
                  <code>{formatJSON(selectedEntry.datos_anteriores)}</code>
                </pre>
              ) : (
                <p className="text-sm text-text-muted italic">Sin datos anteriores</p>
              )}
            </div>

            {/* Datos Nuevos */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Datos Nuevos
              </label>
              {selectedEntry.datos_nuevos ? (
                <pre className="bg-bg-hover rounded-lg border border-border p-3 text-xs text-text-secondary font-mono overflow-x-auto max-h-60 overflow-y-auto">
                  <code>{formatJSON(selectedEntry.datos_nuevos)}</code>
                </pre>
              ) : (
                <p className="text-sm text-text-muted italic">Sin datos nuevos</p>
              )}
            </div>

            {/* Close button */}
            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="ghost" onClick={closeDetail}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
