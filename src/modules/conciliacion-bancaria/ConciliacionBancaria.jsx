import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCuentasBancarias } from '../../hooks/useTesoreria';
import {
  useEstadosCuenta,
  useImportarEstadoCuenta,
} from '../../hooks/useConciliacionBancaria';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import { ESTADOS_CONCILIACION_BANCARIA } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { exportToExcel } from '../../utils/exportHelpers';

/* -------------------------------------------------------------------------- */
/*  ConciliacionBancaria — Lista de estados de cuenta y conciliacion          */
/*  Importacion de estados de cuenta bancarios y seguimiento de conciliacion  */
/* -------------------------------------------------------------------------- */

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

export default function ConciliacionBancaria() {
  const navigate = useNavigate();
  const { ejercicioFiscal } = useAppStore();

  /* ---- State -------------------------------------------------------------- */
  const [selectedCuenta, setSelectedCuenta] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Import form state
  const [periodoId, setPeriodoId] = useState('');
  const [fechaCorte, setFechaCorte] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [saldoFinal, setSaldoFinal] = useState('');
  const [archivoNombre, setArchivoNombre] = useState('');
  const [csvData, setCsvData] = useState('');

  /* ---- Data --------------------------------------------------------------- */
  const { data: cuentas = [], isLoading: loadingCuentas } = useCuentasBancarias();
  const { data: estadosCuenta = [], isLoading: loadingEstados } = useEstadosCuenta(selectedCuenta);

  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const importar = useImportarEstadoCuenta();

  /* ---- Derived ------------------------------------------------------------ */
  const cuentaOptions = useMemo(
    () =>
      cuentas
        .filter((c) => c.activo)
        .map((c) => ({
          value: c.id,
          label: `${c.numero_cuenta} — ${c.banco}`,
        })),
    [cuentas]
  );

  const periodoOptions = useMemo(
    () =>
      periodos.map((p) => ({
        value: p.id,
        label: p.nombre || `Periodo ${p.numero}`,
      })),
    [periodos]
  );

  /* ---- Columns ------------------------------------------------------------ */
  const columns = useMemo(
    () => [
      {
        key: 'periodo',
        label: 'Periodo',
        width: '150px',
        render: (_val, row) => row.periodo?.nombre || '\u2014',
      },
      {
        key: 'fecha_corte',
        label: 'Fecha de Corte',
        width: '140px',
        render: (val) =>
          val ? new Date(val).toLocaleDateString('es-MX') : '\u2014',
      },
      {
        key: 'saldo_inicial_banco',
        label: 'Saldo Inicial',
        width: '160px',
        render: (val) => (
          <span className="text-right block tabular-nums">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'saldo_final_banco',
        label: 'Saldo Final',
        width: '160px',
        render: (val) => (
          <span className="text-right block tabular-nums">{fmtMoney(val)}</span>
        ),
      },
      {
        key: 'archivo_nombre',
        label: 'Archivo',
        width: '180px',
        render: (val) => val || '\u2014',
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '140px',
        render: (val) => {
          const estado = ESTADOS_CONCILIACION_BANCARIA[val];
          return (
            <Badge variant={estado?.variant || 'default'}>
              {estado?.label || val || '\u2014'}
            </Badge>
          );
        },
      },
      {
        key: 'actions',
        label: '',
        width: '60px',
        render: (_val, row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(
                `/tesoreria/conciliacion-bancaria/${row.id}?cuenta=${selectedCuenta}`
              );
            }}
          >
            Ver
          </Button>
        ),
      },
    ],
    [navigate, selectedCuenta]
  );

  /* ---- Handlers ----------------------------------------------------------- */
  const handleRowClick = (row) => {
    navigate(
      `/tesoreria/conciliacion-bancaria/${row.id}?cuenta=${selectedCuenta}`
    );
  };

  const resetForm = () => {
    setPeriodoId('');
    setFechaCorte('');
    setSaldoInicial('');
    setSaldoFinal('');
    setArchivoNombre('');
    setCsvData('');
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleImportar = async () => {
    if (!selectedCuenta || !periodoId || !fechaCorte) return;

    // Parse CSV-like textarea: each line is tab-separated: fecha, referencia, concepto, cargo, abono
    const movimientos = csvData
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split('\t');
        return {
          fecha: parts[0]?.trim() || '',
          referencia: parts[1]?.trim() || '',
          concepto: parts[2]?.trim() || '',
          cargo: parseFloat(parts[3]?.trim()) || 0,
          abono: parseFloat(parts[4]?.trim()) || 0,
        };
      });

    try {
      await importar.mutateAsync({
        cuentaBancariaId: selectedCuenta,
        periodoId,
        fechaCorte,
        saldoInicial: parseFloat(saldoInicial) || 0,
        saldoFinal: parseFloat(saldoFinal) || 0,
        archivoNombre,
        movimientos,
      });
      setShowModal(false);
      resetForm();
    } catch {
      // mutation error handled by React Query
    }
  };

  const handleExport = () => {
    const exportCols = [
      { key: 'periodo', label: 'Periodo', getValue: (row) => row.periodo?.nombre || '' },
      { key: 'fecha_corte', label: 'Fecha de Corte' },
      { key: 'saldo_inicial_banco', label: 'Saldo Inicial' },
      { key: 'saldo_final_banco', label: 'Saldo Final' },
      { key: 'archivo_nombre', label: 'Archivo' },
      { key: 'estado', label: 'Estado', getValue: (row) => ESTADOS_CONCILIACION_BANCARIA[row.estado]?.label || row.estado || '' },
    ];
    exportToExcel(estadosCuenta, exportCols, 'conciliacion_bancaria_estados_cuenta');
  };

  /* ---- Render ------------------------------------------------------------- */
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Conciliacion Bancaria
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Importacion y conciliacion de estados de cuenta bancarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          {estadosCuenta.length > 0 && (
            <Button variant="outline-primary" size="sm" onClick={handleExport}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5 inline-block"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Exportar Excel
            </Button>
          )}
          <Button onClick={handleOpenModal} disabled={!selectedCuenta}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 inline-block"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Importar Estado de Cuenta
          </Button>
        </div>
      </div>

      {/* Account selector */}
      <div className="bg-white rounded-lg card-shadow p-5 mb-4">
        <div className="max-w-md">
          <Select
            label="Cuenta Bancaria"
            placeholder="Seleccionar cuenta bancaria..."
            options={cuentaOptions}
            value={selectedCuenta}
            onChange={(e) => setSelectedCuenta(e.target.value)}
          />
          {loadingCuentas && (
            <p className="text-xs text-text-muted mt-1">
              Cargando cuentas bancarias...
            </p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg card-shadow p-5">
        {!selectedCuenta ? (
          <div className="flex items-center justify-center py-16 text-text-muted text-sm">
            Seleccione una cuenta bancaria para ver sus estados de cuenta
          </div>
        ) : loadingEstados ? (
          <div className="flex items-center justify-center py-16">
            <svg
              className="animate-spin h-8 w-8 text-guinda"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={estadosCuenta}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      {/* Modal — Importar Estado de Cuenta */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Importar Estado de Cuenta"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Periodo Contable"
              placeholder="Seleccionar periodo..."
              options={periodoOptions}
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value)}
              required
            />
            <Input
              label="Fecha de Corte"
              type="date"
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Saldo Inicial"
              type="number"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label="Saldo Final"
              type="number"
              value={saldoFinal}
              onChange={(e) => setSaldoFinal(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <Input
            label="Nombre del Archivo"
            type="text"
            value={archivoNombre}
            onChange={(e) => setArchivoNombre(e.target.value)}
            placeholder="estado_cuenta_enero_2026.csv"
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Movimientos (CSV)
            </label>
            <textarea
              className="w-full h-[160px] rounded-md border border-border text-[0.9375rem] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda font-mono text-sm resize-y"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder={
                'Pegue los movimientos separados por tabulador, uno por linea:\nfecha\treferencia\tconcepto\tcargo\tabono\n2026-01-15\tREF001\tPago proveedor\t5000.00\t0\n2026-01-20\tDEP002\tDeposito transferencia\t0\t15000.00'
              }
            />
            <p className="text-xs text-text-muted mt-1">
              Formato por linea (separado por tabulador): fecha, referencia, concepto, cargo, abono
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImportar}
              loading={importar.isPending}
              disabled={!periodoId || !fechaCorte}
            >
              Importar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
