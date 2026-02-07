import { useState, useMemo } from 'react';
import { useCobros, useContribuyentes } from '../../hooks/useRecaudacion';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { canEdit } from '../../utils/rbac';
import { FORMAS_PAGO, ESTADOS_COBRO } from '../../config/constants';
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

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  contribuyente_id: '',
  concepto: '',
  monto: '',
  forma_pago: 'efectivo',
  referencia: '',
  fecha: today(),
  folio_recibo: '',
  estado: 'pendiente',
  notas: '',
};

export default function Cobros() {
  const { entePublico, ejercicioFiscal, rol } = useAppStore();
  const editable = canEdit(rol, 'recaudacion');

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  // --- Data hooks ---
  const { data: cobros = [], isLoading } = useCobros();
  const { data: contribuyentes = [] } = useContribuyentes();

  const createMut = useCreate('cobro');
  const updateMut = useUpdate('cobro');
  const removeMut = useRemove('cobro');

  // --- Select options ---
  const contribuyenteOptions = useMemo(
    () => contribuyentes.map((c) => ({ value: c.id, label: `${c.nombre} (${c.rfc})` })),
    [contribuyentes]
  );

  const formaPagoOptions = useMemo(
    () => Object.entries(FORMAS_PAGO).map(([value, label]) => ({ value, label })),
    []
  );

  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_COBRO).map(([value, { label }]) => ({ value, label })),
    []
  );

  const filtroEstadoOptions = useMemo(
    () => [
      { value: '', label: 'Todos los estados' },
      ...Object.entries(ESTADOS_COBRO).map(([value, { label }]) => ({ value, label })),
    ],
    []
  );

  // --- Filtered data ---
  const filteredCobros = useMemo(
    () => (filtroEstado ? cobros.filter((c) => c.estado === filtroEstado) : cobros),
    [cobros, filtroEstado]
  );

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fecha: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      contribuyente_id: row.contribuyente_id ?? '',
      concepto: row.concepto ?? '',
      monto: row.monto ?? '',
      forma_pago: row.forma_pago ?? 'efectivo',
      referencia: row.referencia ?? '',
      fecha: row.fecha ?? today(),
      folio_recibo: row.folio_recibo ?? '',
      estado: row.estado ?? 'pendiente',
      notas: row.notas ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      monto: Number(form.monto) || 0,
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
      { key: 'folio_recibo', label: 'Folio' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'contribuyente', label: 'Contribuyente', getValue: (row) => row.contribuyente?.nombre || '' },
      { key: 'contribuyente_rfc', label: 'RFC', getValue: (row) => row.contribuyente?.rfc || '' },
      { key: 'concepto', label: 'Concepto' },
      { key: 'monto', label: 'Monto', getValue: (row) => Number(row.monto || 0) },
      { key: 'forma_pago', label: 'Forma de Pago', getValue: (row) => FORMAS_PAGO[row.forma_pago] || row.forma_pago },
      { key: 'referencia', label: 'Referencia' },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_COBRO[row.estado]?.label || row.estado },
      { key: 'notas', label: 'Notas' },
    ];
    exportToExcel(filteredCobros, excelCols, 'cobros');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'folio_recibo', label: 'Folio', width: '110px' },
      { key: 'fecha', label: 'Fecha', width: '110px' },
      {
        key: 'contribuyente',
        label: 'Contribuyente',
        render: (val) => val?.nombre || '',
      },
      { key: 'concepto', label: 'Concepto', width: '180px' },
      {
        key: 'monto',
        label: 'Monto',
        width: '140px',
        render: (val) => (
          <span className="text-right block tabular-nums font-semibold">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'forma_pago',
        label: 'Forma Pago',
        width: '130px',
        render: (val) => FORMAS_PAGO[val] || val,
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '120px',
        render: (val) => {
          const est = ESTADOS_COBRO[val] || { label: val, variant: 'default' };
          return <Badge variant={est.variant}>{est.label}</Badge>;
        },
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
        <h1 className="text-xl font-bold text-text-primary">Cobros</h1>
        <p className="text-sm text-text-muted mt-1">
          Control de cobros y recaudacion del ejercicio fiscal
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-text-secondary">
            Cobros
            <span className="ml-2 text-text-muted font-normal">
              ({filteredCobros.length} registros)
            </span>
          </h2>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="h-[38px] rounded-md border border-border text-[0.9375rem] px-3 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
          >
            {filtroEstadoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          {editable && (
            <Button onClick={openCreate} size="sm">
              + Nuevo Cobro
            </Button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando cobros...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCobros}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Cobro' : 'Nuevo Cobro'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Contribuyente, Fecha */}
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
              label="Fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => set('fecha', e.target.value)}
              required
            />
          </div>

          {/* Row 2: Folio Recibo, Concepto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Folio de Recibo"
              value={form.folio_recibo}
              onChange={(e) => set('folio_recibo', e.target.value)}
              placeholder="Ej. REC-001"
              required
            />
            <Input
              label="Concepto"
              value={form.concepto}
              onChange={(e) => set('concepto', e.target.value)}
              placeholder="Concepto del cobro"
              required
            />
          </div>

          {/* Row 3: Monto, Forma de Pago, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Monto"
              type="number"
              value={form.monto}
              onChange={(e) => set('monto', e.target.value)}
              placeholder="0.00"
              required
            />
            <Select
              label="Forma de Pago"
              value={form.forma_pago}
              onChange={(e) => set('forma_pago', e.target.value)}
              options={formaPagoOptions}
              placeholder="-- Seleccione forma de pago --"
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

          {/* Row 4: Referencia */}
          <Input
            label="Referencia"
            value={form.referencia}
            onChange={(e) => set('referencia', e.target.value)}
            placeholder="Numero de referencia, cheque, transferencia, etc."
          />

          {/* Row 5: Notas */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Notas
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              placeholder="Observaciones o notas adicionales"
              rows={3}
              className="w-full h-auto rounded-md border border-border text-[0.9375rem] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
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
              disabled={!form.contribuyente_id || !form.concepto.trim() || !form.folio_recibo.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear cobro'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar cobro"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el cobro con folio "${toDelete.folio_recibo}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
