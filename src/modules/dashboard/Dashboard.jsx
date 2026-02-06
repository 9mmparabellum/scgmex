import { useAppStore } from '../../stores/appStore';
import { formatMXN } from '../../utils/formatters';

/* ── Static demo data ────────────────────────────────────── */

const STATS = [
  {
    label: 'Presupuesto Aprobado',
    subtitle: 'Monto total autorizado',
    value: 185_000_000,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
    color: 'guinda',
    iconBg: 'bg-guinda/10',
    iconText: 'text-guinda',
  },
  {
    label: 'Presupuesto Ejercido',
    subtitle: '6.7% del aprobado',
    value: 12_450_000,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    color: 'verde',
    iconBg: 'bg-verde/10',
    iconText: 'text-verde',
  },
  {
    label: 'Ingresos Recaudados',
    subtitle: '12.3% de la estimacion',
    value: 8_320_000,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    color: 'dorado',
    iconBg: 'bg-dorado/10',
    iconText: 'text-dorado',
  },
  {
    label: 'Deuda Publica',
    subtitle: 'Saldo vigente',
    value: 45_000_000,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: 'danger',
    iconBg: 'bg-[#ff3e1d]/10',
    iconText: 'text-[#ff3e1d]',
  },
];

const RECENT_POLIZAS = [
  { folio: 'POL-2026-0001', tipo: 'Ingreso', fecha: '15 Ene 2026', monto: 150000, estado: 'aprobada' },
  { folio: 'POL-2026-0002', tipo: 'Egreso', fecha: '16 Ene 2026', monto: 85000, estado: 'pendiente' },
  { folio: 'POL-2026-0003', tipo: 'Diario', fecha: '17 Ene 2026', monto: 220000, estado: 'borrador' },
  { folio: 'POL-2026-0004', tipo: 'Egreso', fecha: '18 Ene 2026', monto: 43000, estado: 'aprobada' },
  { folio: 'POL-2026-0005', tipo: 'Ingreso', fecha: '19 Ene 2026', monto: 310000, estado: 'pendiente' },
];

const ALERTS = [
  { level: 'danger', text: 'Publicacion trimestral vence en 5 dias' },
  { level: 'warning', text: 'Periodo de Enero 2026 proximo a cerrar' },
  { level: 'info', text: '3 polizas pendientes de aprobacion' },
  { level: 'success', text: 'Balanza cuadrada al cierre Dic 2025' },
];

const PROGRESS = [
  { label: 'Ejecucion presupuestal', value: 6.7 },
  { label: 'Recaudacion de ingresos', value: 12.3 },
  { label: 'Registro patrimonial', value: 45 },
];

/* ── Style maps ──────────────────────────────────────────── */

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
};

const ESTADO_LABEL = {
  aprobada: 'Aprobada',
  pendiente: 'Pendiente',
  borrador: 'Borrador',
};

/* ── Component ───────────────────────────────────────────── */

export default function Dashboard() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-text-heading">Dashboard</h1>
        <p className="text-[0.9375rem] text-text-muted mt-1">
          {entePublico?.nombre || 'Ente Publico'} — Ejercicio{' '}
          {ejercicioFiscal?.anio || new Date().getFullYear()}
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="bg-white border-0 rounded-lg card-shadow p-6 flex items-start justify-between"
          >
            {/* Left: text content */}
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-text-muted mb-1">{s.label}</p>
              <p className="text-[22px] font-bold text-text-heading leading-tight tracking-tight">
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

      {/* ── Middle section: table + sidebar ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Polizas Recientes (col-span-2) */}
        <div className="lg:col-span-2 bg-white border-0 rounded-lg card-shadow">
          {/* Card header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-border">
            <h2 className="text-[15px] font-semibold text-text-heading">
              Polizas Recientes
            </h2>
            <a
              href="#"
              className="text-[13px] text-guinda font-medium hover:text-guinda-dark transition-colors"
            >
              Ver todas
            </a>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
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
                {RECENT_POLIZAS.map((p) => (
                  <tr
                    key={p.folio}
                    className="border-b border-border/50 last:border-0 hover:bg-bg-hover transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono text-[13px] text-guinda font-semibold">
                      {p.folio}
                    </td>
                    <td className="px-6 py-3.5 text-[14px] text-text-primary">
                      {p.tipo}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-text-muted">
                      {p.fecha}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-[14px] font-semibold text-text-heading">
                      {formatMXN(p.monto)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize ${ESTADO_BADGE[p.estado]}`}
                      >
                        {ESTADO_LABEL[p.estado]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              {ALERTS.map((a, i) => (
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
              {PROGRESS.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-text-primary">{item.label}</span>
                    <span className="text-[13px] font-bold text-text-heading">
                      {item.value}%
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
