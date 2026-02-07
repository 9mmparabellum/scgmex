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

// Batch 1: LGCG Compliance
const ConciliacionList = lazy(() => import('./modules/conciliacion/ConciliacionList'));
const ConciliacionDetalle = lazy(() => import('./modules/conciliacion/ConciliacionDetalle'));
const Programas = lazy(() => import('./modules/mir/Programas'));
const MIRDetalle = lazy(() => import('./modules/mir/MIRDetalle'));
const AvanceIndicadores = lazy(() => import('./modules/mir/AvanceIndicadores'));
const ReporteProgramatico = lazy(() => import('./modules/mir/ReporteProgramatico'));
const IndicadoresFiscales = lazy(() => import('./modules/indicadores-fiscales/IndicadoresFiscales'));
const NotasEF = lazy(() => import('./modules/notas/NotasEF'));
const AperturaEjercicio = lazy(() => import('./modules/apertura/AperturaEjercicio'));
const CargaDatos = lazy(() => import('./modules/configuracion/CargaDatos'));

// Batch 3: Adquisiciones + Nomina
const AdquisicionesMain = lazy(() => import('./modules/adquisiciones/AdquisicionesMain'));
const Proveedores = lazy(() => import('./modules/adquisiciones/Proveedores'));
const Requisiciones = lazy(() => import('./modules/adquisiciones/Requisiciones'));
const OrdenesCompra = lazy(() => import('./modules/adquisiciones/OrdenesCompra'));
const NominaMain = lazy(() => import('./modules/nomina/NominaMain'));
const Empleados = lazy(() => import('./modules/nomina/Empleados'));
const Tabulador = lazy(() => import('./modules/nomina/Tabulador'));
const ConceptosNomina = lazy(() => import('./modules/nomina/ConceptosNomina'));
const NominaPeriodos = lazy(() => import('./modules/nomina/NominaPeriodos'));
const NominaDetalle = lazy(() => import('./modules/nomina/NominaDetalle'));

// Batch 4: Obra Publica + Recaudacion + Envio Obligaciones
const ObraPublicaMain = lazy(() => import('./modules/obra-publica/ObraPublicaMain'));
const ProyectosObra = lazy(() => import('./modules/obra-publica/ProyectosObra'));
const ProyectoDetalle = lazy(() => import('./modules/obra-publica/ProyectoDetalle'));
const RecaudacionMain = lazy(() => import('./modules/recaudacion/RecaudacionMain'));
const Contribuyentes = lazy(() => import('./modules/recaudacion/Contribuyentes'));
const Padron = lazy(() => import('./modules/recaudacion/Padron'));
const Cobros = lazy(() => import('./modules/recaudacion/Cobros'));
const EnvioObligaciones = lazy(() => import('./modules/obligaciones/EnvioObligaciones'));

// Batch 5: Portal Ciudadano + CFDI + Dashboard RT + Benchmarking + Reportes Avanzados
const PortalCiudadano = lazy(() => import('./modules/portal-ciudadano/PortalCiudadano'));
const CFDIMain = lazy(() => import('./modules/cfdi/CFDIMain'));
const CFDIEmitidos = lazy(() => import('./modules/cfdi/CFDIEmitidos'));
const CFDIRecibidos = lazy(() => import('./modules/cfdi/CFDIRecibidos'));
const DashboardRealtime = lazy(() => import('./modules/dashboard-realtime/DashboardRealtime'));
const Benchmarking = lazy(() => import('./modules/benchmarking/Benchmarking'));
const ReportesAvanzados = lazy(() => import('./modules/reportes-avanzados/ReportesAvanzados'));

// Batch 6: PWA/Offline + e.firma/FIEL + IA Anomaly Detection
const PWAConfig = lazy(() => import('./modules/pwa/PWAConfig'));
const EFirmaMain = lazy(() => import('./modules/efirma/EFirmaMain'));
const DocumentosFirma = lazy(() => import('./modules/efirma/DocumentosFirma'));
const AnomaliasMain = lazy(() => import('./modules/anomalias/AnomaliasMain'));
const ReglasAnomalia = lazy(() => import('./modules/anomalias/ReglasAnomalia'));

// Portal Publico (sin autenticacion)
const PortalPublico = lazy(() => import('./modules/portal-publico/PortalPublico'));

// Batch 2: Tesoreria + Conciliacion Bancaria
const TesoreriaMain = lazy(() => import('./modules/tesoreria/TesoreriaMain'));
const CuentasBancarias = lazy(() => import('./modules/tesoreria/CuentasBancarias'));
const MovimientosBancarios = lazy(() => import('./modules/tesoreria/MovimientosBancarios'));
const CuentasPorCobrar = lazy(() => import('./modules/tesoreria/CuentasPorCobrar'));
const CuentasPorPagar = lazy(() => import('./modules/tesoreria/CuentasPorPagar'));
const FlujoEfectivo = lazy(() => import('./modules/tesoreria/FlujoEfectivo'));
const ConciliacionBancaria = lazy(() => import('./modules/conciliacion-bancaria/ConciliacionBancaria'));
const ConciliacionBancariaDetalle = lazy(() => import('./modules/conciliacion-bancaria/ConciliacionBancariaDetalle'));

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
          <Route path={ROUTES.PORTAL_PUBLICO} element={<PortalPublico />} />
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

            {/* Batch 1: LGCG Compliance */}
            <Route path={ROUTES.CONCILIACION} element={<ConciliacionList />} />
            <Route path={ROUTES.CONCILIACION_DETALLE} element={<ConciliacionDetalle />} />
            <Route path={ROUTES.PROGRAMAS} element={<Programas />} />
            <Route path={ROUTES.MIR_DETALLE} element={<MIRDetalle />} />
            <Route path={ROUTES.AVANCE_INDICADORES} element={<AvanceIndicadores />} />
            <Route path={ROUTES.REPORTE_PROGRAMATICO} element={<ReporteProgramatico />} />
            <Route path={ROUTES.INDICADORES_FISCALES} element={<IndicadoresFiscales />} />
            <Route path={ROUTES.NOTAS_EF} element={<NotasEF />} />
            <Route path={ROUTES.APERTURA} element={<AperturaEjercicio />} />
            <Route path={ROUTES.CARGA_DATOS} element={<CargaDatos />} />

            {/* Batch 3: Adquisiciones + Nomina */}
            <Route path={ROUTES.ADQUISICIONES} element={<AdquisicionesMain />} />
            <Route path={ROUTES.PROVEEDORES} element={<Proveedores />} />
            <Route path={ROUTES.REQUISICIONES} element={<Requisiciones />} />
            <Route path={ROUTES.ORDENES_COMPRA} element={<OrdenesCompra />} />
            <Route path={ROUTES.NOMINA} element={<NominaMain />} />
            <Route path={ROUTES.EMPLEADOS} element={<Empleados />} />
            <Route path={ROUTES.TABULADOR} element={<Tabulador />} />
            <Route path={ROUTES.CONCEPTOS_NOMINA} element={<ConceptosNomina />} />
            <Route path={ROUTES.NOMINA_PERIODOS} element={<NominaPeriodos />} />
            <Route path={ROUTES.NOMINA_DETALLE} element={<NominaDetalle />} />

            {/* Batch 4: Obra Publica + Recaudacion + Envio Obligaciones */}
            <Route path={ROUTES.OBRA_PUBLICA} element={<ObraPublicaMain />} />
            <Route path={ROUTES.PROYECTOS_OBRA} element={<ProyectosObra />} />
            <Route path={ROUTES.PROYECTO_DETALLE} element={<ProyectoDetalle />} />
            <Route path={ROUTES.RECAUDACION} element={<RecaudacionMain />} />
            <Route path={ROUTES.CONTRIBUYENTES} element={<Contribuyentes />} />
            <Route path={ROUTES.PADRON} element={<Padron />} />
            <Route path={ROUTES.COBROS} element={<Cobros />} />
            <Route path={ROUTES.OBLIGACIONES} element={<EnvioObligaciones />} />

            {/* Batch 5: Portal Ciudadano + CFDI + Dashboard RT + Benchmarking + Reportes Avanzados */}
            <Route path={ROUTES.PORTAL_CIUDADANO} element={<PortalCiudadano />} />
            <Route path={ROUTES.CFDI} element={<CFDIMain />} />
            <Route path={ROUTES.CFDI_EMITIDOS} element={<CFDIEmitidos />} />
            <Route path={ROUTES.CFDI_RECIBIDOS} element={<CFDIRecibidos />} />
            <Route path={ROUTES.DASHBOARD_REALTIME} element={<DashboardRealtime />} />
            <Route path={ROUTES.BENCHMARKING} element={<Benchmarking />} />
            <Route path={ROUTES.REPORTES_AVANZADOS} element={<ReportesAvanzados />} />

            {/* Batch 6: PWA/Offline + e.firma/FIEL + IA Anomaly Detection */}
            <Route path={ROUTES.PWA_CONFIG} element={<PWAConfig />} />
            <Route path={ROUTES.EFIRMA} element={<EFirmaMain />} />
            <Route path={ROUTES.DOCUMENTOS_FIRMA} element={<DocumentosFirma />} />
            <Route path={ROUTES.ANOMALIAS} element={<AnomaliasMain />} />
            <Route path={ROUTES.REGLAS_ANOMALIA} element={<ReglasAnomalia />} />

            {/* Batch 2: Tesoreria + Conciliacion Bancaria */}
            <Route path={ROUTES.TESORERIA} element={<TesoreriaMain />} />
            <Route path={ROUTES.CUENTAS_BANCARIAS} element={<CuentasBancarias />} />
            <Route path={ROUTES.MOVIMIENTOS_BANCARIOS} element={<MovimientosBancarios />} />
            <Route path={ROUTES.CUENTAS_POR_COBRAR} element={<CuentasPorCobrar />} />
            <Route path={ROUTES.CUENTAS_POR_PAGAR} element={<CuentasPorPagar />} />
            <Route path={ROUTES.FLUJO_EFECTIVO} element={<FlujoEfectivo />} />
            <Route path={ROUTES.CONCILIACION_BANCARIA} element={<ConciliacionBancaria />} />
            <Route path={ROUTES.CONCILIACION_BANCARIA_DETALLE} element={<ConciliacionBancariaDetalle />} />

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
