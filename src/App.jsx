import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './config/routes';
import AppShell from './components/layout/AppShell';
import Login from './modules/auth/Login';
import Dashboard from './modules/dashboard/Dashboard';
import PlaceholderPage from './components/shared/PlaceholderPage';

// M1: Configuracion
import EntesPublicos from './modules/configuracion/EntesPublicos';
import EjerciciosFiscales from './modules/configuracion/EjerciciosFiscales';
import PeriodosContables from './modules/configuracion/PeriodosContables';

// M2: Catalogo
import PlanCuentas from './modules/catalogo/PlanCuentas';
import Clasificadores from './modules/catalogo/Clasificadores';
import Matrices from './modules/catalogo/Matrices';

// M3: Contabilidad
import PolizasContables from './modules/contabilidad/PolizasContables';
import PolizaForm from './modules/contabilidad/PolizaForm';
import LibroDiario from './modules/contabilidad/LibroDiario';
import LibroMayor from './modules/contabilidad/LibroMayor';
import BalanzaComprobacion from './modules/contabilidad/BalanzaComprobacion';

// M12: Seguridad
import Bitacora from './modules/seguridad/Bitacora';
import Usuarios from './modules/seguridad/Usuarios';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Login />} />
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
        <Route path={ROUTES.PRESUPUESTO_EGRESOS} element={<PlaceholderPage title="Presupuesto de Egresos" modulo="M4" />} />
        <Route path={ROUTES.PARTIDAS} element={<PlaceholderPage title="Partidas Presupuestales" modulo="M4" />} />
        <Route path={ROUTES.MOMENTOS_GASTO} element={<PlaceholderPage title="Momentos del Gasto" modulo="M4" />} />

        {/* M5: Presupuesto Ingresos */}
        <Route path={ROUTES.PRESUPUESTO_INGRESOS} element={<PlaceholderPage title="Presupuesto de Ingresos" modulo="M5" />} />
        <Route path={ROUTES.CONCEPTOS_INGRESO} element={<PlaceholderPage title="Conceptos de Ingreso" modulo="M5" />} />
        <Route path={ROUTES.MOMENTOS_INGRESO} element={<PlaceholderPage title="Momentos del Ingreso" modulo="M5" />} />

        {/* M6: Patrimonio */}
        <Route path={ROUTES.BIENES} element={<PlaceholderPage title="Bienes" modulo="M6" />} />
        <Route path={ROUTES.INVENTARIOS} element={<PlaceholderPage title="Inventarios" modulo="M6" />} />
        <Route path={ROUTES.FIDEICOMISOS} element={<PlaceholderPage title="Fideicomisos" modulo="M6" />} />

        {/* M7: Deuda */}
        <Route path={ROUTES.DEUDA} element={<PlaceholderPage title="Deuda Publica" modulo="M7" />} />

        {/* M8: Reportes */}
        <Route path={ROUTES.REPORTES} element={<PlaceholderPage title="Estados Financieros" modulo="M8" />} />

        {/* M9: Cuenta Publica */}
        <Route path={ROUTES.CUENTA_PUBLICA} element={<PlaceholderPage title="Cuenta Publica" modulo="M9" />} />

        {/* M10: Transparencia */}
        <Route path={ROUTES.TRANSPARENCIA} element={<PlaceholderPage title="Transparencia" modulo="M10" />} />

        {/* M11: Fondos Federales */}
        <Route path={ROUTES.FONDOS_FEDERALES} element={<PlaceholderPage title="Fondos Federales" modulo="M11" />} />

        {/* M12: Seguridad */}
        <Route path={ROUTES.BITACORA} element={<Bitacora />} />
        <Route path={ROUTES.USUARIOS} element={<Usuarios />} />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
