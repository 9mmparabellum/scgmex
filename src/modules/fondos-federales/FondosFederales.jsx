import { useState, useMemo } from 'react';
import { useList, useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useFondosFederales, useResumenFondos } from '../../hooks/useFondosFederales';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';
import { TIPOS_FONDO_FEDERAL, ESTADOS_FONDO } from '../../config/constants';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const emptyForm = {
  clave: '',
  nombre: '',
  tipo: 'participacion',
  fuente: '',
  monto_asignado: '',
  monto_recibido: '',
  monto_ejercido: '',
  monto_reintegrado: '0',
  fecha_asignacion: '',
  descripcion: '',
  estado: 'activo',
  clasificador_id: '',
};

export default function FondosFederales() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Data hooks ---
  const { data: fondos = [], isLoading } = useFondosFederales();
  const { data: resumen = {} } = useResumenFondos();

  const { data: clasificadorList = [] } = useList('clasificador_presupuestal', {
    filter: { tipo: 'fuente_financiamiento' },
  });

  const createMut = useCreate('fondo_federal');
  const updateMut = useUpdate('fondo_federal');
  const removeMut = useRemove('fondo_federal');

  // --- Select options ---
  const tipoFondoOptions = useMemo(
    () => TIPOS_FONDO_FEDERAL.map((t) => ({ value: t.key ?? t, label: t.label ?? t })),
    []
  );

  const estadoFondoOptions = useMemo(
    () => ESTADOS_FONDO.map((e) => ({ value: e.key ?? e, label: e.label ?? e })),
    []
  );

  const clasificadorOptions = useMemo(
    () => clasificadorList.map((c) => ({ value: c.id, label: `${c.codigo} — ${c.nombre}` })),
    [clasificadorList]
  );

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const tipoBadge = (tipo) => {
    const variants = { participacion: 'primary', aportacion: 'success', subsidio: 'warning', convenio: 'info' };
    return variants[tipo] || 'default';
  };

  const estadoBadge = (estado) => {
    const variants = { activo: 'success', suspendido: 'warning', cancelado: 'danger', cerrado: 'info' };
    return variants[estado] || 'default';
  };

  const tipoLabel = (tipo) => {
    const found = TIPOS_FONDO_FEDERAL.find((t) => (t.key ?? t) === tipo);
    return found ? (found.label ?? found) : tipo;
  };

  const estadoLabel = (estado) => {
    const found = ESTADOS_FONDO.find((e) => (e.key ?? e) === estado);
    return found ? (found.label ?? found) : estado;
  };

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      clave: row.clave ?? '',
      nombre: row.nombre ?? '',
      tipo: row.tipo ?? 'participacion',
      fuente: row.fuente ?? '',
      monto_asignado: row.monto_asignado ?? '',
      monto_recibido: row.monto_recibido ?? '',
      monto_ejercido: row.monto_ejercido ?? '',
      monto_reintegrado: row.monto_reintegrado ?? '0',
      fecha_asignacion: row.fecha_asignacion ?? '',
      descripcion: row.descripcion ?? '',
      estado: row.estado ?? 'activo',
      clasificador_id: row.clasificador_id ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      monto_asignado: Number(form.monto_asignado) || 0,
      monto_recibido: Number(form.monto_recibido) || 0,
      monto_ejercido: Number(form.monto_ejercido) || 0,
      monto_reintegrado: Number(form.monto_reintegrado) || 0,
      clasificador_id: form.clasificador_id || null,
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

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'clave', label: 'Clave' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'tipo', label: 'Tipo', getValue: (row) => tipoLabel(row.tipo) },
      { key: 'fuente', label: 'Fuente' },
      { key: 'monto_asignado', label: 'Asignado', getValue: (row) => Number(row.monto_asignado || 0) },
      { key: 'monto_recibido', label: 'Recibido', getValue: (row) => Number(row.monto_recibido || 0) },
      { key: 'monto_ejercido', label: 'Ejercido', getValue: (row) => Number(row.monto_ejercido || 0) },
      {
        key: 'pct_ejercido',
        label: '% Ejercido',
        getValue: (row) => {
          const asignado = Number(row.monto_asignado || 0);
          return asignado > 0 ? ((Number(row.monto_ejercido || 0) / asignado) * 100).toFixed(1) : '0.0';
        },
      },
      { key: 'estado', label: 'Estado', getValue: (row) => estadoLabel(row.estado) },
    ];
    exportToExcel(fondos, excelCols, 'fondos_federales');
  };

  // --- Table columns ---
  const columns = [
    { key: 'clave', label: 'Clave', width: '100px' },
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '130px',
      render: (val) => (
        <Badge variant={tipoBadge(val)}>
          {tipoLabel(val)}
        </Badge>
      ),
    },
    { key: 'fuente', label: 'Fuente', width: '150px' },
    {
      key: 'monto_asignado',
      label: 'Asignado',
      width: '120px',
      render: (val) => (
        <span className="text-right block tabular-nums">
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'monto_recibido',
      label: 'Recibido',
      width: '120px',
      render: (val) => (
        <span className="text-right block tabular-nums">
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'monto_ejercido',
      label: 'Ejercido',
      width: '120px',
      render: (val) => (
        <span className="text-right block tabular-nums">
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'monto_asignado',
      label: '% Ejercido',
      width: '80px',
      render: (_val, row) => {
        const asignado = Number(row.monto_asignado || 0);
        const ejercido = Number(row.monto_ejercido || 0);
        const pct = asignado > 0 ? ((ejercido / asignado) * 100).toFixed(1) : '0.0';
        return (
          <span className="text-right block tabular-nums">
            {pct}%
          </span>
        );
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      width: '100px',
      render: (val) => (
        <Badge variant={estadoBadge(val)}>
          {estadoLabel(val)}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      width: '140px',
      sortable: false,
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="text-xs text-primary hover:text-primary-light transition-colors cursor-pointer"
          >
            Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); askDelete(row); }}
            className="text-xs text-danger hover:text-danger/80 transition-colors cursor-pointer"
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Fondos Federales</h1>
        <p className="text-sm text-text-muted mt-1">
          Control de participaciones, aportaciones, subsidios y convenios federales
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Asignado</p>
          <p className="text-lg font-bold text-text-primary">{fmtMoney(resumen.total_asignado)}</p>
        </div>
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Recibido</p>
          <p className="text-lg font-bold text-text-primary">{fmtMoney(resumen.total_recibido)}</p>
        </div>
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Ejercido</p>
          <p className="text-lg font-bold text-text-primary">{fmtMoney(resumen.total_ejercido)}</p>
        </div>
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Avance</p>
          <p className="text-lg font-bold text-text-primary">
            {Number(resumen.pct_avance || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Fondos
          <span className="ml-2 text-text-muted font-normal">
            ({fondos.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Nuevo Fondo
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando fondos federales...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={fondos}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Fondo' : 'Nuevo Fondo'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Clave, Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Clave"
              value={form.clave}
              onChange={(e) => set('clave', e.target.value)}
              placeholder="Ej. FF-001"
              required
            />
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoFondoOptions}
              placeholder="— Seleccione tipo —"
              required
            />
          </div>

          {/* Row 2: Nombre */}
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Nombre del fondo federal"
            required
          />

          {/* Row 3: Fuente */}
          <Input
            label="Fuente"
            value={form.fuente}
            onChange={(e) => set('fuente', e.target.value)}
            placeholder="Fuente de los recursos"
          />

          {/* Row 4: Montos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Monto Asignado"
              type="number"
              value={form.monto_asignado}
              onChange={(e) => set('monto_asignado', e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label="Monto Recibido"
              type="number"
              value={form.monto_recibido}
              onChange={(e) => set('monto_recibido', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Monto Ejercido"
              type="number"
              value={form.monto_ejercido}
              onChange={(e) => set('monto_ejercido', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Monto Reintegrado"
              type="number"
              value={form.monto_reintegrado}
              onChange={(e) => set('monto_reintegrado', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Row 5: Fecha Asignacion, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Asignacion"
              type="date"
              value={form.fecha_asignacion}
              onChange={(e) => set('fecha_asignacion', e.target.value)}
              required
            />
            <Select
              label="Estado"
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              options={estadoFondoOptions}
              placeholder="— Seleccione estado —"
              required
            />
          </div>

          {/* Row 6: Clasificador */}
          <Select
            label="Clasificador (Fuente de Financiamiento)"
            value={form.clasificador_id}
            onChange={(e) => set('clasificador_id', e.target.value)}
            options={clasificadorOptions}
            placeholder="— Seleccione clasificador —"
          />

          {/* Row 7: Descripcion */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Descripcion
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Descripcion del fondo federal"
              rows={3}
              className="w-full h-[40px] min-h-[80px] rounded-md border border-border px-3 py-2 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.clave.trim() || !form.nombre.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear fondo'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title="Eliminar fondo"
        message={
          deleteTarget
            ? `¿Esta seguro de eliminar el fondo "${deleteTarget.clave} — ${deleteTarget.nombre}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
