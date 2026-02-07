import { useState, useMemo, useCallback } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useCFDIRecibidos, useValidarCFDI } from '../../hooks/useCFDI';
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
  uuid: '',
  fecha_recepcion: today(),
  emisor_rfc: '',
  emisor_nombre: '',
  uso_cfdi: 'G03',
  tipo: 'ingreso',
  metodo_pago: 'PUE',
  subtotal: '',
  iva: '',
  total: '',
  estado: 'vigente',
  fecha_pago: '',
  notas: '',
};

export default function CFDIRecibidos() {
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

  // --- Validacion state ---
  const [validarError, setValidarError] = useState('');
  const [validarSuccess, setValidarSuccess] = useState('');

  // --- Data hooks ---
  const { data: cfdiRecibidos = [], isLoading } = useCFDIRecibidos();

  const createMut = useCreate('cfdi_recibido');
  const updateMut = useUpdate('cfdi_recibido');
  const removeMut = useRemove('cfdi_recibido');
  const validarMut = useValidarCFDI();

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
    let result = cfdiRecibidos;
    if (filtroTipo) result = result.filter((c) => c.tipo === filtroTipo);
    if (filtroEstado) result = result.filter((c) => c.estado === filtroEstado);
    return result;
  }, [cfdiRecibidos, filtroTipo, filtroEstado]);

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
    setForm({ ...emptyForm, fecha_recepcion: today() });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      uuid: row.uuid ?? '',
      fecha_recepcion: row.fecha_recepcion ?? today(),
      emisor_rfc: row.emisor_rfc ?? '',
      emisor_nombre: row.emisor_nombre ?? '',
      uso_cfdi: row.uso_cfdi ?? 'G03',
      tipo: row.tipo ?? 'ingreso',
      metodo_pago: row.metodo_pago ?? 'PUE',
      subtotal: row.subtotal ?? '',
      iva: row.iva ?? '',
      total: row.total ?? '',
      estado: row.estado ?? 'vigente',
      fecha_pago: row.fecha_pago ?? '',
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
      fecha_pago: form.fecha_pago || null,
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

  // --- Validar SAT handler ---
  const handleValidarSAT = useCallback(async (row) => {
    setValidarError('');
    setValidarSuccess('');
    try {
      const resultado = await validarMut.mutateAsync(row.id);
      const estado = resultado?.Estado || resultado?.status || 'Consultado';
      setValidarSuccess(`CFDI ${row.uuid?.slice(0, 8) || ''}... validado ante SAT. Estado: ${estado}`);
      // Auto-clear success message after 5 seconds
      setTimeout(() => setValidarSuccess(''), 5000);
    } catch (err) {
      setValidarError(err.message || 'Error al validar el CFDI ante el SAT.');
      setTimeout(() => setValidarError(''), 5000);
    }
  }, [validarMut]);

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'uuid', label: 'UUID' },
      { key: 'fecha_recepcion', label: 'Fecha Recepcion' },
      { key: 'emisor_rfc', label: 'Emisor RFC' },
      { key: 'emisor_nombre', label: 'Emisor Nombre' },
      { key: 'uso_cfdi', label: 'Uso CFDI', getValue: (row) => USOS_CFDI[row.uso_cfdi] || row.uso_cfdi },
      { key: 'tipo', label: 'Tipo', getValue: (row) => TIPOS_CFDI[row.tipo] || row.tipo },
      { key: 'metodo_pago', label: 'Metodo Pago', getValue: (row) => METODOS_PAGO_CFDI[row.metodo_pago] || row.metodo_pago },
      { key: 'subtotal', label: 'Subtotal', getValue: (row) => Number(row.subtotal || 0) },
      { key: 'iva', label: 'IVA', getValue: (row) => Number(row.iva || 0) },
      { key: 'total', label: 'Total', getValue: (row) => Number(row.total || 0) },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_CFDI[row.estado]?.label || row.estado },
      { key: 'validado_sat', label: 'Validado SAT', getValue: (row) => row.validado_sat ? 'Si' : 'No' },
      { key: 'estado_sat', label: 'Estado SAT' },
      { key: 'fecha_validacion', label: 'Fecha Validacion' },
      { key: 'fecha_pago', label: 'Fecha Pago' },
      { key: 'notas', label: 'Notas' },
    ];
    exportToExcel(filteredData, excelCols, 'cfdi_recibidos');
  };

  // --- Table columns ---
  const columns = useMemo(
    () => [
      {
        key: 'uuid',
        label: 'UUID',
        width: '120px',
        render: (val) => (
          <span title={val || ''}>{truncateUUID(val)}</span>
        ),
      },
      { key: 'fecha_recepcion', label: 'Fecha Recepcion', width: '140px' },
      { key: 'emisor_rfc', label: 'Emisor RFC', width: '140px' },
      { key: 'emisor_nombre', label: 'Emisor Nombre' },
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
        key: 'validado_sat',
        label: 'SAT',
        width: '100px',
        render: (val, row) => {
          if (val) {
            return (
              <div className="flex flex-col items-start gap-0.5">
                <Badge variant="success">Validado</Badge>
                {row.estado_sat && (
                  <span className="text-[10px] text-text-muted">{row.estado_sat}</span>
                )}
              </div>
            );
          }
          return <Badge variant="default">Pendiente</Badge>;
        },
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '180px',
        sortable: false,
        render: (_val, row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(row); }}
              className="text-xs text-primary hover:text-primary-light transition-colors cursor-pointer"
            >
              Editar
            </button>
            {row.uuid && !row.validado_sat && (
              <button
                onClick={(e) => { e.stopPropagation(); handleValidarSAT(row); }}
                className="text-xs text-[#56ca00] hover:text-[#56ca00]/80 transition-colors cursor-pointer font-medium"
                disabled={validarMut.isPending}
              >
                {validarMut.isPending ? 'Validando...' : 'Validar SAT'}
              </button>
            )}
            {row.validado_sat && row.fecha_validacion && (
              <span className="text-[10px] text-text-muted" title={`Validado el ${row.fecha_validacion}`}>
                {row.fecha_validacion?.slice(0, 10)}
              </span>
            )}
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
    [editable, handleValidarSAT, validarMut.isPending]
  );

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">CFDI Recibidos</h1>
        <p className="text-sm text-text-muted mt-1">
          Comprobantes fiscales digitales recibidos de proveedores y terceros
        </p>
      </div>

      {/* Validation feedback messages */}
      {validarSuccess && (
        <div className="bg-[#71dd37]/10 border border-[#71dd37]/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-[#56ca00] font-medium">{validarSuccess}</p>
        </div>
      )}
      {validarError && (
        <div className="bg-[#ff3e1d]/10 border border-[#ff3e1d]/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-[#e0360a] font-medium">{validarError}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-text-secondary">
            Recibidos
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
          Cargando CFDI recibidos...
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
        title={editing ? 'Editar CFDI Recibido' : 'Nuevo CFDI Recibido'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: UUID, Fecha Recepcion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="UUID"
              value={form.uuid}
              onChange={(e) => set('uuid', e.target.value)}
              placeholder="UUID del comprobante"
              required
            />
            <Input
              label="Fecha de Recepcion"
              type="date"
              value={form.fecha_recepcion}
              onChange={(e) => set('fecha_recepcion', e.target.value)}
              required
            />
          </div>

          {/* Row 2: Emisor RFC, Emisor Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Emisor RFC"
              value={form.emisor_rfc}
              onChange={(e) => set('emisor_rfc', e.target.value)}
              placeholder="RFC del emisor"
              required
            />
            <Input
              label="Emisor Nombre"
              value={form.emisor_nombre}
              onChange={(e) => set('emisor_nombre', e.target.value)}
              placeholder="Nombre o razon social del emisor"
              required
            />
          </div>

          {/* Row 3: Tipo, Uso CFDI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
            <Select
              label="Uso CFDI"
              value={form.uso_cfdi}
              onChange={(e) => set('uso_cfdi', e.target.value)}
              options={usoCfdiOptions}
              placeholder="-- Seleccione uso CFDI --"
              required
            />
          </div>

          {/* Row 4: Metodo de Pago, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Metodo de Pago"
              value={form.metodo_pago}
              onChange={(e) => set('metodo_pago', e.target.value)}
              options={metodoPagoOptions}
              placeholder="-- Seleccione metodo de pago --"
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

          {/* Row 6: Fecha de Pago */}
          <Input
            label="Fecha de Pago (opcional)"
            type="date"
            value={form.fecha_pago}
            onChange={(e) => set('fecha_pago', e.target.value)}
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
              disabled={!form.uuid.trim() || !form.emisor_rfc.trim() || !form.emisor_nombre.trim()}
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
        title="Eliminar CFDI recibido"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el CFDI recibido con UUID "${toDelete.uuid?.slice(0, 8) || ''}..."? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
