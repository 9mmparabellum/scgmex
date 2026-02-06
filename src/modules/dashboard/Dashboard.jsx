import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { useResumenEgresos, useResumenIngresos } from '../../hooks/usePresupuesto';
import { useResumenDeuda } from '../../hooks/useDeuda';
import { usePolizasList } from '../../hooks/usePoliza';
import { useResumenFondos } from '../../hooks/useFondosFederales';
import { formatMXN, formatDate } from '../../utils/formatters';

/* -- Style maps ---------------------------------------------------------- */

const ALERT_DOT_COLOR = {
  danger: 'bg-[#ff3e1d]',
  warning: 'bg-[#ffab00]',
  info: 'bg-[#03c3ec]',
  success: 'bg-[#71dd37]',
};

const ESTADO_BADGE = {
  aprobada: 'bg-[#71dd37]/10 text-[#71dd37]',
  pendiente: 'bg-[#ffab00]/10 text-[#ffab00]',
  borrador: 'bg-[#8592a3]/10 text-[#8592a3]',
  cancelada: 'bg-[#ff3e1d]/10 text-[#ff3e1d]',
};

const ESTADO_LABEL = {
  aprobada: 'Aprobada',
  pendiente: 'Pendiente',
  borrador: 'Borrador',
  cancelada: 'Cancelada',
};

/* -- SVG icons ----------------------------------------------------------- */

const IconWallet = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const IconDollar = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconDollarAlt = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconAlertTriangle = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* -- Helpers -------------------------------------------------------------- */

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* -- Component ------------------------------------------------------------ */

export default function Dashboard() {
  const { entePublico, ejercicioFiscal } = useAppStore();
  const anio = ejercicioFiscal?.anio || new Date().getFullYear();

  /* Fetch real data */
  const { data: resumenEgresos, isLoading: loadingEgresos } = useResumenEgresos();
  const { data: resumenIngresos, isLoading: loadingIngresos } = useResumenIngresos();
  const { data: resumenDeuda, isLoading: loadingDeuda } = useResumenDeuda();
  const { data: polizas, isLoading: loadingPolizas } = usePolizasList();
  const { data: resumenFondos } = useResumenFondos();

  const loadingStats = loadingEgresos || loadingIngresos || loadingDeuda;

  /* Compute stat cards */
  const aprobado = resumenEgresos?.aprobado || 0;
  const ejercido = resumenEgresos?.ejercido || 0;
  const recaudado = resumenIngresos?.recaudado || 0;
  const estimado = resumenIngresos?.estimado || 0;
  const saldoDeuda = resumenDeuda?.saldo_total || 0;

  const pctEjercido = aprobado > 0 ? (ejercido / aprobado * 100).toFixed(1) : '0.0';
  const pctRecaudado = estimado > 0 ? (recaudado / estimado * 100).toFixed(1) : '0.0';

  const stats = [
    {
      label: 'Presupuesto Aprobado',
      subtitle: 'Monto total autorizado',
      value: aprobado,
      icon: IconWallet,
      iconBg: 'bg-guinda/10',
      iconText: 'text-guinda',
    },
    {
      label: 'Presupuesto Ejercido',
      subtitle: `${pctEjercido}% del aprobado`,
      value: ejercido,
      icon: IconDollar,
      iconBg: 'bg-verde/10',
      iconText: 'text-verde',
    },
    {
      label: 'Ingresos Recaudados',
      subtitle: `${pctRecaudado}% de la estimacion`,
      value: recaudado,
      icon: IconDollarAlt,
      iconBg: 'bg-dorado/10',
      iconText: 'text-dorado',
    },
    {
      label: 'Deuda Publica',
      subtitle: 'Saldo vigente',
      value: saldoDeuda,
      icon: IconAlertTriangle,
      iconBg: 'bg-[#ff3e1d]/10',
      iconText: 'text-[#ff3e1d]',
    },
  ];

  /* Polizas recientes (top 5) */
  const recentPolizas = useMemo(() => (polizas?.slice(0, 5) || []), [polizas]);

  /* Alertas */
  const alerts = useMemo(() => {
    const list = [];
    const pendientes = polizas?.filter(p => p.estado === 'pendiente')?.length || 0;
    if (pendientes > 0) {
      list.push({
        level: 'info',
        text: `${pendientes} poliza${pendientes > 1 ? 's' : ''} pendiente${pendientes > 1 ? 's' : ''} de aprobacion`,
      });
    }

    const pctEjecutado = resumenEgresos?.aprobado > 0
      ? (resumenEgresos.ejercido / resumenEgresos.aprobado * 100)
      : 0;
    if (pctEjecutado > 0 && pctEjecutado < 10) {
      list.push({ level: 'warning', text: 'Ejecucion presupuestal por debajo del 10%' });
    }

    if (!resumenEgresos?.aprobado && !resumenIngresos?.estimado) {
      list.push({ level: 'warning', text: 'Sin datos presupuestales registrados' });
    }

    if (list.length === 0) {
      list.push({ level: 'success', text: 'Sistema operando sin alertas' });
    }
    return list;
  }, [polizas, resumenEgresos, resumenIngresos]);

  /* Avance del ejercicio */
  const progress = useMemo(() => {
    const pctEjec = resumenEgresos?.aprobado > 0
      ? (resumenEgresos.ejercido / resumenEgresos.aprobado * 100)
      : 0;
    const pctRec = resumenIngresos?.estimado > 0
      ? (resumenIngresos.recaudado / resumenIngresos.estimado * 100)
      : 0;
    const pctFondos = resumenFondos?.total_asignado > 0
      ? (resumenFondos.total_ejercido / resumenFondos.total_asignado * 100)
      : 0;
    return [
      { label: 'Ejecucion presupuestal', value: Math.min(pctEjec, 100) },
      { label: 'Recaudacion de ingresos', value: Math.min(pctRec, 100) },
      { label: 'Avance fondos federales', value: Math.min(pctFondos, 100) },
    ];
  }, [resumenEgresos, resumenIngresos, resumenFondos]);

  return (
    <div className="space-y-6">
      {/* -- Page header -------------------------------------------------- */}
      <div>
        <h1 className="text-2xl font-semibold text-text-heading">Dashboard</h1>
        <p className="text-[0.9375rem] text-text-muted mt-1">
          {entePublico?.nombre || 'Ente Publico'} — Ejercicio {anio}
        </p>
      </div>

      {/* -- Stat cards --------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border-0 rounded-lg card-shadow p-6 flex items-start justify-between"
          >
            {/* Left: text content */}
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-text-muted mb-1">{s.label}</p>
              <p className={`text-[22px] font-bold text-text-heading leading-tight tracking-tight ${loadingStats ? 'animate-pulse' : ''}`}>
                {formatMXN(s.value)}
              </p>
              <p className="text-xs text-text-muted mt-1.5">{s.subtitle}</p>
            </div>
            {/* Right: icon circle */}
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${s.iconBg} ${s.iconText}`}
            >
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* -- Middle section: table + sidebar ------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Polizas Recientes (col-span-2) */}
        <div className="lg:col-span-2 bg-white border-0 rounded-lg card-shadow">
          {/* Card header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-border">
            <h2 className="text-[15px] font-semibold text-text-heading">
              Polizas Recientes
            </h2>
            <Link
              to="/contabilidad/polizas"
              className="text-[13px] text-guinda font-medium hover:text-guinda-dark transition-colors"
            >
              Ver todas
            </Link>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loadingPolizas ? (
              <p className="px-6 py-8 text-center text-[13px] text-text-muted">Cargando...</p>
            ) : recentPolizas.length === 0 ? (
              <p className="px-6 py-8 text-center text-[13px] text-text-muted">No hay polizas registradas</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f9fafb]">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Folio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentPolizas.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 last:border-0 hover:bg-bg-hover transition-colors"
                    >
                      <td className="px-6 py-3.5 font-mono text-[13px] text-guinda font-semibold">
                        POL-{anio}-{String(p.numero_poliza).padStart(4, '0')}
                      </td>
                      <td className="px-6 py-3.5 text-[14px] text-text-primary">
                        {capitalize(p.tipo)}
                      </td>
                      <td className="px-6 py-3.5 text-[13px] text-text-muted">
                        {formatDate(p.fecha)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-[14px] font-semibold text-text-heading">
                        --
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize ${ESTADO_BADGE[p.estado] || ''}`}
                        >
                          {ESTADO_LABEL[p.estado] || p.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right column (col-span-1): stacked cards */}
        <div className="lg:col-span-1 space-y-6">
          {/* Alertas card */}
          <div className="bg-white border-0 rounded-lg card-shadow">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-[15px] font-semibold text-text-heading">Alertas</h2>
            </div>
            <div className="p-5 space-y-4">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-[7px] flex-shrink-0 ${ALERT_DOT_COLOR[a.level]}`}
                  />
                  <p className="text-[13px] text-text-primary leading-relaxed">{a.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Avance del Ejercicio card */}
          <div className="bg-white border-0 rounded-lg card-shadow">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-[15px] font-semibold text-text-heading">
                Avance del Ejercicio
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {progress.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-text-primary">{item.label}</span>
                    <span className="text-[13px] font-bold text-text-heading">
                      {item.value.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-bg-main rounded-full h-[6px]">
                    <div
                      className="bg-guinda h-[6px] rounded-full transition-all duration-500"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
