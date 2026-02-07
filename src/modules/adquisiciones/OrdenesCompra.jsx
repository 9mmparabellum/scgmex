import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useOrdenesCompra, useProveedores } from '../../hooks/useAdquisiciones';
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

const ESTADOS_ORDEN_COMPRA = {
  borrador: { label: 'Borrador', variant: 'default' },
  enviada: { label: 'Enviada', variant: 'info' },
  recibida: { label: 'Recibida', variant: 'warning' },
  parcial: { label: 'Parcial', variant: 'warning' },
  completa: { label: 'Completa', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  numero: '',
  fecha: today(),
  proveedor_id: '',
  subtotal: '',
  iva: '',
  total: '',
  estado: 'borrador',
  condiciones_pago: '',
  fecha_entrega: '',
};

export default function OrdenesCompra() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: ordenes = [], isLoading } = useOrdenesCompra();
  const { data: proveedores = [] } = useProveedores();

  const createMut = useCreate('orden_compra');
  const updateMut = useUpdate('orden_compra');
  const removeMut = useRemove('orden_compra');

  // --- Select options ---
  const proveedorOptions = useMemo(
    () => proveedores.filter(p => p.activo !== false).map((p) => ({ value: p.id, label: `${p.razon_social} (${p.rfc})` })),
    [proveedores]
  );

  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_ORDEN_COMPRA).map(([value, { label }]) => ({ value, label })),
    []
  );

  // --- Helpers ---
  const set = (k, v) => {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      // Auto-calculate total when subtotal or iva change
      if (k === 'subtotal' || k === 'iva') {
        const subtotal = Number(k === 'subtotal' ? v : prev.subtotal) || 0;
        const iva = Number(k === 'iva' ? v : prev.iva) || 0;
        next.total = (subtotal + iva).toFixed(2);
      }
      return next;
    });
  };

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fecha: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      numero: row.numero ?? '',
      fecha: row.fecha ?? today(),
      proveedor_id: row.proveedor_id ?? '',
      subtotal: row.subtotal ?? '',
      iva: row.iva ?? '',
      total: row.total ?? '',
      estado: row.estado ?? 'borrador',
      condiciones_pago: row.condiciones_pago ?? '',
      fecha_entrega: row.fecha_entrega ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      subtotal: Number(form.subtotal) || 0,
      iva: Number(form.iva) || 0,
      total: Number(form.total) || 0,
      fecha_entrega: form.fecha_entrega || null,
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
      { key: 'numero', label: 'Numero' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'proveedor', label: 'Proveedor', getValue: (row) => row.proveedor?.razon_social || '' },
      { key: 'subtotal', label: 'Subtotal', getValue: (row) => Number(row.subtotal || 0) },
      { key: 'iva', label: 'IVA', getValue: (row) => Number(row.iva || 0) },
      { key: 'total', label: 'Total', getValue: (row) => Number(row.total || 0) },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_ORDEN_COMPRA[row.estado]?.label || row.estado },
      { key: 'condiciones_pago', label: 'Condiciones de Pago' },
      { key: 'fecha_entrega', label: 'Fecha Entrega' },
    ];
    exportToExcel(ordenes, excelCols, 'ordenes_compra');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'numero', label: 'Numero', width: '100px' },
      { key: 'fecha', label: 'Fecha', width: '110px' },
      {
        key: 'proveedor',
        label: 'Proveedor',
        render: (val) => val?.razon_social || '',
      },
      {
        key: 'subtotal',
        label: 'Subtotal',
        width: '130px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'iva',
        label: 'IVA',
        width: '120px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'total',
        label: 'Total',
        width: '140px',
        render: (val) => (
          <span className="text-right block tabular-nums font-semibold">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '120px',
        render: (val) => {
          const est = ESTADOS_ORDEN_COMPRA[val] || { label: val, variant: 'default' };
          return <Badge variant={est.variant}>{est.label}</Badge>;
        },
      },
      { key: 'fecha_entrega', label: 'Entrega', width: '110px' },
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
        <h1 className="text-xl font-bold text-text-primary">Ordenes de Compra</h1>
        <p className="text-sm text-text-muted mt-1">
          Generacion y seguimiento de ordenes de compra del ejercicio fiscal
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Ordenes de Compra
          <span className="ml-2 text-text-muted font-normal">
            ({ordenes.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Nueva Orden
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando ordenes de compra...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={ordenes}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Numero, Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Numero"
              value={form.numero}
              onChange={(e) => set('numero', e.target.value)}
              placeholder="Ej. OC-001"
              required
            />
            <Input
              label="Fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => set('fecha', e.target.value)}
              required
            />
          </div>

          {/* Row 2: Proveedor, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Proveedor"
              value={form.proveedor_id}
              onChange={(e) => set('proveedor_id', e.target.value)}
              options={proveedorOptions}
              placeholder="-- Seleccione proveedor --"
              required
            />
            <Select
              label="Estado"
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              options={estadoOptions}
              placeholder="-- Seleccione estado --"
              required
            />
          </div>

          {/* Row 3: Subtotal, IVA, Total */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Subtotal"
              type="number"
              value={form.subtotal}
              onChange={(e) => set('subtotal', e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label="IVA"
              type="number"
              value={form.iva}
              onChange={(e) => set('iva', e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label="Total"
              type="number"
              value={form.total}
              onChange={(e) => set('total', e.target.value)}
              placeholder="0.00"
              disabled
            />
          </div>

          {/* Row 4: Condiciones de Pago, Fecha Entrega */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Condiciones de Pago"
              value={form.condiciones_pago}
              onChange={(e) => set('condiciones_pago', e.target.value)}
              placeholder="Ej. 30 dias, contado, etc."
            />
            <Input
              label="Fecha de Entrega"
              type="date"
              value={form.fecha_entrega}
              onChange={(e) => set('fecha_entrega', e.target.value)}
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
              disabled={!form.numero.trim() || !form.proveedor_id}
            >
              {editing ? 'Guardar cambios' : 'Crear orden'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar orden de compra"
        message={
          toDelete
            ? `¿Esta seguro de eliminar la orden "${toDelete.numero}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
