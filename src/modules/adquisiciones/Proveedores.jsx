import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useProveedores } from '../../hooks/useAdquisiciones';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';

const emptyForm = {
  rfc: '',
  razon_social: '',
  nombre_comercial: '',
  domicilio: '',
  telefono: '',
  email: '',
  contacto: '',
  giro: '',
  cuenta_bancaria: '',
  clabe: '',
  banco: '',
  activo: true,
};

export default function Proveedores() {
  const { entePublico } = useAppStore();

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: proveedores = [], isLoading } = useProveedores();

  const createMut = useCreate('proveedor');
  const updateMut = useUpdate('proveedor');
  const removeMut = useRemove('proveedor');

  // --- Select options ---
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
      rfc: row.rfc ?? '',
      razon_social: row.razon_social ?? '',
      nombre_comercial: row.nombre_comercial ?? '',
      domicilio: row.domicilio ?? '',
      telefono: row.telefono ?? '',
      email: row.email ?? '',
      contacto: row.contacto ?? '',
      giro: row.giro ?? '',
      cuenta_bancaria: row.cuenta_bancaria ?? '',
      clabe: row.clabe ?? '',
      banco: row.banco ?? '',
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
      { key: 'razon_social', label: 'Razon Social' },
      { key: 'nombre_comercial', label: 'Nombre Comercial' },
      { key: 'telefono', label: 'Telefono' },
      { key: 'email', label: 'Email' },
      { key: 'contacto', label: 'Contacto' },
      { key: 'giro', label: 'Giro' },
      { key: 'cuenta_bancaria', label: 'Cuenta Bancaria' },
      { key: 'clabe', label: 'CLABE' },
      { key: 'banco', label: 'Banco' },
      { key: 'activo', label: 'Estado', getValue: (row) => (row.activo ? 'Activo' : 'Inactivo') },
    ];
    exportToExcel(proveedores, excelCols, 'proveedores');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'rfc', label: 'RFC', width: '140px' },
      { key: 'razon_social', label: 'Razon Social' },
      { key: 'nombre_comercial', label: 'Nombre Comercial', width: '180px' },
      { key: 'telefono', label: 'Telefono', width: '130px' },
      { key: 'email', label: 'Email', width: '180px' },
      { key: 'giro', label: 'Giro', width: '140px' },
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
    ],
    []
  );

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Proveedores</h1>
        <p className="text-sm text-text-muted mt-1">
          Padron de proveedores del ente publico
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Proveedores
          <span className="ml-2 text-text-muted font-normal">
            ({proveedores.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando proveedores...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={proveedores}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: RFC, Razon Social */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="RFC"
              value={form.rfc}
              onChange={(e) => set('rfc', e.target.value)}
              placeholder="Ej. XAXX010101000"
              required
            />
            <Input
              label="Razon Social"
              value={form.razon_social}
              onChange={(e) => set('razon_social', e.target.value)}
              placeholder="Razon social del proveedor"
              required
            />
          </div>

          {/* Row 2: Nombre Comercial, Giro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Comercial"
              value={form.nombre_comercial}
              onChange={(e) => set('nombre_comercial', e.target.value)}
              placeholder="Nombre comercial"
            />
            <Input
              label="Giro"
              value={form.giro}
              onChange={(e) => set('giro', e.target.value)}
              placeholder="Giro o actividad"
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

          {/* Row 5: Contacto, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contacto"
              value={form.contacto}
              onChange={(e) => set('contacto', e.target.value)}
              placeholder="Nombre de la persona de contacto"
            />
            <Select
              label="Estado"
              value={String(form.activo)}
              onChange={(e) => set('activo', e.target.value)}
              options={activoOptions}
              placeholder="-- Seleccione estado --"
              required
            />
          </div>

          {/* Row 6: Cuenta Bancaria, CLABE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Cuenta Bancaria"
              value={form.cuenta_bancaria}
              onChange={(e) => set('cuenta_bancaria', e.target.value)}
              placeholder="Numero de cuenta"
            />
            <Input
              label="CLABE Interbancaria"
              value={form.clabe}
              onChange={(e) => set('clabe', e.target.value)}
              placeholder="18 digitos"
            />
          </div>

          {/* Row 7: Banco */}
          <Input
            label="Banco"
            value={form.banco}
            onChange={(e) => set('banco', e.target.value)}
            placeholder="Nombre del banco"
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.rfc.trim() || !form.razon_social.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar proveedor"
        message={
          toDelete
            ? `¿Esta seguro de eliminar al proveedor "${toDelete.razon_social}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
