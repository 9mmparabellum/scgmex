import { useState, useMemo } from 'react';
import { useCreate } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { useCuentasBancarias, useMovimientosBancarios } from '../../hooks/useTesoreria';
import { TIPOS_MOVIMIENTO_BANCARIO } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { exportToExcel } from '../../utils/exportHelpers';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const emptyMovForm = {
  fecha: new Date().toISOString().split('T')[0],
  referencia: '',
  concepto: '',
  tipo: 'deposito',
  monto: '',
};

export default function MovimientosBancarios() {
  const { periodoContable } = useAppStore();

  // --- Filter state ---
  const [selectedCuenta, setSelectedCuenta] = useState('');
  const periodoId = periodoContable?.id || null;

  // --- Modal state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [movForm, setMovForm] = useState({ ...emptyMovForm });

  // --- Data hooks ---
  const { data: cuentas = [], isLoading: loadingCuentas } = useCuentasBancarias();
  const { data: movimientos = [], isLoading: loadingMov } = useMovimientosBancarios(
    selectedCuenta || null,
    periodoId
  );

  const createMut = useCreate('movimiento_bancario');

  // --- Select options ---
  const cuentaOptions = useMemo(
    () =>
      cuentas.map((c) => ({
        value: c.id,
        label: `${c.numero_cuenta} — ${c.banco}`,
      })),
    [cuentas]
  );

  const tipoMovOptions = useMemo(
    () => TIPOS_MOVIMIENTO_BANCARIO.map((t) => ({ value: t.key, label: t.label })),
    []
  );

  // --- Helpers ---
  const setMov = (k, v) => setMovForm((prev) => ({ ...prev, [k]: v }));

  const tipoMovLabel = (tipo) => {
    const found = TIPOS_MOVIMIENTO_BANCARIO.find((t) => t.key === tipo);
    return found ? found.label : tipo;
  };

  const tipoMovBadge = (tipo) => {
    const variants = {
      deposito: 'success',
      retiro: 'danger',
      transferencia: 'info',
      comision: 'warning',
      interes: 'primary',
      otro: 'default',
    };
    return variants[tipo] || 'default';
  };

  const montoColor = (tipo) => {
    if (tipo === 'deposito' || tipo === 'interes') return 'text-green-600';
    if (tipo === 'retiro' || tipo === 'comision') return 'text-red-600';
    return '';
  };

  // --- Handlers ---
  const openCreate = () => {
    setMovForm({ ...emptyMovForm, fecha: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const handleSaveMov = async () => {
    await createMut.mutateAsync({
      cuenta_bancaria_id: selectedCuenta,
      periodo_id: periodoId,
      ...movForm,
      monto: Number(movForm.monto) || 0,
    });
    setModalOpen(false);
    setMovForm({ ...emptyMovForm, fecha: new Date().toISOString().split('T')[0] });
  };

  // --- Export handler ---
  const handleExport = () => {
    const excelCols = [
      { key: 'fecha', label: 'Fecha' },
      { key: 'referencia', label: 'Referencia' },
      { key: 'concepto', label: 'Concepto' },
      { key: 'tipo', label: 'Tipo', getValue: (row) => tipoMovLabel(row.tipo) },
      { key: 'monto', label: 'Monto', getValue: (row) => Number(row.monto || 0) },
      { key: 'saldo_despues', label: 'Saldo Despues', getValue: (row) => Number(row.saldo_despues || 0) },
      { key: 'conciliado', label: 'Conciliado', getValue: (row) => (row.conciliado ? 'Si' : 'No') },
      { key: 'poliza_numero', label: 'Poliza' },
    ];
    exportToExcel(movimientos, excelCols, 'movimientos_bancarios');
  };

  // --- Table columns ---
  const columns = [
    { key: 'fecha', label: 'Fecha', width: '110px' },
    { key: 'referencia', label: 'Referencia', width: '130px' },
    { key: 'concepto', label: 'Concepto' },
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
      width: '140px',
      render: (val, row) => (
        <span className={`text-right block tabular-nums font-semibold ${montoColor(row.tipo)}`}>
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'saldo_despues',
      label: 'Saldo Despues',
      width: '150px',
      render: (val) => (
        <span className="text-right block tabular-nums">
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      key: 'conciliado',
      label: 'Conciliado',
      width: '110px',
      render: (val) => (
        <Badge variant={val ? 'success' : 'default'}>
          {val ? 'Si' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'poliza_numero',
      label: 'Poliza',
      width: '100px',
      render: (val, row) => {
        const poliza = val || row.poliza_id;
        return poliza ? (
          <span className="text-xs text-info font-medium">{val || 'Ver'}</span>
        ) : (
          <span className="text-xs text-text-muted">—</span>
        );
      },
    },
  ];

  const isSaving = createMut.isPending;
  const isLoading = loadingCuentas || (selectedCuenta && loadingMov);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Movimientos Bancarios</h1>
        <p className="text-sm text-text-muted mt-1">
          Registro y consulta de movimientos por cuenta bancaria
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg card-shadow p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <Select
              label="Cuenta Bancaria"
              value={selectedCuenta}
              onChange={(e) => setSelectedCuenta(e.target.value)}
              options={cuentaOptions}
              placeholder="-- Seleccione una cuenta bancaria --"
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              onClick={handleExport}
              variant="outline-primary"
              size="sm"
              disabled={!selectedCuenta || movimientos.length === 0}
            >
              Exportar Excel
            </Button>
            <Button
              onClick={openCreate}
              size="sm"
              disabled={!selectedCuenta}
            >
              + Nuevo Movimiento
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {selectedCuenta && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary">
            Movimientos
            <span className="ml-2 text-text-muted font-normal">
              ({movimientos.length} registros)
            </span>
          </h2>
        </div>
      )}

      {/* Data table */}
      {!selectedCuenta ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Seleccione una cuenta bancaria para ver sus movimientos
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-sm">
          Cargando movimientos bancarios...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={movimientos}
        />
      )}

      {/* New movement modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo Movimiento Bancario"
        size="md"
      >
        <div className="space-y-4">
          {/* Row 1: Fecha, Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              value={movForm.fecha}
              onChange={(e) => setMov('fecha', e.target.value)}
              required
            />
            <Select
              label="Tipo de Movimiento"
              value={movForm.tipo}
              onChange={(e) => setMov('tipo', e.target.value)}
              options={tipoMovOptions}
              placeholder="-- Seleccione tipo --"
              required
            />
          </div>

          {/* Row 2: Referencia, Monto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Referencia"
              value={movForm.referencia}
              onChange={(e) => setMov('referencia', e.target.value)}
              placeholder="No. de cheque, transferencia, etc."
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

          {/* Row 3: Concepto */}
          <Input
            label="Concepto"
            value={movForm.concepto}
            onChange={(e) => setMov('concepto', e.target.value)}
            placeholder="Descripcion del movimiento"
            required
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMov}
              loading={isSaving}
              disabled={!movForm.tipo || !movForm.monto || !movForm.fecha}
            >
              Guardar movimiento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
