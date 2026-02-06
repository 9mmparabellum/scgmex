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

const TABLE = 'usuarios';
const LS_KEY = 'scgmex_usuarios';

const ROL_OPTIONS = [
  { value: 'super_admin', label: 'Super Administrador' },
  { value: 'admin_ente', label: 'Administrador de Ente' },
  { value: 'contador_general', label: 'Contador General' },
  { value: 'contador', label: 'Contador' },
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'tesorero', label: 'Tesorero' },
  { value: 'patrimonio', label: 'Patrimonio' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'transparencia', label: 'Transparencia' },
  { value: 'consulta', label: 'Solo Consulta' },
];

const ROL_LABEL_MAP = Object.fromEntries(ROL_OPTIONS.map((r) => [r.value, r.label]));

const ROL_BADGE_MAP = {
  super_admin: 'danger',
  admin_ente: 'warning',
  contador_general: 'primary',
  contador: 'info',
  presupuesto: 'info',
  tesorero: 'warning',
  patrimonio: 'primary',
  auditor: 'danger',
  transparencia: 'success',
  consulta: 'default',
};

const MOCK_USERS = [
  { id: '1', nombre: 'Administrador General', email: 'admin@scgmex.gob.mx', rol: 'super_admin', activo: true },
  { id: '2', nombre: 'Maria Lopez', email: 'maria.lopez@scgmex.gob.mx', rol: 'contador_general', activo: true },
  { id: '3', nombre: 'Juan Perez', email: 'juan.perez@scgmex.gob.mx', rol: 'presupuesto', activo: true },
];

const EMPTY_FORM = {
  nombre: '',
  email: '',
  rol: '',
  activo: true,
};

// Seed mock users if localStorage is empty
function seedIfEmpty() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored || JSON.parse(stored).length === 0) {
      localStorage.setItem(LS_KEY, JSON.stringify(MOCK_USERS));
    }
  } catch {
    localStorage.setItem(LS_KEY, JSON.stringify(MOCK_USERS));
  }
}

// Run seed on module load
seedIfEmpty();

const columns = [
  {
    key: 'nombre',
    label: 'Nombre',
  },
  {
    key: 'email',
    label: 'Email',
    render: (value) => (
      <span className="font-mono text-xs text-text-secondary">{value || '--'}</span>
    ),
  },
  {
    key: 'rol',
    label: 'Rol',
    width: '200px',
    render: (value) => (
      <Badge variant={ROL_BADGE_MAP[value] || 'default'}>
        {ROL_LABEL_MAP[value] || value || '--'}
      </Badge>
    ),
  },
  {
    key: 'activo',
    label: 'Estado',
    width: '120px',
    render: (value) => (
      <Badge variant={value ? 'success' : 'danger'}>
        {value ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

export default function Usuarios() {
  const { rol: currentUserRol } = useAppStore();

  // CRUD hooks — uses localStorage fallback via dataService
  const { data: usuarios = [], isLoading } = useList(TABLE, {
    order: { column: 'nombre', ascending: true },
  });
  const createMutation = useCreate(TABLE);
  const updateMutation = useUpdate(TABLE);
  const removeMutation = useRemove(TABLE);

  // UI state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Helpers ---

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      nombre: row.nombre ?? '',
      email: row.email ?? '',
      rol: row.rol ?? '',
      activo: row.activo ?? true,
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        newErrors.email = 'Ingrese un email valido';
      }
    }
    if (!form.rol) newErrors.rol = 'Seleccione un rol';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      rol: form.rol,
      activo: form.activo,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch {
      // Error handling managed by react-query mutation state
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeMutation.mutateAsync(deleteTarget.id);
      setConfirmOpen(false);
      setDeleteTarget(null);
    } catch {
      // Error handling managed by react-query
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Gestion de Usuarios</h1>
          <p className="text-sm text-text-muted mt-1">
            Art. 84 — Control de acceso basado en roles (RBAC)
          </p>
        </div>
        <Button onClick={openNew}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Nuevo Usuario
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-info/5 border border-info/20 rounded-lg p-3 mb-4 flex items-start gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-info flex-shrink-0 mt-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-xs text-text-secondary">
          Los usuarios se gestionan localmente mientras se integra la autenticacion con Supabase Auth.
          Los datos se almacenan en el navegador (localStorage).
        </p>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg card-shadow p-5">
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
            <span className="ml-3 text-sm text-text-muted">Cargando usuarios...</span>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={usuarios}
            onRowClick={openEdit}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre *"
            placeholder="Nombre completo del usuario"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            error={errors.nombre}
          />

          <Input
            label="Email *"
            type="email"
            placeholder="correo@ejemplo.gob.mx"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
          />

          <Select
            label="Rol *"
            placeholder="Seleccionar rol..."
            options={ROL_OPTIONS}
            value={form.rol}
            onChange={(e) => handleChange('rol', e.target.value)}
            error={errors.rol}
          />

          {/* Activo checkbox */}
          <div className="flex items-center gap-3">
            <input
              id="usuario-activo"
              type="checkbox"
              checked={form.activo}
              onChange={(e) => handleChange('activo', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
            />
            <label
              htmlFor="usuario-activo"
              className="text-sm font-medium text-text-secondary cursor-pointer select-none"
            >
              Usuario activo
            </label>
          </div>

          {/* Role description */}
          {form.rol && (
            <div className="bg-bg-hover rounded-md p-3">
              <p className="text-xs text-text-muted">
                <span className="font-semibold text-text-secondary">Rol seleccionado: </span>
                {ROL_LABEL_MAP[form.rol]}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {form.rol === 'super_admin' && 'Acceso total al sistema. Puede gestionar todos los entes, usuarios y configuraciones.'}
                {form.rol === 'admin_ente' && 'Administrador de un ente publico especifico. Puede gestionar usuarios y configuraciones del ente.'}
                {form.rol === 'contador_general' && 'Acceso a todos los modulos contables. Puede registrar y aprobar polizas.'}
                {form.rol === 'contador' && 'Acceso a modulos contables asignados. Puede registrar polizas.'}
                {form.rol === 'presupuesto' && 'Gestion del presupuesto de ingresos y egresos.'}
                {form.rol === 'tesorero' && 'Gestion de fondos, bancos y conciliaciones bancarias.'}
                {form.rol === 'patrimonio' && 'Gestion de bienes muebles e inmuebles del ente.'}
                {form.rol === 'auditor' && 'Acceso de solo lectura a todos los modulos para auditoria.'}
                {form.rol === 'transparencia' && 'Acceso a reportes y generacion de informes de transparencia.'}
                {form.rol === 'consulta' && 'Acceso de solo lectura a modulos autorizados.'}
              </p>
            </div>
          )}

          {/* Error feedback from mutations */}
          {(createMutation.isError || updateMutation.isError) && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger/5 text-sm text-danger">
              Ocurrio un error al guardar. Por favor intente de nuevo.
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {editing && (
                <Button
                  variant="danger"
                  type="button"
                  size="sm"
                  onClick={() => handleDeleteClick(editing)}
                >
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" type="button" onClick={closeModal} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" loading={isSaving}>
                {editing ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Eliminar Usuario"
        message={
          deleteTarget
            ? `Esta seguro de eliminar al usuario "${deleteTarget.nombre}" (${deleteTarget.email})? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={removeMutation.isPending}
      />
    </div>
  );
}
