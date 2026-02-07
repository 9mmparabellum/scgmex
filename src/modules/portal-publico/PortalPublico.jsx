import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { APP_NAME, TIPOS_PUBLICACION_PORTAL } from '../../config/constants';

// ── Helpers ─────────────────────────────────────────────────────────

const fmtCurrency = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0);

const fmtPercent = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 1 }).format(n || 0);

const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
};

// ── Tabs definition ─────────────────────────────────────────────────

const TABS = [
  { key: 'financiera', label: 'Informacion Financiera' },
  { key: 'presupuestal', label: 'Ejecucion Presupuestal' },
  { key: 'transparencia', label: 'Transparencia' },
  { key: 'cuenta', label: 'Cuenta Publica' },
  { key: 'indicadores', label: 'Indicadores' },
];

// ── Traffic light helper ────────────────────────────────────────────

function trafficLight(value, meta) {
  if (meta === 0) return { color: 'bg-gray-400', label: 'Sin meta' };
  const pct = value / meta;
  if (pct >= 0.9) return { color: 'bg-green-500', label: 'Optimo' };
  if (pct >= 0.7) return { color: 'bg-yellow-400', label: 'Aceptable' };
  if (pct >= 0.5) return { color: 'bg-orange-500', label: 'Riesgo' };
  return { color: 'bg-red-500', label: 'Critico' };
}

// ── Simple bar component ────────────────────────────────────────────

function BarChart({ label, aprobado, ejercido }) {
  const max = Math.max(aprobado, ejercido, 1);
  const aprobadoPct = (aprobado / max) * 100;
  const ejercidoPct = (ejercido / max) * 100;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 truncate max-w-[60%]" title={label}>
          {label}
        </span>
        <span className="text-xs text-gray-500">
          {fmtCurrency(ejercido)} / {fmtCurrency(aprobado)}
        </span>
      </div>
      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-blue-200 rounded-full transition-all"
          style={{ width: `${aprobadoPct}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-[#9D2449] rounded-full transition-all"
          style={{ width: `${ejercidoPct}%` }}
        />
      </div>
      <div className="flex items-center gap-4 mt-1">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-200" /> Aprobado
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#9D2449]" /> Ejercido
        </span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════

export default function PortalPublico() {
  const [activeTab, setActiveTab] = useState('financiera');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data state
  const [publicaciones, setPublicaciones] = useState([]);
  const [ente, setEnte] = useState(null);
  const [stats, setStats] = useState({
    totalPresupuesto: 0,
    ejecutado: 0,
    avance: 0,
    deudaTotal: 0,
  });
  const [partidasData, setPartidasData] = useState([]);
  const [indicadores, setIndicadores] = useState([]);

  // ── Fetch all data on mount ─────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch published content
        let pubData = [];
        if (supabase) {
          const { data, error: pubError } = await supabase
            .from('publicacion_portal')
            .select('*')
            .eq('estado', 'publicado')
            .order('fecha_publicacion', { ascending: false });
          if (!pubError && data) pubData = data;
        }
        setPublicaciones(pubData);

        // 2. Fetch first ente for display
        let enteData = null;
        if (supabase) {
          const { data } = await supabase
            .from('ente_publico')
            .select('*')
            .limit(1)
            .single();
          if (data) enteData = data;
        }
        setEnte(enteData);

        // 3. Fetch budget summary from partidas and movimientos
        let totalAprobado = 0;
        let totalEjercido = 0;
        let barData = [];

        if (supabase && enteData) {
          // Get current year exercise
          const currentYear = new Date().getFullYear();
          const { data: ejercicio } = await supabase
            .from('ejercicio_fiscal')
            .select('id')
            .eq('ente_id', enteData.id)
            .eq('anio', currentYear)
            .limit(1)
            .single();

          if (ejercicio) {
            const { data: partidas } = await supabase
              .from('partida_egreso')
              .select('id, clave, descripcion')
              .eq('ente_id', enteData.id)
              .eq('ejercicio_id', ejercicio.id)
              .order('clave');

            if (partidas && partidas.length > 0) {
              const partidaIds = partidas.map((p) => p.id);
              const { data: movimientos } = await supabase
                .from('movimiento_presupuestal_egreso')
                .select('partida_id, momento, monto')
                .in('partida_id', partidaIds);

              if (movimientos) {
                // Aggregate
                const partidaTotales = {};
                for (const p of partidas) {
                  partidaTotales[p.id] = { clave: p.clave, descripcion: p.descripcion, aprobado: 0, ejercido: 0 };
                }
                for (const mov of movimientos) {
                  if (!partidaTotales[mov.partida_id]) continue;
                  const monto = Number(mov.monto) || 0;
                  if (mov.momento === 'aprobado') {
                    partidaTotales[mov.partida_id].aprobado += monto;
                    totalAprobado += monto;
                  } else if (mov.momento === 'ejercido') {
                    partidaTotales[mov.partida_id].ejercido += monto;
                    totalEjercido += monto;
                  }
                }
                barData = Object.values(partidaTotales).filter((p) => p.aprobado > 0 || p.ejercido > 0);
              }
            }
          }

          // 4. Fetch deuda total
          let deudaTotal = 0;
          const { data: deudas } = await supabase
            .from('deuda_publica')
            .select('saldo_actual')
            .eq('ente_id', enteData.id)
            .eq('estado', 'vigente');
          if (deudas) {
            deudaTotal = deudas.reduce((sum, d) => sum + (Number(d.saldo_actual) || 0), 0);
          }

          // 5. Fetch indicadores fiscales
          let indData = [];
          const { data: inds } = await supabase
            .from('indicador_fiscal')
            .select('*')
            .eq('ente_id', enteData.id)
            .order('clave');
          if (inds) indData = inds;

          setIndicadores(indData);
          setStats({
            totalPresupuesto: totalAprobado,
            ejecutado: totalEjercido,
            avance: totalAprobado > 0 ? totalEjercido / totalAprobado : 0,
            deudaTotal,
          });
        }

        setPartidasData(barData);
      } catch (err) {
        console.error('Error fetching portal data:', err);
        setError('No se pudieron cargar los datos. Intente mas tarde.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ── Filter publications by search ────────────────────────────────

  const filteredPublicaciones = useMemo(() => {
    if (!searchQuery.trim()) return publicaciones;
    const q = searchQuery.toLowerCase();
    return publicaciones.filter(
      (p) =>
        (p.titulo || '').toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q) ||
        (p.tipo || '').toLowerCase().includes(q)
    );
  }, [publicaciones, searchQuery]);

  // ── Group publications by type ────────────────────────────────────

  const pubByType = useMemo(() => {
    const map = {};
    for (const pub of filteredPublicaciones) {
      const tipo = pub.tipo || 'otro';
      if (!map[tipo]) map[tipo] = [];
      map[tipo].push(pub);
    }
    return map;
  }, [filteredPublicaciones]);

  const financierasPubs = useMemo(
    () => filteredPublicaciones.filter((p) => p.tipo === 'estado_financiero' || p.tipo === 'presupuesto'),
    [filteredPublicaciones]
  );

  const transparenciaPubs = useMemo(
    () => filteredPublicaciones.filter((p) => p.tipo === 'informe' || p.tipo === 'otro'),
    [filteredPublicaciones]
  );

  const cuentaPubs = useMemo(
    () => filteredPublicaciones.filter((p) => p.tipo === 'cuenta_publica'),
    [filteredPublicaciones]
  );

  const enteName = ente?.nombre || ente?.razon_social || 'Ente Publico';

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="bg-[#2b2c40] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#9D2449] rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Portal de Transparencia Financiera</h1>
                <p className="text-sm text-gray-300 mt-0.5">{enteName}</p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-xs text-gray-400 uppercase tracking-wider">{APP_NAME}</span>
              <p className="text-xs text-gray-500 mt-0.5">Acceso publico</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Search bar ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative max-w-xl mx-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar documentos, reportes, indicadores..."
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9D2449]/30 focus:border-[#9D2449] transition-colors"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Loading / Error ────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#9D2449] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500">Cargando informacion publica...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── Quick stats cards ──────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Presupuesto Total"
                value={fmtCurrency(stats.totalPresupuesto)}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
                  </svg>
                }
                color="blue"
              />
              <StatCard
                title="Ejecutado"
                value={fmtCurrency(stats.ejecutado)}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                }
                color="guinda"
              />
              <StatCard
                title="% Avance"
                value={fmtPercent(stats.avance)}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                  </svg>
                }
                color="green"
              />
              <StatCard
                title="Deuda Total"
                value={fmtCurrency(stats.deudaTotal)}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                }
                color="amber"
              />
            </div>

            {/* ── Tab navigation ─────────────────────────────────────── */}
            <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200 pb-px">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    'px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer rounded-t-lg -mb-px',
                    activeTab === tab.key
                      ? 'bg-white text-[#9D2449] border border-gray-200 border-b-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab content ────────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {activeTab === 'financiera' && (
                <TabFinanciera publicaciones={financierasPubs} />
              )}
              {activeTab === 'presupuestal' && (
                <TabPresupuestal partidasData={partidasData} stats={stats} />
              )}
              {activeTab === 'transparencia' && (
                <TabTransparencia publicaciones={transparenciaPubs} />
              )}
              {activeTab === 'cuenta' && (
                <TabCuentaPublica publicaciones={cuentaPubs} />
              )}
              {activeTab === 'indicadores' && (
                <TabIndicadores indicadores={indicadores} />
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="bg-[#2b2c40] text-gray-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              Portal de Transparencia &mdash; {enteName}
            </p>
            <p className="text-xs text-gray-500">
              Powered by {APP_NAME} &middot; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════

function StatCard({ title, value, icon, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    guinda: 'bg-[#9D2449]/10 text-[#9D2449]',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Informacion Financiera ─────────────────────────────────────

function TabFinanciera({ publicaciones }) {
  if (publicaciones.length === 0) {
    return (
      <EmptyState message="No hay informacion financiera publicada en este momento." />
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Informacion Financiera</h3>
      <p className="text-sm text-gray-500 mb-6">
        Reportes financieros publicados para consulta ciudadana.
      </p>
      <div className="space-y-3">
        {publicaciones.map((pub) => (
          <DocumentRow key={pub.id} pub={pub} />
        ))}
      </div>
    </div>
  );
}

// ── Tab: Ejecucion Presupuestal ─────────────────────────────────────

function TabPresupuestal({ partidasData, stats }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Ejecucion Presupuestal</h3>
      <p className="text-sm text-gray-500 mb-6">
        Comparativo de presupuesto aprobado vs ejercido por partida presupuestal.
      </p>

      {/* Summary bar */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Avance General</span>
          <span className="text-sm font-bold text-[#9D2449]">{fmtPercent(stats.avance)}</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#9D2449] rounded-full transition-all"
            style={{ width: `${Math.min((stats.avance || 0) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Aprobado: {fmtCurrency(stats.totalPresupuesto)}</span>
          <span>Ejercido: {fmtCurrency(stats.ejecutado)}</span>
        </div>
      </div>

      {/* Individual partidas */}
      {partidasData.length === 0 ? (
        <EmptyState message="No hay datos presupuestales disponibles para mostrar." />
      ) : (
        <div className="space-y-2">
          {partidasData.map((p, i) => (
            <BarChart
              key={i}
              label={`${p.clave} - ${p.descripcion}`}
              aprobado={p.aprobado}
              ejercido={p.ejercido}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Transparencia ──────────────────────────────────────────────

function TabTransparencia({ publicaciones }) {
  if (publicaciones.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transparencia</h3>
        <EmptyState message="No hay documentos de transparencia publicados en este momento." />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Transparencia</h3>
      <p className="text-sm text-gray-500 mb-6">
        Documentos publicados en cumplimiento de obligaciones de transparencia.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Titulo</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Vigencia</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Documento</th>
            </tr>
          </thead>
          <tbody>
            {publicaciones.map((pub) => (
              <tr key={pub.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-800">{pub.titulo}</p>
                    {pub.descripcion && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pub.descripcion}</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {TIPOS_PUBLICACION_PORTAL[pub.tipo] || pub.tipo}
                </td>
                <td className="py-3 px-4 text-gray-600">{fmtDate(pub.fecha_publicacion)}</td>
                <td className="py-3 px-4 text-gray-600">{pub.fecha_vigencia ? fmtDate(pub.fecha_vigencia) : '--'}</td>
                <td className="py-3 px-4 text-right">
                  {pub.url_documento ? (
                    <a
                      href={pub.url_documento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#9D2449] hover:text-[#7a1c39] font-medium text-xs transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Descargar
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">No disponible</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Cuenta Publica ─────────────────────────────────────────────

function TabCuentaPublica({ publicaciones }) {
  if (publicaciones.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cuenta Publica</h3>
        <EmptyState message="No hay informes de cuenta publica publicados en este momento." />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Cuenta Publica</h3>
      <p className="text-sm text-gray-500 mb-6">
        Informes anuales de cuenta publica disponibles para descarga.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {publicaciones.map((pub) => (
          <div key={pub.id} className="bg-gray-50 rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#9D2449]/10 text-[#9D2449] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-800 truncate">{pub.titulo}</h4>
                {pub.descripcion && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pub.descripcion}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{fmtDate(pub.fecha_publicacion)}</p>
              </div>
            </div>
            {pub.url_documento && (
              <a
                href={pub.url_documento}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-md bg-[#9D2449] text-white text-xs font-medium hover:bg-[#7a1c39] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Descargar PDF
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Indicadores ────────────────────────────────────────────────

function TabIndicadores({ indicadores }) {
  if (indicadores.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Indicadores Fiscales</h3>
        <EmptyState message="No hay indicadores fiscales disponibles para mostrar." />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Indicadores Fiscales</h3>
      <p className="text-sm text-gray-500 mb-6">
        Indicadores clave de desempeno fiscal con semaforizacion.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicadores.map((ind) => {
          const valor = Number(ind.valor_actual) || 0;
          const meta = Number(ind.meta) || 0;
          const tl = trafficLight(valor, meta);

          return (
            <div key={ind.id} className="bg-gray-50 rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-4 h-4 rounded-full ${tl.color} flex-shrink-0`} title={tl.label} />
                <h4 className="text-sm font-semibold text-gray-800">{ind.nombre || ind.clave}</h4>
              </div>
              {ind.descripcion && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{ind.descripcion}</p>
              )}
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-400">Valor actual</p>
                  <p className="text-lg font-bold text-gray-900">
                    {ind.unidad === 'porcentaje' ? fmtPercent(valor / 100) : valor.toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Meta</p>
                  <p className="text-sm font-medium text-gray-600">
                    {ind.unidad === 'porcentaje' ? fmtPercent(meta / 100) : meta.toLocaleString('es-MX')}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${tl.color}`}
                  style={{ width: `${Math.min((meta > 0 ? (valor / meta) : 0) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">{tl.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────

function DocumentRow({ pub }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 bg-red-50 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{pub.titulo}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {TIPOS_PUBLICACION_PORTAL[pub.tipo] || pub.tipo} &middot; {fmtDate(pub.fecha_publicacion)}
          </p>
        </div>
      </div>
      {pub.url_documento ? (
        <a
          href={pub.url_documento}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#9D2449]/10 text-[#9D2449] text-xs font-medium hover:bg-[#9D2449]/20 transition-colors flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          PDF
        </a>
      ) : (
        <span className="text-xs text-gray-400 flex-shrink-0">Sin archivo</span>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-12">
      <svg className="mx-auto w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
