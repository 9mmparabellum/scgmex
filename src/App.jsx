import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './config/routes';
import AppShell from './components/layout/AppShell';
import Login from './modules/auth/Login';
import Dashboard from './modules/dashboard/Dashboard';
import PlaceholderPage from './components/shared/PlaceholderPage';

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
        <Route path={ROUTES.ENTES} element={<PlaceholderPage title="Entes Publicos" modulo="M1" />} />
        <Route path={ROUTES.EJERCICIOS} element={<PlaceholderPage title="Ejercicios Fiscales" modulo="M1" />} />
        <Route path={ROUTES.PERIODOS} element={<PlaceholderPage title="Periodos Contables" modulo="M1" />} />

        {/* M2: Catalogo */}
        <Route path={ROUTES.PLAN_CUENTAS} element={<PlaceholderPage title="Plan de Cuentas" modulo="M2" />} />
        <Route path={ROUTES.CLASIFICADORES} element={<PlaceholderPage title="Clasificadores Presupuestales" modulo="M2" />} />
        <Route path={ROUTES.MATRICES} element={<PlaceholderPage title="Matrices de Conversion" modulo="M2" />} />

        {/* M3: Contabilidad */}
        <Route path={ROUTES.POLIZAS} element={<PlaceholderPage title="Polizas Contables" modulo="M3" />} />
        <Route path={ROUTES.POLIZA_NUEVA} element={<PlaceholderPage title="Nueva Poliza" modulo="M3" />} />
        <Route path={ROUTES.LIBRO_DIARIO} element={<PlaceholderPage title="Libro Diario" modulo="M3" />} />
        <Route path={ROUTES.LIBRO_MAYOR} element={<PlaceholderPage title="Libro Mayor" modulo="M3" />} />
        <Route path={ROUTES.BALANZA} element={<PlaceholderPage title="Balanza de Comprobacion" modulo="M3" />} />

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
        <Route path={ROUTES.BITACORA} element={<PlaceholderPage title="Bitacora de Auditoria" modulo="M12" />} />
        <Route path={ROUTES.USUARIOS} element={<PlaceholderPage title="Gestion de Usuarios" modulo="M12" />} />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
