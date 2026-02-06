import { useAppStore } from '../../stores/appStore';
import { formatMXN } from '../../utils/formatters';

const STATS = [
  { label: 'Presupuesto Aprobado', value: 185_000_000, change: null, color: '#9D2449' },
  { label: 'Presupuesto Ejercido', value: 12_450_000, change: '6.7%', color: '#235B4E' },
  { label: 'Ingresos Recaudados', value: 8_320_000, change: '12.3%', color: '#BC955C' },
  { label: 'Deuda Publica', value: 45_000_000, change: null, color: '#C62828' },
];

const RECENT = [
  { id: 'POL-2026-0001', tipo: 'Ingreso', fecha: '15 Ene', monto: 150000, estado: 'aprobada' },
  { id: 'POL-2026-0002', tipo: 'Egreso', fecha: '16 Ene', monto: 85000, estado: 'pendiente' },
  { id: 'POL-2026-0003', tipo: 'Diario', fecha: '17 Ene', monto: 220000, estado: 'borrador' },
  { id: 'POL-2026-0004', tipo: 'Egreso', fecha: '18 Ene', monto: 43000, estado: 'aprobada' },
  { id: 'POL-2026-0005', tipo: 'Ingreso', fecha: '19 Ene', monto: 310000, estado: 'pendiente' },
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

const alertDot = {
  danger: 'bg-[#C62828]',
  warning: 'bg-dorado',
  info: 'bg-info',
  success: 'bg-verde',
};

const estadoBadge = {
  aprobada: 'bg-verde/10 text-verde',
  pendiente: 'bg-dorado/10 text-dorado-dark',
  borrador: 'bg-[#f0f0f0] text-[#999]',
};

export default function Dashboard() {
  const { entePublico, ejercicioFiscal } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-[#111]">Dashboard</h1>
        <p className="text-sm text-[#999] mt-0.5">
          {entePublico?.nombre} — Ejercicio {ejercicioFiscal?.anio}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#eee] p-5 hover:shadow-sm transition-shadow">
            <p className="text-[13px] text-[#999] mb-3">{s.label}</p>
            <p className="text-2xl font-semibold text-[#111] tracking-tight">{formatMXN(s.value)}</p>
            {s.change && (
              <p className="text-xs mt-2 font-medium" style={{ color: s.color }}>{s.change} del aprobado</p>
            )}
            <div className="mt-3 h-1 rounded-full bg-[#f0f0f0]">
              <div className="h-1 rounded-full" style={{ backgroundColor: s.color, width: s.change || '100%', opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#eee]">
          <div className="px-5 py-4 flex items-center justify-between border-b border-[#f0f0f0]">
            <h2 className="text-sm font-semibold text-[#111]">Polizas Recientes</h2>
            <button className="text-xs text-guinda font-medium hover:underline cursor-pointer">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#f5f5f5]">
                  <th className="px-5 py-3 text-[11px] font-medium text-[#aaa] uppercase tracking-wider">Folio</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-[#aaa] uppercase tracking-wider">Tipo</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-[#aaa] uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-[#aaa] uppercase tracking-wider text-right">Monto</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-[#aaa] uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {RECENT.map((p) => (
                  <tr key={p.id} className="border-b border-[#f8f8f8] last:border-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-guinda font-medium">{p.id}</td>
                    <td className="px-5 py-3 text-[#555]">{p.tipo}</td>
                    <td className="px-5 py-3 text-[#aaa] text-xs">{p.fecha}</td>
                    <td className="px-5 py-3 text-right font-mono font-medium text-[#333]">{formatMXN(p.monto)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${estadoBadge[p.estado]}`}>
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white rounded-xl border border-[#eee]">
            <div className="px-5 py-4 border-b border-[#f0f0f0]">
              <h2 className="text-sm font-semibold text-[#111]">Alertas</h2>
            </div>
            <div className="p-4 space-y-3">
              {ALERTS.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alertDot[a.level]}`} />
                  <p className="text-[13px] text-[#555] leading-snug">{a.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-xl border border-[#eee]">
            <div className="px-5 py-4 border-b border-[#f0f0f0]">
              <h2 className="text-sm font-semibold text-[#111]">Avance del Ejercicio</h2>
            </div>
            <div className="p-5 space-y-4">
              {PROGRESS.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] text-[#666]">{item.label}</span>
                    <span className="text-[13px] font-semibold text-[#333]">{item.value}%</span>
                  </div>
                  <div className="w-full bg-[#f0f0f0] rounded-full h-1.5">
                    <div className="bg-guinda h-1.5 rounded-full transition-all" style={{ width: `${item.value}%` }} />
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
