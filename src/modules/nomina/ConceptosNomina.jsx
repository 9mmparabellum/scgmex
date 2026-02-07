import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useConceptosNomina } from '../../hooks/useNomina';
import { TIPOS_CONCEPTO_NOMINA } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const emptyForm = {
  clave: '',
  nombre: '',
  tipo: 'percepcion',
  gravado: false,
  activo: true,
};

export default function ConceptosNomina() {
  const { entePublico } = useAppStore();

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: conceptos = [], isLoading } = useConceptosNomina();

  const createMut = useCreate('concepto_nomina');
  const updateMut = useUpdate('concepto_nomina');
  const removeMut = useRemove('concepto_nomina');

  // --- Select options ---
  const tipoOptions = useMemo(
    () =>
      Object.entries(TIPOS_CONCEPTO_NOMINA).map(([value, label]) => ({ value, label })),
    []
  );

  const gravadoOptions = [
    { value: 'true', label: 'Si' },
    { value: 'false', label: 'No' },
  ];

  const activoOptions = [
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' },
  ];

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const tipoBadge = (tipo) => {
    const variants = { percepcion: 'success', deduccion: 'danger' };
    return variants[tipo] || 'default';
  };

  const tipoLabel = (tipo) => TIPOS_CONCEPTO_NOMINA[tipo] || tipo;

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
      tipo: row.tipo ?? 'percepcion',
      gravado: row.gravado ?? false,
      activo: row.activo ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      gravado: form.gravado === true || form.gravado === 'true',
      activo: form.activo === true || form.activo === 'true',
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
  const columns = useMemo(
    () => [
      { key: 'clave', label: 'Clave', width: '120px' },
      { key: 'nombre', label: 'Nombre' },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '130px',
        render: (val) => (
          <Badge variant={tipoBadge(val)}>{tipoLabel(val)}</Badge>
        ),
      },
      {
        key: 'gravado',
        label: 'Gravado',
        width: '100px',
        render: (val) => (val ? 'Si' : 'No'),
      },
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
        width: '140px',
        sortable: false,
        render: (_val, row) => (
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
        ),
      },
    ],
    []
  );

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Conceptos de Nomina</h1>
        <p className="text-sm text-text-muted mt-1">
          Administracion de percepciones y deducciones aplicables en la nomina
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Conceptos
          <span className="ml-2 text-text-muted font-normal">
            ({conceptos.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} size="sm">
            + Nuevo Concepto
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando conceptos de nomina...
        </div>
      ) : (
        <DataTable columns={columns} data={conceptos} onRowClick={openEdit} />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Concepto' : 'Nuevo Concepto'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Clave"
            value={form.clave}
            onChange={(e) => set('clave', e.target.value)}
            placeholder="Ej. P001, D001..."
            required
          />
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Nombre del concepto"
            required
          />
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(e) => set('tipo', e.target.value)}
            options={tipoOptions}
            placeholder="-- Seleccione tipo --"
            required
          />
          <Select
            label="Gravado"
            value={String(form.gravado)}
            onChange={(e) => set('gravado', e.target.value)}
            options={gravadoOptions}
            placeholder="-- Seleccione --"
          />
          <Select
            label="Estado"
            value={String(form.activo)}
            onChange={(e) => set('activo', e.target.value)}
            options={activoOptions}
            placeholder="-- Seleccione estado --"
          />

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
              disabled={!form.clave.trim() || !form.nombre.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear concepto'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar concepto de nomina"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el concepto "${toDelete.clave} — ${toDelete.nombre}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
