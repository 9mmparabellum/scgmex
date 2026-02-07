import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useList, useCreate, useRemove } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { fetchMovimientosIngreso } from '../../services/presupuestoService';
import { MOMENTOS_INGRESO, TIPOS_MOVIMIENTO_PRESUPUESTAL } from '../../config/constants';
import { exportToExcel } from '../../utils/exportHelpers';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const fmtCurrency = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  concepto_id: '',
  periodo_id: '',
  tipo_movimiento: '',
  monto: '',
  descripcion: '',
  fecha: todayISO(),
};

export default function MomentosIngreso() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  const [selectedMomento, setSelectedMomento] = useState(MOMENTOS_INGRESO[0].key);
  const [filterConcepto, setFilterConcepto] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Data hooks ---
  const queryFilter = useMemo(() => {
    const f = { momento: selectedMomento };
    if (filterConcepto) f.concepto_id = filterConcepto;
    if (filterPeriodo) f.periodo_id = filterPeriodo;
    return f;
  }, [selectedMomento, filterConcepto, filterPeriodo]);

  const { data: movimientos = [], isLoading } = useQuery({
    queryKey: ['movimiento_presupuestal_ingreso', entePublico?.id, queryFilter],
    queryFn: () => fetchMovimientosIngreso(entePublico?.id, queryFilter),
    enabled: !!entePublico?.id,
  });

  const { data: conceptos = [] } = useList('concepto_ingreso', {
    filter: { ente_id: entePublico?.id, ejercicio_id: ejercicioFiscal?.id },
  });

  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
  });

  const createMut = useCreate('movimiento_presupuestal_ingreso');
  const removeMut = useRemove('movimiento_presupuestal_ingreso');

  // --- Lookup maps ---
  const conceptoMap = useMemo(() => {
    const map = {};
    conceptos.forEach((c) => { map[c.id] = c; });
    return map;
  }, [conceptos]);

  // --- Select options ---
  const conceptoOptions = useMemo(
    () => conceptos.map((c) => ({ value: c.id, label: `${c.clave} — ${c.descripcion}` })),
    [conceptos]
  );

  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: p.nombre || p.clave })),
    [periodos]
  );

  const tipoMovOptions = useMemo(
    () => TIPOS_MOVIMIENTO_PRESUPUESTAL.map((t) => ({ value: t.key, label: t.label })),
    []
  );

  // --- Badge variant for tipo_movimiento ---
  const tipoMovBadge = (tipo) => {
    const variants = { original: 'info', adicion: 'success', reduccion: 'danger' };
    return variants[tipo] || 'default';
  };

  const tipoMovLabel = (tipo) => {
    const found = TIPOS_MOVIMIENTO_PRESUPUESTAL.find((t) => t.key === tipo);
    return found ? found.label : tipo;
  };

  const momentoLabel = MOMENTOS_INGRESO.find((m) => m.key === selectedMomento)?.label ?? selectedMomento;

  // --- Handlers ---
  const openCreate = () => {
    setForm({ ...emptyForm, fecha: todayISO() });
    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const record = {
      concepto_id: form.concepto_id,
      periodo_id: form.periodo_id || null,
      momento: selectedMomento,
      tipo_movimiento: form.tipo_movimiento,
      monto: Number(form.monto) || 0,
      descripcion: form.descripcion,
      fecha: form.fecha,
    };
    await createMut.mutateAsync(record);
    setModalOpen(false);
  };

  const askDelete = (row) => {
    setDeleteTarget(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await removeMut.mutateAsync(deleteTarget.id);
    }
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      {
        key: 'fecha',
        label: 'Fecha',
        getValue: (row) => row.fecha,
      },
      {
        key: 'concepto',
        label: 'Concepto',
        getValue: (row) => {
          const c = conceptoMap[row.concepto_id];
          return c ? `${c.clave} — ${c.descripcion}` : row.concepto_id;
        },
      },
      {
        key: 'tipo_movimiento',
        label: 'Tipo Movimiento',
        getValue: (row) => tipoMovLabel(row.tipo_movimiento),
      },
      {
        key: 'monto',
        label: 'Monto',
        getValue: (row) => Number(row.monto || 0),
      },
      { key: 'descripcion', label: 'Descripcion' },
    ];
    exportToExcel(movimientos, excelCols, `momentos_ingreso_${selectedMomento}`);
  };

  // --- Table columns ---
  const columns = [
    {
      key: 'fecha',
      label: 'Fecha',
      width: '120px',
    },
    {
      key: 'concepto_id',
      label: 'Concepto',
      render: (val) => {
        const c = conceptoMap[val];
        return c ? c.clave : '\u2014';
      },
    },
    {
      key: 'tipo_movimiento',
      label: 'Tipo Mov.',
      width: '120px',
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
          {fmtCurrency(val)}
        </span>
      ),
    },
    { key: 'descripcion', label: 'Descripcion' },
    {
      key: 'id',
      label: 'Acciones',
      width: '100px',
      sortable: false,
      render: (_val, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); askDelete(row); }}
          className="text-xs text-danger hover:text-danger/80 transition-colors cursor-pointer"
        >
          Eliminar
        </button>
      ),
    },
  ];

  const isSaving = createMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Momentos del Ingreso</h1>
        <p className="text-sm text-text-muted mt-1">
          Registro de movimientos presupuestarios de ingreso
        </p>
      </div>

      {/* Momento tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {MOMENTOS_INGRESO.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedMomento(m.key)}
            className={[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
              selectedMomento === m.key
                ? 'bg-primary text-white'
                : 'bg-white card-shadow text-text-secondary hover:bg-bg-hover',
            ].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-2xl">
        <Select
          label="Concepto"
          value={filterConcepto}
          onChange={(e) => setFilterConcepto(e.target.value)}
          options={conceptoOptions}
          placeholder="— Todos los conceptos —"
        />
        <Select
          label="Periodo"
          value={filterPeriodo}
          onChange={(e) => setFilterPeriodo(e.target.value)}
          options={periodoOptions}
          placeholder="— Todos los periodos —"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">
          {momentoLabel}
          <span className="ml-2 text-text-muted font-normal">
            ({movimientos.length} movimientos)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline-primary" size="sm">
            Exportar Excel
          </Button>
          <Button onClick={openCreate} size="sm">
            + Registrar Movimiento
          </Button>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando movimientos...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={movimientos}
        />
      )}

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Movimiento"
        size="md"
      >
        <div className="space-y-4">
          {/* Momento (readonly) */}
          <div className="w-full">
            <label className="block text-sm font-medium text-text-heading mb-1.5">
              Momento contable
            </label>
            <div className="block w-full h-[40px] rounded-md border border-border bg-bg-hover text-text-muted text-[0.9375rem] px-3.5 py-2.5">
              {momentoLabel}
            </div>
          </div>

          {/* Concepto */}
          <Select
            label="Concepto"
            value={form.concepto_id}
            onChange={(e) => handleChange('concepto_id', e.target.value)}
            options={conceptoOptions}
            placeholder="— Seleccione un concepto —"
            required
          />

          {/* Periodo */}
          <Select
            label="Periodo contable"
            value={form.periodo_id}
            onChange={(e) => handleChange('periodo_id', e.target.value)}
            options={periodoOptions}
            placeholder="— Seleccione un periodo —"
            required
          />

          {/* Tipo movimiento */}
          <Select
            label="Tipo de movimiento"
            value={form.tipo_movimiento}
            onChange={(e) => handleChange('tipo_movimiento', e.target.value)}
            options={tipoMovOptions}
            placeholder="— Seleccione tipo —"
            required
          />

          {/* Monto */}
          <Input
            label="Monto"
            type="number"
            value={form.monto}
            onChange={(e) => handleChange('monto', e.target.value)}
            placeholder="0.00"
            min={0}
            required
          />

          {/* Descripcion */}
          <Input
            label="Descripcion (opcional)"
            value={form.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Descripcion del movimiento"
          />

          {/* Fecha */}
          <Input
            label="Fecha"
            type="date"
            value={form.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
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
              disabled={!form.concepto_id || !form.tipo_movimiento || !form.monto || !form.fecha}
            >
              Registrar movimiento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title="Eliminar movimiento"
        message={
          deleteTarget
            ? `¿Esta seguro de eliminar este movimiento por ${fmtCurrency(deleteTarget.monto)}? Esta accion no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        loading={removeMut.isPending}
      />
    </div>
  );
}
