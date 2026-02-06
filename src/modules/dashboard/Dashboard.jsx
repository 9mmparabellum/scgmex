import { useAppStore } from '../../stores/appStore';
import { formatMXN } from '../../utils/formatters';

const MOCK_STATS = [
  {
    label: 'Presupuesto Aprobado',
    value: 185_000_000,
    color: 'guinda',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" />
      </svg>
    ),
    sub: 'PEF 2026',
  },
  {
    label: 'Presupuesto Ejercido',
    value: 12_450_000,
    pct: 6.7,
    color: 'verde',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
    sub: '6.7% del aprobado',
  },
  {
    label: 'Ingresos Recaudados',
    value: 8_320_000,
    color: 'dorado',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    sub: 'Ley de Ingresos',
  },
  {
    label: 'Deuda Publica',
    value: 45_000_000,
    color: 'danger',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    sub: 'Corto y largo plazo',
  },
];

const MOCK_ALERTS = [
  { type: 'danger', text: 'Publicacion trimestral de transparencia vence en 5 dias', time: 'Hace 2h' },
  { type: 'warning', text: 'El periodo de Enero 2026 esta proximo a cerrar', time: 'Hace 4h' },
  { type: 'info', text: '3 polizas pendientes de aprobacion', time: 'Hoy' },
  { type: 'success', text: 'Balanza de comprobacion cuadrada al cierre de Diciembre 2025', time: 'Ayer' },
];

const MOCK_RECENT = [
  { id: 'POL-2026-0001', tipo: 'Ingreso', fecha: '2026-01-15', monto: 150000, estado: 'aprobada' },
  { id: 'POL-2026-0002', tipo: 'Egreso', fecha: '2026-01-16', monto: 85000, estado: 'pendiente' },
  { id: 'POL-2026-0003', tipo: 'Diario', fecha: '2026-01-17', monto: 220000, estado: 'borrador' },
  { id: 'POL-2026-0004', tipo: 'Egreso', fecha: '2026-01-18', monto: 43000, estado: 'aprobada' },
  { id: 'POL-2026-0005', tipo: 'Ingreso', fecha: '2026-01-19', monto: 310000, estado: 'pendiente' },
];

const MOCK_PROGRESS = [
  { label: 'Ejecucion presupuestal', value: 6.7, color: 'bg-guinda' },
  { label: 'Recaudacion de ingresos', value: 12.3, color: 'bg-dorado' },
  { label: 'Registro patrimonial', value: 45, color: 'bg-verde' },
];

function StatCard({ label, value, color, icon, sub }) {
  const bgMap = {
    guinda: 'bg-guinda/10',
    verde: 'bg-verde/10',
    dorado: 'bg-dorado/10',
    danger: 'bg-danger/10',
  };
  const iconColorMap = {
    guinda: 'text-guinda',
    verde: 'text-verde',
    dorado: 'text-dorado-dark',
    danger: 'text-danger',
  };
  return (
    <div className="bg-white rounded-lg border border-border/60 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-text-muted font-medium mb-1">{label}</p>
          <p className={`text-2xl font-bold ${iconColorMap[color]} tracking-tight`}>{formatMXN(value)}</p>
          <p className="text-[11px] text-text-muted mt-1.5">{sub}</p>
        </div>
        <div className={`w-11 h-11 ${bgMap[color]} rounded-lg flex items-center justify-center ${iconColorMap[color]} flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function AlertItem({ type, text, time }) {
  const iconMap = {
    danger: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
    ),
    warning: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    ),
    info: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
    ),
    success: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    ),
  };
  const styles = {
    danger: 'text-danger bg-danger/5',
    warning: 'text-dorado-dark bg-dorado/5',
    info: 'text-info bg-info/5',
    success: 'text-verde bg-verde/5',
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${styles[type]}`}>
        {iconMap[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary leading-snug">{text}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{time}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  return (
    <div>
      {/* Welcome banner */}
      <div className="bg-guinda-dark rounded-lg p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20h20v20H20zM0 0h20v20H0z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10">
          <h1 className="text-lg font-bold text-white">
            Bienvenido al Sistema de Contabilidad Gubernamental
          </h1>
          <p className="text-white/60 text-sm mt-1">
            {entePublico?.nombre} &mdash; Ejercicio Fiscal {ejercicioFiscal?.anio}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white/10 rounded px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-dorado" />
              <span className="text-white/80 text-xs">Periodo actual: Enero 2026</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-verde" />
              <span className="text-white/80 text-xs">Estado: Abierto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {MOCK_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent polizas */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-border/60 shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Polizas Recientes</h2>
              <p className="text-[11px] text-text-muted mt-0.5">Ultimos movimientos contables</p>
            </div>
            <button className="text-xs text-guinda font-medium hover:underline">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="px-5 py-2.5 font-medium text-[11px] text-text-muted uppercase tracking-wider">Folio</th>
                  <th className="px-5 py-2.5 font-medium text-[11px] text-text-muted uppercase tracking-wider">Tipo</th>
                  <th className="px-5 py-2.5 font-medium text-[11px] text-text-muted uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-2.5 font-medium text-[11px] text-text-muted uppercase tracking-wider text-right">Monto</th>
                  <th className="px-5 py-2.5 font-medium text-[11px] text-text-muted uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT.map((p) => (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-bg-hover/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-guinda font-medium">{p.id}</td>
                    <td className="px-5 py-3">
                      <span className="text-text-primary">{p.tipo}</span>
                    </td>
                    <td className="px-5 py-3 text-text-muted text-xs">{p.fecha}</td>
                    <td className="px-5 py-3 text-right font-mono font-medium">{formatMXN(p.monto)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                        p.estado === 'aprobada' ? 'bg-verde/10 text-verde' :
                        p.estado === 'pendiente' ? 'bg-dorado/10 text-dorado-dark' :
                        'bg-bg-hover text-text-muted'
                      }`}>
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg border border-border/60 shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Alertas</h2>
            <p className="text-[11px] text-text-muted mt-0.5">Cumplimiento y seguimiento</p>
          </div>
          <div className="px-5 py-2">
            {MOCK_ALERTS.map((alert, i) => (
              <AlertItem key={i} {...alert} />
            ))}
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="bg-white rounded-lg border border-border/60 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Avance del Ejercicio Fiscal</h2>
        <div className="space-y-4">
          {MOCK_PROGRESS.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className="text-sm font-semibold text-text-primary">{item.value}%</span>
              </div>
              <div className="w-full bg-bg-hover rounded-full h-2">
                <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
