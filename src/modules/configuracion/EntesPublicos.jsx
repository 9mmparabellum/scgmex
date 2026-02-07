import { useState } from 'react';
import { useList, useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { seedPlanCuentasCONAC } from '../../services/catalogoService';
import { supabase } from '../../config/supabase';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const TABLE = 'ente_publico';

const NIVELES = [
  { value: 'federal', label: 'Federal' },
  { value: 'estatal', label: 'Estatal' },
  { value: 'municipal', label: 'Municipal' },
];

const TIPOS_ENTE = [
  { value: 'ejecutivo', label: 'Poder Ejecutivo' },
  { value: 'legislativo', label: 'Poder Legislativo' },
  { value: 'judicial', label: 'Poder Judicial' },
  { value: 'autonomo', label: 'Organo Autonomo' },
  { value: 'paraestatal', label: 'Paraestatal' },
  { value: 'municipio', label: 'Municipio' },
  { value: 'alcaldia', label: 'Alcaldia' },
];

const NIVEL_LABELS = Object.fromEntries(NIVELES.map((n) => [n.value, n.label]));
const TIPO_LABELS = Object.fromEntries(TIPOS_ENTE.map((t) => [t.value, t.label]));

const EMPTY_FORM = {
  clave: '',
  nombre: '',
  nombre_corto: '',
  nivel_gobierno: '',
  tipo_ente: '',
  entidad_federativa: '',
  municipio: '',
  rfc: '',
  domicilio: '',
  titular: '',
  activo: true,
};

const columns = [
  {
    key: 'clave',
    label: 'Clave',
    width: '120px',
  },
  {
    key: 'nombre',
    label: 'Nombre',
  },
  {
    key: 'nivel_gobierno',
    label: 'Nivel de Gobierno',
    width: '160px',
    render: (value) => {
      const variantMap = {
        federal: 'primary',
        estatal: 'info',
        municipal: 'warning',
      };
      return (
        <Badge variant={variantMap[value] || 'default'}>
          {NIVEL_LABELS[value] || value || '--'}
        </Badge>
      );
    },
  },
  {
    key: 'tipo_ente',
    label: 'Tipo de Ente',
    width: '170px',
    render: (value) => TIPO_LABELS[value] || value || '--',
  },
  {
    key: 'entidad_federativa',
    label: 'Entidad Federativa',
    width: '180px',
  },
  {
    key: 'activo',
    label: 'Estado',
    width: '100px',
    render: (value) => (
      <Badge variant={value ? 'success' : 'danger'}>
        {value ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

export default function EntesPublicos() {
  const { data: entes = [], isLoading } = useList(TABLE);
  const createMutation = useCreate(TABLE);
  const updateMutation = useUpdate(TABLE);
  const removeMutation = useRemove(TABLE);

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
      clave: row.clave ?? '',
      nombre: row.nombre ?? '',
      nombre_corto: row.nombre_corto ?? '',
      nivel_gobierno: row.nivel_gobierno ?? '',
      tipo_ente: row.tipo_ente ?? '',
      entidad_federativa: row.entidad_federativa ?? '',
      municipio: row.municipio ?? '',
      rfc: row.rfc ?? '',
      domicilio: row.domicilio ?? '',
      titular: row.titular ?? '',
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
    if (!form.clave.trim()) newErrors.clave = 'La clave es requerida';
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.nivel_gobierno) newErrors.nivel_gobierno = 'Seleccione un nivel de gobierno';
    if (!form.tipo_ente) newErrors.tipo_ente = 'Seleccione un tipo de ente';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      clave: form.clave.trim(),
      nombre: form.nombre.trim(),
      nombre_corto: form.nombre_corto.trim() || null,
      nivel_gobierno: form.nivel_gobierno,
      tipo_ente: form.tipo_ente,
      entidad_federativa: form.entidad_federativa.trim() || null,
      municipio: form.nivel_gobierno === 'municipal' ? (form.municipio.trim() || null) : null,
      rfc: form.rfc.trim() || null,
      domicilio: form.domicilio.trim() || null,
      titular: form.titular.trim() || null,
      activo: form.activo,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
      } else {
        const newEnte = await createMutation.mutateAsync(payload);
        // Auto-seed CONAC Plan de Cuentas for the new ente
        try {
          const count = await seedPlanCuentasCONAC(newEnte.id);
          console.log(`Plan de Cuentas CONAC: ${count} cuentas creadas para ente ${newEnte.clave}`);
        } catch (seedErr) {
          console.error('Error al crear Plan de Cuentas CONAC:', seedErr);
        }
      }
      closeModal();
    } catch {
      // Error handling is managed by react-query; mutation state reflects the error
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      // Delete associated usuarios first (FK without CASCADE)
      await supabase.from('usuarios').delete().eq('ente_id', deleteTarget.id);
      await removeMutation.mutateAsync(deleteTarget.id);
      setConfirmOpen(false);
      setDeleteTarget(null);
    } catch {
      // Error toast is shown by useRemove's onError
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // --- Render ---

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Entes Publicos</h1>
          <p className="text-sm text-text-muted mt-1">
            Administracion del catalogo de entes publicos del sistema
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
          Nuevo Ente
        </Button>
      </div>

      {/* Data table */}
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
            <span className="ml-3 text-sm text-text-muted">Cargando entes publicos...</span>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={entes}
            onRowClick={openEdit}
          />
        )}
      </div>

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Ente Publico' : 'Nuevo Ente Publico'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row: clave + nombre */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Clave *"
              placeholder="Ej. MUN-001"
              value={form.clave}
              onChange={(e) => handleChange('clave', e.target.value)}
              error={errors.clave}
            />
            <div className="md:col-span-2">
              <Input
                label="Nombre completo *"
                placeholder="Nombre oficial del ente publico"
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                error={errors.nombre}
              />
            </div>
          </div>

          {/* Row: nombre_corto + rfc */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre corto"
              placeholder="Nombre abreviado"
              value={form.nombre_corto}
              onChange={(e) => handleChange('nombre_corto', e.target.value)}
            />
            <Input
              label="RFC"
              placeholder="RFC del ente publico"
              value={form.rfc}
              onChange={(e) => handleChange('rfc', e.target.value)}
            />
          </div>

          {/* Row: nivel_gobierno + tipo_ente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Nivel de Gobierno *"
              placeholder="Seleccionar nivel..."
              options={NIVELES}
              value={form.nivel_gobierno}
              onChange={(e) => handleChange('nivel_gobierno', e.target.value)}
              error={errors.nivel_gobierno}
            />
            <Select
              label="Tipo de Ente *"
              placeholder="Seleccionar tipo..."
              options={TIPOS_ENTE}
              value={form.tipo_ente}
              onChange={(e) => handleChange('tipo_ente', e.target.value)}
              error={errors.tipo_ente}
            />
          </div>

          {/* Row: entidad_federativa + municipio (conditional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Entidad Federativa"
              placeholder="Ej. Jalisco, CDMX..."
              value={form.entidad_federativa}
              onChange={(e) => handleChange('entidad_federativa', e.target.value)}
            />
            {form.nivel_gobierno === 'municipal' && (
              <Input
                label="Municipio"
                placeholder="Nombre del municipio"
                value={form.municipio}
                onChange={(e) => handleChange('municipio', e.target.value)}
              />
            )}
          </div>

          {/* Titular */}
          <Input
            label="Titular"
            placeholder="Nombre del titular del ente publico"
            value={form.titular}
            onChange={(e) => handleChange('titular', e.target.value)}
          />

          {/* Domicilio */}
          <div className="w-full">
            <label
              htmlFor="domicilio"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Domicilio
            </label>
            <textarea
              id="domicilio"
              rows={3}
              placeholder="Direccion completa del ente publico"
              value={form.domicilio}
              onChange={(e) => handleChange('domicilio', e.target.value)}
              className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-hover resize-none"
            />
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3">
            <input
              id="activo"
              type="checkbox"
              checked={form.activo}
              onChange={(e) => handleChange('activo', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
            />
            <label
              htmlFor="activo"
              className="text-sm font-medium text-text-secondary cursor-pointer select-none"
            >
              Ente publico activo
            </label>
          </div>

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
                {editing ? 'Guardar Cambios' : 'Crear Ente'}
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
        title="Eliminar Ente Publico"
        message={
          deleteTarget
            ? `Esta seguro de eliminar el ente publico "${deleteTarget.nombre}"? Esta accion no se puede deshacer.`
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
