import { useState } from 'react';
import { useList, useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const TIPOS = [
  { value: 'objeto_gasto', label: 'Objeto del Gasto' },
  { value: 'funcional', label: 'Funcional' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'economico', label: 'Economico' },
  { value: 'programatico', label: 'Programatico' },
  { value: 'geografico', label: 'Geografico' },
  { value: 'fuente_financiamiento', label: 'Fuente de Financiamiento' },
];

const emptyForm = {
  tipo: '',
  codigo: '',
  nombre: '',
  nivel: 1,
  padre_id: '',
  activo: true,
};

export default function Clasificadores() {
  const { entePublico } = useAppStore();

  const [selectedTipo, setSelectedTipo] = useState(TIPOS[0].value);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, tipo: TIPOS[0].value });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Data hooks ---
  const { data: clasificadores = [], isLoading } = useList('clasificador_presupuestal', {
    filter: { ente_id: entePublico?.id, tipo: selectedTipo },
  });

  const createMut = useCreate('clasificador_presupuestal');
  const updateMut = useUpdate('clasificador_presupuestal');
  const removeMut = useRemove('clasificador_presupuestal');

  // --- Helpers ---
  const tipoLabel = TIPOS.find((t) => t.value === selectedTipo)?.label ?? selectedTipo;

  const padreOptions = clasificadores
    .filter((c) => (editing ? c.id !== editing.id : true))
    .map((c) => ({ value: c.id, label: `${c.codigo} — ${c.nombre}` }));

  // --- Handlers ---
  const handleTabChange = (tipo) => {
    setSelectedTipo(tipo);
    setForm((prev) => ({ ...prev, tipo }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, tipo: selectedTipo });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      tipo: row.tipo ?? selectedTipo,
      codigo: row.codigo ?? '',
      nombre: row.nombre ?? '',
      nivel: row.nivel ?? 1,
      padre_id: row.padre_id ?? '',
      activo: row.activo ?? true,
    });
    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const record = {
      ...form,
      ente_id: entePublico?.id,
      padre_id: form.padre_id || null,
      nivel: Number(form.nivel) || 1,
    };

    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...record });
    } else {
      await createMut.mutateAsync(record);
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

  // --- Table columns ---
  const columns = [
    { key: 'codigo', label: 'Codigo', width: '140px' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'nivel', label: 'Nivel', width: '80px' },
    {
      key: 'activo',
      label: 'Estado',
      width: '100px',
      render: (val) => (
        <Badge variant={val ? 'success' : 'default'}>
          {val ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      width: '160px',
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
        <h1 className="text-xl font-bold text-text-primary">Clasificadores Presupuestales</h1>
        <p className="text-sm text-text-muted mt-1">
          Art. 4 &mdash; 7 clasificadores normativos CONAC
        </p>
      </div>

      {/* Tipo tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {TIPOS.map((tipo) => (
          <button
            key={tipo.value}
            onClick={() => handleTabChange(tipo.value)}
            className={[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
              selectedTipo === tipo.value
                ? 'bg-primary text-white'
                : 'bg-white card-shadow text-text-secondary hover:bg-bg-hover',
            ].join(' ')}
          >
            {tipo.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          {tipoLabel}
          <span className="ml-2 text-text-muted font-normal">
            ({clasificadores.length} registros)
          </span>
        </h2>
        <Button onClick={openCreate} size="sm">
          + Nuevo clasificador
        </Button>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando clasificadores...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={clasificadores}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Clasificador' : 'Nuevo Clasificador'}
        size="md"
      >
        <div className="space-y-4">
          {/* Tipo (readonly) */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Tipo de clasificador
            </label>
            <div className="block w-full h-[40px] rounded-md border border-border bg-bg-hover text-text-muted text-[0.9375rem] px-3.5 py-2.5">
              {TIPOS.find((t) => t.value === form.tipo)?.label ?? form.tipo}
            </div>
          </div>

          {/* Codigo */}
          <Input
            label="Codigo"
            value={form.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Ej. 1000, 1.1, F01"
            required
          />

          {/* Nombre */}
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre del clasificador"
            required
          />

          {/* Nivel */}
          <Input
            label="Nivel"
            type="number"
            value={form.nivel}
            onChange={(e) => handleChange('nivel', e.target.value)}
            min={1}
          />

          {/* Padre */}
          <Select
            label="Clasificador padre (opcional)"
            value={form.padre_id}
            onChange={(e) => handleChange('padre_id', e.target.value)}
            placeholder="— Sin padre (nivel raiz) —"
            options={padreOptions}
          />

          {/* Activo */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => handleChange('activo', e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/30 h-4 w-4 cursor-pointer"
            />
            <span className="text-sm text-text-secondary">Activo</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.codigo.trim() || !form.nombre.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear clasificador'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title="Eliminar clasificador"
        message={
          deleteTarget
            ? `¿Esta seguro de eliminar el clasificador "${deleteTarget.codigo} — ${deleteTarget.nombre}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
