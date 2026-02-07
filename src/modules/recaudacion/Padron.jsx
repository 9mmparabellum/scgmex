import { useState, useMemo } from 'react';
import { usePadron, useContribuyentes } from '../../hooks/useRecaudacion';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { canEdit } from '../../utils/rbac';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const emptyForm = {
  contribuyente_id: '',
  clave_catastral: '',
  tipo_impuesto: '',
  base_gravable: '',
  tasa: '',
  monto_determinado: '',
  periodo: '',
  activo: true,
};

export default function Padron() {
  const { entePublico, ejercicioFiscal, rol } = useAppStore();
  const editable = canEdit(rol, 'recaudacion');

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: padron = [], isLoading } = usePadron();
  const { data: contribuyentes = [] } = useContribuyentes();

  const createMut = useCreate('padron_fiscal');
  const updateMut = useUpdate('padron_fiscal');
  const removeMut = useRemove('padron_fiscal');

  // --- Select options ---
  const contribuyenteOptions = useMemo(
    () => contribuyentes.map((c) => ({ value: c.id, label: `${c.nombre} (${c.rfc})` })),
    [contribuyentes]
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
      contribuyente_id: row.contribuyente_id ?? '',
      clave_catastral: row.clave_catastral ?? '',
      tipo_impuesto: row.tipo_impuesto ?? '',
      base_gravable: row.base_gravable ?? '',
      tasa: row.tasa ?? '',
      monto_determinado: row.monto_determinado ?? '',
      periodo: row.periodo ?? '',
      activo: row.activo ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      base_gravable: Number(form.base_gravable) || 0,
      tasa: Number(form.tasa) || 0,
      monto_determinado: Number(form.monto_determinado) || 0,
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
      { key: 'clave_catastral', label: 'Clave Catastral' },
      { key: 'contribuyente', label: 'Contribuyente', getValue: (row) => row.contribuyente?.nombre || '' },
      { key: 'contribuyente_rfc', label: 'RFC', getValue: (row) => row.contribuyente?.rfc || '' },
      { key: 'tipo_impuesto', label: 'Tipo Impuesto' },
      { key: 'base_gravable', label: 'Base Gravable', getValue: (row) => Number(row.base_gravable || 0) },
      { key: 'tasa', label: 'Tasa (%)', getValue: (row) => Number(row.tasa || 0) },
      { key: 'monto_determinado', label: 'Monto Determinado', getValue: (row) => Number(row.monto_determinado || 0) },
      { key: 'periodo', label: 'Periodo' },
      { key: 'activo', label: 'Estado', getValue: (row) => (row.activo ? 'Activo' : 'Inactivo') },
    ];
    exportToExcel(padron, excelCols, 'padron_fiscal');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'clave_catastral', label: 'Clave Catastral', width: '150px' },
      {
        key: 'contribuyente',
        label: 'Contribuyente',
        render: (val) => val?.nombre || '',
      },
      { key: 'tipo_impuesto', label: 'Tipo Impuesto', width: '150px' },
      {
        key: 'base_gravable',
        label: 'Base Gravable',
        width: '140px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'tasa',
        label: 'Tasa (%)',
        width: '100px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {Number(val || 0).toFixed(2)}%
          </span>
        ),
      },
      {
        key: 'monto_determinado',
        label: 'Monto',
        width: '140px',
        render: (val) => (
          <span className="text-right block tabular-nums font-semibold">
            {fmtMoney(val)}
          </span>
        ),
      },
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
        <h1 className="text-xl font-bold text-text-primary">Padron Fiscal</h1>
        <p className="text-sm text-text-muted mt-1">
          Registro de obligaciones fiscales de contribuyentes del ejercicio fiscal
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Padron Fiscal
          <span className="ml-2 text-text-muted font-normal">
            ({padron.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          {editable && (
            <Button onClick={openCreate} size="sm">
              + Nuevo Registro
            </Button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando padron fiscal...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={padron}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Registro del Padron' : 'Nuevo Registro del Padron'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Contribuyente, Clave Catastral */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Contribuyente"
              value={form.contribuyente_id}
              onChange={(e) => set('contribuyente_id', e.target.value)}
              options={contribuyenteOptions}
              placeholder="-- Seleccione contribuyente --"
              required
            />
            <Input
              label="Clave Catastral"
              value={form.clave_catastral}
              onChange={(e) => set('clave_catastral', e.target.value)}
              placeholder="Ej. 001-002-003"
              required
            />
          </div>

          {/* Row 2: Tipo Impuesto, Periodo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tipo de Impuesto"
              value={form.tipo_impuesto}
              onChange={(e) => set('tipo_impuesto', e.target.value)}
              placeholder="Ej. Predial, ISR, Agua, etc."
              required
            />
            <Input
              label="Periodo"
              value={form.periodo}
              onChange={(e) => set('periodo', e.target.value)}
              placeholder="Ej. Bimestre 1, Anual, etc."
            />
          </div>

          {/* Row 3: Base Gravable, Tasa, Monto Determinado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Base Gravable"
              type="number"
              value={form.base_gravable}
              onChange={(e) => set('base_gravable', e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label="Tasa (%)"
              type="number"
              value={form.tasa}
              onChange={(e) => set('tasa', e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label="Monto Determinado"
              type="number"
              value={form.monto_determinado}
              onChange={(e) => set('monto_determinado', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Row 4: Estado */}
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
              disabled={!form.contribuyente_id || !form.clave_catastral.trim() || !form.tipo_impuesto.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear registro'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar registro del padron"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el registro con clave catastral "${toDelete.clave_catastral}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
