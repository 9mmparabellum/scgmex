import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useCuentasBancarias } from '../../hooks/useTesoreria';
import { TIPOS_CUENTA_BANCARIA } from '../../config/constants';
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
  numero_cuenta: '',
  clabe: '',
  banco: '',
  tipo: 'cheques',
  moneda: 'MXN',
  saldo_actual: '',
  responsable: '',
  activo: true,
};

export default function CuentasBancarias() {
  const { entePublico } = useAppStore();

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: cuentas = [], isLoading } = useCuentasBancarias();

  const createMut = useCreate('cuenta_bancaria');
  const updateMut = useUpdate('cuenta_bancaria');
  const removeMut = useRemove('cuenta_bancaria');

  // --- Select options ---
  const tipoCuentaOptions = useMemo(
    () => Object.entries(TIPOS_CUENTA_BANCARIA).map(([value, label]) => ({ value, label })),
    []
  );

  const activoOptions = [
    { value: 'true', label: 'Activa' },
    { value: 'false', label: 'Inactiva' },
  ];

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const tipoBadge = (tipo) => {
    const variants = { cheques: 'primary', inversion: 'info', fideicomiso: 'warning', otro: 'default' };
    return variants[tipo] || 'default';
  };

  const tipoLabel = (tipo) => TIPOS_CUENTA_BANCARIA[tipo] || tipo;

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      numero_cuenta: row.numero_cuenta ?? '',
      clabe: row.clabe ?? '',
      banco: row.banco ?? '',
      tipo: row.tipo ?? 'cheques',
      moneda: row.moneda ?? 'MXN',
      saldo_actual: row.saldo_actual ?? '',
      responsable: row.responsable ?? '',
      activo: row.activo ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      saldo_actual: Number(form.saldo_actual) || 0,
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
      { key: 'numero_cuenta', label: 'No. Cuenta' },
      { key: 'clabe', label: 'CLABE' },
      { key: 'banco', label: 'Banco' },
      { key: 'tipo', label: 'Tipo', getValue: (row) => tipoLabel(row.tipo) },
      { key: 'moneda', label: 'Moneda' },
      { key: 'saldo_actual', label: 'Saldo Actual', getValue: (row) => Number(row.saldo_actual || 0) },
      { key: 'responsable', label: 'Responsable' },
      { key: 'activo', label: 'Estado', getValue: (row) => (row.activo ? 'Activa' : 'Inactiva') },
    ];
    exportToExcel(cuentas, excelCols, 'cuentas_bancarias');
  };

  // --- Table columns ---
  const columns = [
    { key: 'numero_cuenta', label: 'No. Cuenta', width: '150px' },
    { key: 'clabe', label: 'CLABE', width: '180px' },
    { key: 'banco', label: 'Banco' },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '120px',
      render: (val) => (
        <Badge variant={tipoBadge(val)}>
          {tipoLabel(val)}
        </Badge>
      ),
    },
    { key: 'moneda', label: 'Moneda', width: '80px' },
    {
      key: 'saldo_actual',
      label: 'Saldo Actual',
      width: '150px',
      render: (val) => (
        <span className="text-right block tabular-nums">
          {fmtMoney(val)}
        </span>
      ),
    },
    { key: 'responsable', label: 'Responsable', width: '150px' },
    {
      key: 'activo',
      label: 'Estado',
      width: '100px',
      render: (val) => (
        <Badge variant={val ? 'success' : 'default'}>
          {val ? 'Activa' : 'Inactiva'}
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
  ];

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Cuentas Bancarias</h1>
        <p className="text-sm text-text-muted mt-1">
          Administracion de cuentas bancarias del ente publico
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Cuentas
          <span className="ml-2 text-text-muted font-normal">
            ({cuentas.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando cuentas bancarias...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={cuentas}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: No. Cuenta, CLABE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Numero de Cuenta"
              value={form.numero_cuenta}
              onChange={(e) => set('numero_cuenta', e.target.value)}
              placeholder="Ej. 0123456789"
              required
            />
            <Input
              label="CLABE Interbancaria"
              value={form.clabe}
              onChange={(e) => set('clabe', e.target.value)}
              placeholder="18 digitos"
            />
          </div>

          {/* Row 2: Banco, Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Banco"
              value={form.banco}
              onChange={(e) => set('banco', e.target.value)}
              placeholder="Nombre del banco"
              required
            />
            <Select
              label="Tipo de Cuenta"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoCuentaOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
          </div>

          {/* Row 3: Moneda, Saldo Actual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Moneda"
              value={form.moneda}
              onChange={(e) => set('moneda', e.target.value)}
              placeholder="MXN"
            />
            <Input
              label="Saldo Actual"
              type="number"
              value={form.saldo_actual}
              onChange={(e) => set('saldo_actual', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Row 4: Responsable, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Responsable"
              value={form.responsable}
              onChange={(e) => set('responsable', e.target.value)}
              placeholder="Nombre del responsable de la cuenta"
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!form.numero_cuenta.trim() || !form.banco.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear cuenta'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar cuenta bancaria"
        message={
          toDelete
            ? `¿Esta seguro de eliminar la cuenta "${toDelete.numero_cuenta} — ${toDelete.banco}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
