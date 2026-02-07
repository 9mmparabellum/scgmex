import { useState, useMemo, useCallback } from 'react';
import { useList } from '../../hooks/useCrud';
import { useAppStore } from '../../stores/appStore';
import {
  useEstadoSituacionFinanciera,
  useEstadoActividades,
  useEstadoVariacionHacienda,
  useEstadoAnaliticoActivo,
} from '../../hooks/useReportes';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { exportToExcel } from '../../utils/exportHelpers';
import {
  CATALOGO_REPORTES,
  getReportesPorNivel,
  generarReporte,
} from '../../utils/reportesCONAC';
import { generarPdfCONAC } from '../../utils/pdfReporteCONAC';

// ── Formatting ──────────────────────────────────────────────────────────────

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const fmtCompact = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n || 0);

// ── Constants ───────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { key: 'contable', label: 'Contables', color: 'primary' },
  { key: 'presupuestal', label: 'Presupuestales', color: 'info' },
  { key: 'programatico', label: 'Programaticos', color: 'warning' },
];

const NIVEL_BADGE = {
  federal: { label: 'Federal', variant: 'danger' },
  estatal: { label: 'Estatal', variant: 'info' },
  municipal: { label: 'Municipal', variant: 'success' },
};

// ── SVG Icons ───────────────────────────────────────────────────────────────

function IconDownload({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconPdf({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function IconChart({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 mr-3 text-guinda" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ================================================================== */
/*  ReporteViewer: Renders any CONAC structured report as HTML table   */
/* ================================================================== */

function ReporteViewer({ reporte }) {
  if (!reporte) return null;

  const { titulo, columnas = [], secciones = [], totales, notas } = reporte;

  return (
    <div className="space-y-1">
      {/* Report header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-text-primary">{titulo}</h2>
        {reporte.subtitulo && (
          <p className="text-xs text-text-muted mt-0.5">{reporte.subtitulo}</p>
        )}
        <p className="text-[11px] text-text-muted italic mt-0.5">(Cifras en Pesos y Centavos)</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-guinda">
                {columnas.map((col) => (
                  <th
                    key={col.key}
                    className={`text-xs font-semibold text-white uppercase tracking-wider px-5 py-3 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {secciones.map((seccion, si) => (
                <SectionBlock key={si} seccion={seccion} columnas={columnas} />
              ))}
            </tbody>

            {/* Grand total */}
            {totales && (
              <tfoot>
                <tr className="bg-guinda text-white font-bold">
                  {columnas.map((col, ci) => {
                    let content = '';
                    if (ci === 0) content = '';
                    else if (ci === 1) content = totales.label || 'TOTAL';
                    else if (totales.valores && totales.valores[col.key] != null) {
                      content = fmtMoney(totales.valores[col.key]);
                    } else if (ci === columnas.length - 1 && totales.valor != null) {
                      content = fmtMoney(totales.valor);
                    }
                    return (
                      <td
                        key={col.key}
                        className={`px-5 py-3.5 text-sm ${
                          col.align === 'right' ? 'text-right font-mono' : ''
                        }`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Notes */}
      {notas && (
        <div className="bg-[#f9fafb] rounded-lg p-4 text-xs text-text-secondary mt-3">
          <span className="font-semibold">Nota: </span>{notas}
        </div>
      )}
    </div>
  );
}

function SectionBlock({ seccion, columnas }) {
  return (
    <>
      {/* Section header row */}
      <tr className="bg-[#f5f5f8]">
        <td
          colSpan={columnas.length}
          className="px-5 py-2.5 text-xs font-bold text-text-primary uppercase tracking-wider"
        >
          {seccion.titulo}
        </td>
      </tr>
      {/* Data rows */}
      {(seccion.filas || []).length === 0 ? (
        <tr>
          <td colSpan={columnas.length} className="px-5 py-4 text-center text-xs text-text-muted">
            Sin datos para esta seccion
          </td>
        </tr>
      ) : (
        seccion.filas.map((fila, fi) => (
          <tr key={fi} className="border-b border-[#f0f0f0] hover:bg-[#f9fafb]">
            {columnas.map((col) => {
              const val = fila[col.key];
              const isMoney = col.format || (typeof val === 'number' && col.align === 'right');
              return (
                <td
                  key={col.key}
                  className={`px-5 py-2.5 text-sm ${
                    col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : ''
                  } ${col.key === 'codigo' ? 'font-mono text-text-secondary' : ''}`}
                >
                  {isMoney && typeof val === 'number' ? fmtMoney(val) : (val ?? '')}
                </td>
              );
            })}
          </tr>
        ))
      )}
      {/* Subtotal row */}
      {seccion.subtotal != null && (
        <tr className="bg-[#e9e9ed] font-bold border-t border-guinda/20">
          {columnas.map((col, ci) => {
            let content = '';
            if (ci === 1) content = `SUBTOTAL ${seccion.titulo}`;
            if (ci === columnas.length - 1) content = fmtMoney(seccion.subtotal);
            return (
              <td
                key={col.key}
                className={`px-5 py-2.5 text-sm ${col.align === 'right' ? 'text-right font-mono' : ''}`}
              >
                {content}
              </td>
            );
          })}
        </tr>
      )}
    </>
  );
}

/* ================================================================== */
/*  SummaryDashboard: Key metrics cards + mini bar chart               */
/* ================================================================== */

function SummaryDashboard({ situacion, actividades }) {
  const totalActivo   = situacion?.activo?.total || 0;
  const totalPasivo   = situacion?.pasivo?.total || 0;
  const totalHacienda = situacion?.hacienda?.total || 0;
  const totalIngresos = actividades?.ingresos?.total || 0;
  const totalGastos   = actividades?.gastos?.total || 0;
  const resultado     = totalIngresos - totalGastos;

  const cards = [
    { label: 'Total Activos', value: totalActivo, color: 'bg-blue-500' },
    { label: 'Total Pasivos', value: totalPasivo, color: 'bg-orange-500' },
    { label: 'Hacienda Publica', value: totalHacienda, color: 'bg-guinda' },
    { label: 'Ingresos', value: totalIngresos, color: 'bg-green-500' },
    { label: 'Egresos', value: totalGastos, color: 'bg-red-500' },
  ];

  // Build mini bar chart data from ingresos/gastos
  const maxVal = Math.max(totalIngresos, totalGastos, 1);
  const ingPct = Math.round((totalIngresos / maxVal) * 100);
  const egPct  = Math.round((totalGastos / maxVal) * 100);

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg card-shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${card.color}`} />
              <span className="text-xs text-text-muted">{card.label}</span>
            </div>
            <p className="text-lg font-bold text-text-primary font-mono">
              {fmtCompact(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Mini bar chart: Ingresos vs Egresos */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <IconChart />
          Resumen: Ingresos vs Egresos
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Ingresos</span>
              <span className="font-mono">{fmtMoney(totalIngresos)}</span>
            </div>
            <div className="h-6 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${ingPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Egresos</span>
              <span className="font-mono">{fmtMoney(totalGastos)}</span>
            </div>
            <div className="h-6 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${egPct}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-text-primary">
              Resultado del Ejercicio (Ahorro / Desahorro)
            </span>
            <span className={`text-lg font-bold font-mono ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmtMoney(resultado)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                      */
/* ================================================================== */

export default function EstadosFinancieros() {
  const { entePublico, ejercicioFiscal, periodoContable } = useAppStore();
  const [periodoId, setPeriodoId] = useState('');
  const [activeCategoria, setActiveCategoria] = useState('contable');
  const [selectedReporte, setSelectedReporte] = useState('');

  const nivelGobierno = entePublico?.nivel_gobierno || 'federal';
  const nivelBadge = NIVEL_BADGE[nivelGobierno] || NIVEL_BADGE.federal;

  // ── Periodos ──────────────────────────────────────────────────────────

  const { data: periodos = [] } = useList('periodo_contable', {
    filter: { ejercicio_id: ejercicioFiscal?.id },
    order: { column: 'numero', ascending: true },
  });

  const periodoOptions = useMemo(
    () => periodos.map((p) => ({ value: p.id, label: p.nombre || `Periodo ${p.numero}` })),
    [periodos]
  );

  const periodoActual = useMemo(
    () => periodos.find((p) => p.id === periodoId) || null,
    [periodos, periodoId]
  );

  // ── Available reports for this nivel_gobierno ─────────────────────────

  const reportKeys = useMemo(() => getReportesPorNivel(nivelGobierno), [nivelGobierno]);

  const reportesByCategoria = useMemo(() => {
    const map = { contable: [], presupuestal: [], programatico: [] };
    for (const key of reportKeys) {
      const meta = CATALOGO_REPORTES[key];
      if (meta) {
        map[meta.categoria]?.push(meta);
      }
    }
    return map;
  }, [reportKeys]);

  const reporteOptions = useMemo(
    () =>
      (reportesByCategoria[activeCategoria] || []).map((r) => ({
        value: r.key,
        label: `${r.orden}. ${r.nombre}`,
      })),
    [reportesByCategoria, activeCategoria]
  );

  // ── Data hooks ────────────────────────────────────────────────────────

  const { data: situacion, isLoading: loadingSituacion } = useEstadoSituacionFinanciera(periodoId);
  const { data: actividades, isLoading: loadingActividades } = useEstadoActividades(periodoId);
  const { data: variacion, isLoading: loadingVariacion } = useEstadoVariacionHacienda(periodoId);
  const { data: analitico, isLoading: loadingAnalitico } = useEstadoAnaliticoActivo(periodoId);

  const isLoading = loadingSituacion || loadingActividades || loadingVariacion || loadingAnalitico;

  // ── Build unified data payload for CONAC generator ────────────────────

  const unifiedData = useMemo(() => {
    // Build saldos array from all available data
    const saldoEntries = [];
    const cuentasEntries = [];

    // From situacion
    if (situacion) {
      for (const section of ['activo', 'pasivo', 'hacienda']) {
        const cuentas = situacion[section]?.cuentas || [];
        for (const c of cuentas) {
          cuentasEntries.push(c);
          saldoEntries.push({ cuenta_id: c.id, saldo_final: c.saldo_final || 0 });
        }
      }
    }
    // From actividades
    if (actividades) {
      for (const section of ['ingresos', 'gastos']) {
        const cuentas = actividades[section]?.cuentas || [];
        for (const c of cuentas) {
          if (!cuentasEntries.find((e) => e.id === c.id)) {
            cuentasEntries.push(c);
            saldoEntries.push({ cuenta_id: c.id, saldo_final: c.saldo_final || c.monto || 0 });
          }
        }
      }
    }
    // From analitico (has full saldo data)
    if (analitico) {
      const cuentas = Array.isArray(analitico) ? analitico : analitico?.cuentas || [];
      for (const c of cuentas) {
        const existing = saldoEntries.find((s) => s.cuenta_id === c.id);
        if (existing) {
          existing.saldo_inicial = c.saldo_inicial;
          existing.total_debe = c.total_debe || c.debe;
          existing.total_haber = c.total_haber || c.haber;
        } else {
          cuentasEntries.push(c);
          saldoEntries.push({
            cuenta_id: c.id,
            saldo_inicial: c.saldo_inicial || 0,
            total_debe: c.total_debe || c.debe || 0,
            total_haber: c.total_haber || c.haber || 0,
            saldo_final: c.saldo_final || 0,
          });
        }
      }
    }

    return {
      saldos: saldoEntries,
      cuentas: cuentasEntries,
      presupuesto: [],
      indicadores: [],
      movimientos: [],
    };
  }, [situacion, actividades, analitico]);

  // ── Generate selected report ──────────────────────────────────────────

  const generatedReporte = useMemo(() => {
    if (!selectedReporte || !periodoId) return null;
    try {
      return generarReporte(
        selectedReporte,
        unifiedData,
        entePublico,
        periodoActual,
        ejercicioFiscal
      );
    } catch (err) {
      console.warn('Error generando reporte:', err);
      return null;
    }
  }, [selectedReporte, periodoId, unifiedData, entePublico, periodoActual, ejercicioFiscal]);

  // ── Export handlers ───────────────────────────────────────────────────

  const handleExportPdf = useCallback(async () => {
    if (!generatedReporte) return;
    await generarPdfCONAC(generatedReporte, {
      ente: entePublico,
      ejercicio: ejercicioFiscal,
      periodo: periodoActual,
      nivelGobierno,
    });
  }, [generatedReporte, entePublico, ejercicioFiscal, periodoActual, nivelGobierno]);

  const handleExportExcel = useCallback(() => {
    if (!generatedReporte) return;
    const { columnas, secciones, titulo } = generatedReporte;
    const allRows = [];
    for (const seccion of (secciones || [])) {
      for (const fila of (seccion.filas || [])) {
        allRows.push(fila);
      }
    }
    const excelCols = columnas.map((c) => ({
      key: c.key,
      label: c.label,
    }));
    const safeName = titulo.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_').substring(0, 50);
    exportToExcel(allRows, excelCols, safeName);
  }, [generatedReporte]);

  const handleExportAllPdf = useCallback(async () => {
    if (!periodoId) return;
    const contableKeys = reportKeys.filter((k) => CATALOGO_REPORTES[k]?.categoria === 'contable' && k !== 'NOTAS');
    for (const key of contableKeys) {
      try {
        const rep = generarReporte(key, unifiedData, entePublico, periodoActual, ejercicioFiscal);
        await generarPdfCONAC(rep, {
          ente: entePublico,
          ejercicio: ejercicioFiscal,
          periodo: periodoActual,
          nivelGobierno,
        });
      } catch (err) {
        console.warn(`No se pudo generar ${key}:`, err);
      }
    }
  }, [periodoId, reportKeys, unifiedData, entePublico, periodoActual, ejercicioFiscal, nivelGobierno]);

  // ── Tab change resets report selection ─────────────────────────────────

  const handleCategoriaChange = (cat) => {
    setActiveCategoria(cat);
    setSelectedReporte('');
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ──── Page Header ──── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-3">
            Estados Financieros
            <Badge variant={nivelBadge.variant}>{nivelBadge.label}</Badge>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Art. 46-50 LGCG — Reportes CONAC del ente publico ({reportKeys.length} reportes aplicables)
          </p>
        </div>
      </div>

      {/* ──── Controls Bar ──── */}
      <div className="bg-white rounded-lg card-shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Select
            label="Periodo Contable"
            placeholder="Seleccionar periodo..."
            options={periodoOptions}
            value={periodoId}
            onChange={(e) => {
              setPeriodoId(e.target.value);
              setSelectedReporte('');
            }}
          />
          <Select
            label="Reporte"
            placeholder="Seleccionar reporte..."
            options={reporteOptions}
            value={selectedReporte}
            onChange={(e) => setSelectedReporte(e.target.value)}
            disabled={!periodoId}
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportPdf}
              disabled={!generatedReporte}
            >
              <IconPdf className="w-4 h-4 mr-1" />
              PDF (CONAC)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportExcel}
              disabled={!generatedReporte}
            >
              <IconDownload className="w-4 h-4 mr-1" />
              Excel
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleExportAllPdf}
              disabled={!periodoId || isLoading}
            >
              Exportar todos (PDF)
            </Button>
          </div>
        </div>
      </div>

      {/* ──── Category Tabs ──── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIAS.map((cat) => {
          const count = (reportesByCategoria[cat.key] || []).length;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoriaChange(cat.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeCategoria === cat.key
                  ? 'bg-guinda text-white shadow-md'
                  : 'bg-white card-shadow text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat.label}
              <span
                className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                  activeCategoria === cat.key
                    ? 'bg-white/20 text-white'
                    : 'bg-[#f0f0f0] text-text-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ──── Report list (clickable cards) ──── */}
      {!selectedReporte && periodoId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {(reportesByCategoria[activeCategoria] || []).map((meta) => (
            <button
              key={meta.key}
              onClick={() => setSelectedReporte(meta.key)}
              className="bg-white rounded-lg card-shadow p-4 text-left hover:ring-2 hover:ring-guinda/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-guinda/10 flex items-center justify-center text-guinda font-bold text-xs shrink-0">
                  {meta.orden}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary group-hover:text-guinda transition-colors leading-tight">
                    {meta.nombre}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">{meta.key}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ──── Content Area ──── */}
      {!periodoId ? (
        /* No period selected */
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16 text-text-muted text-sm">
            <svg className="w-12 h-12 mx-auto mb-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Seleccione un periodo contable para generar estados financieros
          </div>
        </div>
      ) : isLoading ? (
        /* Loading */
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="flex items-center justify-center py-16 text-text-muted text-sm">
            <Spinner />
            Cargando datos financieros...
          </div>
        </div>
      ) : selectedReporte && generatedReporte ? (
        /* Report viewer */
        <div>
          {/* Back button */}
          <button
            onClick={() => setSelectedReporte('')}
            className="text-sm text-guinda hover:text-guinda-dark font-medium mb-3 flex items-center gap-1 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al listado
          </button>
          <ReporteViewer reporte={generatedReporte} />
        </div>
      ) : selectedReporte && !generatedReporte ? (
        /* Report selected but no data */
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="text-center py-16 text-text-muted text-sm">
            No hay datos disponibles para generar este reporte en el periodo seleccionado.
            <br />
            <span className="text-xs mt-1 block">
              Verifique que existan movimientos contables registrados.
            </span>
          </div>
        </div>
      ) : (
        /* Summary dashboard (no report selected) */
        <SummaryDashboard situacion={situacion} actividades={actividades} />
      )}
    </div>
  );
}
