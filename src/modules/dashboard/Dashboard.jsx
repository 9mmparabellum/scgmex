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
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[#111]">Dashboard</h1>
        <p className="text-[15px] text-[#999] mt-1">
          {entePublico?.nombre} — Ejercicio {ejercicioFiscal?.anio}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#eee] p-6 hover:shadow-sm transition-shadow">
            <p className="text-[14px] text-[#999] mb-3">{s.label}</p>
            <p className="text-[28px] font-bold text-[#111] tracking-tight leading-none">{formatMXN(s.value)}</p>
            {s.change && (
              <p className="text-[13px] mt-3 font-medium" style={{ color: s.color }}>{s.change} del aprobado</p>
            )}
            <div className="mt-4 h-1.5 rounded-full bg-[#f0f0f0]">
              <div className="h-1.5 rounded-full" style={{ backgroundColor: s.color, width: s.change || '100%', opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#eee]">
          <div className="px-6 py-5 flex items-center justify-between border-b border-[#f0f0f0]">
            <h2 className="text-[16px] font-semibold text-[#111]">Polizas Recientes</h2>
            <button className="text-[13px] text-guinda font-medium hover:underline cursor-pointer">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[#f5f5f5]">
                  <th className="px-6 py-4 text-xs font-semibold text-[#aaa] uppercase tracking-wider">Folio</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#aaa] uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#aaa] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#aaa] uppercase tracking-wider text-right">Monto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#aaa] uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {RECENT.map((p) => (
                  <tr key={p.id} className="border-b border-[#f8f8f8] last:border-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-6 py-4 font-mono text-[13px] text-guinda font-semibold">{p.id}</td>
                    <td className="px-6 py-4 text-[14px] text-[#555]">{p.tipo}</td>
                    <td className="px-6 py-4 text-[13px] text-[#aaa]">{p.fecha}</td>
                    <td className="px-6 py-4 text-right font-mono text-[14px] font-semibold text-[#333]">{formatMXN(p.monto)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoBadge[p.estado]}`}>
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
          <div className="bg-white rounded-2xl border border-[#eee]">
            <div className="px-6 py-5 border-b border-[#f0f0f0]">
              <h2 className="text-[16px] font-semibold text-[#111]">Alertas</h2>
            </div>
            <div className="p-5 space-y-4">
              {ALERTS.map((a, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${alertDot[a.level]}`} />
                  <p className="text-[14px] text-[#555] leading-relaxed">{a.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-2xl border border-[#eee]">
            <div className="px-6 py-5 border-b border-[#f0f0f0]">
              <h2 className="text-[16px] font-semibold text-[#111]">Avance del Ejercicio</h2>
            </div>
            <div className="p-6 space-y-5">
              {PROGRESS.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] text-[#666]">{item.label}</span>
                    <span className="text-[14px] font-bold text-[#333]">{item.value}%</span>
                  </div>
                  <div className="w-full bg-[#f0f0f0] rounded-full h-2">
                    <div className="bg-guinda h-2 rounded-full transition-all" style={{ width: `${item.value}%` }} />
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
