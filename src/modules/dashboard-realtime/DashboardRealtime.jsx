/**
 * DashboardRealtime.jsx
 * ---------------------------------------------------------------------------
 * Real-time KPI dashboard. Read-only, auto-refreshes every 30 seconds.
 * Module: 'reportes' for RBAC.
 * ---------------------------------------------------------------------------
 */

import { useState, useCallback } from 'react';
import { useKPIsRealtime } from '../../hooks/useDashboardRealtime';

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const fmtPct = (n) => Number(n || 0).toFixed(1) + '%';

const safePct = (part, whole) => (whole ? (part / whole) * 100 : 0);

/* ── Skeleton placeholder ─────────────────────────────────────────── */
function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-lg card-shadow p-5 animate-pulse ${className}`}>
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

/* ── Progress Bar ─────────────────────────────────────────────────── */
function ProgressBar({ value, color = 'bg-guinda', label }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className="mt-2">
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>{fmtPct(clamped)}</span>
        </div>
      )}
      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/* ── Metric Card (top row) ────────────────────────────────────────── */
function MetricCard({ title, value, subtitle, color = 'text-gray-900', icon, children }) {
  return (
    <div className="bg-white rounded-lg card-shadow p-5 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {children}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */
export default function DashboardRealtime() {
  const { data, isLoading, refetch, dataUpdatedAt } = useKPIsRealtime();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  /* ── Derived values ──────────────────────────────────────────────── */
  const kpi = data || {};
  const pe = kpi.presupuestoEgresos || {};
  const pi = kpi.presupuestoIngresos || {};
  const cxc = kpi.cuentasPorCobrar || {};
  const cxp = kpi.cuentasPorPagar || {};
  const tes = kpi.tesoreria || {};
  const pol = kpi.polizas || {};

  const pctEjercido = safePct(pe.ejercido, pe.aprobado);
  const pctPagado = safePct(pe.pagado, pe.aprobado);
  const pctRecaudado = safePct(pi.recaudado, pi.estimado);
  const liquidezNeta = (tes.saldoBancos || 0) - (cxp.pendiente || 0) + (cxc.pendiente || 0);

  /* ── Alerts ──────────────────────────────────────────────────────── */
  const alerts = [];
  if (pctEjercido > 80) {
    alerts.push({
      text: `Presupuesto ejercido al ${fmtPct(pctEjercido)} del aprobado`,
      variant: pctEjercido > 95 ? 'danger' : 'warning',
    });
  }
  if (pol.pendientes > 10) {
    alerts.push({
      text: `${pol.pendientes} polizas pendientes de aprobacion`,
      variant: 'warning',
    });
  }
  if ((cxp.pendiente || 0) > 1000000) {
    alerts.push({
      text: `CxP pendientes por ${fmtMoney(cxp.pendiente)}`,
      variant: 'danger',
    });
  }
  if (pctRecaudado < 50 && pi.estimado > 0) {
    alerts.push({
      text: `Recaudacion al ${fmtPct(pctRecaudado)} del estimado`,
      variant: 'warning',
    });
  }
  if (liquidezNeta < 0) {
    alerts.push({
      text: `Liquidez neta negativa: ${fmtMoney(liquidezNeta)}`,
      variant: 'danger',
    });
  }
  if (alerts.length === 0) {
    alerts.push({ text: 'Sin alertas activas', variant: 'success' });
  }

  const alertColors = {
    danger: 'bg-red-50 text-red-600 border-red-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };

  /* ── Render ──────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse" />
        </div>
        {/* Skeleton grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg card-shadow p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard en Tiempo Real</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Indicadores clave actualizados automaticamente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Ultima actualizacion: {lastUpdate}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-[38px] px-4 rounded-md bg-guinda text-white text-sm font-medium hover:bg-guinda/90 disabled:opacity-50 transition-colors"
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Top Row: 6 Metric Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Saldo en Bancos */}
        <MetricCard
          title="Saldo en Bancos"
          value={fmtMoney(tes.saldoBancos)}
          subtitle={`${tes.cuentasActivas || 0} cuentas activas`}
          color="text-emerald-600"
        />

        {/* 2. Presup. Egresos */}
        <MetricCard
          title="Presup. Egresos"
          value={fmtMoney(pe.ejercido)}
          subtitle={`de ${fmtMoney(pe.aprobado)} aprobado`}
        >
          <ProgressBar value={pctEjercido} color="bg-guinda" label="Ejercido" />
        </MetricCard>

        {/* 3. Presup. Ingresos */}
        <MetricCard
          title="Presup. Ingresos"
          value={fmtMoney(pi.recaudado)}
          subtitle={`de ${fmtMoney(pi.estimado)} estimado`}
        >
          <ProgressBar value={pctRecaudado} color="bg-emerald-500" label="Recaudado" />
        </MetricCard>

        {/* 4. CxC Pendiente */}
        <MetricCard
          title="CxC Pendiente"
          value={fmtMoney(cxc.pendiente)}
          subtitle={`${cxc.total || 0} cuentas por cobrar`}
          color="text-amber-600"
        />

        {/* 5. CxP Pendiente */}
        <MetricCard
          title="CxP Pendiente"
          value={fmtMoney(cxp.pendiente)}
          subtitle={`${cxp.total || 0} cuentas por pagar`}
          color="text-red-600"
        />

        {/* 6. Polizas */}
        <MetricCard
          title="Polizas"
          value={`${pol.pendientes || 0} / ${pol.total || 0}`}
          subtitle={`${pol.aprobadas || 0} aprobadas`}
          color="text-gray-900"
        >
          <ProgressBar
            value={safePct(pol.aprobadas, pol.total)}
            color="bg-sky-500"
            label="Aprobadas"
          />
        </MetricCard>
      </div>

      {/* ── Middle Row: Execution Bars ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ejecucion Presupuestal Egresos */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Ejecucion Presupuestal Egresos
          </h2>
          <div className="space-y-4">
            {/* Aprobado */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Aprobado</span>
                <span className="font-medium text-gray-900">{fmtMoney(pe.aprobado)}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div className="bg-gray-400 h-4 rounded-full w-full" />
              </div>
            </div>
            {/* Ejercido */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  Ejercido ({fmtPct(pctEjercido)})
                </span>
                <span className="font-medium text-guinda">{fmtMoney(pe.ejercido)}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-guinda h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(pctEjercido, 100)}%` }}
                />
              </div>
            </div>
            {/* Pagado */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  Pagado ({fmtPct(pctPagado)})
                </span>
                <span className="font-medium text-emerald-600">{fmtMoney(pe.pagado)}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-emerald-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(pctPagado, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recaudacion de Ingresos */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Recaudacion de Ingresos
          </h2>
          <div className="space-y-4">
            {/* Estimado */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Estimado</span>
                <span className="font-medium text-gray-900">{fmtMoney(pi.estimado)}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div className="bg-gray-400 h-4 rounded-full w-full" />
              </div>
            </div>
            {/* Recaudado */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  Recaudado ({fmtPct(pctRecaudado)})
                </span>
                <span className="font-medium text-emerald-600">{fmtMoney(pi.recaudado)}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-emerald-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(pctRecaudado, 100)}%` }}
                />
              </div>
            </div>
          </div>
          {/* Summary */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Diferencia</span>
              <span
                className={`font-medium ${
                  pi.recaudado >= pi.estimado ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {fmtMoney((pi.recaudado || 0) - (pi.estimado || 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Detail Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tesoreria */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tesoreria</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Saldo en Bancos</span>
              <span className="font-medium text-emerald-600">{fmtMoney(tes.saldoBancos)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cuentas Activas</span>
              <span className="font-medium text-gray-900">{tes.cuentasActivas || 0}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
              <span className="text-gray-500">( - ) CxP Pendiente</span>
              <span className="font-medium text-red-600">{fmtMoney(cxp.pendiente)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">( + ) CxC Pendiente</span>
              <span className="font-medium text-amber-600">{fmtMoney(cxc.pendiente)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-semibold">
              <span className="text-gray-700">Liquidez Neta</span>
              <span className={liquidezNeta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {fmtMoney(liquidezNeta)}
              </span>
            </div>
          </div>
        </div>

        {/* Polizas */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Polizas</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {pol.total || 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Aprobadas</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                {pol.aprobadas || 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Pendientes</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                {pol.pendientes || 0}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <ProgressBar
              value={safePct(pol.aprobadas, pol.total)}
              color="bg-emerald-500"
              label="Tasa de aprobacion"
            />
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white rounded-lg card-shadow p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Alertas</h2>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`text-xs px-3 py-2.5 rounded-md border ${alertColors[a.variant] || alertColors.warning}`}
              >
                {a.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
