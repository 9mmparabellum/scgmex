import { useState, useMemo } from 'react';
import { useCreate, useUpdate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useInstrumentosDeuda, useMovimientosDeuda, useResumenDeuda } from '../../hooks/useDeuda';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportToExcel } from '../../utils/exportHelpers';
import { TIPOS_DEUDA, ESTADOS_DEUDA, TIPOS_MOVIMIENTO_DEUDA } from '../../config/constants';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const emptyForm = {
  clave: '',
  descripcion: '',
  tipo: 'credito',
  acreedor: '',
  monto_original: '',
  saldo_vigente: '',
  tasa_interes: '',
  tipo_tasa: 'fija',
  plazo_meses: '',
  fecha_contratacion: '',
  fecha_vencimiento: '',
  moneda: 'MXN',
  destino_recursos: '',
  garantia: '',
  estado: 'vigente',
};

const emptyMovForm = {
  tipo: 'disposicion',
  monto: '',
  fecha: new Date().toISOString().split('T')[0],
  descripcion: '',
};

export default function DeudaPublica() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  // --- Instrument CRUD state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // --- Movements state ---
  const [movModalOpen, setMovModalOpen] = useState(false);
  const [selectedInstrumentoId, setSelectedInstrumentoId] = useState(null);
  const [selectedInstrumento, setSelectedInstrumento] = useState(null);
  const [showMovForm, setShowMovForm] = useState(false);
  const [movForm, setMovForm] = useState({ ...emptyMovForm });

  // --- Data hooks ---
  const { data: instrumentos = [], isLoading } = useInstrumentosDeuda();
  const { data: resumen = {} } = useResumenDeuda();
  const { data: movimientos = [], isLoading: loadingMov } = useMovimientosDeuda(selectedInstrumentoId);

  const createMut = useCreate('instrumento_deuda');
  const updateMut = useUpdate('instrumento_deuda');
  const removeMut = useRemove('instrumento_deuda');
  const createMovMut = useCreate('movimiento_deuda');

  // --- Select options ---
  const tipoDeudaOptions = useMemo(
    () => TIPOS_DEUDA.map((t) => ({ value: t.key ?? t, label: t.label ?? t })),
    []
  );

  const estadoDeudaOptions = useMemo(
    () => ESTADOS_DEUDA.map((e) => ({ value: e.key ?? e, label: e.label ?? e })),
    []
  );

  const tipoMovDeudaOptions = useMemo(
    () => TIPOS_MOVIMIENTO_DEUDA.map((t) => ({ value: t.key ?? t, label: t.label ?? t })),
    []
  );

  const tipoTasaOptions = [
    { value: 'fija', label: 'Fija' },
    { value: 'variable', label: 'Variable' },
    { value: 'mixta', label: 'Mixta' },
  ];

  // --- Helpers ---
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const setMov = (k, v) => setMovForm((prev) => ({ ...prev, [k]: v }));

  const tipoBadge = (tipo) => {
    const variants = { credito: 'primary', emision: 'info' };
    return variants[tipo] || 'default';
  };

  const estadoBadge = (estado) => {
    const variants = { vigente: 'success', pagado: 'info', reestructurado: 'warning', vencido: 'danger' };
    return variants[estado] || 'default';
  };

  const tipoMovBadge = (tipo) => {
    const variants = { disposicion: 'info', amortizacion: 'success', pago_interes: 'warning', reestructura: 'danger' };
    return variants[tipo] || 'default';
  };

  const tipoLabel = (tipo) => {
    const found = TIPOS_DEUDA.find((t) => (t.key ?? t) === tipo);
    return found ? (found.label ?? found) : tipo;
  };

  const estadoLabel = (estado) => {
    const found = ESTADOS_DEUDA.find((e) => (e.key ?? e) === estado);
    return found ? (found.label ?? found) : estado;
  };

  const tipoMovLabel = (tipo) => {
    const found = TIPOS_MOVIMIENTO_DEUDA.find((t) => (t.key ?? t) === tipo);
    return found ? (found.label ?? found) : tipo;
  };

  // --- Instrument handlers ---
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      clave: row.clave ?? '',
      descripcion: row.descripcion ?? '',
      tipo: row.tipo ?? 'credito',
      acreedor: row.acreedor ?? '',
      monto_original: row.monto_original ?? '',
      saldo_vigente: row.saldo_vigente ?? '',
      tasa_interes: row.tasa_interes ?? '',
      tipo_tasa: row.tipo_tasa ?? 'fija',
      plazo_meses: row.plazo_meses ?? '',
      fecha_contratacion: row.fecha_contratacion ?? '',
      fecha_vencimiento: row.fecha_vencimiento ?? '',
      moneda: row.moneda ?? 'MXN',
      destino_recursos: row.destino_recursos ?? '',
      garantia: row.garantia ?? '',
      estado: row.estado ?? 'vigente',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      ente_id: entePublico?.id,
      ejercicio_id: ejercicioFiscal?.id,
      monto_original: Number(form.monto_original) || 0,
      saldo_vigente: Number(form.saldo_vigente) || 0,
      tasa_interes: Number(form.tasa_interes) || 0,
      plazo_meses: Number(form.plazo_meses) || 0,
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

  // --- Movement handlers ---
  const openMovimientos = (row) => {
    setSelectedInstrumentoId(row.id);
    setSelectedInstrumento(row);
    setShowMovForm(false);
    setMovForm({ ...emptyMovForm, fecha: new Date().toISOString().split('T')[0] });
    setMovModalOpen(true);
  };

  const handleSaveMov = async () => {
    await createMovMut.mutateAsync({
      instrumento_id: selectedInstrumentoId,
      ...movForm,
      monto: Number(movForm.monto) || 0,
    });
    setShowMovForm(false);
    setMovForm({ ...emptyMovForm, fecha: new Date().toISOString().split('T')[0] });
  };

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'clave', label: 'Clave' },
      { key: 'descripcion', label: 'Descripcion' },
      { key: 'tipo', label: 'Tipo', getValue: (row) => tipoLabel(row.tipo) },
      { key: 'acreedor', label: 'Acreedor' },
      { key: 'monto_original', label: 'Monto Original', getValue: (row) => Number(row.monto_original || 0) },
      { key: 'saldo_vigente', label: 'Saldo Vigente', getValue: (row) => Number(row.saldo_vigente || 0) },
      { key: 'tasa_interes', label: 'Tasa %', getValue: (row) => Number(row.tasa_interes || 0) },
      { key: 'fecha_vencimiento', label: 'Vencimiento' },
      { key: 'estado', label: 'Estado', getValue: (row) => estadoLabel(row.estado) },
    ];
    exportToExcel(instrumentos, excelCols, 'deuda_publica');
  };

  // --- Movement table columns ---
  const movColumns = [
    { key: 'fecha', label: 'Fecha', width: '100px' },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '130px',
      render: (val) => (
        <Badge variant={tipoMovBadge(val)}>
          {tipoMovLabel(val)}
        </Badge>
      ),
    },
    {
      key: 'monto',
      label: 'Monto',
      width: '130px',
      render: (val) => (
        <span className="text-right block tabular-nums">
          {fmtMoney(val)}
        </span>
      ),
    },
    { key: 'descripcion', label: 'Descripcion' },
  ];

  // --- Instruments table columns ---
  const columns = [
    { key: 'clave', label: 'Clave', width: '100px' },
    { key: 'descripcion', label: 'Descripcion' },
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
    { key: 'acreedor', label: 'Acreedor', width: '150px' },
    {
      key: 'monto_original',
      label: 'Monto Original',
      width: '130px',
      render: (val) => (
        <span className="text-right block tabular-nums">
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'saldo_vigente',
      label: 'Saldo Vigente',
      width: '130px',
      render: (val) => (
        <span className="text-right block tabular-nums">
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'tasa_interes',
      label: 'Tasa %',
      width: '80px',
      render: (val) => `${Number(val || 0).toFixed(2)}%`,
    },
    { key: 'fecha_vencimiento', label: 'Vencimiento', width: '110px' },
    {
      key: 'estado',
      label: 'Estado',
      width: '120px',
      render: (val) => (
        <Badge variant={estadoBadge(val)}>
          {estadoLabel(val)}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      width: '180px',
      sortable: false,
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openMovimientos(row); }}
            className="text-xs text-info hover:text-info/80 transition-colors cursor-pointer"
          >
            Movimientos
          </button>
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
  const isSavingMov = createMovMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Deuda Publica</h1>
        <p className="text-sm text-text-muted mt-1">
          Art. 47 LGCG — Control de instrumentos de deuda publica
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Saldo Total</p>
          <p className="text-lg font-bold text-text-primary">{fmtMoney(resumen.saldo_total)}</p>
        </div>
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Intereses Pagados</p>
          <p className="text-lg font-bold text-text-primary">{fmtMoney(resumen.intereses_pagados)}</p>
        </div>
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Amortizaciones</p>
          <p className="text-lg font-bold text-text-primary">{fmtMoney(resumen.amortizaciones)}</p>
        </div>
        <div className="bg-white rounded-lg card-shadow p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Instrumentos</p>
          <p className="text-lg font-bold text-text-primary">{resumen.total_instrumentos ?? 0}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          Instrumentos
          <span className="ml-2 text-text-muted font-normal">
            ({instrumentos.length} registros)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Nuevo Instrumento
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando instrumentos de deuda...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={instrumentos}
          onRowClick={openEdit}
        />
      )}

      {/* Create / Edit instrument modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Instrumento' : 'Nuevo Instrumento'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row 1: Clave, Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Clave"
              value={form.clave}
              onChange={(e) => set('clave', e.target.value)}
              placeholder="Ej. DP-001"
              required
            />
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              options={tipoDeudaOptions}
              placeholder="— Seleccione tipo —"
              required
            />
          </div>

          {/* Row 2: Descripcion */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Descripcion <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Descripcion del instrumento de deuda"
              rows={3}
              className="w-full h-[40px] min-h-[80px] rounded-md border border-border px-3 py-2 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>

          {/* Row 3: Acreedor */}
          <Input
            label="Acreedor"
            value={form.acreedor}
            onChange={(e) => set('acreedor', e.target.value)}
            placeholder="Nombre del acreedor o institucion"
            required
          />

          {/* Row 4: Monto Original, Saldo Vigente, Tasa Interes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Monto Original"
              type="number"
              value={form.monto_original}
              onChange={(e) => set('monto_original', e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label="Saldo Vigente"
              type="number"
              value={form.saldo_vigente}
              onChange={(e) => set('saldo_vigente', e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label="Tasa Interes (%)"
              type="number"
              value={form.tasa_interes}
              onChange={(e) => set('tasa_interes', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Row 5: Tipo Tasa, Plazo Meses, Moneda */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Tipo Tasa"
              value={form.tipo_tasa}
              onChange={(e) => set('tipo_tasa', e.target.value)}
              options={tipoTasaOptions}
              placeholder="— Seleccione —"
            />
            <Input
              label="Plazo (meses)"
              type="number"
              value={form.plazo_meses}
              onChange={(e) => set('plazo_meses', e.target.value)}
              placeholder="Ej. 60"
            />
            <Input
              label="Moneda"
              value={form.moneda}
              onChange={(e) => set('moneda', e.target.value)}
              placeholder="MXN"
            />
          </div>

          {/* Row 6: Fecha Contratacion, Fecha Vencimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Contratacion"
              type="date"
              value={form.fecha_contratacion}
              onChange={(e) => set('fecha_contratacion', e.target.value)}
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

          {/* Row 7: Destino Recursos, Garantia */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Destino de Recursos
            </label>
            <textarea
              value={form.destino_recursos}
              onChange={(e) => set('destino_recursos', e.target.value)}
              placeholder="Destino de los recursos del financiamiento"
              rows={2}
              className="w-full h-[40px] min-h-[80px] rounded-md border border-border px-3 py-2 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda"
            />
          </div>
          <Input
            label="Garantia"
            value={form.garantia}
            onChange={(e) => set('garantia', e.target.value)}
            placeholder="Tipo de garantia ofrecida"
          />

          {/* Row 8: Estado */}
          <Select
            label="Estado"
            value={form.estado}
            onChange={(e) => set('estado', e.target.value)}
            options={estadoDeudaOptions}
            placeholder="— Seleccione estado —"
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
              disabled={!form.clave.trim() || !form.descripcion.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear instrumento'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Movements modal */}
      <Modal
        open={movModalOpen}
        onClose={() => { setMovModalOpen(false); setSelectedInstrumentoId(null); setSelectedInstrumento(null); }}
        title={`Movimientos — ${selectedInstrumento?.clave ?? ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Movements table */}
          {loadingMov ? (
            <div className="flex items-center justify-center py-8 text-text-muted text-sm">
              Cargando movimientos...
            </div>
          ) : movimientos.length === 0 && !showMovForm ? (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
              <p className="text-[0.9375rem]">No hay movimientos registrados para este instrumento</p>
            </div>
          ) : (
            <DataTable
              columns={movColumns}
              data={movimientos}
            />
          )}

          {/* Inline movement form */}
          {showMovForm && (
            <div className="border border-border rounded-lg p-4 space-y-4 bg-[#f9fafb]">
              <h3 className="text-sm font-semibold text-text-secondary">Nuevo Movimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Tipo"
                  value={movForm.tipo}
                  onChange={(e) => setMov('tipo', e.target.value)}
                  options={tipoMovDeudaOptions}
                  placeholder="— Seleccione tipo —"
                  required
                />
                <Input
                  label="Monto"
                  type="number"
                  value={movForm.monto}
                  onChange={(e) => setMov('monto', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha"
                  type="date"
                  value={movForm.fecha}
                  onChange={(e) => setMov('fecha', e.target.value)}
                  required
                />
                <Input
                  label="Descripcion"
                  value={movForm.descripcion}
                  onChange={(e) => setMov('descripcion', e.target.value)}
                  placeholder="Descripcion del movimiento"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowMovForm(false)} disabled={isSavingMov}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveMov}
                  loading={isSavingMov}
                  disabled={!movForm.tipo || !movForm.monto || !movForm.fecha}
                >
                  Guardar movimiento
                </Button>
              </div>
            </div>
          )}

          {/* Add movement button */}
          {!showMovForm && (
            <div className="flex justify-end pt-2 border-t border-border">
              <Button onClick={() => setShowMovForm(true)} size="sm">
                + Registrar Movimiento
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Eliminar instrumento"
        message={
          toDelete
            ? `¿Esta seguro de eliminar el instrumento "${toDelete.clave} — ${toDelete.descripcion}"? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
