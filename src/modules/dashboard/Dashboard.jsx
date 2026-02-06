import { useAppStore } from '../../stores/appStore';
import { formatMXN } from '../../utils/formatters';

const MOCK_STATS = [
  { label: 'Presupuesto Aprobado', value: 185_000_000, color: 'guinda' },
  { label: 'Presupuesto Ejercido', value: 12_450_000, color: 'verde' },
  { label: 'Ingresos Recaudados', value: 8_320_000, color: 'dorado' },
  { label: 'Deuda Publica', value: 45_000_000, color: 'danger' },
];

const MOCK_ALERTS = [
  { type: 'warning', text: 'El periodo de Enero 2026 esta proximo a cerrar' },
  { type: 'info', text: '3 polizas pendientes de aprobacion' },
  { type: 'success', text: 'Balanza de comprobacion cuadrada al cierre de Diciembre 2025' },
  { type: 'danger', text: 'Publicacion trimestral de transparencia vence en 5 dias' },
];

const MOCK_RECENT = [
  { id: 'POL-2026-0001', tipo: 'Ingreso', fecha: '2026-01-15', monto: 150000, estado: 'aprobada' },
  { id: 'POL-2026-0002', tipo: 'Egreso', fecha: '2026-01-16', monto: 85000, estado: 'pendiente' },
  { id: 'POL-2026-0003', tipo: 'Diario', fecha: '2026-01-17', monto: 220000, estado: 'borrador' },
  { id: 'POL-2026-0004', tipo: 'Egreso', fecha: '2026-01-18', monto: 43000, estado: 'aprobada' },
  { id: 'POL-2026-0005', tipo: 'Ingreso', fecha: '2026-01-19', monto: 310000, estado: 'pendiente' },
];

function StatCard({ label, value, color }) {
  const colorMap = {
    guinda: 'bg-guinda',
    verde: 'bg-verde',
    dorado: 'bg-dorado',
    danger: 'bg-danger',
  };
  const textMap = {
    guinda: 'text-guinda',
    verde: 'text-verde',
    dorado: 'text-dorado-dark',
    danger: 'text-danger',
  };
  return (
    <div className="bg-bg-card rounded border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted font-medium">{label}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${colorMap[color]}`} />
      </div>
      <div className={`text-xl font-bold ${textMap[color]}`}>{formatMXN(value)}</div>
    </div>
  );
}

function AlertItem({ type, text }) {
  const styles = {
    warning: 'border-dorado/30 bg-dorado/5 text-dorado-dark',
    info: 'border-info/30 bg-info/5 text-info',
    success: 'border-verde/30 bg-verde/5 text-verde',
    danger: 'border-danger/30 bg-danger/5 text-danger',
  };
  return (
    <div className={`p-3 rounded border text-sm ${styles[type]}`}>
      {text}
    </div>
  );
}

export default function Dashboard() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">
          Resumen ejecutivo &mdash; {entePublico?.nombre} &mdash; Ejercicio {ejercicioFiscal?.anio}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {MOCK_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent polizas */}
        <div className="lg:col-span-2 bg-bg-card rounded border border-border">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Polizas Recientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border bg-bg-main/50">
                  <th className="px-5 py-3 font-medium text-xs">Folio</th>
                  <th className="px-5 py-3 font-medium text-xs">Tipo</th>
                  <th className="px-5 py-3 font-medium text-xs">Fecha</th>
                  <th className="px-5 py-3 font-medium text-xs text-right">Monto</th>
                  <th className="px-5 py-3 font-medium text-xs">Estado</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-bg-hover/50">
                    <td className="px-5 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-5 py-3">{p.tipo}</td>
                    <td className="px-5 py-3 text-text-muted">{p.fecha}</td>
                    <td className="px-5 py-3 text-right font-mono">{formatMXN(p.monto)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        p.estado === 'aprobada' ? 'bg-verde/10 text-verde' :
                        p.estado === 'pendiente' ? 'bg-dorado/10 text-dorado-dark' :
                        'bg-border text-text-muted'
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
        <div className="bg-bg-card rounded border border-border">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Alertas de Cumplimiento</h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {MOCK_ALERTS.map((alert, i) => (
              <AlertItem key={i} {...alert} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
