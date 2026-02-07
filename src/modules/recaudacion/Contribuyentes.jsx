import { useState, useMemo } from 'react';
import { useContribuyentes } from '../../hooks/useRecaudacion';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { canEdit } from '../../utils/rbac';
import { TIPOS_CONTRIBUYENTE } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';

const emptyForm = {
  nombre: '',
  rfc: '',
  curp: '',
  tipo: 'persona_fisica',
  domicilio: '',
  telefono: '',
  email: '',
  activo: true,
};

export default function Contribuyentes() {
  const { entePublico, rol } = useAppStore();
  const editable = canEdit(rol, 'recaudacion');

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: contribuyentes = [], isLoading } = useContribuyentes();

  const createMut = useCreate('contribuyente');
  const updateMut = useUpdate('contribuyente');
  const removeMut = useRemove('contribuyente');

  // --- Select options ---
  const tipoOptions = useMemo(
    () => Object.entries(TIPOS_CONTRIBUYENTE).map(([value, label]) => ({ value, label })),
    []
  );

  const activoOptions = [
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' },
  ];

  // --- Helpers ---
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
      nombre: row.nombre ?? '',
      rfc: row.rfc ?? '',
      curp: row.curp ?? '',
      tipo: row.tipo ?? 'persona_fisica',
      domicilio: row.domicilio ?? '',
      telefono: row.telefono ?? '',
      email: row.email ?? '',
      activo: row.activo ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
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

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'rfc', label: 'RFC' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'curp', label: 'CURP' },
      { key: 'tipo', label: 'Tipo', getValue: (row) => TIPOS_CONTRIBUYENTE[row.tipo] || row.tipo },
      { key: 'domicilio', label: 'Domicilio' },
      { key: 'telefono', label: 'Telefono' },
      { key: 'email', label: 'Email' },
      { key: 'activo', label: 'Estado', getValue: (row) => (row.activo ? 'Activo' : 'Inactivo') },
    ];
    exportToExcel(contribuyentes, excelCols, 'contribuyentes');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'rfc', label: 'RFC', width: '140px' },
      { key: 'nombre', label: 'Nombre' },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '150px',
        render: (val) => TIPOS_CONTRIBUYENTE[val] || val,
      },
      { key: 'telefono', label: 'Telefono', width: '130px' },
      { key: 'email', label: 'Email', width: '180px' },
      {
        key: 'activo',
        label: 'Activo',
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
              onClick={(e) => { e.stopPropagation(); openEdit(row); }}
              className="text-xs text-primary hover:text-primary-light transition-colors cursor-pointer"
            >
              Editar
            </button>
            {editable && (
              <button
                onClick={(e) => { e.stopPropagation(); askDelete(row); }}
                className="text-xs text-danger hover:text-danger/80 transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            )}
          </div>
        ),
      },
    ],
    [editable]
  );

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Contribuyentes</h1>
        <p className="text-sm text-text-muted mt-1">
          Padron de contribuyentes del ente publico
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Contribuyentes
          <span className="ml-2 text-text-muted font-normal">
            ({contribuyentes.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          {editable && (
            <Button onClick={openCreate} size="sm">
              + Nuevo Contribuyente
            </Button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando contribuyentes...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={contribuyentes}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Contribuyente' : 'Nuevo Contribuyente'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Nombre, RFC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Nombre completo o razon social"
              required
            />
            <Input
              label="RFC"
              value={form.rfc}
              onChange={(e) => set('rfc', e.target.value)}
              placeholder="Ej. XAXX010101000"
              required
            />
          </div>

          {/* Row 2: CURP, Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CURP"
              value={form.curp}
              onChange={(e) => set('curp', e.target.value)}
              placeholder="CURP (opcional)"
            />
            <Select
              label="Tipo de Contribuyente"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
          </div>

          {/* Row 3: Domicilio */}
          <Input
            label="Domicilio"
            value={form.domicilio}
            onChange={(e) => set('domicilio', e.target.value)}
            placeholder="Direccion completa"
          />

          {/* Row 4: Telefono, Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Telefono"
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              placeholder="Ej. 55 1234 5678"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>

          {/* Row 5: Estado */}
          <Select
            label="Estado"
            value={String(form.activo)}
            onChange={(e) => set('activo', e.target.value)}
            options={activoOptions}
            placeholder="-- Seleccione estado --"
            required
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.nombre.trim() || !form.rfc.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear contribuyente'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar contribuyente"
        message={
          toDelete
            ? `¿Esta seguro de eliminar al contribuyente "${toDelete.nombre}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
