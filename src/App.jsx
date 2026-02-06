import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './config/routes';
import AppShell from './components/layout/AppShell';
import Login from './modules/auth/Login';
import Dashboard from './modules/dashboard/Dashboard';

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

// M4: Presupuesto Egresos
import PresupuestoEgresos from './modules/presupuesto-egresos/PresupuestoEgresos';
import PartidasPresupuestales from './modules/presupuesto-egresos/PartidasPresupuestales';
import MomentosGasto from './modules/presupuesto-egresos/MomentosGasto';

// M5: Presupuesto Ingresos
import PresupuestoIngresos from './modules/presupuesto-ingresos/PresupuestoIngresos';
import ConceptosIngreso from './modules/presupuesto-ingresos/ConceptosIngreso';
import MomentosIngreso from './modules/presupuesto-ingresos/MomentosIngreso';

// M6: Patrimonio
import Bienes from './modules/patrimonio/Bienes';
import Inventarios from './modules/patrimonio/Inventarios';
import Fideicomisos from './modules/patrimonio/Fideicomisos';

// M7: Deuda
import DeudaPublica from './modules/deuda/DeudaPublica';

// M8: Reportes
import EstadosFinancieros from './modules/reportes/EstadosFinancieros';

// M9: Cuenta Publica
import CuentaPublica from './modules/cuenta-publica/CuentaPublica';

// M10: Transparencia
import Transparencia from './modules/transparencia/Transparencia';

// M11: Fondos Federales
import FondosFederales from './modules/fondos-federales/FondosFederales';

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

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
