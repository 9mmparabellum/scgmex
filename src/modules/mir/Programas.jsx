import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgramas } from '../../hooks/useMIR';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { TIPOS_PROGRAMA } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const TIPO_BADGE_MAP = {
  programa: 'primary',
  proyecto: 'info',
  actividad: 'warning',
};

const emptyForm = {
  clave: '',
  nombre: '',
  objetivo: '',
  tipo: '',
  responsable: '',
  activo: true,
};

const tipoOptions = Object.entries(TIPOS_PROGRAMA).map(([value, label]) => ({
  value,
  label,
}));

export default function Programas() {
  const navigate = useNavigate();
  const { entePublico, ejercicioFiscal } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Data hooks ---
  const { data: programas = [], isLoading } = useProgramas();

  const createMut = useCreate('programa_presupuestario');
  const updateMut = useUpdate('programa_presupuestario');
  const removeMut = useRemove('programa_presupuestario');

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
      objetivo: row.objetivo ?? '',
      tipo: row.tipo ?? '',
      responsable: row.responsable ?? '',
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
    setModalOpen(false);
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
        <Badge variant={TIPO_BADGE_MAP[val] || 'default'}>
          {TIPOS_PROGRAMA[val] || val || '\u2014'}
        </Badge>
      ),
    },
    {
      key: 'clasificador',
      label: 'Clasificador',
      width: '160px',
      render: (val) => (val?.codigo ? val.codigo : '\u2014'),
    },
    { key: 'responsable', label: 'Responsable', width: '180px' },
    {
      key: 'activo',
      label: 'Activo',
      width: '100px',
      render: (val) => (
        <Badge variant={val ? 'success' : 'danger'}>
          {val ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      width: '180px',
      sortable: false,
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/mir/${row.id}`);
            }}
            className="text-xs text-info hover:text-info/80 transition-colors cursor-pointer"
          >
            Ver MIR
          </button>
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
  ];

  const isSaving = createMut.isPending || updateMut.isPending;

  // Guard: no context selected
  if (!entePublico?.id || !ejercicioFiscal?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">
          Seleccione un ente publico y ejercicio fiscal para ver los programas presupuestarios.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Programas Presupuestarios</h1>
        <p className="text-sm text-text-muted mt-1">
          Catalogo de programas para PbR-SED y MIR
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Programas
          <span className="ml-2 text-text-muted font-normal">
            ({programas.length} registros)
          </span>
        </h2>
        <Button onClick={openCreate} size="sm">
          + Nuevo Programa
        </Button>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          <svg className="animate-spin h-5 w-5 mr-3 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando programas presupuestarios...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={programas}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Programa' : 'Nuevo Programa'}
        size="md"
      >
        <div className="space-y-4">
          {/* Clave */}
          <Input
            label="Clave"
            value={form.clave}
            onChange={(e) => handleChange('clave', e.target.value)}
            placeholder="Ej. E001, S001"
          />

          {/* Nombre */}
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre del programa presupuestario"
          />

          {/* Objetivo */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Objetivo
            </label>
            <textarea
              value={form.objetivo}
              onChange={(e) => handleChange('objetivo', e.target.value)}
              placeholder="Objetivo del programa presupuestario"
              rows={3}
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda resize-none"
            />
          </div>

          {/* Tipo */}
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            placeholder="-- Seleccione tipo --"
            options={tipoOptions}
          />

          {/* Responsable */}
          <Input
            label="Responsable"
            value={form.responsable}
            onChange={(e) => handleChange('responsable', e.target.value)}
            placeholder="Nombre del responsable del programa"
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

          {/* Delete button (only when editing) */}
          {editing && (
            <div className="pt-2 border-t border-border">
              <Button
                variant="danger"
                size="sm"
                onClick={() => askDelete(editing)}
              >
                Eliminar programa
              </Button>
            </div>
          )}

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
              {editing ? 'Guardar cambios' : 'Crear programa'}
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
        title="Eliminar programa"
        message={
          deleteTarget
            ? `¿Esta seguro de eliminar el programa "${deleteTarget.clave} — ${deleteTarget.nombre}"? Se eliminaran tambien sus indicadores y avances asociados. Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
