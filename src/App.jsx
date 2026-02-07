import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './config/routes';
import AppShell from './components/layout/AppShell';
import Login from './modules/auth/Login';
import LoadingSpinner from './components/shared/LoadingSpinner';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Lazy-loaded modules
const Dashboard = lazy(() => import('./modules/dashboard/Dashboard'));

// M1: Configuracion
const EntesPublicos = lazy(() => import('./modules/configuracion/EntesPublicos'));
const EjerciciosFiscales = lazy(() => import('./modules/configuracion/EjerciciosFiscales'));
const PeriodosContables = lazy(() => import('./modules/configuracion/PeriodosContables'));

// M2: Catalogo
const PlanCuentas = lazy(() => import('./modules/catalogo/PlanCuentas'));
const Clasificadores = lazy(() => import('./modules/catalogo/Clasificadores'));
const Matrices = lazy(() => import('./modules/catalogo/Matrices'));

// M3: Contabilidad
const PolizasContables = lazy(() => import('./modules/contabilidad/PolizasContables'));
const PolizaForm = lazy(() => import('./modules/contabilidad/PolizaForm'));
const LibroDiario = lazy(() => import('./modules/contabilidad/LibroDiario'));
const LibroMayor = lazy(() => import('./modules/contabilidad/LibroMayor'));
const BalanzaComprobacion = lazy(() => import('./modules/contabilidad/BalanzaComprobacion'));

// M4: Presupuesto Egresos
const PresupuestoEgresos = lazy(() => import('./modules/presupuesto-egresos/PresupuestoEgresos'));
const PartidasPresupuestales = lazy(() => import('./modules/presupuesto-egresos/PartidasPresupuestales'));
const MomentosGasto = lazy(() => import('./modules/presupuesto-egresos/MomentosGasto'));

// M5: Presupuesto Ingresos
const PresupuestoIngresos = lazy(() => import('./modules/presupuesto-ingresos/PresupuestoIngresos'));
const ConceptosIngreso = lazy(() => import('./modules/presupuesto-ingresos/ConceptosIngreso'));
const MomentosIngreso = lazy(() => import('./modules/presupuesto-ingresos/MomentosIngreso'));

// M6: Patrimonio
const Bienes = lazy(() => import('./modules/patrimonio/Bienes'));
const Inventarios = lazy(() => import('./modules/patrimonio/Inventarios'));
const Fideicomisos = lazy(() => import('./modules/patrimonio/Fideicomisos'));

// M7: Deuda
const DeudaPublica = lazy(() => import('./modules/deuda/DeudaPublica'));

// M8: Reportes
const EstadosFinancieros = lazy(() => import('./modules/reportes/EstadosFinancieros'));

// M9: Cuenta Publica
const CuentaPublica = lazy(() => import('./modules/cuenta-publica/CuentaPublica'));

// M10: Transparencia
const Transparencia = lazy(() => import('./modules/transparencia/Transparencia'));

// M11: Fondos Federales
const FondosFederales = lazy(() => import('./modules/fondos-federales/FondosFederales'));

// M12: Seguridad
const Bitacora = lazy(() => import('./modules/seguridad/Bitacora'));
const Usuarios = lazy(() => import('./modules/seguridad/Usuarios'));
const Perfil = lazy(() => import('./modules/auth/Perfil'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return children;
}

function LoginRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <Login />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

            {/* M1: Configuracion */}
            <Route path={ROUTES.ENTES} element={<EntesPublicos />} />
            <Route path={ROUTES.EJERCICIOS} element={<EjerciciosFiscales />} />
            <Route path={ROUTES.PERIODOS} element={<PeriodosContables />} />

            {/* M2: Catalogo */}
            <Route path={ROUTES.PLAN_CUENTAS} element={<PlanCuentas />} />
            <Route path={ROUTES.CLASIFICADORES} element={<Clasificadores />} />
            <Route path={ROUTES.MATRICES} element={<Matrices />} />

            {/* M3: Contabilidad */}
            <Route path={ROUTES.POLIZAS} element={<PolizasContables />} />
            <Route path={ROUTES.POLIZA_NUEVA} element={<PolizaForm />} />
            <Route path={ROUTES.POLIZA_DETALLE} element={<PolizaForm />} />
            <Route path={ROUTES.LIBRO_DIARIO} element={<LibroDiario />} />
            <Route path={ROUTES.LIBRO_MAYOR} element={<LibroMayor />} />
            <Route path={ROUTES.BALANZA} element={<BalanzaComprobacion />} />

            {/* M4: Presupuesto Egresos */}
            <Route path={ROUTES.PRESUPUESTO_EGRESOS} element={<PresupuestoEgresos />} />
            <Route path={ROUTES.PARTIDAS} element={<PartidasPresupuestales />} />
            <Route path={ROUTES.MOMENTOS_GASTO} element={<MomentosGasto />} />

            {/* M5: Presupuesto Ingresos */}
            <Route path={ROUTES.PRESUPUESTO_INGRESOS} element={<PresupuestoIngresos />} />
            <Route path={ROUTES.CONCEPTOS_INGRESO} element={<ConceptosIngreso />} />
            <Route path={ROUTES.MOMENTOS_INGRESO} element={<MomentosIngreso />} />

            {/* M6: Patrimonio */}
            <Route path={ROUTES.BIENES} element={<Bienes />} />
            <Route path={ROUTES.INVENTARIOS} element={<Inventarios />} />
            <Route path={ROUTES.FIDEICOMISOS} element={<Fideicomisos />} />

            {/* M7: Deuda */}
            <Route path={ROUTES.DEUDA} element={<DeudaPublica />} />

            {/* M8: Reportes */}
            <Route path={ROUTES.REPORTES} element={<EstadosFinancieros />} />

            {/* M9: Cuenta Publica */}
            <Route path={ROUTES.CUENTA_PUBLICA} element={<CuentaPublica />} />

            {/* M10: Transparencia */}
            <Route path={ROUTES.TRANSPARENCIA} element={<Transparencia />} />

            {/* M11: Fondos Federales */}
            <Route path={ROUTES.FONDOS_FEDERALES} element={<FondosFederales />} />

            {/* M12: Seguridad */}
            <Route path={ROUTES.BITACORA} element={<Bitacora />} />
            <Route path={ROUTES.USUARIOS} element={<Usuarios />} />

            {/* Perfil */}
            <Route path={ROUTES.PERFIL} element={<Perfil />} />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
