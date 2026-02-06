import { useState, useMemo } from 'react';
import { useList, useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const emptyForm = {
  clave: '',
  descripcion: '',
  clasificador_id: '',
  activo: true,
};

export default function ConceptosIngreso() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Data hooks ---
  const { data: conceptos = [], isLoading } = useList('concepto_ingreso', {
    filter: { ente_id: entePublico?.id, ejercicio_id: ejercicioFiscal?.id },
  });

  const { data: clasificadorList = [] } = useList('clasificador_presupuestal', {
    filter: { ente_id: entePublico?.id, tipo: 'clasificador_ingreso' },
  });

  const createMut = useCreate('concepto_ingreso');
  const updateMut = useUpdate('concepto_ingreso');
  const removeMut = useRemove('concepto_ingreso');

  // --- Lookup maps ---
  const clasificadorMap = useMemo(() => {
    const map = {};
    clasificadorList.forEach((c) => { map[c.id] = c; });
    return map;
  }, [clasificadorList]);

  // --- Select options ---
  const clasificadorOptions = useMemo(
    () => clasificadorList.map((c) => ({ value: c.id, label: `${c.codigo} — ${c.nombre}` })),
    [clasificadorList]
  );

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
      clasificador_id: row.clasificador_id ?? '',
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
      ejercicio_id: ejercicioFiscal?.id,
      clasificador_id: form.clasificador_id || null,
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
    { key: 'clave', label: 'Clave', width: '120px' },
    { key: 'descripcion', label: 'Descripcion' },
    {
      key: 'clasificador_id',
      label: 'Clasificador',
      width: '200px',
      render: (val) => {
        const clasificador = clasificadorMap[val];
        return clasificador ? `${clasificador.codigo} — ${clasificador.nombre}` : '\u2014';
      },
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
        <h1 className="text-xl font-bold text-text-primary">Conceptos de Ingreso</h1>
        <p className="text-sm text-text-muted mt-1">
          Catalogo de conceptos de ingreso del ejercicio fiscal
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
        <Button onClick={openCreate} size="sm">
          + Nuevo Concepto
        </Button>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando conceptos de ingreso...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={conceptos}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Concepto' : 'Nuevo Concepto'}
        size="md"
      >
        <div className="space-y-4">
          {/* Clave */}
          <Input
            label="Clave"
            value={form.clave}
            onChange={(e) => handleChange('clave', e.target.value)}
            placeholder="Ej. I001, 4100"
            required
          />

          {/* Descripcion */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Descripcion <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripcion del concepto de ingreso"
              rows={3}
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda resize-none"
            />
          </div>

          {/* Clasificador */}
          <Select
            label="Clasificador de Ingreso"
            value={form.clasificador_id}
            onChange={(e) => handleChange('clasificador_id', e.target.value)}
            placeholder="— Seleccione un clasificador —"
            options={clasificadorOptions}
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
              disabled={!form.clave.trim() || !form.descripcion.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear concepto'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title="Eliminar concepto"
        message={
          deleteTarget
            ? `¿Esta seguro de eliminar el concepto "${deleteTarget.clave} — ${deleteTarget.descripcion}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
