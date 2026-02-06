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

const ESTADO_OPTIONS = [
  { value: 'abierto', label: 'Abierto' },
  { value: 'en_cierre', label: 'En Cierre' },
  { value: 'cerrado', label: 'Cerrado' },
];

const ESTADO_BADGE_MAP = {
  abierto: 'success',
  en_cierre: 'warning',
  cerrado: 'danger',
};

const ESTADO_LABEL_MAP = {
  abierto: 'Abierto',
  en_cierre: 'En Cierre',
  cerrado: 'Cerrado',
};

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
  'Ajustes',
];

const INITIAL_FORM = {
  anio: new Date().getFullYear(),
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'abierto',
};

function buildPeriodos(ejercicioId, anio) {
  const periodos = [];
  for (let i = 1; i <= 13; i++) {
    if (i <= 12) {
      const start = new Date(anio, i - 1, 1);
      const end = new Date(anio, i, 0); // last day of month
      periodos.push({
        ejercicio_id: ejercicioId,
        numero: i,
        nombre: MESES[i - 1],
        fecha_inicio: start.toISOString().slice(0, 10),
        fecha_fin: end.toISOString().slice(0, 10),
        estado: 'cerrado',
      });
    } else {
      // Periodo 13: Ajustes — covers Dec 31 to Dec 31
      periodos.push({
        ejercicio_id: ejercicioId,
        numero: 13,
        nombre: 'Ajustes',
        fecha_inicio: `${anio}-12-31`,
        fecha_fin: `${anio}-12-31`,
        estado: 'cerrado',
      });
    }
  }
  return periodos;
}

export default function EjerciciosFiscales() {
  const { entePublico } = useAppStore();

  // ---- CRUD hooks ----
  const { data: ejercicios = [], isLoading } = useList('ejercicio_fiscal', {
    filter: { ente_id: entePublico?.id },
    order: { column: 'anio', ascending: false },
  });

  const createEjercicio = useCreate('ejercicio_fiscal');
  const updateEjercicio = useUpdate('ejercicio_fiscal');
  const removeEjercicio = useRemove('ejercicio_fiscal');
  const createPeriodo = useCreate('periodo_contable');

  // ---- UI state ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = creating, object = editing
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // ---- Helpers ----
  const openCreate = () => {
    setEditing(null);
    setForm(INITIAL_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      anio: row.anio,
      fecha_inicio: row.fecha_inicio ?? '',
      fecha_fin: row.fecha_fin ?? '',
      estado: row.estado ?? 'abierto',
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(INITIAL_FORM);
    setErrors({});
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.anio || isNaN(Number(form.anio))) {
      newErrors.anio = 'El anio es requerido y debe ser un numero valido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        // Update existing
        await updateEjercicio.mutateAsync({
          id: editing.id,
          anio: Number(form.anio),
          fecha_inicio: form.fecha_inicio || null,
          fecha_fin: form.fecha_fin || null,
          estado: form.estado,
        });
      } else {
        // Create new ejercicio
        const newEjercicio = await createEjercicio.mutateAsync({
          ente_id: entePublico?.id,
          anio: Number(form.anio),
          fecha_inicio: form.fecha_inicio || `${form.anio}-01-01`,
          fecha_fin: form.fecha_fin || `${form.anio}-12-31`,
          estado: form.estado,
        });

        // Auto-generate 13 periodos contables
        const periodos = buildPeriodos(newEjercicio.id, Number(form.anio));
        for (const periodo of periodos) {
          await createPeriodo.mutateAsync(periodo);
        }
      }
      closeModal();
    } catch (err) {
      console.error('Error al guardar ejercicio fiscal:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await removeEjercicio.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error al eliminar ejercicio fiscal:', err);
    }
  };

  // ---- Columns ----
  const columns = [
    {
      key: 'anio',
      label: 'Anio',
      width: '100px',
    },
    {
      key: 'fecha_inicio',
      label: 'Fecha Inicio',
    },
    {
      key: 'fecha_fin',
      label: 'Fecha Fin',
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <Badge variant={ESTADO_BADGE_MAP[value] || 'default'}>
          {ESTADO_LABEL_MAP[value] || value}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            className="text-xs text-primary hover:text-primary-light font-medium transition-colors cursor-pointer"
          >
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(row);
            }}
            className="text-xs text-danger hover:text-danger/80 font-medium transition-colors cursor-pointer"
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  // ---- Guard: no ente selected ----
  if (!entePublico?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">
          Seleccione un ente publico para ver los ejercicios fiscales.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Ejercicios Fiscales</h1>
          <p className="text-sm text-text-muted mt-1">
            Administracion de ejercicios fiscales para {entePublico?.nombre}
          </p>
        </div>
        <Button onClick={openCreate}>Nuevo Ejercicio</Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg card-shadow p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
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
            <span className="ml-3 text-text-muted text-sm">Cargando ejercicios...</span>
          </div>
        ) : (
          <DataTable columns={columns} data={ejercicios} />
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Ejercicio Fiscal' : 'Nuevo Ejercicio Fiscal'}
      >
        <div className="space-y-4">
          <Input
            label="Anio"
            type="number"
            value={form.anio}
            onChange={(e) => handleChange('anio', e.target.value)}
            error={errors.anio}
            min={2000}
            max={2100}
            required
          />

          <Input
            label="Fecha Inicio"
            type="date"
            value={form.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
          />

          <Input
            label="Fecha Fin"
            type="date"
            value={form.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
          />

          <Select
            label="Estado"
            value={form.estado}
            onChange={(e) => handleChange('estado', e.target.value)}
            options={ESTADO_OPTIONS}
          />

          {!editing && (
            <p className="text-xs text-text-muted border-l-2 border-info pl-3">
              Al crear el ejercicio fiscal se generaran automaticamente 13 periodos contables
              (Enero a Diciembre mas periodo de Ajustes).
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Guardar Cambios' : 'Crear Ejercicio'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Ejercicio Fiscal"
        message={
          confirmDelete
            ? `Esta seguro de eliminar el ejercicio fiscal ${confirmDelete.anio}? Esta accion no se puede deshacer y eliminara todos los periodos contables asociados.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeEjercicio.isPending}
      />
    </div>
  );
}
