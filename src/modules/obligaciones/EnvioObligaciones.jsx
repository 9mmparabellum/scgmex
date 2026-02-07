import { useState, useMemo } from 'react';
import { useEnvios, useResumenEnvios } from '../../hooks/useEnvioObligaciones';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { canEdit } from '../../utils/rbac';
import { TIPOS_ENVIO_OBLIGACION, ESTADOS_ENVIO } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const fmtDate = (d) => {
  if (!d) return '\u2014';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const tipoLabel = (tipo) => TIPOS_ENVIO_OBLIGACION[tipo] || tipo;
const estadoLabel = (estado) => ESTADOS_ENVIO[estado]?.label || estado;
const estadoVariant = (estado) => ESTADOS_ENVIO[estado]?.variant || 'default';

const QUARTERS = [
  { key: 'Q1', label: 'T1 (Ene\u2013Mar)', months: [1, 2, 3] },
  { key: 'Q2', label: 'T2 (Abr\u2013Jun)', months: [4, 5, 6] },
  { key: 'Q3', label: 'T3 (Jul\u2013Sep)', months: [7, 8, 9] },
  { key: 'Q4', label: 'T4 (Oct\u2013Dic)', months: [10, 11, 12] },
];

const emptyForm = {
  tipo: 'conac_trimestral',
  periodo: '',
  descripcion: '',
  fecha_limite: '',
  fecha_envio: '',
  estado: 'pendiente',
  acuse: '',
  notas: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function EnvioObligaciones() {
  const { entePublico, ejercicioFiscal, rol } = useAppStore();
  const editable = canEdit(rol, 'obligaciones');

  /* --- State --- */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  /* --- Data hooks --- */
  const { data: envios = [], isLoading } = useEnvios();
  const { data: resumen = {} } = useResumenEnvios();

  const createMut = useCreate('envio_obligacion');
  const updateMut = useUpdate('envio_obligacion');
  const removeMut = useRemove('envio_obligacion');

  /* --- Select options --- */
  const tipoOptions = useMemo(
    () =>
      Object.entries(TIPOS_ENVIO_OBLIGACION).map(([value, label]) => ({
        value,
        label,
      })),
    []
  );

  const estadoOptions = useMemo(
    () =>
      Object.entries(ESTADOS_ENVIO).map(([value, obj]) => ({
        value,
        label: obj.label,
      })),
    []
  );

  /* --- Filtered data --- */
  const filteredEnvios = useMemo(() => {
    let result = envios;
    if (filterEstado) {
      result = result.filter((e) => e.estado === filterEstado);
    }
    if (filterTipo) {
      result = result.filter((e) => e.tipo === filterTipo);
    }
    return result;
  }, [envios, filterEstado, filterTipo]);

  /* --- Timeline grouped by quarter --- */
  const enviosByQuarter = useMemo(() => {
    const now = new Date();
    return QUARTERS.map((q) => {
      const items = envios.filter((e) => {
        if (!e.fecha_limite) return false;
        const month = new Date(e.fecha_limite + 'T00:00:00').getMonth() + 1;
        return q.months.includes(month);
      });
      return {
        ...q,
        items: items.map((e) => {
          const isVencido =
            e.estado === 'pendiente' && new Date(e.fecha_limite) < now;
          const isProximo =
            e.estado === 'pendiente' &&
            !isVencido &&
            new Date(e.fecha_limite) - now < 15 * 24 * 60 * 60 * 1000;
          const isEnviado = ['enviado', 'confirmado'].includes(e.estado);
          return { ...e, isVencido, isProximo, isEnviado };
        }),
      };
    });
  }, [envios]);

  /* --- Form helpers --- */
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  /* --- Handlers --- */
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    if (!editable) return;
    setEditing(row);
    setForm({
      tipo: row.tipo ?? 'conac_trimestral',
      periodo: row.periodo ?? '',
      descripcion: row.descripcion ?? '',
      fecha_limite: row.fecha_limite ?? '',
      fecha_envio: row.fecha_envio ?? '',
      estado: row.estado ?? 'pendiente',
      acuse: row.acuse ?? '',
      notas: row.notas ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      fecha_envio: form.fecha_envio || null,
    };

    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  const askDelete = (row) => {
    setDeleteTarget(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await removeMut.mutateAsync(deleteTarget.id);
    }
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  /* --- Export --- */
  const handleExport = () => {
    const excelCols = [
      { key: 'tipo', label: 'Tipo', getValue: (row) => tipoLabel(row.tipo) },
      { key: 'periodo', label: 'Periodo' },
      { key: 'descripcion', label: 'Descripcion' },
      { key: 'fecha_limite', label: 'Fecha Limite' },
      { key: 'fecha_envio', label: 'Fecha Envio' },
      { key: 'estado', label: 'Estado', getValue: (row) => estadoLabel(row.estado) },
      { key: 'acuse', label: 'Acuse' },
      { key: 'notas', label: 'Notas' },
    ];
    exportToExcel(filteredEnvios, excelCols, 'envio_obligaciones');
  };

  /* --- Table columns --- */
  const columns = [
    {
      key: 'tipo',
      label: 'Tipo',
      width: '180px',
      render: (val) => (
        <span className="text-[0.8125rem] font-medium">{tipoLabel(val)}</span>
      ),
    },
    { key: 'periodo', label: 'Periodo', width: '100px' },
    {
      key: 'fecha_limite',
      label: 'Fecha Limite',
      width: '130px',
      render: (val) => {
        const now = new Date();
        const isOverdue = val && new Date(val) < now;
        return (
          <span className={isOverdue ? 'text-danger font-medium' : ''}>
            {fmtDate(val)}
          </span>
        );
      },
    },
    {
      key: 'fecha_envio',
      label: 'Fecha Envio',
      width: '130px',
      render: (val) => fmtDate(val),
    },
    {
      key: 'estado',
      label: 'Estado',
      width: '120px',
      render: (val) => (
        <Badge variant={estadoVariant(val)}>{estadoLabel(val)}</Badge>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      width: '140px',
      sortable: false,
      render: (_val, row) =>
        editable ? (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
              className="text-xs text-primary hover:text-primary-light transition-colors cursor-pointer"
            >
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                askDelete(row);
              }}
              className="text-xs text-danger hover:text-danger/80 transition-colors cursor-pointer"
            >
              Eliminar
            </button>
          </div>
        ) : (
          <span className="text-xs text-text-muted">Solo lectura</span>
        ),
    },
  ];

  const isSaving = createMut.isPending || updateMut.isPending;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          Envio de Obligaciones
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Control y seguimiento de envios de informacion a organos fiscalizadores
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            Total Obligaciones
          </p>
          <p className="text-lg font-bold text-text-primary">
            {resumen.total ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            Pendientes
          </p>
          <p className="text-lg font-bold text-amber-600">
            {resumen.pendientes ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            Enviados
          </p>
          <p className="text-lg font-bold text-emerald-600">
            {resumen.enviados ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg card-shadow p-4 border border-red-100">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            Vencidos
          </p>
          <p className="text-lg font-bold text-danger">
            {resumen.vencidos ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            Rechazados
          </p>
          <p className="text-lg font-bold text-danger">
            {resumen.rechazados ?? 0}
          </p>
        </div>
      </div>

      {/* Timeline by quarter */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">
          Calendario de Obligaciones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {enviosByQuarter.map((q) => (
            <div key={q.key} className="bg-white rounded-lg card-shadow p-4">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                {q.label}
              </h3>
              {q.items.length === 0 ? (
                <p className="text-xs text-text-muted italic">
                  Sin obligaciones
                </p>
              ) : (
                <div className="space-y-2">
                  {q.items.map((e) => (
                    <div
                      key={e.id}
                      className={[
                        'rounded-md px-3 py-2 text-xs cursor-pointer transition-colors',
                        e.isVencido
                          ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                          : e.isProximo
                            ? 'bg-amber-50 border border-amber-200 hover:bg-amber-100'
                            : e.isEnviado
                              ? 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100',
                      ].join(' ')}
                      onClick={() => editable && openEdit(e)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-text-primary truncate">
                          {tipoLabel(e.tipo)}
                        </span>
                        <Badge variant={estadoVariant(e.estado)}>
                          {estadoLabel(e.estado)}
                        </Badge>
                      </div>
                      <p className="text-text-muted">
                        {fmtDate(e.fecha_limite)}
                        {e.periodo ? ` \u00B7 ${e.periodo}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar + toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            Detalle
            <span className="ml-2 text-text-muted font-normal">
              ({filteredEnvios.length} registros)
            </span>
          </h2>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="h-[32px] rounded-md border border-border bg-white text-[0.8125rem] text-text-heading px-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
          >
            <option value="">Todos los tipos</option>
            {tipoOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="h-[32px] rounded-md border border-border bg-white text-[0.8125rem] text-text-heading px-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
          >
            <option value="">Todos los estados</option>
            {estadoOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          {editable && (
            <Button onClick={openCreate} size="sm">
              + Nuevo Envio
            </Button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando obligaciones...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredEnvios}
          onRowClick={editable ? openEdit : undefined}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Envio' : 'Nuevo Envio'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Tipo, Periodo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Obligacion"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoOptions}
              placeholder="\u2014 Seleccione tipo \u2014"
              required
            />
            <Input
              label="Periodo"
              value={form.periodo}
              onChange={(e) => set('periodo', e.target.value)}
              placeholder="Ej. 2024-T1"
              required
            />
          </div>

          {/* Row 2: Descripcion */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Descripcion
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Descripcion de la obligacion"
              rows={2}
              className="w-full min-h-[60px] rounded-md border border-border px-3 py-2 text-[0.9375rem] text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda transition-all duration-150"
            />
          </div>

          {/* Row 3: Fecha Limite, Fecha Envio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Limite"
              type="date"
              value={form.fecha_limite}
              onChange={(e) => set('fecha_limite', e.target.value)}
              required
            />
            <Input
              label="Fecha Envio"
              type="date"
              value={form.fecha_envio}
              onChange={(e) => set('fecha_envio', e.target.value)}
            />
          </div>

          {/* Row 4: Estado, Acuse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Estado"
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              options={estadoOptions}
              placeholder="\u2014 Seleccione estado \u2014"
              required
            />
            <Input
              label="Acuse"
              value={form.acuse}
              onChange={(e) => set('acuse', e.target.value)}
              placeholder="Numero de acuse o referencia"
            />
          </div>

          {/* Row 5: Notas */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Notas
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              placeholder="Notas adicionales"
              rows={3}
              className="w-full min-h-[80px] rounded-md border border-border px-3 py-2 text-[0.9375rem] text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda transition-all duration-150"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.tipo || !form.periodo.trim() || !form.fecha_limite}
            >
              {editing ? 'Guardar cambios' : 'Crear envio'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar envio"
        message={
          deleteTarget
            ? `\u00BFEsta seguro de eliminar el envio "${tipoLabel(deleteTarget.tipo)} \u2014 ${deleteTarget.periodo || ''}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
