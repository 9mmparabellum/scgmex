import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useCFDIEmitidos } from '../../hooks/useCFDI';
import { canEdit } from '../../utils/rbac';
import { TIPOS_CFDI, ESTADOS_CFDI, USOS_CFDI, METODOS_PAGO_CFDI } from '../../config/constants';
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
  serie: '',
  folio: '',
  uuid: '',
  fecha_emision: today(),
  receptor_rfc: '',
  receptor_nombre: '',
  uso_cfdi: 'G03',
  tipo: 'ingreso',
  metodo_pago: 'PUE',
  subtotal: '',
  iva: '',
  total: '',
  estado: 'vigente',
  notas: '',
};

export default function CFDIEmitidos() {
  const { entePublico, ejercicioFiscal, rol } = useAppStore();
  const editable = canEdit(rol, 'cfdi');

  // --- CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // --- Data hooks ---
  const { data: cfdiEmitidos = [], isLoading } = useCFDIEmitidos();

  const createMut = useCreate('cfdi_emitido');
  const updateMut = useUpdate('cfdi_emitido');
  const removeMut = useRemove('cfdi_emitido');

  // --- Select options ---
  const tipoOptions = useMemo(
    () => Object.entries(TIPOS_CFDI).map(([value, label]) => ({ value, label })),
    []
  );

  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_CFDI).map(([value, { label }]) => ({ value, label })),
    []
  );

  const usoCfdiOptions = useMemo(
    () => Object.entries(USOS_CFDI).map(([value, label]) => ({ value, label: `${value} - ${label}` })),
    []
  );

  const metodoPagoOptions = useMemo(
    () => Object.entries(METODOS_PAGO_CFDI).map(([value, label]) => ({ value, label: `${value} - ${label}` })),
    []
  );

  const filtroTipoOptions = useMemo(
    () => [
      { value: '', label: 'Todos los tipos' },
      ...Object.entries(TIPOS_CFDI).map(([value, label]) => ({ value, label })),
    ],
    []
  );

  const filtroEstadoOptions = useMemo(
    () => [
      { value: '', label: 'Todos los estados' },
      ...Object.entries(ESTADOS_CFDI).map(([value, { label }]) => ({ value, label })),
    ],
    []
  );

  // --- Filtered data ---
  const filteredData = useMemo(() => {
    let result = cfdiEmitidos;
    if (filtroTipo) result = result.filter((c) => c.tipo === filtroTipo);
    if (filtroEstado) result = result.filter((c) => c.estado === filtroEstado);
    return result;
  }, [cfdiEmitidos, filtroTipo, filtroEstado]);

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => {
    const next = { ...prev, [k]: v };
    // Auto-calc total when subtotal or iva change
    if (k === 'subtotal' || k === 'iva') {
      const subtotal = Number(k === 'subtotal' ? v : next.subtotal) || 0;
      const iva = Number(k === 'iva' ? v : next.iva) || 0;
      next.total = (subtotal + iva).toFixed(2);
    }
    return next;
  });

  const truncateUUID = (uuid) => {
    if (!uuid) return '';
    return uuid.length > 12 ? uuid.slice(0, 8) + '...' : uuid;
  };

  // --- Handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fecha_emision: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      serie: row.serie ?? '',
      folio: row.folio ?? '',
      uuid: row.uuid ?? '',
      fecha_emision: row.fecha_emision ?? today(),
      receptor_rfc: row.receptor_rfc ?? '',
      receptor_nombre: row.receptor_nombre ?? '',
      uso_cfdi: row.uso_cfdi ?? 'G03',
      tipo: row.tipo ?? 'ingreso',
      metodo_pago: row.metodo_pago ?? 'PUE',
      subtotal: row.subtotal ?? '',
      iva: row.iva ?? '',
      total: row.total ?? '',
      estado: row.estado ?? 'vigente',
      notas: row.notas ?? '',
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
      { key: 'serie', label: 'Serie' },
      { key: 'folio', label: 'Folio' },
      { key: 'uuid', label: 'UUID' },
      { key: 'fecha_emision', label: 'Fecha Emision' },
      { key: 'receptor_rfc', label: 'Receptor RFC' },
      { key: 'receptor_nombre', label: 'Receptor Nombre' },
      { key: 'uso_cfdi', label: 'Uso CFDI', getValue: (row) => USOS_CFDI[row.uso_cfdi] || row.uso_cfdi },
      { key: 'tipo', label: 'Tipo', getValue: (row) => TIPOS_CFDI[row.tipo] || row.tipo },
      { key: 'metodo_pago', label: 'Metodo Pago', getValue: (row) => METODOS_PAGO_CFDI[row.metodo_pago] || row.metodo_pago },
      { key: 'subtotal', label: 'Subtotal', getValue: (row) => Number(row.subtotal || 0) },
      { key: 'iva', label: 'IVA', getValue: (row) => Number(row.iva || 0) },
      { key: 'total', label: 'Total', getValue: (row) => Number(row.total || 0) },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_CFDI[row.estado]?.label || row.estado },
      { key: 'notas', label: 'Notas' },
    ];
    exportToExcel(filteredData, excelCols, 'cfdi_emitidos');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      {
        key: 'serie',
        label: 'Serie-Folio',
        width: '120px',
        render: (val, row) => `${val || ''}${val && row.folio ? '-' : ''}${row.folio || ''}`,
      },
      {
        key: 'uuid',
        label: 'UUID',
        width: '120px',
        render: (val) => (
          <span title={val || ''}>{truncateUUID(val)}</span>
        ),
      },
      { key: 'fecha_emision', label: 'Fecha', width: '110px' },
      { key: 'receptor_rfc', label: 'Receptor RFC', width: '140px' },
      { key: 'receptor_nombre', label: 'Receptor Nombre' },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '100px',
        render: (val) => TIPOS_CFDI[val] || val,
      },
      {
        key: 'subtotal',
        label: 'Subtotal',
        width: '130px',
        render: (val) => (
          <span className="text-right block tabular-nums">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'iva',
        label: 'IVA',
        width: '110px',
        render: (val) => (
          <span className="text-right block tabular-nums">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'total',
        label: 'Total',
        width: '140px',
        render: (val) => (
          <span className="text-right block tabular-nums font-bold">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '120px',
        render: (val) => {
          const est = ESTADOS_CFDI[val] || { label: val, variant: 'default' };
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
        <h1 className="text-xl font-bold text-text-primary">CFDI Emitidos</h1>
        <p className="text-sm text-text-muted mt-1">
          Comprobantes fiscales digitales emitidos por el ente publico
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-text-secondary">
            Emitidos
            <span className="ml-2 text-text-muted font-normal">
              ({filteredData.length} registros)
            </span>
          </h2>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="h-[38px] rounded-md border border-border text-[0.9375rem] px-3 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
          >
            {filtroTipoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
              + Nuevo CFDI
            </Button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando CFDI emitidos...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar CFDI Emitido' : 'Nuevo CFDI Emitido'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Serie, Folio, UUID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Serie"
              value={form.serie}
              onChange={(e) => set('serie', e.target.value)}
              placeholder="Ej. A"
            />
            <Input
              label="Folio"
              value={form.folio}
              onChange={(e) => set('folio', e.target.value)}
              placeholder="Ej. 001"
              required
            />
            <Input
              label="UUID"
              value={form.uuid}
              onChange={(e) => set('uuid', e.target.value)}
              placeholder="UUID del timbrado"
              disabled={!!editing}
            />
          </div>

          {/* Row 2: Fecha Emision, Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Emision"
              type="date"
              value={form.fecha_emision}
              onChange={(e) => set('fecha_emision', e.target.value)}
              required
            />
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
          </div>

          {/* Row 3: Receptor RFC, Receptor Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Receptor RFC"
              value={form.receptor_rfc}
              onChange={(e) => set('receptor_rfc', e.target.value)}
              placeholder="RFC del receptor"
              required
            />
            <Input
              label="Receptor Nombre"
              value={form.receptor_nombre}
              onChange={(e) => set('receptor_nombre', e.target.value)}
              placeholder="Nombre o razon social del receptor"
              required
            />
          </div>

          {/* Row 4: Uso CFDI, Metodo de Pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Uso CFDI"
              value={form.uso_cfdi}
              onChange={(e) => set('uso_cfdi', e.target.value)}
              options={usoCfdiOptions}
              placeholder="-- Seleccione uso CFDI --"
              required
            />
            <Select
              label="Metodo de Pago"
              value={form.metodo_pago}
              onChange={(e) => set('metodo_pago', e.target.value)}
              options={metodoPagoOptions}
              placeholder="-- Seleccione metodo de pago --"
              required
            />
          </div>

          {/* Row 5: Subtotal, IVA, Total */}
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

          {/* Row 6: Estado */}
          <Select
            label="Estado"
            value={form.estado}
            onChange={(e) => set('estado', e.target.value)}
            options={estadoOptions}
            placeholder="-- Seleccione estado --"
            required
          />

          {/* Row 7: Notas */}
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
              disabled={!form.folio.toString().trim() || !form.receptor_rfc.trim() || !form.receptor_nombre.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear CFDI'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar CFDI emitido"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el CFDI emitido "${toDelete.serie || ''}${toDelete.serie && toDelete.folio ? '-' : ''}${toDelete.folio || ''}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
