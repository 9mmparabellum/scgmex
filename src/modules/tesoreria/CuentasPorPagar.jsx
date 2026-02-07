import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useCuentasPorPagar, useRegistrarPago } from '../../hooks/useTesoreria';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';
import { ESTADOS_CXP } from '../../config/constants';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = {
  numero_documento: '',
  acreedor: '',
  concepto: '',
  monto_original: '',
  fecha_recepcion: today(),
  fecha_vencimiento: '',
  estado: 'pendiente',
};

export default function CuentasPorPagar() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Pago state ---
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [selectedCxP, setSelectedCxP] = useState(null);
  const [montoPago, setMontoPago] = useState('');

  // --- Data hooks ---
  const { data: cuentas = [], isLoading } = useCuentasPorPagar();

  const createMut = useCreate('cuenta_por_pagar');
  const updateMut = useUpdate('cuenta_por_pagar');
  const removeMut = useRemove('cuenta_por_pagar');
  const pagoMut = useRegistrarPago();

  // --- Select options ---
  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_CXP).map(([value, obj]) => ({ value, label: obj.label })),
    []
  );

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fecha_recepcion: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      numero_documento: row.numero_documento ?? '',
      acreedor: row.acreedor ?? '',
      concepto: row.concepto ?? '',
      monto_original: row.monto_original ?? '',
      fecha_recepcion: row.fecha_recepcion ?? '',
      fecha_vencimiento: row.fecha_vencimiento ?? '',
      estado: row.estado ?? 'pendiente',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      monto_original: Number(form.monto_original) || 0,
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

  // --- Pago handlers ---
  const openPago = (row) => {
    setSelectedCxP(row);
    setMontoPago('');
    setPagoModalOpen(true);
  };

  const handlePago = async () => {
    if (selectedCxP && montoPago) {
      await pagoMut.mutateAsync({
        cxpId: selectedCxP.id,
        montoPago: Number(montoPago),
      });
    }
    setPagoModalOpen(false);
    setSelectedCxP(null);
    setMontoPago('');
  };

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'numero_documento', label: 'No. Documento' },
      { key: 'acreedor', label: 'Acreedor' },
      { key: 'concepto', label: 'Concepto' },
      { key: 'monto_original', label: 'Monto Original', getValue: (row) => Number(row.monto_original || 0) },
      { key: 'monto_pagado', label: 'Monto Pagado', getValue: (row) => Number(row.monto_pagado || 0) },
      { key: 'saldo_pendiente', label: 'Saldo Pendiente', getValue: (row) => Number(row.saldo_pendiente || 0) },
      { key: 'fecha_recepcion', label: 'Fecha Recepcion' },
      { key: 'fecha_vencimiento', label: 'Fecha Vencimiento' },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_CXP[row.estado]?.label || row.estado },
    ];
    exportToExcel(cuentas, excelCols, 'cuentas_por_pagar');
  };

  // --- Table columns ---
  const columns = [
    { key: 'numero_documento', label: 'No. Documento', width: '130px' },
    { key: 'acreedor', label: 'Acreedor' },
    { key: 'concepto', label: 'Concepto' },
    {
      key: 'monto_original',
      label: 'Monto Original',
      width: '140px',
      render: (val) => (
        <span className="text-right block tabular-nums">
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'monto_pagado',
      label: 'Pagado',
      width: '130px',
      render: (val) => (
        <span className="text-right block tabular-nums">
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'saldo_pendiente',
      label: 'Saldo Pendiente',
      width: '140px',
      render: (val) => (
        <span className="text-right block tabular-nums font-bold">
          {fmtMoney(val)}
        </span>
      ),
    },
    { key: 'fecha_recepcion', label: 'Recepcion', width: '110px' },
    { key: 'fecha_vencimiento', label: 'Vencimiento', width: '110px' },
    {
      key: 'estado',
      label: 'Estado',
      width: '120px',
      render: (val) => {
        const cfg = ESTADOS_CXP[val];
        return (
          <Badge variant={cfg?.variant || 'default'}>
            {cfg?.label || val}
          </Badge>
        );
      },
    },
    {
      key: 'id',
      label: 'Acciones',
      width: '200px',
      sortable: false,
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          {(row.estado === 'pendiente' || row.estado === 'parcial') && (
            <button
              onClick={(e) => { e.stopPropagation(); openPago(row); }}
              className="text-xs text-success hover:text-success/80 transition-colors cursor-pointer"
            >
              Pagar
            </button>
          )}
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
        <h1 className="text-xl font-bold text-text-primary">Cuentas por Pagar</h1>
        <p className="text-sm text-text-muted mt-1">
          Control de cuentas por pagar del ente publico
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Cuentas por Pagar
          <span className="ml-2 text-text-muted font-normal">
            ({cuentas.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Nueva CxP
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando cuentas por pagar...
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
        title={editing ? 'Editar Cuenta por Pagar' : 'Nueva Cuenta por Pagar'}
        size="md"
      >
        <div className="space-y-4">
          {/* Row 1: No. Documento, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="No. Documento"
              value={form.numero_documento}
              onChange={(e) => set('numero_documento', e.target.value)}
              placeholder="Ej. CXP-001"
              required
            />
            <Select
              label="Estado"
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              options={estadoOptions}
              placeholder="— Seleccione estado —"
              required
            />
          </div>

          {/* Acreedor */}
          <Input
            label="Acreedor"
            value={form.acreedor}
            onChange={(e) => set('acreedor', e.target.value)}
            placeholder="Nombre del acreedor o proveedor"
            required
          />

          {/* Concepto */}
          <Input
            label="Concepto"
            value={form.concepto}
            onChange={(e) => set('concepto', e.target.value)}
            placeholder="Concepto de la cuenta por pagar"
            required
          />

          {/* Monto Original */}
          <Input
            label="Monto Original"
            type="number"
            value={form.monto_original}
            onChange={(e) => set('monto_original', e.target.value)}
            placeholder="0.00"
            required
          />

          {/* Row: Fecha Recepcion, Fecha Vencimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Recepcion"
              type="date"
              value={form.fecha_recepcion}
              onChange={(e) => set('fecha_recepcion', e.target.value)}
              required
            />
            <Input
              label="Fecha Vencimiento"
              type="date"
              value={form.fecha_vencimiento}
              onChange={(e) => set('fecha_vencimiento', e.target.value)}
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
              disabled={!form.numero_documento.trim() || !form.acreedor.trim() || !form.monto_original}
            >
              {editing ? 'Guardar cambios' : 'Crear cuenta'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pago modal */}
      <Modal
        open={pagoModalOpen}
        onClose={() => { setPagoModalOpen(false); setSelectedCxP(null); setMontoPago(''); }}
        title="Registrar Pago"
        size="sm"
      >
        <div className="space-y-4">
          {selectedCxP && (
            <div className="bg-[#f9fafb] rounded-lg p-3 space-y-1">
              <p className="text-sm text-text-secondary">
                <span className="font-medium">Documento:</span> {selectedCxP.numero_documento}
              </p>
              <p className="text-sm text-text-secondary">
                <span className="font-medium">Acreedor:</span> {selectedCxP.acreedor}
              </p>
              <p className="text-sm text-text-secondary">
                <span className="font-medium">Saldo pendiente:</span>{' '}
                <span className="font-bold">{fmtMoney(selectedCxP.saldo_pendiente)}</span>
              </p>
            </div>
          )}

          <Input
            label="Monto a Pagar"
            type="number"
            value={montoPago}
            onChange={(e) => setMontoPago(e.target.value)}
            placeholder="0.00"
            required
          />

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => { setPagoModalOpen(false); setSelectedCxP(null); setMontoPago(''); }}
              disabled={pagoMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePago}
              loading={pagoMut.isPending}
              disabled={!montoPago || Number(montoPago) <= 0}
            >
              Registrar Pago
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar cuenta por pagar"
        message={
          toDelete
            ? `¿Esta seguro de eliminar la cuenta "${toDelete.numero_documento} — ${toDelete.acreedor}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
