/**
 * Benchmarking.jsx
 * ---------------------------------------------------------------------------
 * Financial benchmarking and comparative analysis page.
 * Supports four analysis types defined in TIPOS_BENCHMARK.
 * Uses mock/demo data for previous-period comparisons while
 * the UI remains production-ready. Module: 'reportes' for RBAC.
 * ---------------------------------------------------------------------------
 */

import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { TIPOS_BENCHMARK } from '../../config/constants';
import { exportToExcel } from '../../utils/exportHelpers';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const fmtPct = (n) => Number(n || 0).toFixed(1) + '%';

/* ── Badge helper ─────────────────────────────────────────────────── */
const badgeVariants = {
  primary: 'bg-guinda/10 text-guinda',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-sky-50 text-sky-600',
  default: 'bg-gray-100 text-gray-600',
};

function Badge({ children, variant = 'default' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeVariants[variant] || badgeVariants.default}`}
    >
      {children}
    </span>
  );
}

/* ── Progress Bar ─────────────────────────────────────────────────── */
function ProgressBar({ value, color = 'bg-guinda' }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-12 text-right">{fmtPct(clamped)}</span>
    </div>
  );
}

/* ── Trend Arrow ──────────────────────────────────────────────────── */
function TrendArrow({ value }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center text-emerald-600 font-medium text-sm" title="Incremento">
        <svg className="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        {fmtPct(Math.abs(value))}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center text-red-600 font-medium text-sm" title="Decremento">
        <svg className="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {fmtPct(Math.abs(value))}
      </span>
    );
  }
  return <span className="text-gray-400 text-sm">--</span>;
}

/* ── Mock Data Generators ─────────────────────────────────────────── */
function buildPeriodComparisonData() {
  const rows = [
    { indicador: 'Ingresos Totales', anterior: 45200000, actual: 48750000 },
    { indicador: 'Gastos Totales', anterior: 42800000, actual: 44100000 },
    { indicador: 'Balance Presupuestal', anterior: 2400000, actual: 4650000 },
    { indicador: 'Saldo Bancos', anterior: 12500000, actual: 14200000 },
    { indicador: 'CxC Total', anterior: 3200000, actual: 2800000 },
    { indicador: 'CxP Total', anterior: 5100000, actual: 4700000 },
    { indicador: 'Deuda Total', anterior: 18000000, actual: 16500000 },
  ];
  return rows.map((r) => {
    const variacion = r.actual - r.anterior;
    const variacionPct = r.anterior ? (variacion / r.anterior) * 100 : 0;
    return { ...r, variacion, variacionPct };
  });
}

function buildIndicadorVsMetaData() {
  return [
    { indicador: 'Recaudacion de Ingresos Propios', meta: 15000000, resultado: 13200000 },
    { indicador: 'Ejecucion del Gasto', meta: 42000000, resultado: 44100000 },
    { indicador: 'Ahorro Presupuestal', meta: 3000000, resultado: 4650000 },
    { indicador: 'Reduccion de Deuda', meta: 2000000, resultado: 1500000 },
    { indicador: 'Cobranza de CxC', meta: 5000000, resultado: 4200000 },
    { indicador: 'Inversion Publica', meta: 8000000, resultado: 7600000 },
    { indicador: 'Gasto Corriente / Ingreso', meta: 70, resultado: 65.2, isPct: true },
    { indicador: 'Autonomia Financiera', meta: 40, resultado: 38.5, isPct: true },
  ].map((r) => {
    const desviacion = r.resultado - r.meta;
    const cumplimiento = r.meta ? (r.resultado / r.meta) * 100 : 0;
    return { ...r, desviacion, cumplimiento };
  });
}

function buildEnteComparisonData() {
  return [
    { ente: 'Municipio Centro', ingresos: 48750000, gastos: 44100000, balance: 4650000, deuda: 16500000 },
    { ente: 'Municipio Norte', ingresos: 32100000, gastos: 31200000, balance: 900000, deuda: 8200000 },
    { ente: 'Municipio Sur', ingresos: 28400000, gastos: 29100000, balance: -700000, deuda: 12100000 },
    { ente: 'Municipio Este', ingresos: 19800000, gastos: 18500000, balance: 1300000, deuda: 5400000 },
    { ente: 'Municipio Oeste', ingresos: 22600000, gastos: 23100000, balance: -500000, deuda: 9800000 },
  ];
}

function buildHistoricoData() {
  return [
    { periodo: '2021', ingresos: 38200000, gastos: 37800000, balance: 400000, deuda: 22000000 },
    { periodo: '2022', ingresos: 40500000, gastos: 39200000, balance: 1300000, deuda: 20500000 },
    { periodo: '2023', ingresos: 43100000, gastos: 41800000, balance: 1300000, deuda: 19200000 },
    { periodo: '2024', ingresos: 45200000, gastos: 42800000, balance: 2400000, deuda: 18000000 },
    { periodo: '2025', ingresos: 48750000, gastos: 44100000, balance: 4650000, deuda: 16500000 },
  ];
}

/* ══════════════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════════════ */
export default function Benchmarking() {
  const { ejercicioFiscal } = useAppStore();
  const [tipoAnalisis, setTipoAnalisis] = useState('periodo');
  const [generated, setGenerated] = useState(false);

  /* ── Data ─────────────────────────────────────────────────────────── */
  const periodData = useMemo(() => buildPeriodComparisonData(), []);
  const indicadorData = useMemo(() => buildIndicadorVsMetaData(), []);
  const enteData = useMemo(() => buildEnteComparisonData(), []);
  const historicoData = useMemo(() => buildHistoricoData(), []);

  /* ── Export handlers ─────────────────────────────────────────────── */
  const handleExport = () => {
    const ejercicio = ejercicioFiscal?.anio || 'actual';

    if (tipoAnalisis === 'periodo') {
      exportToExcel(
        periodData,
        [
          { label: 'Indicador', key: 'indicador' },
          { label: 'Periodo Anterior', getValue: (r) => r.anterior },
          { label: 'Periodo Actual', getValue: (r) => r.actual },
          { label: 'Variacion ($)', getValue: (r) => r.variacion },
          { label: 'Variacion (%)', getValue: (r) => Number(r.variacionPct).toFixed(1) },
        ],
        `Benchmarking_Periodo_${ejercicio}`,
      );
    } else if (tipoAnalisis === 'indicador') {
      exportToExcel(
        indicadorData,
        [
          { label: 'Indicador', key: 'indicador' },
          { label: 'Meta', getValue: (r) => (r.isPct ? fmtPct(r.meta) : r.meta) },
          { label: 'Resultado', getValue: (r) => (r.isPct ? fmtPct(r.resultado) : r.resultado) },
          { label: 'Desviacion', getValue: (r) => (r.isPct ? fmtPct(r.desviacion) : r.desviacion) },
          { label: 'Cumplimiento (%)', getValue: (r) => Number(r.cumplimiento).toFixed(1) },
        ],
        `Benchmarking_Indicadores_${ejercicio}`,
      );
    } else if (tipoAnalisis === 'ente') {
      exportToExcel(
        enteData,
        [
          { label: 'Ente', key: 'ente' },
          { label: 'Ingresos', key: 'ingresos' },
          { label: 'Gastos', key: 'gastos' },
          { label: 'Balance', key: 'balance' },
          { label: 'Deuda', key: 'deuda' },
        ],
        `Benchmarking_Entes_${ejercicio}`,
      );
    } else if (tipoAnalisis === 'historico') {
      exportToExcel(
        historicoData,
        [
          { label: 'Periodo', key: 'periodo' },
          { label: 'Ingresos', key: 'ingresos' },
          { label: 'Gastos', key: 'gastos' },
          { label: 'Balance', key: 'balance' },
          { label: 'Deuda', key: 'deuda' },
        ],
        `Benchmarking_Historico_${ejercicio}`,
      );
    }
  };

  /* ── Table: Comparativo por Periodo ──────────────────────────────── */
  const renderPeriodoTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Indicador</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Periodo Anterior</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Periodo Actual</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Variacion ($)</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Variacion (%)</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          {periodData.map((row, i) => (
            <tr
              key={row.indicador}
              className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
            >
              <td className="py-3 px-4 font-medium text-gray-900">{row.indicador}</td>
              <td className="py-3 px-4 text-right text-gray-600">{fmtMoney(row.anterior)}</td>
              <td className="py-3 px-4 text-right font-medium text-gray-900">{fmtMoney(row.actual)}</td>
              <td
                className={`py-3 px-4 text-right font-medium ${
                  row.variacion >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {fmtMoney(row.variacion)}
              </td>
              <td
                className={`py-3 px-4 text-right font-medium ${
                  row.variacionPct >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {fmtPct(row.variacionPct)}
              </td>
              <td className="py-3 px-4 text-center">
                <TrendArrow value={row.variacionPct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* ── Table: Indicador vs Meta ────────────────────────────────────── */
  const renderIndicadorTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Indicador</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Meta</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Resultado</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Desviacion</th>
            <th className="py-3 px-4 font-semibold text-gray-700 w-48">Cumplimiento</th>
          </tr>
        </thead>
        <tbody>
          {indicadorData.map((row, i) => {
            const cumplColor =
              row.cumplimiento >= 100
                ? 'bg-emerald-500'
                : row.cumplimiento >= 80
                  ? 'bg-amber-500'
                  : 'bg-red-500';
            return (
              <tr
                key={row.indicador}
                className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <td className="py-3 px-4 font-medium text-gray-900">{row.indicador}</td>
                <td className="py-3 px-4 text-right text-gray-600">
                  {row.isPct ? fmtPct(row.meta) : fmtMoney(row.meta)}
                </td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">
                  {row.isPct ? fmtPct(row.resultado) : fmtMoney(row.resultado)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-medium ${
                    row.desviacion >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {row.isPct ? fmtPct(row.desviacion) : fmtMoney(row.desviacion)}
                </td>
                <td className="py-3 px-4">
                  <ProgressBar value={row.cumplimiento} color={cumplColor} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  /* ── Table: Comparativo entre Entes ──────────────────────────────── */
  const renderEnteTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Ente</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Ingresos</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Gastos</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Balance</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Deuda</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
          </tr>
        </thead>
        <tbody>
          {enteData.map((row, i) => (
            <tr
              key={row.ente}
              className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
            >
              <td className="py-3 px-4 font-medium text-gray-900">{row.ente}</td>
              <td className="py-3 px-4 text-right text-gray-600">{fmtMoney(row.ingresos)}</td>
              <td className="py-3 px-4 text-right text-gray-600">{fmtMoney(row.gastos)}</td>
              <td
                className={`py-3 px-4 text-right font-medium ${
                  row.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {fmtMoney(row.balance)}
              </td>
              <td className="py-3 px-4 text-right text-gray-600">{fmtMoney(row.deuda)}</td>
              <td className="py-3 px-4 text-center">
                <Badge variant={row.balance >= 0 ? 'success' : 'danger'}>
                  {row.balance >= 0 ? 'Superavit' : 'Deficit'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* ── Table: Tendencia Historica ───────────────────────────────────── */
  const renderHistoricoTable = () => {
    const rows = historicoData.map((row, idx) => {
      const prev = idx > 0 ? historicoData[idx - 1] : null;
      const ingVar = prev && prev.ingresos ? ((row.ingresos - prev.ingresos) / prev.ingresos) * 100 : null;
      const gasVar = prev && prev.gastos ? ((row.gastos - prev.gastos) / prev.gastos) * 100 : null;
      return { ...row, ingVar, gasVar };
    });

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Periodo</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Ingresos</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Var.</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Gastos</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Var.</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Balance</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Deuda</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.periodo}
                className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <td className="py-3 px-4 font-medium text-gray-900">{row.periodo}</td>
                <td className="py-3 px-4 text-right text-gray-900">{fmtMoney(row.ingresos)}</td>
                <td className="py-3 px-4 text-center">
                  {row.ingVar !== null ? <TrendArrow value={row.ingVar} /> : <span className="text-gray-400 text-sm">--</span>}
                </td>
                <td className="py-3 px-4 text-right text-gray-900">{fmtMoney(row.gastos)}</td>
                <td className="py-3 px-4 text-center">
                  {row.gasVar !== null ? <TrendArrow value={row.gasVar} /> : <span className="text-gray-400 text-sm">--</span>}
                </td>
                <td
                  className={`py-3 px-4 text-right font-medium ${
                    row.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {fmtMoney(row.balance)}
                </td>
                <td className="py-3 px-4 text-right text-gray-600">{fmtMoney(row.deuda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /* ── View Descriptions ───────────────────────────────────────────── */
  const viewDescriptions = {
    periodo: 'Compara indicadores financieros clave entre el periodo actual y el anterior.',
    ente: 'Compara metricas financieras entre diferentes entes publicos.',
    indicador: 'Evalua el cumplimiento de indicadores contra las metas establecidas.',
    historico: 'Muestra la evolucion de indicadores financieros a lo largo del tiempo.',
  };

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <h1 className="text-xl font-bold text-gray-900">Benchmarking Financiero</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Analisis comparativo de indicadores financieros
        </p>
      </div>

      {/* ── Config Bar ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Tipo de analisis */}
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Tipo de Comparacion
            </label>
            <select
              value={tipoAnalisis}
              onChange={(e) => {
                setTipoAnalisis(e.target.value);
                setGenerated(false);
              }}
              className="w-full h-[40px] rounded-md border border-border px-3 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda bg-white"
            >
              {Object.entries(TIPOS_BENCHMARK).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">{viewDescriptions[tipoAnalisis]}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setGenerated(true)}
              className="h-[38px] px-5 rounded-md bg-guinda text-white text-sm font-medium hover:bg-guinda/90 transition-colors"
            >
              Generar Analisis
            </button>
            {generated && (
              <button
                onClick={handleExport}
                className="h-[38px] px-4 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Exportar Excel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      {!generated ? (
        <div className="bg-white rounded-lg card-shadow p-12 text-center">
          <div className="text-gray-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600">Selecciona el tipo de analisis</h3>
          <p className="text-sm text-gray-400 mt-1">
            Elige una comparacion y haz clic en &quot;Generar Analisis&quot; para ver los resultados
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg card-shadow p-5">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {TIPOS_BENCHMARK[tipoAnalisis]}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Ejercicio fiscal: {ejercicioFiscal?.anio || 'N/A'}
              </p>
            </div>
            <Badge variant="primary">Datos de demostracion</Badge>
          </div>

          {/* Table for selected view */}
          {tipoAnalisis === 'periodo' && renderPeriodoTable()}
          {tipoAnalisis === 'indicador' && renderIndicadorTable()}
          {tipoAnalisis === 'ente' && renderEnteTable()}
          {tipoAnalisis === 'historico' && renderHistoricoTable()}

          {/* Summary footer */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span>Los datos mostrados son de demostracion para visualizar la funcionalidad</span>
              {tipoAnalisis === 'periodo' && (
                <span className="ml-auto">
                  Valores positivos indican incremento respecto al periodo anterior
                </span>
              )}
              {tipoAnalisis === 'indicador' && (
                <span className="ml-auto">
                  Barras verdes = cumplimiento al 100%+, amarillas = 80-99%, rojas = menos de 80%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
