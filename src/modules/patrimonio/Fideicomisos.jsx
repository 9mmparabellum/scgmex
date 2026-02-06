import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useFideicomisos } from '../../hooks/usePatrimonio';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';
import { TIPOS_FIDEICOMISO, ESTADOS_FIDEICOMISO } from '../../config/constants';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const emptyForm = {
  clave: '',
  nombre: '',
  tipo: 'administracion',
  mandante: '',
  fiduciario: '',
  fideicomisario: '',
  monto_patrimonio: '',
  fecha_constitucion: '',
  fecha_extincion: '',
  vigencia_anios: '',
  objeto: '',
  estado: 'vigente',
};

const tipoBadgeVariant = {
  administracion: 'info',
  inversion: 'success',
  garantia: 'warning',
  traslativo: 'info',
  otro: 'default',
};

const estadoVariantMap = {
  vigente: 'success',
  en_extincion: 'warning',
  extinto: 'danger',
  suspendido: 'default',
};

export default function Fideicomisos() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: fideicomisos = [], isLoading } = useFideicomisos();

  const createMut = useCreate('fideicomiso');
  const updateMut = useUpdate('fideicomiso');
  const removeMut = useRemove('fideicomiso');

  // --- Select options ---
  const tipoOptions = useMemo(
    () => TIPOS_FIDEICOMISO.map((t) => ({ value: t.value ?? t.key ?? t, label: t.label ?? t })),
    []
  );

  const estadoOptions = useMemo(
    () => ESTADOS_FIDEICOMISO.map((e) => ({ value: e.value ?? e.key ?? e, label: e.label ?? e })),
    []
  );

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
      nombre: row.nombre ?? '',
      tipo: row.tipo ?? 'administracion',
      mandante: row.mandante ?? '',
      fiduciario: row.fiduciario ?? '',
      fideicomisario: row.fideicomisario ?? '',
      monto_patrimonio: row.monto_patrimonio ?? '',
      fecha_constitucion: row.fecha_constitucion ?? '',
      fecha_extincion: row.fecha_extincion ?? '',
      vigencia_anios: row.vigencia_anios ?? '',
      objeto: row.objeto ?? '',
      estado: row.estado ?? 'vigente',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      monto_patrimonio: Number(form.monto_patrimonio) || 0,
      vigencia_anios: form.vigencia_anios ? Number(form.vigencia_anios) : null,
      fecha_extincion: form.fecha_extincion || null,
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

  // --- Export ---
  const handleExport = () => {
    const excelCols = [
      { key: 'clave', label: 'Clave' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'mandante', label: 'Mandante' },
      { key: 'fiduciario', label: 'Fiduciario' },
      { key: 'fideicomisario', label: 'Fideicomisario' },
      { key: 'monto_patrimonio', label: 'Monto Patrimonio' },
      { key: 'fecha_constitucion', label: 'Fecha Constitucion' },
      { key: 'fecha_extincion', label: 'Fecha Extincion' },
      { key: 'vigencia_anios', label: 'Vigencia (anios)' },
      { key: 'estado', label: 'Estado' },
      { key: 'objeto', label: 'Objeto' },
    ];
    exportToExcel(fideicomisos, excelCols, 'fideicomisos_publicos');
  };

  // --- Table columns ---
  const columns = [
    { key: 'clave', label: 'Clave', width: '100px' },
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '130px',
      render: (val) => {
        const variant = tipoBadgeVariant[val] || 'default';
        return (
          <Badge variant={variant}>
            {val ? val.charAt(0).toUpperCase() + val.slice(1) : '\u2014'}
          </Badge>
        );
      },
    },
    { key: 'mandante', label: 'Mandante', width: '150px' },
    { key: 'fiduciario', label: 'Fiduciario', width: '150px' },
    {
      key: 'monto_patrimonio',
      label: 'Monto',
      width: '130px',
      render: (val) => (
        <span className="block text-right tabular-nums">{fmtMoney(val)}</span>
      ),
    },
    {
      key: 'fecha_constitucion',
      label: 'Fecha Const.',
      width: '110px',
      render: (val) => {
        if (!val) return '\u2014';
        const d = new Date(val + 'T00:00:00');
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
      },
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
        <h1 className="text-xl font-bold text-text-primary">Fideicomisos Publicos</h1>
        <p className="text-sm text-text-muted mt-1">
          Registro y control de fideicomisos del ente publico
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Fideicomisos
          <span className="ml-2 text-text-muted font-normal">
            ({fideicomisos.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="secondary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Nuevo Fideicomiso
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando fideicomisos...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={fideicomisos}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Fideicomiso' : 'Nuevo Fideicomiso'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Clave + Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Clave"
              value={form.clave}
              onChange={(e) => set('clave', e.target.value)}
              placeholder="Ej. FID-001"
              required
            />
            <Select
              label="Tipo de Fideicomiso"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoOptions}
              placeholder="— Seleccione tipo —"
            />
          </div>

          {/* Row 2: Nombre (full width) */}
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Nombre del fideicomiso"
            required
          />

          {/* Row 3: Mandante, Fiduciario, Fideicomisario */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Mandante"
              value={form.mandante}
              onChange={(e) => set('mandante', e.target.value)}
              placeholder="Mandante / Fideicomitente"
            />
            <Input
              label="Fiduciario"
              value={form.fiduciario}
              onChange={(e) => set('fiduciario', e.target.value)}
              placeholder="Institucion fiduciaria"
            />
            <Input
              label="Fideicomisario"
              value={form.fideicomisario}
              onChange={(e) => set('fideicomisario', e.target.value)}
              placeholder="Fideicomisario"
            />
          </div>

          {/* Row 4: Monto, Fecha Constitucion, Fecha Extincion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Monto Patrimonio"
              type="number"
              value={form.monto_patrimonio}
              onChange={(e) => set('monto_patrimonio', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Fecha Constitucion"
              type="date"
              value={form.fecha_constitucion}
              onChange={(e) => set('fecha_constitucion', e.target.value)}
            />
            <Input
              label="Fecha Extincion"
              type="date"
              value={form.fecha_extincion}
              onChange={(e) => set('fecha_extincion', e.target.value)}
            />
          </div>

          {/* Row 5: Vigencia + Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vigencia (anios)"
              type="number"
              value={form.vigencia_anios}
              onChange={(e) => set('vigencia_anios', e.target.value)}
              placeholder="Ej. 30"
            />
            <Select
              label="Estado"
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              options={estadoOptions}
              placeholder="— Seleccione estado —"
            />
          </div>

          {/* Row 6: Objeto (textarea, full width) */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Objeto del Fideicomiso
            </label>
            <textarea
              value={form.objeto}
              onChange={(e) => set('objeto', e.target.value)}
              placeholder="Descripcion del objeto y finalidad del fideicomiso"
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
              {editing ? 'Guardar cambios' : 'Crear fideicomiso'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar fideicomiso"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el fideicomiso "${toDelete.clave} — ${toDelete.nombre}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
