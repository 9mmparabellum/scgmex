import { useState } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useInventarios } from '../../hooks/usePatrimonio';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ESTADOS_INVENTARIO } from '../../config/constants';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const emptyForm = {
  clave: '',
  descripcion: '',
  fecha_conteo: '',
  responsable: '',
  ubicacion: '',
  total_bienes: '',
  valor_total: '',
  estado: 'borrador',
  observaciones: '',
};

const estadoVariantMap = {
  borrador: 'default',
  en_proceso: 'warning',
  finalizado: 'success',
};

const estadoSelectOptions = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'finalizado', label: 'Finalizado' },
];

export default function Inventarios() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: inventarios = [], isLoading } = useInventarios();

  const createMut = useCreate('inventario_conteo');
  const updateMut = useUpdate('inventario_conteo');
  const removeMut = useRemove('inventario_conteo');

  // --- Form helper ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

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
      descripcion: row.descripcion ?? '',
      fecha_conteo: row.fecha_conteo ?? '',
      responsable: row.responsable ?? '',
      ubicacion: row.ubicacion ?? '',
      total_bienes: row.total_bienes ?? '',
      valor_total: row.valor_total ?? '',
      estado: row.estado ?? 'borrador',
      observaciones: row.observaciones ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      total_bienes: form.total_bienes ? Number(form.total_bienes) : null,
      valor_total: Number(form.valor_total) || 0,
    };

    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  const askDelete = (row) => {
    setToDelete(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (toDelete) {
      await removeMut.mutateAsync(toDelete.id);
    }
    setConfirmOpen(false);
    setToDelete(null);
  };

  // --- Table columns ---
  const columns = [
    { key: 'clave', label: 'Clave', width: '100px' },
    { key: 'descripcion', label: 'Descripcion' },
    {
      key: 'fecha_conteo',
      label: 'Fecha Conteo',
      width: '110px',
      render: (val) => {
        if (!val) return '\u2014';
        const d = new Date(val + 'T00:00:00');
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
      },
    },
    { key: 'responsable', label: 'Responsable', width: '150px' },
    {
      key: 'total_bienes',
      label: 'Total Bienes',
      width: '100px',
      render: (val) => (
        <span className="block text-right tabular-nums">
          {val != null ? Number(val).toLocaleString('es-MX') : '\u2014'}
        </span>
      ),
    },
    {
      key: 'valor_total',
      label: 'Valor Total',
      width: '130px',
      render: (val) => (
        <span className="block text-right tabular-nums">{fmtMoney(val)}</span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      width: '120px',
      render: (val) => {
        const variant = estadoVariantMap[val] || 'default';
        return (
          <Badge variant={variant}>
            {val ? val.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '\u2014'}
          </Badge>
        );
      },
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
        <h1 className="text-xl font-bold text-text-primary">Inventarios Fisicos</h1>
        <p className="text-sm text-text-muted mt-1">
          Control de inventarios y conteos de bienes patrimoniales
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Inventarios
          <span className="ml-2 text-text-muted font-normal">
            ({inventarios.length} registros)
          </span>
        </h2>
        <Button onClick={openCreate} size="sm">
          + Nuevo Inventario
        </Button>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando inventarios...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={inventarios}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Inventario' : 'Nuevo Inventario'}
        size="md"
      >
        <div className="space-y-4">
          {/* Clave */}
          <Input
            label="Clave"
            value={form.clave}
            onChange={(e) => set('clave', e.target.value)}
            placeholder="Ej. INV-2026-001"
            required
          />

          {/* Descripcion */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Descripcion <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Descripcion del inventario"
              rows={3}
              className="w-full h-[40px] min-h-[80px] rounded-md border border-border px-3 py-2 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>

          {/* Fecha + Responsable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Conteo"
              type="date"
              value={form.fecha_conteo}
              onChange={(e) => set('fecha_conteo', e.target.value)}
            />
            <Input
              label="Responsable"
              value={form.responsable}
              onChange={(e) => set('responsable', e.target.value)}
              placeholder="Nombre del responsable"
            />
          </div>

          {/* Ubicacion */}
          <Input
            label="Ubicacion"
            value={form.ubicacion}
            onChange={(e) => set('ubicacion', e.target.value)}
            placeholder="Ubicacion del conteo"
          />

          {/* Total Bienes + Valor Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Total Bienes"
              type="number"
              value={form.total_bienes}
              onChange={(e) => set('total_bienes', e.target.value)}
              placeholder="0"
            />
            <Input
              label="Valor Total"
              type="number"
              value={form.valor_total}
              onChange={(e) => set('valor_total', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Estado */}
          <Select
            label="Estado"
            value={form.estado}
            onChange={(e) => set('estado', e.target.value)}
            options={estadoSelectOptions}
            placeholder="— Seleccione estado —"
          />

          {/* Observaciones */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Observaciones
            </label>
            <textarea
              value={form.observaciones}
              onChange={(e) => set('observaciones', e.target.value)}
              placeholder="Observaciones adicionales"
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
              disabled={!form.clave.trim() || !form.descripcion.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear inventario'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar inventario"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el inventario "${toDelete.clave} — ${toDelete.descripcion}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
