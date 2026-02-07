import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useAnomalias, useResumenAnomalias, useEjecutarAnalisis } from '../../hooks/useAnomalias';
import { useList, useCreate, useUpdate } from '../../hooks/useCrud';
import { canEdit } from '../../utils/rbac';
import { TIPOS_ANOMALIA, NIVELES_RIESGO, ESTADOS_ANOMALIA } from '../../config/constants';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { exportToExcel } from '../../utils/exportHelpers';
import { exportToPdf } from '../../utils/exportPdfHelpers';

/* -------------------------------------------------------------------------- */
/*  Helpers: formateo de moneda                                               */
/* -------------------------------------------------------------------------- */
const fmtMXN = (val) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

const fmtDate = (val) =>
  val ? new Date(val).toLocaleDateString('es-MX') : '\u2014';

/* -------------------------------------------------------------------------- */
/*  CLIENT-SIDE DETECTION ENGINE                                              */
/* -------------------------------------------------------------------------- */

function calcMean(values) {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function calcStdDev(values, mean) {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Runs client-side pattern detection on polizas and their movimientos.
 * Returns an array of anomaly records ready to be persisted.
 */
export function detectarAnomalias(polizas = [], movimientos = [], reglas = []) {
  const anomalias = [];
  const now = new Date().toISOString();

  // ---- Helper: get threshold from reglas by tipo ----
  const getUmbral = (tipo, defaultVal) => {
    const regla = reglas.find((r) => r.tipo === tipo && r.activa !== false);
    return regla ? Number(regla.umbral) : defaultVal;
  };

  // ---- 1. Montos inusuales: montos > N desviaciones estandar ----
  const stdDevThreshold = getUmbral('monto_inusual', 3);
  const montos = movimientos.map((m) => Math.abs(m.monto || m.debe || m.haber || 0)).filter((v) => v > 0);
  const mean = calcMean(montos);
  const stdDev = calcStdDev(montos, mean);

  if (stdDev > 0) {
    movimientos.forEach((m) => {
      const monto = Math.abs(m.monto || m.debe || m.haber || 0);
      if (monto > mean + stdDevThreshold * stdDev) {
        anomalias.push({
          tipo: 'monto_inusual',
          nivel_riesgo: monto > mean + 5 * stdDev ? 'critico' : 'alto',
          estado: 'detectada',
          descripcion: `Monto inusual de ${fmtMXN(monto)} detectado (media: ${fmtMXN(mean)}, desv: ${fmtMXN(stdDev)})`,
          monto,
          cuenta_afectada: m.cuenta_codigo || m.cuenta_id || '',
          poliza_referencia: m.poliza_id || '',
          evidencia: `Monto excede ${stdDevThreshold} desviaciones estandar de la media`,
          fecha_deteccion: now,
        });
      }
    });
  }

  // ---- 2. Patrones duplicados: misma cuenta + mismo monto dentro de N dias ----
  const dupDays = getUmbral('patron_duplicado', 7);
  const movsByKey = {};
  movimientos.forEach((m) => {
    const monto = Math.abs(m.monto || m.debe || m.haber || 0);
    const key = `${m.cuenta_codigo || m.cuenta_id}-${monto}`;
    if (!movsByKey[key]) movsByKey[key] = [];
    movsByKey[key].push(m);
  });

  Object.entries(movsByKey).forEach(([, group]) => {
    if (group.length < 2) return;
    const sorted = [...group].sort((a, b) => new Date(a.fecha || a.created_at) - new Date(b.fecha || b.created_at));
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i].fecha || sorted[i].created_at) - new Date(sorted[i - 1].fecha || sorted[i - 1].created_at)) / (1000 * 60 * 60 * 24);
      if (diff <= dupDays && diff >= 0) {
        const monto = Math.abs(sorted[i].monto || sorted[i].debe || sorted[i].haber || 0);
        anomalias.push({
          tipo: 'patron_duplicado',
          nivel_riesgo: 'medio',
          estado: 'detectada',
          descripcion: `Movimiento duplicado: misma cuenta y monto ${fmtMXN(monto)} en ${Math.round(diff)} dias`,
          monto,
          cuenta_afectada: sorted[i].cuenta_codigo || sorted[i].cuenta_id || '',
          poliza_referencia: sorted[i].poliza_id || '',
          evidencia: `Dos movimientos identicos detectados con ${Math.round(diff)} dias de diferencia (umbral: ${dupDays} dias)`,
          fecha_deteccion: now,
        });
      }
    }
  });

  // ---- 3. Horario sospechoso: fines de semana u horarios fuera de oficina ----
  polizas.forEach((p) => {
    const fecha = new Date(p.fecha || p.created_at);
    const day = fecha.getDay();
    const hour = fecha.getHours();
    const isWeekend = day === 0 || day === 6;
    const isAfterHours = hour < 7 || hour > 20;
    if (isWeekend || isAfterHours) {
      anomalias.push({
        tipo: 'horario_sospechoso',
        nivel_riesgo: 'medio',
        estado: 'detectada',
        descripcion: `Poliza registrada ${isWeekend ? 'en fin de semana' : 'fuera de horario laboral'} (${fmtDate(p.fecha || p.created_at)}, ${hour}:00 hrs)`,
        monto: p.total_debe || p.total || 0,
        cuenta_afectada: '',
        poliza_referencia: p.id || '',
        evidencia: isWeekend
          ? `Dia ${day === 0 ? 'domingo' : 'sabado'} — transaccion fuera de dias habiles`
          : `Hora ${hour}:00 — fuera de horario laboral (07:00-20:00)`,
        fecha_deteccion: now,
      });
    }
  });

  // ---- 4. Numeros redondos: montos que son multiplos exactos de 10,000 ----
  const roundThreshold = getUmbral('monto_inusual', 100000);
  movimientos.forEach((m) => {
    const monto = Math.abs(m.monto || m.debe || m.haber || 0);
    if (monto >= roundThreshold && monto % 10000 === 0) {
      anomalias.push({
        tipo: 'monto_inusual',
        nivel_riesgo: 'bajo',
        estado: 'detectada',
        descripcion: `Monto redondo sospechoso: ${fmtMXN(monto)}`,
        monto,
        cuenta_afectada: m.cuenta_codigo || m.cuenta_id || '',
        poliza_referencia: m.poliza_id || '',
        evidencia: `Monto es multiplo exacto de $10,000 y supera el umbral de ${fmtMXN(roundThreshold)}`,
        fecha_deteccion: now,
      });
    }
  });

  // ---- 5. Desviacion presupuestal: ejercido > N% del aprobado ----
  // This applies if presupuesto data is available via poliza metadata
  const desvThreshold = getUmbral('desviacion_presupuestal', 20);
  polizas.forEach((p) => {
    if (p.aprobado && p.ejercido) {
      const pct = ((p.ejercido - p.aprobado) / p.aprobado) * 100;
      if (pct > desvThreshold) {
        anomalias.push({
          tipo: 'desviacion_presupuestal',
          nivel_riesgo: pct > 50 ? 'critico' : 'alto',
          estado: 'detectada',
          descripcion: `Desviacion presupuestal del ${pct.toFixed(1)}% (ejercido ${fmtMXN(p.ejercido)} vs aprobado ${fmtMXN(p.aprobado)})`,
          monto: p.ejercido - p.aprobado,
          cuenta_afectada: p.partida || '',
          poliza_referencia: p.id || '',
          evidencia: `Porcentaje de desviacion: ${pct.toFixed(1)}% — umbral permitido: ${desvThreshold}%`,
          fecha_deteccion: now,
        });
      }
    }
  });

  // ---- 6. Concentracion de proveedor: >N% de compras a un solo proveedor ----
  const concThreshold = getUmbral('proveedor_concentrado', 40);
  const byProveedor = {};
  let totalCompras = 0;
  movimientos.forEach((m) => {
    if (m.proveedor || m.beneficiario) {
      const prov = m.proveedor || m.beneficiario;
      const monto = Math.abs(m.monto || m.debe || m.haber || 0);
      byProveedor[prov] = (byProveedor[prov] || 0) + monto;
      totalCompras += monto;
    }
  });

  if (totalCompras > 0) {
    Object.entries(byProveedor).forEach(([prov, total]) => {
      const pct = (total / totalCompras) * 100;
      if (pct > concThreshold) {
        anomalias.push({
          tipo: 'proveedor_concentrado',
          nivel_riesgo: pct > 70 ? 'critico' : 'alto',
          estado: 'detectada',
          descripcion: `Concentracion de proveedor: "${prov}" con ${pct.toFixed(1)}% del total de compras (${fmtMXN(total)})`,
          monto: total,
          cuenta_afectada: '',
          poliza_referencia: '',
          evidencia: `Proveedor concentra ${pct.toFixed(1)}% — umbral: ${concThreshold}%`,
          fecha_deteccion: now,
        });
      }
    });
  }

  return anomalias;
}

/* -------------------------------------------------------------------------- */
/*  MiniBarChart — inline SVG bar chart (no external library)                 */
/* -------------------------------------------------------------------------- */
function MiniBarChart({ data, colorFn, height = 180 }) {
  if (!data.length) return <p className="text-sm text-text-muted py-8 text-center">Sin datos</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(28, Math.min(56, 400 / data.length));
  const chartWidth = data.length * (barWidth + 8) + 16;

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={height + 40} className="mx-auto">
        {data.map((d, i) => {
          const barH = (d.value / max) * height;
          const x = i * (barWidth + 8) + 8;
          const y = height - barH;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={colorFn ? colorFn(d, i) : '#9D2449'}
                opacity={0.85}
              />
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                className="text-[11px] fill-text-heading font-semibold"
              >
                {d.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={height + 16}
                textAnchor="middle"
                className="text-[10px] fill-text-muted"
              >
                {d.shortLabel || d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SummaryCard                                                               */
/* -------------------------------------------------------------------------- */
function SummaryCard({ icon, label, value, sublabel, color = 'text-guinda', bgColor = 'bg-guinda/10' }) {
  return (
    <div className="bg-white rounded-lg card-shadow p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-sm font-medium text-text-heading">{label}</p>
        {sublabel && <p className="text-xs text-text-muted">{sublabel}</p>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  LoadingSpinner                                                            */
/* -------------------------------------------------------------------------- */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="animate-spin h-8 w-8 text-guinda" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  AnomaliasMain — Dashboard principal                                       */
/* -------------------------------------------------------------------------- */
export default function AnomaliasMain() {
  const { entePublico, ejercicioFiscal, rol } = useAppStore();
  const enteId = entePublico?.id;
  const ejercicioId = ejercicioFiscal?.id;
  const editable = canEdit(rol, 'anomalias');

  /* ---- Data hooks -------------------------------------------------------- */
  const { data: anomalias = [], isLoading } = useAnomalias(enteId, ejercicioId);
  const { data: resumen } = useResumenAnomalias(enteId, ejercicioId);
  const ejecutarAnalisis = useEjecutarAnalisis();
  const createAnomalia = useCreate('anomalia');
  const updateAnomalia = useUpdate('anomalia');

  // Polizas & movimientos for client-side detection
  const { data: polizas = [] } = useList('poliza', {
    filter: { ejercicio_id: ejercicioId },
  });
  const { data: movimientos = [] } = useList('movimiento_poliza', {
    filter: { ejercicio_id: ejercicioId },
  });
  const { data: reglas = [] } = useList('regla_anomalia', {
    filter: { ente_id: enteId },
  });

  /* ---- Filters ----------------------------------------------------------- */
  const [filters, setFilters] = useState({ tipo: '', nivel_riesgo: '', estado: '' });
  const setFilter = (key, value) => setFilters((p) => ({ ...p, [key]: value }));
  const clearFilters = () => setFilters({ tipo: '', nivel_riesgo: '', estado: '' });
  const hasActiveFilters = Object.values(filters).some(Boolean);

  /* ---- Detail modal state ------------------------------------------------ */
  const [selectedAnomalia, setSelectedAnomalia] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editEstado, setEditEstado] = useState('');
  const [editNotas, setEditNotas] = useState('');
  const [saving, setSaving] = useState(false);

  /* ---- Analysis state ---------------------------------------------------- */
  const [analyzing, setAnalyzing] = useState(false);

  /* ---- Resumen values ---------------------------------------------------- */
  const total = resumen?.total ?? anomalias.length;
  const criticas = resumen?.criticas ?? anomalias.filter((a) => a.nivel_riesgo === 'critico').length;
  const altas = resumen?.altas ?? anomalias.filter((a) => a.nivel_riesgo === 'alto').length;
  const enRevision = resumen?.enRevision ?? anomalias.filter((a) => a.estado === 'en_revision').length;
  const resueltas = resumen?.resueltas ?? anomalias.filter((a) => a.estado === 'resuelta').length;

  /* ---- Filtered data ----------------------------------------------------- */
  const filteredAnomalias = useMemo(() => {
    let result = anomalias;
    if (filters.tipo) result = result.filter((a) => a.tipo === filters.tipo);
    if (filters.nivel_riesgo) result = result.filter((a) => a.nivel_riesgo === filters.nivel_riesgo);
    if (filters.estado) result = result.filter((a) => a.estado === filters.estado);
    return result;
  }, [anomalias, filters]);

  /* ---- Chart data -------------------------------------------------------- */
  const chartByTipo = useMemo(() => {
    const counts = {};
    Object.keys(TIPOS_ANOMALIA).forEach((k) => { counts[k] = 0; });
    anomalias.forEach((a) => { if (counts[a.tipo] !== undefined) counts[a.tipo]++; });
    return Object.entries(counts)
      .map(([key, value]) => ({
        label: TIPOS_ANOMALIA[key],
        shortLabel: TIPOS_ANOMALIA[key].split(' ')[0],
        value,
        key,
      }))
      .filter((d) => d.value > 0);
  }, [anomalias]);

  const riesgoColors = { bajo: '#03c3ec', medio: '#ffab00', alto: '#ff3e1d', critico: '#9D2449' };

  const chartByRiesgo = useMemo(() => {
    const counts = {};
    Object.keys(NIVELES_RIESGO).forEach((k) => { counts[k] = 0; });
    anomalias.forEach((a) => { if (counts[a.nivel_riesgo] !== undefined) counts[a.nivel_riesgo]++; });
    return Object.entries(counts).map(([key, value]) => ({
      label: NIVELES_RIESGO[key].label,
      shortLabel: NIVELES_RIESGO[key].label,
      value,
      key,
    }));
  }, [anomalias]);

  /* ---- Select options ---------------------------------------------------- */
  const tipoOptions = useMemo(
    () => Object.entries(TIPOS_ANOMALIA).map(([value, label]) => ({ value, label })),
    [],
  );
  const riesgoOptions = useMemo(
    () => Object.entries(NIVELES_RIESGO).map(([value, { label }]) => ({ value, label })),
    [],
  );
  const estadoOptions = useMemo(
    () => Object.entries(ESTADOS_ANOMALIA).map(([value, { label }]) => ({ value, label })),
    [],
  );

  /* ---- Table columns ----------------------------------------------------- */
  const columns = useMemo(
    () => [
      {
        key: 'fecha_deteccion',
        label: 'Fecha',
        width: '110px',
        render: (val) => fmtDate(val),
      },
      {
        key: 'tipo',
        label: 'Tipo',
        width: '150px',
        render: (val) => TIPOS_ANOMALIA[val] || val || '\u2014',
      },
      {
        key: 'descripcion',
        label: 'Descripcion',
        render: (val) => (
          <span className="line-clamp-2 text-sm">{val || '\u2014'}</span>
        ),
      },
      {
        key: 'nivel_riesgo',
        label: 'Riesgo',
        width: '110px',
        render: (val) => {
          const cfg = NIVELES_RIESGO[val];
          return <Badge variant={cfg?.variant || 'default'}>{cfg?.label || val || '\u2014'}</Badge>;
        },
      },
      {
        key: 'estado',
        label: 'Estado',
        width: '120px',
        render: (val) => {
          const cfg = ESTADOS_ANOMALIA[val];
          return <Badge variant={cfg?.variant || 'default'}>{cfg?.label || val || '\u2014'}</Badge>;
        },
      },
      {
        key: 'monto',
        label: 'Monto',
        width: '130px',
        render: (val) => <span className="font-mono text-sm">{fmtMXN(val)}</span>,
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '80px',
        sortable: false,
        render: (_, row) => (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              openDetail(row);
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Button>
        ),
      },
    ],
    [],
  );

  /* ---- Handlers ---------------------------------------------------------- */
  const openDetail = useCallback((anomalia) => {
    setSelectedAnomalia(anomalia);
    setEditEstado(anomalia.estado || 'detectada');
    setEditNotas(anomalia.notas || '');
    setDetailOpen(true);
  }, []);

  const handleSaveDetail = useCallback(async () => {
    if (!selectedAnomalia?.id) return;
    setSaving(true);
    try {
      await updateAnomalia.mutateAsync({
        id: selectedAnomalia.id,
        estado: editEstado,
        notas: editNotas,
      });
      setDetailOpen(false);
    } finally {
      setSaving(false);
    }
  }, [selectedAnomalia, editEstado, editNotas, updateAnomalia]);

  const handleEjecutarAnalisis = useCallback(async () => {
    if (!enteId || !ejercicioId) return;
    setAnalyzing(true);
    try {
      // First attempt server-side analysis
      await ejecutarAnalisis.mutateAsync({ enteId, ejercicioId });
    } catch {
      // Fallback: run client-side detection engine
      const detected = detectarAnomalias(polizas, movimientos, reglas);
      for (const anomalia of detected) {
        await createAnomalia.mutateAsync({
          ...anomalia,
          ente_id: enteId,
          ejercicio_id: ejercicioId,
        });
      }
    } finally {
      setAnalyzing(false);
    }
  }, [enteId, ejercicioId, ejecutarAnalisis, polizas, movimientos, reglas, createAnomalia]);

  /* ---- Export ------------------------------------------------------------- */
  const exportColumns = [
    { key: 'fecha_deteccion', label: 'Fecha', getValue: (r) => fmtDate(r.fecha_deteccion) },
    { key: 'tipo', label: 'Tipo', getValue: (r) => TIPOS_ANOMALIA[r.tipo] || r.tipo },
    { key: 'descripcion', label: 'Descripcion' },
    { key: 'nivel_riesgo', label: 'Nivel Riesgo', getValue: (r) => NIVELES_RIESGO[r.nivel_riesgo]?.label || r.nivel_riesgo },
    { key: 'estado', label: 'Estado', getValue: (r) => ESTADOS_ANOMALIA[r.estado]?.label || r.estado },
    { key: 'monto', label: 'Monto' },
    { key: 'cuenta_afectada', label: 'Cuenta Afectada' },
    { key: 'poliza_referencia', label: 'Poliza Referencia' },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredAnomalias, exportColumns, 'anomalias_detectadas');
  };

  const handleExportPdf = () => {
    exportToPdf(filteredAnomalias, exportColumns, 'anomalias_detectadas', {
      title: 'Deteccion de Anomalias (IA)',
      subtitle: `Ejercicio Fiscal ${ejercicioFiscal?.anio || ''}`,
      ente: entePublico?.nombre || '',
    });
  };

  /* ---- Render ------------------------------------------------------------ */
  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Deteccion de Anomalias (IA)
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Motor de deteccion de patrones anomalos en operaciones contables y presupuestales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={handleExportExcel}>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Excel
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={handleExportPdf}>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            PDF
          </Button>
          {editable && (
            <Button onClick={handleEjecutarAnalisis} loading={analyzing}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Ejecutar Analisis
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={
            <svg className="w-6 h-6 text-guinda" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          label="Total Anomalias"
          value={total}
          sublabel="detectadas este periodo"
          color="text-guinda"
          bgColor="bg-guinda/10"
        />
        <SummaryCard
          icon={
            <svg className="w-6 h-6 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          label="Criticas + Altas"
          value={criticas + altas}
          sublabel={`${criticas} criticas, ${altas} altas`}
          color="text-danger"
          bgColor="bg-danger/10"
        />
        <SummaryCard
          icon={
            <svg className="w-6 h-6 text-[#e09600]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          label="En Revision"
          value={enRevision}
          sublabel="pendientes de analisis"
          color="text-[#e09600]"
          bgColor="bg-[#ffab00]/10"
        />
        <SummaryCard
          icon={
            <svg className="w-6 h-6 text-[#56ca00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          label="Resueltas"
          value={resueltas}
          sublabel="anomalias resueltas"
          color="text-[#56ca00]"
          bgColor="bg-[#71dd37]/10"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg card-shadow p-5">
          <h3 className="text-sm font-semibold text-text-heading mb-4">Anomalias por Tipo</h3>
          <MiniBarChart
            data={chartByTipo}
            colorFn={() => '#9D2449'}
          />
        </div>
        <div className="bg-white rounded-lg card-shadow p-5">
          <h3 className="text-sm font-semibold text-text-heading mb-4">Anomalias por Nivel de Riesgo</h3>
          <MiniBarChart
            data={chartByRiesgo}
            colorFn={(d) => riesgoColors[d.key] || '#9D2449'}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg card-shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Select
            label="Tipo"
            options={tipoOptions}
            value={filters.tipo}
            onChange={(e) => setFilter('tipo', e.target.value)}
            placeholder="Todos los tipos"
          />
          <Select
            label="Nivel de Riesgo"
            options={riesgoOptions}
            value={filters.nivel_riesgo}
            onChange={(e) => setFilter('nivel_riesgo', e.target.value)}
            placeholder="Todos los niveles"
          />
          <Select
            label="Estado"
            options={estadoOptions}
            value={filters.estado}
            onChange={(e) => setFilter('estado', e.target.value)}
            placeholder="Todos los estados"
          />
          <div className="flex items-end">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <DataTable
          columns={columns}
          data={filteredAnomalias}
          onRowClick={openDetail}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle de Anomalia"
        size="lg"
      >
        {selectedAnomalia && (
          <div className="space-y-5">
            {/* Tipo + Riesgo badges */}
            <div className="flex items-center gap-3">
              <Badge variant={NIVELES_RIESGO[selectedAnomalia.nivel_riesgo]?.variant || 'default'}>
                {NIVELES_RIESGO[selectedAnomalia.nivel_riesgo]?.label || selectedAnomalia.nivel_riesgo}
              </Badge>
              <Badge variant="primary">
                {TIPOS_ANOMALIA[selectedAnomalia.tipo] || selectedAnomalia.tipo}
              </Badge>
              <Badge variant={ESTADOS_ANOMALIA[selectedAnomalia.estado]?.variant || 'default'}>
                {ESTADOS_ANOMALIA[selectedAnomalia.estado]?.label || selectedAnomalia.estado}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-heading mb-1.5">Descripcion</label>
              <p className="text-[0.9375rem] text-text-primary bg-[#f9fafb] rounded-md p-3">
                {selectedAnomalia.descripcion || '\u2014'}
              </p>
            </div>

            {/* Evidence */}
            <div>
              <label className="block text-sm font-medium text-text-heading mb-1.5">Evidencia</label>
              <p className="text-[0.9375rem] text-text-primary bg-[#f9fafb] rounded-md p-3">
                {selectedAnomalia.evidencia || '\u2014'}
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1.5">Cuenta Afectada</label>
                <p className="text-[0.9375rem] text-text-primary font-mono bg-[#f9fafb] rounded-md p-3">
                  {selectedAnomalia.cuenta_afectada || '\u2014'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1.5">Poliza Referencia</label>
                <p className="text-[0.9375rem] text-text-primary font-mono bg-[#f9fafb] rounded-md p-3">
                  {selectedAnomalia.poliza_referencia || '\u2014'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1.5">Monto</label>
                <p className="text-[0.9375rem] text-text-primary font-mono font-semibold bg-[#f9fafb] rounded-md p-3">
                  {fmtMXN(selectedAnomalia.monto)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1.5">Fecha Deteccion</label>
                <p className="text-[0.9375rem] text-text-primary bg-[#f9fafb] rounded-md p-3">
                  {fmtDate(selectedAnomalia.fecha_deteccion)}
                </p>
              </div>
            </div>

            {/* Editable fields */}
            {editable && (
              <>
                <div className="border-t border-border pt-4">
                  <Select
                    label="Cambiar Estado"
                    options={estadoOptions}
                    value={editEstado}
                    onChange={(e) => setEditEstado(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-heading mb-1.5">
                    Notas
                  </label>
                  <textarea
                    className="block w-full rounded-md border border-border bg-white text-text-heading text-[0.9375rem] px-3.5 py-2.5 placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-guinda/25 focus:border-guinda min-h-[80px]"
                    rows={3}
                    value={editNotas}
                    onChange={(e) => setEditNotas(e.target.value)}
                    placeholder="Agregar notas sobre esta anomalia..."
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button variant="ghost" onClick={() => setDetailOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveDetail} loading={saving}>
                    Guardar Cambios
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
