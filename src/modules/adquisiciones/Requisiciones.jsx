import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useRequisiciones } from '../../hooks/useAdquisiciones';
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

const ESTADOS_REQUISICION = {
  borrador: { label: 'Borrador', variant: 'default' },
  enviada: { label: 'Enviada', variant: 'info' },
  autorizada: { label: 'Autorizada', variant: 'success' },
  en_cotizacion: { label: 'En Cotizacion', variant: 'warning' },
  adjudicada: { label: 'Adjudicada', variant: 'primary' },
  rechazada: { label: 'Rechazada', variant: 'danger' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  numero: '',
  fecha: today(),
  area_solicitante: '',
  justificacion: '',
  monto_estimado: '',
  estado: 'borrador',
};

export default function Requisiciones() {
  const { entePublico, ejercicioFiscal, user } = useAppStore();

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Data hooks ---
  const { data: requisiciones = [], isLoading } = useRequisiciones();

  const createMut = useCreate('requisicion');
  const updateMut = useUpdate('requisicion');
  const removeMut = useRemove('requisicion');

  // --- Select options ---
  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_REQUISICION).map(([value, { label }]) => ({ value, label })),
    []
  );

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const truncate = (text, max = 40) => {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '...' : text;
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
      area_solicitante: row.area_solicitante ?? '',
      justificacion: row.justificacion ?? '',
      monto_estimado: row.monto_estimado ?? '',
      estado: row.estado ?? 'borrador',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      solicitado_por: user?.id,
      monto_estimado: Number(form.monto_estimado) || 0,
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
      { key: 'area_solicitante', label: 'Area Solicitante' },
      { key: 'justificacion', label: 'Justificacion' },
      { key: 'monto_estimado', label: 'Monto Estimado', getValue: (row) => Number(row.monto_estimado || 0) },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_REQUISICION[row.estado]?.label || row.estado },
      { key: 'solicitante', label: 'Solicitante', getValue: (row) => row.solicitante?.nombre || '' },
    ];
    exportToExcel(requisiciones, excelCols, 'requisiciones');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      { key: 'numero', label: 'Numero', width: '100px' },
      { key: 'fecha', label: 'Fecha', width: '110px' },
      { key: 'area_solicitante', label: 'Area Solicitante', width: '180px' },
      {
        key: 'justificacion',
        label: 'Justificacion',
        render: (val) => (
          <span title={val || ''}>{truncate(val)}</span>
        ),
      },
      {
        key: 'monto_estimado',
        label: 'Monto Estimado',
        width: '150px',
        render: (val) => (
          <span className="text-right block tabular-nums">
            {fmtMoney(val)}
          </span>
        ),
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '130px',
        render: (val) => {
          const est = ESTADOS_REQUISICION[val] || { label: val, variant: 'default' };
          return <Badge variant={est.variant}>{est.label}</Badge>;
        },
      },
      {
        key: 'solicitante',
        label: 'Solicitante',
        width: '150px',
        render: (val) => val?.nombre || '',
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
        <h1 className="text-xl font-bold text-text-primary">Requisiciones</h1>
        <p className="text-sm text-text-muted mt-1">
          Solicitudes de compra y requisiciones del ejercicio fiscal
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Requisiciones
          <span className="ml-2 text-text-muted font-normal">
            ({requisiciones.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Nueva Requisicion
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando requisiciones...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={requisiciones}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Requisicion' : 'Nueva Requisicion'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Numero, Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Numero"
              value={form.numero}
              onChange={(e) => set('numero', e.target.value)}
              placeholder="Ej. REQ-001"
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

          {/* Row 2: Area Solicitante, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Area Solicitante"
              value={form.area_solicitante}
              onChange={(e) => set('area_solicitante', e.target.value)}
              placeholder="Area que solicita la compra"
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

          {/* Row 3: Monto Estimado */}
          <Input
            label="Monto Estimado"
            type="number"
            value={form.monto_estimado}
            onChange={(e) => set('monto_estimado', e.target.value)}
            placeholder="0.00"
            required
          />

          {/* Row 4: Justificacion */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Justificacion
            </label>
            <textarea
              value={form.justificacion}
              onChange={(e) => set('justificacion', e.target.value)}
              placeholder="Describa la justificacion de la requisicion"
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
              disabled={!form.numero.trim() || !form.area_solicitante.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear requisicion'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar requisicion"
        message={
          toDelete
            ? `¿Esta seguro de eliminar la requisicion "${toDelete.numero}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
